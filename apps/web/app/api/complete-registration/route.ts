import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    // Verify caller is authenticated
    const authSupabase = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      console.error("[complete-registration] Auth error:", authError?.message);
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { trainer_id, client_id, promo_code_id, email } = await request.json();

    if (!trainer_id || !client_id || !promo_code_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use service_role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert trainer_clients record as pending until client confirms email and logs in
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

    // Store email in profile (column added via migration)
    if (email) {
      const { error: emailError } = await supabase
        .from("profiles")
        .update({ email })
        .eq("user_id", client_id);
      if (emailError) {
        console.error("[complete-registration] Email update error:", emailError);
        // No bloqueante — el registro ya se creó correctamente
      }
    }

    // Increment promo code current_uses
    // ⚠️ RACE CONDITION: Este read-then-write no es atómico. Bajo concurrencia alta
    // dos requests podrían leer el mismo current_uses y ambos escribir +1, perdiendo
    // un incremento. La solución correcta es crear una función RPC en PostgreSQL:
    //
    //   CREATE OR REPLACE FUNCTION increment_promo_code_uses(p_code_id UUID)
    //   RETURNS void AS $$
    //     UPDATE trainer_promo_codes
    //     SET current_uses = current_uses + 1
    //     WHERE id = p_code_id;
    //   $$ LANGUAGE sql;
    //
    // Y luego llamar: await supabase.rpc("increment_promo_code_uses", { p_code_id: promo_code_id })
    const { data: currentCode, error: promoSelectError } = await supabase
      .from("trainer_promo_codes")
      .select("current_uses")
      .eq("id", promo_code_id)
      .single();

    if (promoSelectError) {
      console.error("[complete-registration] Promo code select error:", promoSelectError);
      // No bloqueante — el registro ya se creó correctamente
    }

    if (currentCode) {
      const { error: promoUpdateError } = await supabase
        .from("trainer_promo_codes")
        .update({ current_uses: currentCode.current_uses + 1 })
        .eq("id", promo_code_id);
      if (promoUpdateError) {
        console.error("[complete-registration] Promo code update error:", promoUpdateError);
        // No bloqueante — el registro ya se creó correctamente
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
