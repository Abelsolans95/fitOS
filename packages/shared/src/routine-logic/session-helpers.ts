/**
 * Shared session helper functions for routine training.
 * Used by both web and mobile apps.
 * Pure functions — no React hooks, no side effects.
 */

import type { SetEntry } from "../types/routine";

// ─── Sets data payload for DB ────────────────────────────────────────────────

export interface SetsDataEntry {
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
 * Returns both the payload and total volume.
 *
 * @param sets - Array of SetEntry from the UI
 * @param mainCount - Number of main (non-derivative) sets for type fallback
 */
export function buildSetsData(
  sets: SetEntry[],
  mainCount: number
): { setsData: SetsDataEntry[]; totalVolume: number } {
  const setsData: SetsDataEntry[] = sets.map((s, i) => ({
    set_number: i + 1,
    weight_kg: Number(s.weight_kg) || 0,
    reps_done: Number(s.reps_done) || 0,
    rir: Number(s.rir) || 0,
    rpe: Number(s.rpe) || 0,
    type: s.type ?? (i < mainCount ? "main" : "rest_pause"),
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
    type: s.type ?? "main",
  }));

  const totalVolume = setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);

  return { setsData, totalVolume };
}

// ─── Average RPE ─────────────────────────────────────────────────────────────

/**
 * Compute average RPE from completed sets. Returns 1 decimal precision.
 */
export function computeAverageRpe(setsData: SetsDataEntry[]): number | null {
  const rpeVals = setsData.filter((s) => s.completed && s.rpe > 0).map((s) => s.rpe);
  if (rpeVals.length === 0) return null;
  return Math.round((rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length) * 10) / 10;
}

// ─── Session totals ──────────────────────────────────────────────────────────

export interface SessionTotals {
  totalVolume: number;
  totalSetsCount: number;
}

/**
 * Compute session-level totals from all sets.
 *
 * @param allSets - Map of exercise index → SetEntry[]
 * @param countOnlyCompleted - If true, only count completed sets (default: true)
 */
export function computeSessionTotals(
  allSets: Record<number, SetEntry[]>,
  countOnlyCompleted = true
): SessionTotals {
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

// ─── Total volume from SetsDataEntry ─────────────────────────────────────────

/**
 * Compute total volume from a SetsDataEntry array (DB payload shape).
 */
export function computeTotalVolume(setsData: SetsDataEntry[]): number {
  return setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);
}
