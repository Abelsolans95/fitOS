/**
 * Pure helper functions for useRoutineScreen.
 * No React hooks, no side effects, no Supabase calls.
 */
import type {
  ExerciseData,
  SetEntry,
  SavedLogEntry,
  PreviousSet,
  PreviousLog,
  MobileSetConfig,
} from "./types";
import { calculateProgress } from "./constants";

// ─── Set type resolution ─────────────────────────────────────────────────────

type SetEntryType = SetEntry["type"];

/**
 * Derive the SetEntry type from a MobileSetConfig.set_type value.
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
  weekDetail: MobileSetConfig[] | undefined,
  mainCount: number
): SetEntryType {
  if (weekDetail?.[index]) {
    return resolveSetEntryType(weekDetail[index].set_type ?? "normal");
  }
  return index < mainCount ? "main" : "rest_pause";
}

// ─── Empty set creation ──────────────────────────────────────────────────────

function emptySet(type: SetEntryType): SetEntry {
  return { weight_kg: "", reps_done: "", rir: "", rpe: "", completed: false, type };
}

// ─── Initialize sets for a list of exercises ─────────────────────────────────

/**
 * Build the initial empty sets for each exercise based on its config.
 * Resolves weekly_config → sets_config → base fields.
 */
export function buildInitialSets(
  exercises: ExerciseData[],
  activeWeek: number
): Record<number, SetEntry[]> {
  const initial: Record<number, SetEntry[]> = {};

  exercises.forEach((ex, idx) => {
    // Check weekly_config sets_detail first (works for both equal and different modes)
    const wkDetail = ex.weekly_config?.[activeWeek]?.sets_detail;

    if (wkDetail && wkDetail.length > 0) {
      initial[idx] = wkDetail.map((sc) => emptySet(resolveSetEntryType(sc.set_type)));
    } else if (ex.mode === "different" && ex.sets_config && ex.sets_config.length > 0) {
      initial[idx] = ex.sets_config.map((sc) => emptySet(resolveSetEntryType(sc.set_type)));
    } else {
      const mainCount = ex.sets ?? 3;
      const rpCount = ex.rest_pause_sets ?? 0;
      const total = mainCount + rpCount;
      initial[idx] = Array.from({ length: total }, (_, i) =>
        emptySet(i < mainCount ? "main" : "rest_pause")
      );
    }
  });

  return initial;
}

// ─── Resume session: rebuild sets from saved logs ────────────────────────────

export interface ResumeResult {
  sets: Record<number, SetEntry[]>;
  savedIndices: Set<number>;
  restoredNotes: Record<number, string>;
  firstIncompleteIdx: number;
}

/**
 * Rebuild set state from saved weight_log entries when resuming an in-progress session.
 */
export function buildResumedSets(
  exercises: ExerciseData[],
  savedLogs: SavedLogEntry[],
  activeWeek: number
): ResumeResult {
  const sets: Record<number, SetEntry[]> = {};
  const savedIndices = new Set<number>();
  const restoredNotes: Record<number, string> = {};

  exercises.forEach((ex, idx) => {
    const wkDetail = ex.weekly_config?.[activeWeek]?.sets_detail;
    const mainCount = ex.sets ?? 3;
    const rpCount = ex.rest_pause_sets ?? 0;
    const total = wkDetail?.length ?? (mainCount + rpCount);
    const savedLog = savedLogs.find((l) => l.exercise_name === ex.name);

    if (savedLog && savedLog.sets_data) {
      sets[idx] = savedLog.sets_data.map(
        (s: PreviousSet & { rir?: number; rpe?: number; completed?: boolean }, i: number) => ({
          weight_kg: String(s.weight_kg),
          reps_done: String(s.reps_done),
          rir: String(s.rir ?? ""),
          rpe: String(s.rpe ?? ""),
          completed: s.completed !== false,
          type: getSetTypeForIndex(i, wkDetail, mainCount),
        })
      );

      if (sets[idx].every((s) => s.completed)) {
        savedIndices.add(idx);
      }

      // Pad to expected total if saved data is shorter
      while (sets[idx].length < total) {
        const i = sets[idx].length;
        sets[idx].push(emptySet(getSetTypeForIndex(i, wkDetail, mainCount)));
      }

      if (savedLog.client_notes) {
        restoredNotes[idx] = savedLog.client_notes;
      }
    } else {
      sets[idx] = Array.from({ length: total }, (_, i) =>
        emptySet(getSetTypeForIndex(i, wkDetail, mainCount))
      );
    }
  });

  const firstIncompleteIdx = exercises.findIndex((_, idx) => {
    const exSets = sets[idx] ?? [];
    return exSets.some((s) => !s.completed);
  });

  return {
    sets,
    savedIndices,
    restoredNotes,
    firstIncompleteIdx: firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0,
  };
}

// ─── Build sets_data payload for DB ──────────────────────────────────────────

export interface SetsDataRow {
  set_number: number;
  weight_kg: number;
  reps_done: number;
  rir: number;
  rpe: number;
  type: string;
  completed: boolean;
}

/**
 * Transform SetEntry[] into the shape expected by weight_log.sets_data.
 * Also computes total volume.
 */
export function buildSetsDataPayload(
  sets: SetEntry[],
  mainCount: number
): { setsData: SetsDataRow[]; totalVolume: number } {
  const setsData: SetsDataRow[] = sets.map((s, i) => ({
    set_number: i + 1,
    weight_kg: Number(s.weight_kg) || 0,
    reps_done: Number(s.reps_done) || 0,
    rir: Number(s.rir) || 0,
    rpe: Number(s.rpe) || 0,
    type: i < mainCount ? "main" : "rest_pause",
    completed: s.completed,
  }));

  const totalVolume = setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);

  return { setsData, totalVolume };
}

/**
 * Build a simplified sets_data payload (without rir/rpe/completed) for registration mode.
 */
export function buildRegistrationSetsData(
  sets: SetEntry[]
): { setsData: { set_number: number; weight_kg: number; reps_done: number; type: string }[]; totalVolume: number } {
  const setsData = sets.map((s, i) => ({
    set_number: i + 1,
    weight_kg: Number(s.weight_kg) || 0,
    reps_done: Number(s.reps_done) || 0,
    type: s.type,
  }));

  const totalVolume = setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);

  return { setsData, totalVolume };
}

// ─── Compute average RPE from completed sets ─────────────────────────────────

export function computeAverageRpe(setsData: SetsDataRow[]): number | null {
  const rpeVals = setsData.filter((s) => s.completed && s.rpe > 0).map((s) => s.rpe);
  if (rpeVals.length === 0) return null;
  return Math.round((rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length) * 10) / 10;
}

// ─── Compute session totals ──────────────────────────────────────────────────

export function computeSessionTotals(
  allSets: Record<number, SetEntry[]>,
  countOnlyCompleted: boolean
): { totalVolume: number; totalSetsCount: number } {
  let totalVolume = 0;
  let totalSetsCount = 0;

  for (const sets of Object.values(allSets)) {
    for (const s of sets) {
      totalVolume += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
      if (countOnlyCompleted) {
        if (s.completed) totalSetsCount++;
      } else {
        totalSetsCount++;
      }
    }
  }

  return { totalVolume, totalSetsCount };
}

// ─── Summary data computation ────────────────────────────────────────────────

export interface SummaryResult {
  totalVol: number;
  totalSetsCount: number;
  results: { name: string; progress: string; color: string }[];
}

/**
 * Compute end-of-session summary with progress comparison against previous logs.
 */
export function computeSummaryData(
  exercises: ExerciseData[],
  allSets: Record<number, SetEntry[]>,
  getPreviousLog: (name: string) => PreviousSet[]
): SummaryResult {
  let totalVol = 0;
  let totalSetsCount = 0;
  const results: { name: string; progress: string; color: string }[] = [];

  exercises.forEach((ex, idx) => {
    const sets = allSets[idx] ?? [];
    const prev = getPreviousLog(ex.name);

    for (const s of sets) {
      totalVol += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
      if (s.completed || Number(s.reps_done) > 0) totalSetsCount++;
    }

    const cur = sets
      .filter((s) => s.completed || Number(s.reps_done) > 0)
      .map((s) => ({ weight: Number(s.weight_kg) || 0, reps: Number(s.reps_done) || 0 }));
    const prv = prev.map((s) => ({ weight: s.weight_kg, reps: s.reps_done }));

    const { label, color } = calculateProgress(cur, prv);
    results.push({ name: ex.name, progress: label, color });
  });

  return { totalVol, totalSetsCount, results };
}
