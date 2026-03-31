// ── Routine & Training types ──────────────────────────────────────────────────

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
  /** RPE objetivo fijado por el entrenador. Si null/undefined no se muestra el input al cliente. */
  target_rpe?: number | null;
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
  sent_at?: string | null;
  goal?: string;
  duration_months?: number;
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
