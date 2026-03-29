/* ────────────────────────────────────────────
   Active Training — Shared Types & Helpers
   ──────────────────────────────────────────── */

export interface SetConfig {
  reps_min: number;
  reps_max: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
}

export interface WeekConfig {
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
  sets_detail?: SetConfig[];
  coach_notes?: string;
}

export interface ExerciseData {
  exercise_id: string;
  name: string;
  day_of_week: string;
  day_label?: string;
  scheme?: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_pause_sets?: number;
  rir: number;
  weight_kg?: number;
  target_weight?: number | null;
  rest_s: number;
  progression_rule?: string;
  coach_notes?: string;
  trainer_notes?: string;
  technique_notes?: string;
  video_url?: string;
  order?: number;
  mode?: "equal" | "different";
  sets_config?: SetConfig[];
  weekly_config?: Record<number, WeekConfig>;
}

export interface DayData {
  day: string;
  label?: string;
  exercises: ExerciseData[];
}

export interface RoutineRaw {
  id: string;
  title: string;
  trainer_id: string;
  exercises?: ExerciseData[];
  days?: DayData[];
}

export interface PreviousSet {
  weight_kg: number;
  reps_done: number;
  type?: string;
}

export interface PreviousLog {
  exercise_name: string;
  session_date: string;
  sets_data: PreviousSet[];
}

export interface SetEntry {
  weight_kg: string;
  reps_done: string;
  rir: string;
  completed: boolean;
}

export interface SavedLogEntry {
  exercise_name: string;
  sets_data: {
    set_number: number;
    weight_kg: number;
    reps_done: number;
    type: string;
    completed?: boolean;
  }[];
  client_notes: string | null;
}

export type Phase = "loading" | "ready" | "training" | "rest" | "rpe" | "summary";

export interface SummaryExerciseResult {
  name: string;
  sets: SetEntry[];
  previous: PreviousSet[];
  progress: { label: string; color: string };
  notes: string | null;
}

export interface SummaryData {
  totalVolume: number;
  totalSetsCount: number;
  exerciseResults: SummaryExerciseResult[];
}

/* ── Helpers ── */

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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
