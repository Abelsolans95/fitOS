export type CaloriesMode = "analizar" | "nevera" | "buffet";

export interface FoodLogEntry {
  id: string;
  logged_at: string;
  meal_type: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  source: string;
  photo_url: string | null;
  foods: Array<{ name: string }>;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

export const MODE_TABS: { key: CaloriesMode; label: string }[] = [
  { key: "analizar", label: "Analizar" },
  { key: "nevera", label: "Mi nevera" },
  { key: "buffet", label: "Buffet" },
];
