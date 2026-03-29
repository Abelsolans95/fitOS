import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify auth
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verify trainer role
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "trainer") {
    return NextResponse.json({ error: "Solo entrenadores" }, { status: 403 });
  }

  const { exercises, linked, import_id, decisions } = await request.json();

  const created: { name: string; id: string }[] = [];
  const errors: { name: string; error: string }[] = [];

  // 1. Create new private exercises
  if (exercises && Array.isArray(exercises)) {
    for (const ex of exercises) {
      const { data, error } = await supabaseAdmin
        .from("trainer_exercise_library")
        .insert({
          trainer_id: user.id,
          name: ex.name,
          is_global: false,
          category: ex.category || null,
        })
        .select("id, name")
        .single();

      if (error) {
        errors.push({ name: ex.name, error: error.message });
      } else if (data) {
        created.push({ name: data.name, id: data.id });
      }
    }
  }

  // 2. Linked exercises — clone as private with the trainer's name if different,
  //    or skip if trainer already has a private exercise with that name.
  const linkedResults: { name: string; id: string }[] = [];
  if (linked && Array.isArray(linked)) {
    for (const link of linked) {
      // link = { global_exercise_id, trainer_exercise_name }
      const trainerName = link.trainer_exercise_name || "";

      // Check if trainer already has a private exercise with this exact name
      const { data: existing } = await supabaseAdmin
        .from("trainer_exercise_library")
        .select("id, name")
        .eq("trainer_id", user.id)
        .eq("is_global", false)
        .ilike("name", trainerName)
        .maybeSingle();

      if (existing) {
        // Already exists as private — no action needed
        linkedResults.push({ name: existing.name, id: existing.id });
        continue;
      }

      // Check if the matched exercise name is identical (case-insensitive) to trainer's name
      const { data: matchedEx } = await supabaseAdmin
        .from("trainer_exercise_library")
        .select("id, name, category")
        .eq("id", link.global_exercise_id)
        .single();

      if (matchedEx && matchedEx.name.toLowerCase() === trainerName.toLowerCase()) {
        // Same name — global is already visible, no clone needed
        linkedResults.push({ name: matchedEx.name, id: matchedEx.id });
        continue;
      }

      // Different name — create private exercise with trainer's name
      const { data: cloned, error: cloneErr } = await supabaseAdmin
        .from("trainer_exercise_library")
        .insert({
          trainer_id: user.id,
          name: trainerName,
          is_global: false,
          category: matchedEx?.category ?? null,
        })
        .select("id, name")
        .single();

      if (cloneErr) {
        errors.push({ name: trainerName, error: cloneErr.message });
      } else if (cloned) {
        linkedResults.push({ name: cloned.name, id: cloned.id });
      }
    }
  }

  // 3. Update import record
  if (import_id && decisions) {
    await supabaseAdmin
      .from("excel_imports")
      .update({
        mapping_decisions: decisions,
        status: "imported",
      })
      .eq("id", import_id);
  }

  return NextResponse.json({
    created,
    linked: linkedResults,
    errors,
    total_created: created.length,
    total_linked: linkedResults.length,
    total_errors: errors.length,
  });
}
