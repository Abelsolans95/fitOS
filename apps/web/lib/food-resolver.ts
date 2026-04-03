/**
 * Three-layer food resolver
 *
 * Layer A: Global foods (trainer_food_library.is_global = true)
 * Layer B: Trainer private foods (trainer_food_library.is_global = false)
 * Layer C: Trainer overrides of global foods (trainer_food_overrides)
 *
 * Resolution order: C (override) → B (private) → A (global)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { getCached, setCache, invalidateCache } from "./query-cache";

/** Row shape from trainer_food_overrides */
interface TrainerFoodOverride {
  id: string;
  trainer_id: string;
  food_id: string;
  custom_name: string | null;
  custom_kcal: number | null;
  custom_protein: number | null;
  custom_carbs: number | null;
  custom_fat: number | null;
  custom_fiber: number | null;
  custom_notes: string | null;
  hidden: boolean;
}

/** Row returned by search_similar_foods RPC */
export interface SimilarFoodResult {
  id: string;
  name: string;
  similarity: number;
  is_global: boolean;
  trainer_id: string | null;
}

export interface ResolvedFood {
  id: string;
  name: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  is_global: boolean;
  is_overridden: boolean;
  override_id: string | null;
  notes: string | null;
}

/**
 * Get all foods visible to a trainer, with overrides applied.
 */
export async function getResolvedFoods(
  supabase: SupabaseClient,
  trainerId: string
): Promise<ResolvedFood[]> {
  const cacheKey = `foods:${trainerId}`;
  const cached = getCached<ResolvedFood[]>(cacheKey);
  if (cached) return cached;

  const [foodsRes, overridesRes] = await Promise.all([
    supabase
      .from("trainer_food_library")
      .select("id,name,kcal,protein,carbs,fat,fiber,is_global,trainer_id")
      .or(`is_global.eq.true,trainer_id.eq.${trainerId}`)
      .order("name"),
    supabase
      .from("trainer_food_overrides")
      .select("id,trainer_id,food_id,custom_name,custom_kcal,custom_protein,custom_carbs,custom_fat,custom_fiber,custom_notes,hidden")
      .eq("trainer_id", trainerId),
  ]);

  if (foodsRes.error) throw foodsRes.error;
  if (overridesRes.error) throw overridesRes.error;

  const overrideMap = new Map<string, TrainerFoodOverride>();
  for (const ov of (overridesRes.data ?? []) as TrainerFoodOverride[]) {
    overrideMap.set(ov.food_id, ov);
  }

  const result: ResolvedFood[] = [];
  for (const food of (foodsRes.data ?? [])) {
    const override = overrideMap.get(food.id);
    // Layer C: hidden=true means the trainer has explicitly hidden this global food
    if (override?.hidden) continue;
    result.push({
      id: food.id,
      name: override?.custom_name ?? food.name,
      kcal: override?.custom_kcal ?? food.kcal,
      protein: override?.custom_protein ?? food.protein,
      carbs: override?.custom_carbs ?? food.carbs,
      fat: override?.custom_fat ?? food.fat,
      fiber: override?.custom_fiber ?? food.fiber,
      is_global: food.is_global,
      is_overridden: !!override,
      override_id: override?.id ?? null,
      notes: override?.custom_notes ?? null,
    });
  }
  setCache(cacheKey, result);
  return result;
}

/**
 * Search foods by name using pg_trgm similarity.
 */
export async function searchSimilarFoods(
  supabase: SupabaseClient,
  searchTerm: string,
  trainerId: string,
  threshold = 0.3,
  maxResults = 10
): Promise<SimilarFoodResult[]> {
  const { data, error } = await supabase.rpc("search_similar_foods", {
    search_term: searchTerm,
    p_trainer_id: trainerId,
    similarity_threshold: threshold,
    max_results: maxResults,
  });

  if (error) throw error;
  return (data ?? []) as SimilarFoodResult[];
}

/**
 * Create or update a trainer override for a global food.
 */
export async function upsertFoodOverride(
  supabase: SupabaseClient,
  trainerId: string,
  foodId: string,
  overrides: {
    custom_name?: string;
    custom_kcal?: number;
    custom_protein?: number;
    custom_carbs?: number;
    custom_fat?: number;
    custom_fiber?: number;
    custom_notes?: string;
  }
) {
  const { data, error } = await supabase
    .from("trainer_food_overrides")
    .upsert(
      {
        trainer_id: trainerId,
        food_id: foodId,
        ...overrides,
      },
      { onConflict: "trainer_id,food_id" }
    )
    .select()
    .single();

  if (error) throw error;
  invalidateCache(`foods:${trainerId}`);
  return data;
}
