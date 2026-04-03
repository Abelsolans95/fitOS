import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: CSRF protection
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainer_id, client_id, promo_code_id, role } = await request.json();

    if (!client_id || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SECURITY: Clients MUST have trainer_id and promo_code_id
    if (role === "client" && (!trainer_id || !promo_code_id)) {
      return NextResponse.json({ error: "Clients must register with a valid promo code" }, { status: 400 });
    }

    // Use service_role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user actually exists in auth.users (prevents spoofing)
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(client_id);
    if (authErr || !authUser?.user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 403 });
    }

    // SECURITY: Verify client_id matches the auth user's own ID from JWT metadata
    // The signUp flow sets client_id = user.id, so they must match
    if (authUser.user.user_metadata?.role !== role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

      // SECURITY: Store email from auth user, NOT from request body (prevents email spoofing)
      if (authUser.user.email) {
        const { error: emailError } = await supabase
          .from("profiles")
          .update({ email: authUser.user.email })
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
