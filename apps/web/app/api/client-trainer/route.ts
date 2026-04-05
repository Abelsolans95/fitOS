import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";

/**
 * GET /api/client-trainer
 * Returns the trainer_id linked to the authenticated client.
 * Uses service_role to bypass RLS on trainer_clients.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get the authenticated user from the request cookies
    const serverSupabase = await createBrowserClient();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // SECURITY: Rate limiting
    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    // Only clients can query their linked trainer
    if (user.user_metadata?.role !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Use service_role to query trainer_clients (bypasses RLS)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tc, error: tcErr } = await adminSupabase
      .from("trainer_clients")
      .select("trainer_id, client_id, status")
      .eq("client_id", user.id);

    if (tcErr) {
      console.error("[client-trainer] Error al buscar trainer_clients");
      return NextResponse.json(
        { error: "Error al buscar el entrenador vinculado" },
        { status: 500 }
      );
    }

    if (!tc || tc.length === 0) {
      return NextResponse.json(
        { error: "No se encontró un entrenador vinculado a tu cuenta." },
        { status: 404 }
      );
    }

    const trainerRow = tc[0];

    // 3. Get trainer profile
    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("full_name, business_name")
      .eq("user_id", trainerRow.trainer_id)
      .single();

    if (profileErr) {
      console.error("[client-trainer] Error al obtener perfil del entrenador");
    }

    return NextResponse.json({
      trainer_id: trainerRow.trainer_id,
      full_name: profile?.business_name || profile?.full_name || "Tu entrenador",
    });
  } catch {
    return NextResponse.json(
      { error: "Error inesperado" },
      { status: 500 }
    );
  }
}
