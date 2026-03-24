import { describe, it, expect, vi } from "vitest";
import { getResolvedExercises, resolveExercise } from "./exercise-resolver";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Internal row shapes (mirror DB schema)
// ---------------------------------------------------------------------------

interface LibraryRow {
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

interface OverrideRow {
  id: string;
  trainer_id: string;
  exercise_id: string;
  custom_name: string | null;
  custom_description: string | null;
  custom_notes: string | null;
  custom_video_url: string | null;
  hidden: boolean;
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function makeExercise(overrides: Partial<LibraryRow> = {}): LibraryRow {
  return {
    id: "ex-1",
    name: "Squat",
    description: null,
    video_url: null,
    video_thumbnail_url: null,
    muscle_groups: ["quadriceps"],
    secondary_muscles: [],
    equipment_needed: [],
    category: "legs",
    difficulty: null,
    is_global: true,
    trainer_id: null,
    aliases: [],
    ...overrides,
  };
}

function makeOverride(overrides: Partial<OverrideRow> = {}): OverrideRow {
  return {
    id: "ov-1",
    trainer_id: "trainer-1",
    exercise_id: "ex-1",
    custom_name: null,
    custom_description: null,
    custom_notes: null,
    custom_video_url: null,
    hidden: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Supabase mock helpers
// ---------------------------------------------------------------------------

/**
 * Creates a chainable Supabase query builder mock.
 * - All selector methods (.select, .eq, .or, .order) return `this` for chaining.
 * - .single() and .maybeSingle() return Promises resolving to `result`.
 * - The chain itself is a thenable so `await chain` resolves to `result`.
 */
function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const method of ["select", "eq", "or", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  // Make the chain awaitable without calling .single()
  chain.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

/**
 * Creates a mock SupabaseClient that routes `from()` calls by table name.
 */
function createMockSupabase(
  libraryResult: { data: LibraryRow[] | null; error: unknown },
  overridesResult: { data: OverrideRow[] | null; error: unknown },
): SupabaseClient {
  return {
    from: vi.fn((table: string) => {
      if (table === "trainer_exercise_library") return createChain(libraryResult);
      if (table === "trainer_exercise_overrides") return createChain(overridesResult);
      return createChain({ data: [], error: null });
    }),
  } as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRAINER_ID = "trainer-1";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getResolvedExercises", () => {
  // 1. Layer A — global exercises only
  it("returns global exercises (Layer A) with is_overridden=false", async () => {
    const supabase = createMockSupabase(
      { data: [makeExercise({ id: "ex-1", is_global: true, trainer_id: null })], error: null },
      { data: [], error: null },
    );

    const result = await getResolvedExercises(supabase, TRAINER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ex-1");
    expect(result[0].is_global).toBe(true);
    expect(result[0].is_overridden).toBe(false);
    expect(result[0].override_id).toBeNull();
  });

  // 2. Layer B — trainer private exercises
  it("includes trainer private exercises (Layer B), not other trainers' privates", async () => {
    // The .or() query already prevents other trainers' privates from reaching us.
    // We simulate correct DB behavior: only trainer-1's exercises are in the result.
    const exercises = [
      makeExercise({ id: "ex-global", name: "Squat", is_global: true, trainer_id: null }),
      makeExercise({ id: "ex-private", name: "My Curl", is_global: false, trainer_id: TRAINER_ID }),
    ];
    const supabase = createMockSupabase(
      { data: exercises, error: null },
      { data: [], error: null },
    );

    const result = await getResolvedExercises(supabase, TRAINER_ID);

    expect(result).toHaveLength(2);
    expect(result.some((e) => e.id === "ex-global" && e.is_global === true)).toBe(true);
    expect(result.some((e) => e.id === "ex-private" && e.is_global === false)).toBe(true);
    // Another trainer's private would not be in the data (filtered by the query)
  });

  // 3a. Layer C — hidden=true removes the exercise from results
  it("excludes exercises with override hidden=true (Layer C)", async () => {
    const supabase = createMockSupabase(
      { data: [makeExercise({ id: "ex-1", is_global: true })], error: null },
      { data: [makeOverride({ exercise_id: "ex-1", hidden: true })], error: null },
    );

    const result = await getResolvedExercises(supabase, TRAINER_ID);

    expect(result).toHaveLength(0);
  });

  // 3b. Layer C — custom_name override replaces the original name
  it("applies custom_name from Layer C override", async () => {
    const supabase = createMockSupabase(
      { data: [makeExercise({ id: "ex-1", name: "Squat", is_global: true })], error: null },
      { data: [makeOverride({ exercise_id: "ex-1", custom_name: "Sentadilla", hidden: false })], error: null },
    );

    const result = await getResolvedExercises(supabase, TRAINER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Sentadilla");
    expect(result[0].is_overridden).toBe(true);
    expect(result[0].override_id).toBe("ov-1");
  });

  // 4. Combination — Layer A + B present; Layer C overrides the global, private is unchanged
  it("Layer C overrides global (Layer A) while Layer B private exercise is unchanged", async () => {
    const exercises = [
      makeExercise({ id: "ex-global", name: "Squat", is_global: true, trainer_id: null }),
      makeExercise({ id: "ex-private", name: "My Curl", is_global: false, trainer_id: TRAINER_ID }),
    ];
    const overrides = [
      makeOverride({ id: "ov-1", exercise_id: "ex-global", custom_name: "Sentadilla", hidden: false }),
    ];
    const supabase = createMockSupabase(
      { data: exercises, error: null },
      { data: overrides, error: null },
    );

    const result = await getResolvedExercises(supabase, TRAINER_ID);

    expect(result).toHaveLength(2);

    const global = result.find((e) => e.id === "ex-global")!;
    expect(global.name).toBe("Sentadilla");
    expect(global.is_overridden).toBe(true);

    const privateEx = result.find((e) => e.id === "ex-private")!;
    expect(privateEx.name).toBe("My Curl");
    expect(privateEx.is_overridden).toBe(false);
  });

  // 5. Edge — trainer has no private exercises: only globals are returned
  it("returns only globals when trainer has no private exercises", async () => {
    const exercises = [
      makeExercise({ id: "ex-1", name: "Squat", is_global: true }),
      makeExercise({ id: "ex-2", name: "Deadlift", is_global: true }),
    ];
    const supabase = createMockSupabase(
      { data: exercises, error: null },
      { data: [], error: null },
    );

    const result = await getResolvedExercises(supabase, TRAINER_ID);

    expect(result).toHaveLength(2);
    expect(result.every((e) => e.is_global)).toBe(true);
    expect(result.every((e) => !e.is_overridden)).toBe(true);
  });

  // 6. Edge — Supabase error in Layer A propagates (not silenced)
  it("propagates Supabase error from Layer A query", async () => {
    const dbError = { message: "DB connection failed", code: "PGRST000" };
    const supabase = createMockSupabase(
      { data: null, error: dbError },
      { data: [], error: null },
    );

    await expect(getResolvedExercises(supabase, TRAINER_ID)).rejects.toMatchObject({
      message: "DB connection failed",
    });
  });
});

// ---------------------------------------------------------------------------
// resolveExercise — smoke tests
// ---------------------------------------------------------------------------

describe("resolveExercise", () => {
  it("returns null when exercise is not found", async () => {
    const supabase = {
      from: vi.fn(() => createChain({ data: null, error: { message: "not found" } })),
    } as unknown as SupabaseClient;

    const result = await resolveExercise(supabase, "missing-id", TRAINER_ID);
    expect(result).toBeNull();
  });

  it("returns resolved exercise with override applied", async () => {
    const exercise = makeExercise({ id: "ex-1", name: "Squat", is_global: true });
    const override = makeOverride({ exercise_id: "ex-1", custom_name: "Sentadilla", hidden: false });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "trainer_exercise_library")
          return createChain({ data: exercise, error: null });
        if (table === "trainer_exercise_overrides")
          return createChain({ data: override, error: null });
        return createChain({ data: null, error: null });
      }),
    } as unknown as SupabaseClient;

    const result = await resolveExercise(supabase, "ex-1", TRAINER_ID);

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Sentadilla");
    expect(result!.is_overridden).toBe(true);
  });
});
