import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithRole, successResponse, errorResponse } from "@/lib/api-utils";

/**
 * GET /api/client-trainer
 * Returns the trainer_id linked to the authenticated client.
 * Uses service_role to bypass RLS on trainer_clients.
 */
export async function GET(request: NextRequest) {
  try {
    const result = await requireAuthWithRole("client");
    if (result instanceof NextResponse) return result;
    const { user, admin: adminSupabase } = result;

    const { data: tc, error: tcErr } = await adminSupabase
      .from("trainer_clients")
      .select("trainer_id, status")
      .eq("client_id", user.id);

    if (tcErr) {
      console.error("[client-trainer] Error al buscar trainer_clients:", tcErr);
      return errorResponse("Error al buscar el entrenador vinculado", 500);
    }

    if (!tc || tc.length === 0) {
      return errorResponse(
        "No se encontró un entrenador vinculado a tu cuenta.",
        404
      );
    }

    const trainerRow = tc[0];

    // Get trainer profile
    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("full_name, business_name")
      .eq("user_id", trainerRow.trainer_id)
      .single();

    if (profileErr) {
      console.error("[client-trainer] Error al obtener perfil del entrenador:", profileErr);
    }

    return successResponse({
      trainer_id: trainerRow.trainer_id,
      full_name: profile?.business_name || profile?.full_name || "Tu entrenador",
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Error inesperado",
      500
    );
  }
}
