// ── Stress Index calculation ─────────────────────────────────────────────────
// Pure function shared between web and mobile.
// Formula: sum(weight × reps × intensityFactor) for completed sets.

/** Minimal set data required to compute stress index. */
export interface StressIndexSet {
  weight_kg: number;
  reps_done: number;
  rir: number;
  completed: boolean;
}

/** RIR → intensity factor (0 = failure = 1.0, 5+ = 0.75) */
function rirToIntensityFactor(rir: number): number {
  if (rir <= 0) return 1.0;
  if (rir === 1) return 0.95;
  if (rir === 2) return 0.90;
  if (rir === 3) return 0.85;
  if (rir === 4) return 0.80;
  return 0.75;
}

/** Calculate stress index from sets data: sum(weight × reps × intensityFactor) */
export function calculateStressIndex(sets: StressIndexSet[]): number {
  let stress = 0;
  for (const s of sets) {
    if (!s.completed) continue;
    stress += s.weight_kg * s.reps_done * rirToIntensityFactor(s.rir);
  }
  return Math.round(stress * 100) / 100;
}
