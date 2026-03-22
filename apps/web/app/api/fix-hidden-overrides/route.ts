import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase-server";

/**
 * POST /api/fix-hidden-overrides
 * Removes all hidden overrides created by old import bug.
 * DELETE THIS FILE after use.
 */
export async function POST() {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find all hidden overrides for this trainer
  const { data: hidden } = await supabaseAdmin
    .from("trainer_exercise_overrides")
    .select("id, exercise_id")
    .eq("trainer_id", user.id)
    .eq("hidden", true);

  if (!hidden || hidden.length === 0) {
    return NextResponse.json({ message: "No hay overrides ocultos", count: 0 });
  }

  // Delete them
  const { error } = await supabaseAdmin
    .from("trainer_exercise_overrides")
    .delete()
    .eq("trainer_id", user.id)
    .eq("hidden", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `${hidden.length} overrides eliminados. Los ejercicios ya son visibles.`,
    count: hidden.length,
    restored_ids: hidden.map((h) => h.exercise_id),
  });
}
