import { NextResponse } from "next/server";
import { createRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName, sanitizeEmail, sanitizeText } from "@/lib/sanitize";

// Rate limiter: 10 requests per minute (public form, strict)
const leadLimiter = createRateLimiter({ interval: 60_000, maxRequests: 10 });

export async function POST(request: Request) {
  // CSRF
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit by IP (no auth)
  const identifier = getClientIdentifier(request);
  const { success } = leadLimiter.check(identifier);
  if (!success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    const name = sanitizeName(body.name ?? "", 100);
    const email = sanitizeEmail(body.email ?? "");
    const trainerId = typeof body.trainer_id === "string" ? body.trainer_id.trim() : "";
    const goal = sanitizeText(body.goal ?? "", 500);
    const source = typeof body.source === "string" ? body.source : "landing";

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "El email no es valido." }, { status: 400 });
    }
    if (!trainerId) {
      return NextResponse.json({ error: "Identificador de entrenador invalido." }, { status: 400 });
    }

    // Validate UUID format for trainer_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trainerId)) {
      return NextResponse.json({ error: "Identificador de entrenador invalido." }, { status: 400 });
    }

    // Validate source
    const validSources = ["landing", "blog", "instagram_dm", "instagram_ads", "tiktok", "whatsapp", "manual"];
    const finalSource = validSources.includes(source) ? source : "landing";

    // Use service_role to bypass RLS (anon can't INSERT into leads)
    // IMPORTANT: createClient inside handler, not at module level (Gotcha #33)
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify trainer exists
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", trainerId)
      .eq("role", "trainer")
      .single();

    if (trainerError || !trainer) {
      return NextResponse.json({ error: "Entrenador no encontrado." }, { status: 404 });
    }

    const { error: insertError } = await supabaseAdmin.from("leads").insert({
      trainer_id: trainerId,
      name,
      email,
      goal: goal || null,
      source: finalSource,
      status: "nuevo",
    });

    if (insertError) {
      console.error("[API/leads] Insert error:", insertError.code);
      return NextResponse.json({ error: "Error al enviar el formulario." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
