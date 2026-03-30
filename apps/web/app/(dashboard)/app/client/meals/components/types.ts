export interface FoodInMeal {
  food_id?: string;
  name: string;
  portion_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  type: string;
  foods: FoodInMeal[];
  total_kcal: number;
  macros: { protein: number; carbs: number; fat: number };
}

export interface DayPlan {
  date?: string;
  meals: Meal[];
  daily_total_kcal: number;
  daily_macros: { protein: number; carbs: number; fat: number };
}

export interface MealPlan {
  id: string;
  title: string;
  period: string;
  meals_per_day: number;
  days: DayPlan[];
  target_kcal: number;
  is_active: boolean;
  created_at: string;
}

export const DAY_LABELS = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

export const MEAL_TYPE_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};
