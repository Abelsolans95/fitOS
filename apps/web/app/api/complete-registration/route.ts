import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { trainer_id, client_id, promo_code_id, email, role } = await request.json();

    if (!client_id || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use service_role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user actually exists in auth.users (prevents spoofing)
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(client_id);
    if (authErr || !authUser?.user) {
      console.error("[complete-registration] User not found:", authErr?.message);
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 403 });
    }

    // Verify role matches what was set during signUp
    if (authUser.user.user_metadata?.role !== role) {
      console.error("[complete-registration] Role mismatch:", { expected: role, got: authUser.user.user_metadata?.role });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert user_roles record
    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: client_id, role });
    if (roleError) {
      console.error("[complete-registration] Role insert error:", roleError);
      return NextResponse.json({ error: "Error al asignar rol" }, { status: 500 });
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
        return NextResponse.json({ error: tcError.message }, { status: 500 });
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

      // Increment promo code current_uses
      const { data: currentCode, error: promoSelectError } = await supabase
        .from("trainer_promo_codes")
        .select("current_uses")
        .eq("id", promo_code_id)
        .single();

      if (promoSelectError) {
        console.error("[complete-registration] Promo code select error:", promoSelectError);
        // No bloqueante
      }

      if (currentCode) {
        const { error: promoUpdateError } = await supabase
          .from("trainer_promo_codes")
          .update({ current_uses: currentCode.current_uses + 1 })
          .eq("id", promo_code_id);
        if (promoUpdateError) {
          console.error("[complete-registration] Promo code update error:", promoUpdateError);
          // No bloqueante
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
