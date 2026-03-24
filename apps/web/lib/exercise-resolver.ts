/**
 * Three-layer exercise resolver
 *
 * Layer A: Global exercises (trainer_exercise_library.is_global = true)
 * Layer B: Trainer private exercises (trainer_exercise_library.is_global = false)
 * Layer C: Trainer overrides of global exercises (trainer_exercise_overrides)
 *
 * Resolution order: C (override) → B (private) → A (global)
 * If a trainer has an override for a global exercise, the override fields win.
 * If hidden=true in Layer C, the exercise is excluded entirely.
 */

import { SupabaseClient } from "@supabase/supabase-js";

/** Row shape from trainer_exercise_library */
interface TrainerExerciseLibraryRow {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  muscle_groups: string[] | null;
  secondary_muscles: string[] | null;
  equipment_needed: string[] | null;
  category: string | null;
  difficulty: string | null;
  is_global: boolean;
  trainer_id: string | null;
  aliases: string[] | null;
}

/** Row shape from trainer_exercise_overrides (migración 021 + 027) */
interface TrainerExerciseOverride {
  id: string;
  trainer_id: string;
  exercise_id: string;
  custom_name: string | null;
  custom_description: string | null;
  custom_notes: string | null;
  custom_video_url: string | null;
  /** hidden=true → exclude the global exercise from the trainer's library */
  hidden: boolean;
}

/** Row returned by search_similar_exercises RPC */
export interface SimilarExerciseResult {
  id: string;
  name: string;
  similarity: number;
  is_global: boolean;
  trainer_id: string | null;
}

export interface ResolvedExercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  muscle_groups: string[];
  secondary_muscles: string[];
  equipment_needed: string[];
  category: string | null;
  difficulty: string | null;
  is_global: boolean;
  is_overridden: boolean;
  override_id: string | null;
  aliases: string[];
}

/**
 * Get all exercises visible to a trainer, with overrides applied.
 * Returns global exercises (with any overrides merged) + trainer's private exercises.
 */
export async function getResolvedExercises(
  supabase: SupabaseClient,
  trainerId: string
): Promise<ResolvedExercise[]> {
  // Fetch all visible exercises and overrides in parallel
  const [exercisesRes, overridesRes] = await Promise.all([
    supabase
      .from("trainer_exercise_library")
      .select("*")
      .or(`is_global.eq.true,trainer_id.eq.${trainerId}`)
      .order("name"),
    supabase
      .from("trainer_exercise_overrides")
      .select("*")
      .eq("trainer_id", trainerId),
  ]);

  if (exercisesRes.error) throw exercisesRes.error;
  if (overridesRes.error) throw overridesRes.error;

  const exercises = (exercisesRes.data ?? []) as TrainerExerciseLibraryRow[];
  const overrides = (overridesRes.data ?? []) as TrainerExerciseOverride[];

  const overrideMap = new Map<string, TrainerExerciseOverride>();
  for (const ov of overrides) {
    overrideMap.set(ov.exercise_id, ov);
  }

  const result: ResolvedExercise[] = [];
  for (const ex of exercises) {
    const override = overrideMap.get(ex.id);
    // Layer C: hidden=true means the trainer has explicitly hidden this global exercise
    if (override?.hidden) continue;
    result.push({
      id: ex.id,
      name: override?.custom_name ?? ex.name,
      description: override?.custom_description ?? ex.description,
      video_url: override?.custom_video_url ?? ex.video_url,
      video_thumbnail_url: ex.video_thumbnail_url,
      muscle_groups: ex.muscle_groups ?? [],
      secondary_muscles: ex.secondary_muscles ?? [],
      equipment_needed: ex.equipment_needed ?? [],
      category: ex.category,
      difficulty: ex.difficulty,
      is_global: ex.is_global,
      is_overridden: !!override,
      override_id: override?.id ?? null,
      aliases: ex.aliases ?? [],
    });
  }
  return result;
}

/**
 * Resolve a single exercise by ID, applying any trainer override.
 */
export async function resolveExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  trainerId: string
): Promise<ResolvedExercise | null> {
  const [exerciseRes, overrideRes] = await Promise.all([
    supabase
      .from("trainer_exercise_library")
      .select("*")
      .eq("id", exerciseId)
      .single(),
    supabase
      .from("trainer_exercise_overrides")
      .select("*")
      .eq("exercise_id", exerciseId)
      .eq("trainer_id", trainerId)
      .maybeSingle(),
  ]);

  if (exerciseRes.error || !exerciseRes.data) return null;

  const ex = exerciseRes.data as TrainerExerciseLibraryRow;
  const override = overrideRes.data as TrainerExerciseOverride | null;

  return {
    id: ex.id,
    name: override?.custom_name ?? ex.name,
    description: override?.custom_description ?? ex.description,
    video_url: override?.custom_video_url ?? ex.video_url,
    video_thumbnail_url: ex.video_thumbnail_url,
    muscle_groups: ex.muscle_groups ?? [],
    secondary_muscles: ex.secondary_muscles ?? [],
    equipment_needed: ex.equipment_needed ?? [],
    category: ex.category,
    difficulty: ex.difficulty,
    is_global: ex.is_global,
    is_overridden: !!override,
    override_id: override?.id ?? null,
    aliases: ex.aliases ?? [],
  };
}

/**
 * Search exercises by name using pg_trgm similarity.
 * Calls the search_similar_exercises database function.
 */
export async function searchSimilarExercises(
  supabase: SupabaseClient,
  searchTerm: string,
  trainerId: string,
  threshold = 0.3,
  maxResults = 10
): Promise<SimilarExerciseResult[]> {
  const { data, error } = await supabase.rpc("search_similar_exercises", {
    search_term: searchTerm,
    p_trainer_id: trainerId,
    similarity_threshold: threshold,
    max_results: maxResults,
  });

  if (error) throw error;
  return (data ?? []) as SimilarExerciseResult[];
}

/**
 * Create or update a trainer override for a global exercise.
 */
export async function upsertExerciseOverride(
  supabase: SupabaseClient,
  trainerId: string,
  exerciseId: string,
  overrides: {
    custom_name?: string;
    custom_description?: string;
    custom_notes?: string;
    custom_video_url?: string;
  }
) {
  const { data, error } = await supabase
    .from("trainer_exercise_overrides")
    .upsert(
      {
        trainer_id: trainerId,
        exercise_id: exerciseId,
        ...overrides,
      },
      { onConflict: "trainer_id,exercise_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
