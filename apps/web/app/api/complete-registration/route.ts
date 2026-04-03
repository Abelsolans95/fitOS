import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { successResponse, errorResponse, parseJsonBody } from "@/lib/api-utils";

interface CompleteRegistrationBody {
  trainer_id?: string;
  client_id: string;
  promo_code_id?: string;
  email?: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<CompleteRegistrationBody>(request);
    if (body instanceof NextResponse) return body;

    const { trainer_id, client_id, promo_code_id, email, role } = body;

    if (!client_id || !role) {
      return errorResponse("Missing required fields", 400);
    }

    const validRoles = ["client", "trainer"];
    if (!validRoles.includes(role)) {
      return errorResponse("Rol no válido", 400);
    }

    // Use service_role key to bypass RLS
    const supabase = createAdminClient();

    // Verify the user actually exists in auth.users (prevents spoofing)
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(client_id);
    if (authErr || !authUser?.user) {
      console.error("[complete-registration] User not found:", authErr?.message);
      return errorResponse("Usuario no encontrado", 403);
    }

    // Verify role matches what was set during signUp
    if (authUser.user.user_metadata?.role !== role) {
      console.error("[complete-registration] Role mismatch:", { expected: role, got: authUser.user.user_metadata?.role });
      return errorResponse("Forbidden", 403);
    }

    // Insert user_roles record
    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: client_id, role });
    if (roleError) {
      console.error("[complete-registration] Role insert error:", roleError);
      return errorResponse("Error al asignar rol", 500);
    }

    // For clients: link to trainer + update promo
    if (role === "client" && trainer_id && promo_code_id) {
      const { error: tcError } = await supabase.from("trainer_clients").insert({
        trainer_id,
        client_id,
        promo_code_id,
        status: "pending",
      });

      if (tcError) {
        console.error("[complete-registration] Insert error:", tcError);
        return errorResponse("Error al vincular con el entrenador", 500);
      }

      // Store email in profile
      if (email) {
        const { error: emailError } = await supabase
          .from("profiles")
          .update({ email })
          .eq("user_id", client_id);
        if (emailError) {
          console.error("[complete-registration] Email update error:", emailError);
          // No bloqueante
        }
      }

      // Increment promo code current_uses atomically (avoids race condition)
      const { error: promoRpcError } = await supabase.rpc("increment_promo_code_uses", {
        p_promo_code_id: promo_code_id,
      });
      if (promoRpcError) {
        console.error("[complete-registration] Promo code increment error:", promoRpcError);
        // No bloqueante — el registro del cliente ya se completó
      }
    }

    return successResponse({ success: true });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Unexpected error",
      500
    );
  }
}
