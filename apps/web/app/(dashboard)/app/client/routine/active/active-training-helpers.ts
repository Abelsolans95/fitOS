/* ────────────────────────────────────────────
   Active Training — Pure helper functions
   Extracted from useActiveTraining.ts (Rule 51)
   ──────────────────────────────────────────── */

import type {
  ExerciseData,
  PreviousLog,
  PreviousSet,
  SetEntry,
  SavedSetData,
  SavedLogEntry,
  SummaryExerciseResult,
  SummaryData,
} from "./types";
import { calculateProgress } from "./types";

/* ── Empty set factory ── */

export function createEmptySet(): SetEntry {
  return {
    weight_kg: "",
    reps_done: "",
    rir: "",
    rpe: "",
    completed: false,
  };
}

/* ── Compute total sets count for an exercise at a given week ── */

export function getTotalSetsCount(ex: ExerciseData, week: number): number {
  const wkDetail = ex.weekly_config?.[week]?.sets_detail;
  if (wkDetail?.length) return wkDetail.length;
  if (ex.mode === "different" && ex.sets_config?.length) return ex.sets_config.length;
  return (ex.sets || 3) + (ex.rest_pause_sets || 0);
}

/* ── Initialize sets for a fresh session ── */

export function initializeSetsFromExercises(
  exercises: ExerciseData[],
  week: number
): Record<number, SetEntry[]> {
  const initial: Record<number, SetEntry[]> = {};
  exercises.forEach((ex, idx) => {
    const count = getTotalSetsCount(ex, week);
    initial[idx] = Array.from({ length: count }, () => createEmptySet());
  });
  return initial;
}

/* ── Resume sets from an in-progress session ── */

export interface ResumeResult {
  sets: Record<number, SetEntry[]>;
  notes: Record<number, string>;
  savedExercises: number[];
  firstIncompleteIdx: number;
}

export function resumeSetsFromSession(
  exercises: ExerciseData[],
  sessionLogs: SavedLogEntry[],
  week: number
): ResumeResult {
  const initial: Record<number, SetEntry[]> = {};
  const restoredNotes: Record<number, string> = {};
  const alreadySaved: number[] = [];

  exercises.forEach((ex, idx) => {
    const totalSetsCount = getTotalSetsCount(ex, week);
    const savedLog = sessionLogs.find((l) => l.exercise_name === ex.name);

    if (savedLog && savedLog.sets_data) {
      initial[idx] = savedLog.sets_data.map((s: SavedSetData) => ({
        weight_kg: String(s.weight_kg),
        reps_done: String(s.reps_done),
        rir: String(s.rir ?? ex.rir ?? ""),
        rpe: String(s.rpe ?? ""),
        completed: s.completed !== false,
      }));
      const allSetsDone = initial[idx].every((s) => s.completed);
      if (allSetsDone) alreadySaved.push(idx);
      // Pad if exercise has more sets than saved
      while (initial[idx].length < totalSetsCount) {
        initial[idx].push(createEmptySet());
      }
      if (savedLog.client_notes) {
        restoredNotes[idx] = savedLog.client_notes;
      }
    } else {
      initial[idx] = Array.from({ length: totalSetsCount }, () => createEmptySet());
    }
  });

  // Jump to first exercise with incomplete sets
  const firstIncomplete = exercises.findIndex((_, idx) => {
    const sets = initial[idx] || [];
    return sets.some((s) => !s.completed);
  });

  return {
    sets: initial,
    notes: restoredNotes,
    savedExercises: alreadySaved,
    firstIncompleteIdx: firstIncomplete >= 0 ? firstIncomplete : 0,
  };
}

/* ── Build sets_data payload for DB upsert ── */

export interface SetsDataEntry {
  set_number: number;
  weight_kg: number;
  reps_done: number;
  rir: number;
  rpe: number;
  type: string;
  completed: boolean;
}

export function buildSetsData(
  sets: SetEntry[],
  exerciseSetsCount: number
): SetsDataEntry[] {
  return sets.map((s, i) => ({
    set_number: i + 1,
    weight_kg: Number(s.weight_kg) || 0,
    reps_done: Number(s.reps_done) || 0,
    rir: Number(s.rir) || 0,
    rpe: Number(s.rpe) || 0,
    type: i < exerciseSetsCount ? "main" : "rest_pause",
    completed: s.completed,
  }));
}

/* ── Compute average RPE from per-set values ── */

export function computeAverageRpe(setsData: SetsDataEntry[]): number | null {
  const rpeValues = setsData
    .filter((s) => s.rpe > 0 && s.completed)
    .map((s) => s.rpe);
  return rpeValues.length > 0
    ? Math.round(rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length)
    : null;
}

/* ── Compute total volume from sets data ── */

export function computeTotalVolume(setsData: SetsDataEntry[]): number {
  return setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);
}

/* ── Compute session-level totals from all sets ── */

export interface SessionTotals {
  totalVolume: number;
  totalSetsCount: number;
}

export function computeSessionTotals(
  allSets: Record<number, SetEntry[]>
): SessionTotals {
  let totalVolume = 0;
  let totalSetsCount = 0;
  for (const sets of Object.values(allSets)) {
    for (const s of sets) {
      totalVolume += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
      if (s.completed) totalSetsCount++;
    }
  }
  return { totalVolume, totalSetsCount };
}

/* ── Build summary data for the summary view ── */

export function buildSummaryData(
  exercises: ExerciseData[],
  allSets: Record<number, SetEntry[]>,
  exerciseNotes: Record<number, string>,
  getPreviousForExercise: (name: string) => PreviousSet[]
): SummaryData {
  let totalVolume = 0;
  let totalSetsCount = 0;
  const exerciseResults: SummaryExerciseResult[] = [];

  exercises.forEach((ex, idx) => {
    const sets = allSets[idx] || [];
    const prev = getPreviousForExercise(ex.name);

    for (const s of sets) {
      totalVolume += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
      if (s.completed) totalSetsCount++;
    }

    const currentData = sets
      .filter((s) => s.completed)
      .map((s) => ({
        weight: Number(s.weight_kg) || 0,
        reps: Number(s.reps_done) || 0,
      }));
    const prevData = prev.map((s) => ({
      weight: s.weight_kg,
      reps: s.reps_done,
    }));

    exerciseResults.push({
      name: ex.name,
      sets,
      previous: prev,
      progress: calculateProgress(currentData, prevData),
      notes: exerciseNotes[idx]?.trim() || null,
    });
  });

  return { totalVolume, totalSetsCount, exerciseResults };
}

/* ── Lookup previous log for a given exercise name ── */

export function findPreviousSets(
  previousLogs: PreviousLog[],
  exerciseName: string
): PreviousSet[] {
  const log = previousLogs.find((l) => l.exercise_name === exerciseName);
  return (log?.sets_data as PreviousSet[]) || [];
}
