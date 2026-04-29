/* ────────────────────────────────────────────
   Active Training — re-exports from @kuvox/shared
   ──────────────────────────────────────────── */

export type {
  SetConfig,
  WeekConfig,
  ExerciseData,
  DayData,
  RoutineRaw,
  PreviousSet,
  PreviousLog,
  SetEntry,
  SavedSetData,
  SavedLogEntry,
  Phase,
  SummaryExerciseResult,
  SummaryData,
} from "@kuvox/shared";

export { formatTime } from "@kuvox/shared";

/* ── calculateProgress (web-specific labels/colors) ── */

export function calculateProgress(
  current: { weight: number; reps: number }[],
  previous: { weight: number; reps: number }[]
): { label: string; color: string } {
  if (previous.length === 0)
    return { label: "PRIMERA SESIÓN", color: "#00E5FF" };

  let wUp = false,
    wDown = false,
    rUp = false,
    rDown = false;
  for (let i = 0; i < Math.min(current.length, previous.length); i++) {
    if (current[i].weight > previous[i].weight) wUp = true;
    if (current[i].weight < previous[i].weight) wDown = true;
    if (current[i].reps > previous[i].reps) rUp = true;
    if (current[i].reps < previous[i].reps) rDown = true;
  }

  if (wUp && !wDown && !rDown)
    return { label: "PROGRESIÓN CARGA", color: "#00C853" };
  if (rUp && !rDown && !wUp && !wDown)
    return { label: "PROGRESIÓN REPS", color: "#00C853" };
  if (wUp && rDown)
    return { label: "CARGA ↑ REPS ↓", color: "#FF9100" };
  if (!wUp && !wDown && !rUp && !rDown)
    return { label: "MANTENIDO", color: "#8B8BA3" };
  if (wDown || rDown) return { label: "REGRESIÓN", color: "#FF1744" };
  return { label: "PROGRESIÓN", color: "#00C853" };
}
