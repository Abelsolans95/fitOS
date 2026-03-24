import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Verify the request comes from an authenticated client
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service_role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update trainer_clients status from pending to active
    const { error: activateError } = await supabase
      .from("trainer_clients")
      .update({ status: "active" })
      .eq("client_id", user.id)
      .eq("status", "pending");

    if (activateError) {
      console.error("[activate-client] Error activando cliente:", activateError);
      return NextResponse.json({ error: "Error al activar el cliente" }, { status: 500 });
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
