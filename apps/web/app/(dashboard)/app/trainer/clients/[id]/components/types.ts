// Shared types for the client detail page and all its tab components.
// Import from here whenever a tab component needs one of these types.

export type TabKey = "perfil" | "progreso" | "rutina" | "menu" | "formulario" | "comunicacion";

export interface Message {
  id: string;
  trainer_id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface FoodPreferences {
  dietary_restrictions?: string[];
  allergies?: string;
  disliked_foods?: string;
}

export interface ClientProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  goal: string | null;
  bio: string | null;
  height: number | null;
  weight: number | null;
  food_preferences: FoodPreferences | null;
  avatar_url: string | null;
}

export interface TrainerClientRow {
  id: string;
  status: string;
  joined_at: string;
}

export interface BodyMetric {
  id: string;
  body_weight_kg: number | null;
  body_fat_pct: number | null;
  recorded_at: string;
}

export interface UserRoutine {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export interface MealPlan {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  routine_id: string;
  mode: string;
  status: string;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  total_sets: number | null;
  total_exercises: number | null;
  rpe_session: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface WeightLogEntry {
  id: string;
  exercise_name: string;
  sets_data: { set_number: number; weight_kg: number; reps_done: number; type: string }[];
  total_volume_kg: number | null;
  client_notes: string | null;
  session_id: string;
}

export interface FoodLogEntry {
  id: string;
  meal_type: string;
  foods: { name: string; portion_g?: number; kcal?: number; protein?: number; carbs?: number; fat?: number }[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  photo_url: string | null;
  source: string;
  notes: string | null;
  logged_at: string;
}

export interface FormField {
  id: string;
  label: string;
  type: string;
}

export interface OnboardingResponse {
  id: string;
  responses: Record<string, unknown>;
  ai_analysis: string | null;
  created_at: string;
  form: {
    title: string;
    fields: FormField[];
  } | null;
}
