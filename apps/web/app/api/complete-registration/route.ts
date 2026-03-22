import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
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
    console.log("[complete-registration] Inserting trainer_clients:", { trainer_id, client_id, promo_code_id });
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
    console.log("[complete-registration] Insert OK");

    // Store email in profile (column added via migration)
    if (email) {
      await supabase
        .from("profiles")
        .update({ email })
        .eq("user_id", client_id);
    }

    // Increment promo code current_uses
    const { data: currentCode } = await supabase
      .from("trainer_promo_codes")
      .select("current_uses")
      .eq("id", promo_code_id)
      .single();

    if (currentCode) {
      await supabase
        .from("trainer_promo_codes")
        .update({ current_uses: currentCode.current_uses + 1 })
        .eq("id", promo_code_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
