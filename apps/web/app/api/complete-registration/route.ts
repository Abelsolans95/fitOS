import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName } from "@/lib/sanitize";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: CSRF protection
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // SECURITY: Verify the CALLER is authenticated via session cookie
    const authClient = await createServerClient();
    const { data: { user: caller }, error: callerErr } = await authClient.auth.getUser();
    if (callerErr || !caller) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // SECURITY: Rate limiting
    const { success } = apiLimiter.check(getClientIdentifier(request, caller.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    const { trainer_id, client_id, promo_code_id, role } = await request.json();

    if (!client_id || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SECURITY: The caller must be the same user as client_id (prevent spoofing other users)
    if (caller.id !== client_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // SECURITY: Clients MUST have trainer_id and promo_code_id
    if (role === "client" && (!trainer_id || !promo_code_id)) {
      return NextResponse.json({ error: "Clients must register with a valid promo code" }, { status: 400 });
    }

    // SECURITY: Validate types of optional params
    if (trainer_id && typeof trainer_id !== "string") {
      return NextResponse.json({ error: "Invalid trainer_id" }, { status: 400 });
    }
    if (promo_code_id && typeof promo_code_id !== "string") {
      return NextResponse.json({ error: "Invalid promo_code_id" }, { status: 400 });
    }

    // Use service_role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the role matches what was set during signUp
    if (caller.user_metadata?.role !== role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // SECURITY: Use email from auth session, not request body
    const callerEmail = caller.email;

    // Insert user_roles record
    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: client_id, role: sanitizeName(role, 20) });
    if (roleError) {
      console.error("[complete-registration] Role insert error");
      return NextResponse.json({ error: "Error al asignar rol" }, { status: 500 });
    }

    // For clients: link to trainer + update promo
    if (role === "client") {
      // SECURITY: Verify trainer exists and has role "trainer"
      const { data: trainerProfile, error: trainerErr } = await supabase
        .from("profiles")
        .select("user_id, role")
        .eq("user_id", trainer_id)
        .eq("role", "trainer")
        .single();

      if (trainerErr || !trainerProfile) {
        return NextResponse.json({ error: "Entrenador no valido" }, { status: 400 });
      }

      // SECURITY: Verify promo code belongs to the specified trainer
      const { data: promoCode, error: promoErr } = await supabase
        .from("trainer_promo_codes")
        .select("id, trainer_id, is_active")
        .eq("id", promo_code_id)
        .eq("trainer_id", trainer_id)
        .eq("is_active", true)
        .single();

      if (promoErr || !promoCode) {
        return NextResponse.json({ error: "Codigo promo no valido para este entrenador" }, { status: 400 });
      }

      const { error: tcError } = await supabase.from("trainer_clients").insert({
        trainer_id,
        client_id,
        promo_code_id,
        status: "pending",
      });

      if (tcError) {
        console.error("[complete-registration] Insert error");
        return NextResponse.json({ error: "Error al vincular con entrenador" }, { status: 500 });
      }

      // SECURITY: Store email from auth session, NOT from request body (prevents email spoofing)
      if (callerEmail) {
        const { error: emailError } = await supabase
          .from("profiles")
          .update({ email: callerEmail })
          .eq("user_id", client_id);
        if (emailError) {
          console.error("[complete-registration] Email update error");
        }
      }

      // SECURITY: Atomic increment of promo code usage (prevents race condition)
      const { error: incrementErr } = await supabase
        .rpc("increment_promo_code_usage", { p_promo_code_id: promo_code_id });

      if (incrementErr) {
        console.error("[complete-registration] Promo increment error");
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error inesperado" },
      { status: 500 }
    );
  }
}
