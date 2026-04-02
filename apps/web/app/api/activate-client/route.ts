import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithRole, successResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    // Verify the request comes from an authenticated client
    const result = await requireAuthWithRole("client");
    if (result instanceof NextResponse) return result;
    const { user, admin: supabase } = result;

    // Update trainer_clients status from pending to active
    const { error: activateError } = await supabase
      .from("trainer_clients")
      .update({ status: "active" })
      .eq("client_id", user.id)
      .eq("status", "pending");

    if (activateError) {
      console.error("[activate-client] Error activando cliente:", activateError);
      return errorResponse("Error al activar el cliente", 500);
    }

    // Ensure profile has email stored (trigger may not include it)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ email: user.email })
      .eq("user_id", user.id)
      .is("email", null);

    if (profileError) {
      console.error("[activate-client] Error actualizando email en perfil:", profileError);
      // No bloqueante — la activación ya se completó
    }

    return successResponse({ success: true });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Unexpected error",
      500
    );
  }
}
