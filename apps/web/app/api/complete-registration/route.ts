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
      // SECURITY: Verify trainer exists and has role "trainer"
      const { data: trainerProfile, error: trainerErr } = await supabase
        .from("profiles")
        .select("user_id, role")
        .eq("user_id", trainer_id)
        .eq("role", "trainer")
        .single();

      if (trainerErr || !trainerProfile) {
        console.error("[complete-registration] Invalid trainer:", trainerErr?.message);
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
        console.error("[complete-registration] Promo code mismatch:", promoErr?.message);
        return NextResponse.json({ error: "Codigo promo no valido para este entrenador" }, { status: 400 });
      }

      const { error: tcError } = await supabase.from("trainer_clients").insert({
        trainer_id,
        client_id,
        promo_code_id,
        status: "pending",
      });

      if (tcError) {
        console.error("[complete-registration] Insert error:", tcError);
        return NextResponse.json({ error: "Error al vincular con entrenador" }, { status: 500 });
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

      // SECURITY: Atomic increment of promo code usage (prevents race condition)
      const { data: incrementResult, error: incrementErr } = await supabase
        .rpc("increment_promo_code_usage", { p_promo_code_id: promo_code_id });

      if (incrementErr) {
        console.error("[complete-registration] Promo increment error:", incrementErr);
        // No bloqueante — client is already linked
      } else if (incrementResult === false) {
        console.warn("[complete-registration] Promo code limit reached or expired:", promo_code_id);
        // No bloqueante — client is already linked, but log for monitoring
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
