// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Exercise {
  id: string;
  trainer_id: string | null;
  name: string;
  description: string | null;
  muscle_groups: string[] | null;
  secondary_muscles: string[] | null;
  category: string | null;
  video_url: string | null;
  is_global: boolean;
  created_at: string;
  // Override data (applied on top of globals for this trainer)
  _override_id?: string;
  _is_overridden?: boolean;
  _is_hidden?: boolean;
}

export interface ExerciseOverride {
  id: string;
  trainer_id: string;
  exercise_id: string;
  custom_name: string | null;
  custom_description: string | null;
  custom_notes: string | null;
  custom_video_url: string | null;
  hidden: boolean;
}

export interface ExerciseFormData {
  name: string;
  description: string;
  primary_muscles: string;
  secondary_muscles: string;
  category: string;
  video_url: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const OWNERSHIP_FILTERS: { value: "todos" | "global" | "propio"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "global", label: "Global" },
  { value: "propio", label: "Propio" },
];

export const EMPTY_FORM: ExerciseFormData = {
  name: "",
  description: "",
  primary_muscles: "",
  secondary_muscles: "",
  category: "",
  video_url: "",
};
