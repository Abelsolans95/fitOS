import { describe, it, expect, vi } from "vitest";
import { getResolvedFoods, searchSimilarFoods } from "./food-resolver";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Internal row shapes (mirror DB schema)
// ---------------------------------------------------------------------------

interface FoodRow {
  id: string;
  name: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  is_global: boolean;
  trainer_id: string | null;
}

interface FoodOverrideRow {
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

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function makeFood(overrides: Partial<FoodRow> = {}): FoodRow {
  return {
    id: "food-1",
    name: "Arroz blanco",
    kcal: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4,
    is_global: true,
    trainer_id: null,
    ...overrides,
  };
}

function makeOverride(overrides: Partial<FoodOverrideRow> = {}): FoodOverrideRow {
  return {
    id: "ov-1",
    trainer_id: "trainer-1",
    food_id: "food-1",
    custom_name: null,
    custom_kcal: null,
    custom_protein: null,
    custom_carbs: null,
    custom_fat: null,
    custom_fiber: null,
    custom_notes: null,
    hidden: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Supabase mock helpers
// ---------------------------------------------------------------------------

function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const method of ["select", "eq", "or", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

function createMockSupabase(
  foodsResult: { data: FoodRow[] | null; error: unknown },
  overridesResult: { data: FoodOverrideRow[] | null; error: unknown },
): SupabaseClient {
  return {
    from: vi.fn((table: string) => {
      if (table === "trainer_food_library") return createChain(foodsResult);
      if (table === "trainer_food_overrides") return createChain(overridesResult);
      return createChain({ data: [], error: null });
    }),
  } as unknown as SupabaseClient;
}

const TRAINER_ID = "trainer-1";

// ---------------------------------------------------------------------------
// Tests — getResolvedFoods
// ---------------------------------------------------------------------------

describe("getResolvedFoods", () => {
  // 1. Layer A — global foods only
  it("returns global foods with is_overridden=false", async () => {
    const supabase = createMockSupabase(
      { data: [makeFood({ id: "food-1", is_global: true })], error: null },
      { data: [], error: null },
    );

    const result = await getResolvedFoods(supabase, TRAINER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("food-1");
    expect(result[0].is_global).toBe(true);
    expect(result[0].is_overridden).toBe(false);
    expect(result[0].override_id).toBeNull();
  });

  // 2. Layer B — trainer private foods
  it("includes trainer private foods (Layer B)", async () => {
    const foods = [
      makeFood({ id: "food-global", name: "Arroz", is_global: true, trainer_id: null }),
      makeFood({ id: "food-private", name: "Mi batido", is_global: false, trainer_id: TRAINER_ID }),
    ];
    const supabase = createMockSupabase(
      { data: foods, error: null },
      { data: [], error: null },
    );

    const result = await getResolvedFoods(supabase, TRAINER_ID);

    expect(result).toHaveLength(2);
    expect(result.some((f) => f.id === "food-global" && f.is_global)).toBe(true);
    expect(result.some((f) => f.id === "food-private" && !f.is_global)).toBe(true);
  });

  // 3. Layer C — override applies custom_name
  it("applies custom_name from Layer C override", async () => {
    const supabase = createMockSupabase(
      { data: [makeFood({ id: "food-1", name: "Arroz blanco" })], error: null },
      { data: [makeOverride({ food_id: "food-1", custom_name: "Arroz integral" })], error: null },
    );

    const result = await getResolvedFoods(supabase, TRAINER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Arroz integral");
    expect(result[0].is_overridden).toBe(true);
    expect(result[0].override_id).toBe("ov-1");
  });

  // 4. Override applies custom macros via ??
  it("applies custom_kcal from override (nullish coalescing)", async () => {
    const supabase = createMockSupabase(
      { data: [makeFood({ id: "food-1", kcal: 130 })], error: null },
      { data: [makeOverride({ food_id: "food-1", custom_kcal: 110 })], error: null },
    );

    const result = await getResolvedFoods(supabase, TRAINER_ID);

    expect(result[0].kcal).toBe(110);
  });

  // 5. Supabase error propagates
  it("propagates Supabase error from foods query", async () => {
    const dbError = { message: "DB connection failed", code: "PGRST000" };
    const supabase = createMockSupabase(
      { data: null, error: dbError },
      { data: [], error: null },
    );

    await expect(getResolvedFoods(supabase, TRAINER_ID)).rejects.toMatchObject({
      message: "DB connection failed",
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — searchSimilarFoods
// ---------------------------------------------------------------------------

describe("searchSimilarFoods", () => {
  it("returns results from RPC call", async () => {
    const rpcResult = [
      { id: "food-1", name: "Arroz", similarity: 0.8, is_global: true, trainer_id: null },
    ];
    const supabase = {
      rpc: vi.fn(() => Promise.resolve({ data: rpcResult, error: null })),
    } as unknown as SupabaseClient;

    const result = await searchSimilarFoods(supabase, "arroz", TRAINER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Arroz");
    expect(supabase.rpc).toHaveBeenCalledWith("search_similar_foods", {
      search_term: "arroz",
      p_trainer_id: TRAINER_ID,
      similarity_threshold: 0.3,
      max_results: 10,
    });
  });
});
