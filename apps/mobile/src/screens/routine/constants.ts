import { colors } from "../../theme";

export { DAY_KEYS, DAY_LABELS, DAY_SHORT, formatTime } from "@kuvox/shared";

export function calculateProgress(
  current: { weight: number; reps: number }[],
  previous: { weight: number; reps: number }[]
): { label: string; color: string } {
  if (previous.length === 0) return { label: "PRIMERA SESIÓN", color: colors.cyan };
  if (current.length === 0) return { label: "", color: colors.dimmed };

  let weightUp = false, weightDown = false;
  let repsUp = false, repsDown = false;
  let weightSame = true, repsSame = true;

  for (let i = 0; i < Math.min(current.length, previous.length); i++) {
    if (current[i].weight > previous[i].weight) { weightUp = true; weightSame = false; }
    if (current[i].weight < previous[i].weight) { weightDown = true; weightSame = false; }
    if (current[i].reps > previous[i].reps) { repsUp = true; repsSame = false; }
    if (current[i].reps < previous[i].reps) { repsDown = true; repsSame = false; }
  }

  if (weightUp && !weightDown && (repsSame || repsUp))
    return { label: "PROGRESIÓN", color: colors.green };
  if (repsUp && !repsDown && weightSame)
    return { label: "REPS ↑", color: colors.green };
  if (weightUp && repsDown)
    return { label: "CARGA ↑ REPS ↓", color: colors.orange };
  if (weightSame && repsSame)
    return { label: "MANTENIDO", color: colors.muted };
  if (weightDown || repsDown)
    return { label: "REGRESIÓN", color: colors.red };

  return { label: "PROGRESIÓN", color: colors.green };
}

export function getScheme(ex: { scheme?: string; sets: number; reps_min: number; reps_max: number }): string {
  return ex.scheme || `${ex.sets}×${ex.reps_min}${ex.reps_max !== ex.reps_min ? `-${ex.reps_max}` : ""}`;
}
