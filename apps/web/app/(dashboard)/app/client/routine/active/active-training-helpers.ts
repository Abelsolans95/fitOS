/* ────────────────────────────────────────────
   Active Training — Pure helper functions
   Extracted from useActiveTraining.ts (Rule 51)

   Shared logic lives in @fitos/shared/routine-logic.
   This file wraps shared functions and adds web-specific buildSummaryData.
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

// ── Re-export shared helpers used by useActiveTraining ───────────────────────
export {
  createEmptySet,
  getTotalSetsCount,
  findPreviousSets,
} from "@fitos/shared";

export type { SetsDataEntry } from "@fitos/shared";

export {
  buildSetsData,
  computeAverageRpe,
  computeSessionTotals,
} from "@fitos/shared";

// ── Import shared helpers used internally ───────────────────────────────────
import {
  createEmptySet,
  getTotalSetsCount,
} from "@fitos/shared";

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

/* ── Build summary data for the summary view (web-specific: uses calculateProgress with hex colors) ── */

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
