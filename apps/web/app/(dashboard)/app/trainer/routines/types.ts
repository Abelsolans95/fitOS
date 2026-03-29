/* ────────────────────────────────────────────
   Routines — Shared Types, Constants & Helpers
   ──────────────────────────────────────────── */

export interface ClientOption {
  client_id: string;
  full_name: string | null;
  email: string | null;
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscle_group: string | null;
  category: string | null;
}

export interface SetConfig {
  reps_min: number;
  reps_max: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
}

/** Per-week override for an exercise (progressive overload across mesocycle) */
export interface WeekConfig {
  /** Used in "equal" mode */
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
  /** Used in "different" mode — one entry per set */
  sets_detail?: SetConfig[];
  /** Per-week coach notes (dynamic per week, unlike progression_rule which is per exercise) */
  coach_notes?: string;
}

export interface RoutineExercise {
  exercise_id: string;
  name: string;
  scheme: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_pause_sets: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
  progression_rule: string;
  coach_notes: string;
  order: number;
  mode: "equal" | "different";
  sets_config: SetConfig[];
  /** Per-week overrides keyed by week number (1-based). If absent, uses base values. */
  weekly_config?: Record<number, WeekConfig>;
}

export interface TrainingDay {
  key: string;
  label: string;
  dayLabel: string;
  exercises: RoutineExercise[];
}

export interface RoutineRow {
  id: string;
  title: string;
  goal: string | null;
  duration_months: number | null;
  is_active: boolean;
  sent_at: string | null;
  created_at: string;
  client_name: string | null;
}

/** Saved routine template (exercises without weight/RIR) */
export interface RoutineTemplate {
  id: string;
  name: string;
  training_days: string[];
  day_labels: Record<string, string>;
  exercises: TemplateExercise[];
  total_weeks: number;
  goal: string | null;
  created_at: string;
}

/** Set config stored in a template — no weight/RIR */
export interface TemplateSetConfig {
  reps_min: number;
  reps_max: number;
  rest_s: number;
}

/** Week config stored in a template — no weight/RIR */
export interface TemplateWeekConfig {
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_s: number;
  sets_detail?: TemplateSetConfig[];
  coach_notes?: string;
}

/** Exercise stored inside a template — no weight/RIR */
export interface TemplateExercise {
  exercise_id: string;
  name: string;
  day_of_week: string;
  day_label: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_pause_sets: number;
  rest_s: number;
  progression_rule: string;
  coach_notes: string;
  order: number;
  mode: "equal" | "different";
  sets_config?: TemplateSetConfig[];
  weekly_config?: Record<number, TemplateWeekConfig>;
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

export const DAYS_OF_WEEK = [
  { label: "Lunes", key: "lunes", short: "L" },
  { label: "Martes", key: "martes", short: "M" },
  { label: "Miércoles", key: "miercoles", short: "X" },
  { label: "Jueves", key: "jueves", short: "J" },
  { label: "Viernes", key: "viernes", short: "V" },
  { label: "Sábado", key: "sabado", short: "S" },
  { label: "Domingo", key: "domingo", short: "D" },
] as const;

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

export function buildScheme(ex: RoutineExercise): string {
  if (ex.mode === "different" && ex.sets_config.length > 0) {
    const allReps = ex.sets_config.flatMap((s) => [s.reps_min, s.reps_max]);
    const minReps = Math.min(...allReps);
    const maxReps = Math.max(...allReps);
    return `${ex.sets_config.length}x${minReps}-${maxReps}`;
  }
  if (ex.reps_min === ex.reps_max) return `${ex.sets}x${ex.reps_min}`;
  return `${ex.sets}x${ex.reps_min}-${ex.reps_max}`;
}

export function makeDefaultSetConfig(ex: RoutineExercise): SetConfig {
  return {
    reps_min: ex.reps_min,
    reps_max: ex.reps_max,
    rir: ex.rir,
    target_weight: ex.target_weight,
    rest_s: ex.rest_s,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getWeekDates(
  startDate: Date,
  weekNumber: number,
  selectedDays: string[]
): { day: string; date: string }[] {
  const dayMap: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    domingo: 0,
  };

  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

  return selectedDays.map((dayKey) => {
    const targetDow = dayMap[dayKey];
    const currentDow = weekStart.getDay();
    let diff = targetDow - currentDow;
    if (diff < 0) diff += 7;
    const date = new Date(weekStart);
    date.setDate(date.getDate() + diff);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return { day: dayKey, date: `${dd}/${mm}` };
  });
}
