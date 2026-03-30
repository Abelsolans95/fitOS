import { colors } from "../../theme";

export const DAY_KEYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export const DAY_SHORT: Record<string, string> = {
  lunes: "L", martes: "M", "miércoles": "X", jueves: "J",
  viernes: "V", "sábado": "S", domingo: "D",
};

export const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", "miércoles": "Miércoles", jueves: "Jueves",
  viernes: "Viernes", "sábado": "Sábado", domingo: "Domingo",
};

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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
