/**
 * Shared set helper functions for routine training.
 * Used by both web and mobile apps.
 * Pure functions — no React hooks, no side effects.
 */

import type { SetEntryType, SetConfig, ExerciseData, SetEntry } from "../types/routine";

// ─── Set type resolution ─────────────────────────────────────────────────────

/**
 * Derive the runtime SetEntryType from a SetConfig.set_type value.
 * Maps config "normal" → runtime "main".
 */
export function resolveSetEntryType(setType: string | undefined): SetEntryType {
  if (setType === "rest_pause") return "rest_pause";
  if (setType === "drop_set") return "drop_set";
  return "main";
}

/**
 * Get the set type for a given index, checking weekly_config sets_detail first,
 * then falling back to mainCount threshold.
 */
export function getSetTypeForIndex(
  index: number,
  weekDetail: SetConfig[] | undefined,
  mainCount: number
): SetEntryType {
  if (weekDetail?.[index]) {
    return resolveSetEntryType(weekDetail[index].set_type ?? "normal");
  }
  return index < mainCount ? "main" : "rest_pause";
}

// ─── Empty set creation ──────────────────────────────────────────────────────

/**
 * Create an empty SetEntry with optional type.
 */
export function createEmptySet(type?: SetEntryType): SetEntry {
  return {
    weight_kg: "",
    reps_done: "",
    rir: "",
    rpe: "",
    completed: false,
    ...(type !== undefined ? { type } : {}),
  };
}

// ─── Total sets count ────────────────────────────────────────────────────────

/**
 * Compute total sets count for an exercise at a given week.
 * Resolves: weekly_config.sets_detail → sets_config (different mode) → base sets + rest_pause_sets.
 */
export function getTotalSetsCount(ex: ExerciseData, week: number): number {
  const wkDetail = ex.weekly_config?.[week]?.sets_detail;
  if (wkDetail?.length) return wkDetail.length;
  if (ex.mode === "different" && ex.sets_config?.length) return ex.sets_config.length;
  return (ex.sets || 3) + (ex.rest_pause_sets || 0);
}

// ─── Lookup previous log ─────────────────────────────────────────────────────

import type { PreviousLog, PreviousSet } from "../types/routine";

/**
 * Find previous sets for a given exercise name from a list of previous logs.
 */
export function findPreviousSets(
  previousLogs: PreviousLog[],
  exerciseName: string
): PreviousSet[] {
  const log = previousLogs.find((l) => l.exercise_name === exerciseName);
  return (log?.sets_data as PreviousSet[]) || [];
}
