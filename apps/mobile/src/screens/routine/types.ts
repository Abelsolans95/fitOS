export type SetType = "normal" | "rest_pause" | "drop_set";

export interface MobileSetConfig {
  reps_min: number;
  reps_max: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
  target_rpe?: number | null;
  set_type?: SetType;
}

export interface MobileWeekConfig {
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
  target_rpe?: number | null;
  sets_detail?: MobileSetConfig[];
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
  week_of_month?: number;
  mode?: "equal" | "different";
  sets_config?: MobileSetConfig[];
  weekly_config?: Record<number, MobileWeekConfig>;
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
  goal: string;
  trainer_id: string;
  duration_months: number;
  exercises?: ExerciseData[];
  days?: DayData[];
  total_weeks?: number;
  current_week?: number;
  training_days?: string[];
  sent_at?: string | null;
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
  rpe: string;
  completed: boolean;
  type: "main" | "rest_pause" | "drop_set";
}

export interface SavedLogEntry {
  exercise_name: string;
  sets_data: { set_number: number; weight_kg: number; reps_done: number; type: string }[];
  client_notes: string | null;
}

export interface InProgressSession {
  id: string;
  routine_id: string;
  day_label: string;
  week_number: number;
  created_at: string;
}

export type ScreenMode = "overview" | "registration" | "active" | "rest" | "sfr" | "rpe" | "summary";
