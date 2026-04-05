import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { authLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName } from "@/lib/sanitize";

export async function POST(req: Request) {
  // SECURITY: CSRF check
  if (!validateCsrf(req)) {
    return NextResponse.json({ valid: false, error: "Forbidden" }, { status: 403 });
  }

  // SECURITY: Verify authentication before any DB access
  const supabaseAuth = await createServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ valid: false, error: "No autenticado" }, { status: 401 });
  }

  // SECURITY: Rate limiting (10 req/min for auth-adjacent endpoints)
  const { success } = authLimiter.check(getClientIdentifier(req, user.id));
  if (!success) {
    return NextResponse.json({ valid: false, error: "Demasiadas peticiones. Espera un momento." }, { status: 429 });
  }

  const { code } = await req.json().catch(() => ({ code: "" }));
  // Sanitize input
  const cleanCode = sanitizeName(typeof code === "string" ? code : "", 50);

  if (!cleanCode || cleanCode.length < 3) {
    return NextResponse.json({ valid: false, error: "Codigo no valido" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error: qErr } = await supabase
    .from("trainer_promo_codes")
    .select("id, trainer_id, code, is_active, max_uses, current_uses, expires_at")
    .eq("code", cleanCode.toUpperCase())
    .eq("is_active", true)
    .single();

  if (qErr || !data) {
    return NextResponse.json({ valid: false, error: "Codigo no valido o inactivo" });
  }

  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    return NextResponse.json({ valid: false, error: "Este codigo ha alcanzado su limite de usos" });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Este codigo ha expirado" });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("user_id", data.trainer_id)
    .single();

  if (profileErr) {
    console.error("[validate-promo] Error cargando perfil:", profileErr);
  }

  return NextResponse.json({
    valid: true,
    trainer_name: profile?.business_name ?? profile?.full_name ?? "Entrenador",
    trainer_id: data.trainer_id,
    promo_code_id: data.id,
  });
}
