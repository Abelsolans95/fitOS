import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/fix-client-link
 * Temporary endpoint to manually link a client to a trainer.
 * DELETE THIS FILE after use.
 */
export async function POST(request: NextRequest) {
  try {
    const { client_id, trainer_id } = await request.json();

    if (!client_id || !trainer_id) {
      return NextResponse.json({ error: "Missing client_id or trainer_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if already exists
    const { data: existing } = await supabase
      .from("trainer_clients")
      .select("id")
      .eq("client_id", client_id)
      .eq("trainer_id", trainer_id);

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: "Already linked", id: existing[0].id });
    }

    const { data, error } = await supabase.from("trainer_clients").insert({
      trainer_id,
      client_id,
      status: "active",
    }).select();

    if (error) {
      console.error("[fix-client-link] Error:", error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
