/**
 * Shared types, constants and helpers for the nutrition module.
 * Extracted to break circular dependency between useNutritionPage ↔ useMenuCreator ↔ useFoodLibrary.
 */

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

export type MainTab = "menus" | "biblioteca";

export interface ClientOption {
  client_id: string;
  full_name: string | null;
  email: string | null;
  food_preferences: string | Record<string, unknown> | null;
}

export interface FoodItem {
  id: string;
  trainer_id: string | null;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string[];
  is_global: boolean;
  created_at: string;
}

export interface MealFood {
  food_id: string;
  name: string;
  portion_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Supplement {
  name: string;
  timing?: string;
}

export interface MealSlot {
  label: string;
  foods: MealFood[];
  isSnack?: boolean;
  isCheatMeal?: boolean;
  notes?: string;
  supplements?: Supplement[];
}

export interface DayPlan {
  day: string;
  meals: MealSlot[];
  expanded: boolean;
}

export interface MealPlanRow {
  id: string;
  title: string;
  period: string;
  target_kcal: number | null;
  is_active: boolean;
  sent_at: string | null;
  created_at: string;
  client_name: string | null;
}

export interface WeekTarget {
  kcal: number | "";
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export interface SavedMenuTemplate {
  id: string;
  name: string;
  config: {
    title: string;
    selectedDays: string[];
    mesocycleWeeks: number;
    mainMeals: number;
    snacksPerDay: number;
    targetKcal: number | "";
    targetProteinPct: number;
    targetCarbsPct: number;
    targetFatPct: number;
    days: DayPlan[];
    weekDays: Record<number, DayPlan[]>;
    weeklyTargets?: Record<number, WeekTarget>;
  };
  created_at: string;
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

export function getWeekDates(
  startDate: Date,
  weekNumber: number,
  selectedDays: string[]
): { day: string; date: string }[] {
  const dayMap: Record<string, number> = {
    lunes: 1, martes: 2, miercoles: 3, jueves: 4,
    viernes: 5, sabado: 6, domingo: 0,
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

export function getWeekTarget(
  week: number,
  weeklyTargets: Record<number, WeekTarget>,
  defaults: { kcal: number | ""; proteinPct: number; carbsPct: number; fatPct: number }
): WeekTarget {
  return weeklyTargets[week] ?? { kcal: defaults.kcal, proteinPct: defaults.proteinPct, carbsPct: defaults.carbsPct, fatPct: defaults.fatPct };
}

export function getMealTotals(foods: MealFood[]) {
  return {
    kcal: Math.round(foods.reduce((s, f) => s + f.kcal, 0) * 10) / 10,
    protein: Math.round(foods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    carbs: Math.round(foods.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    fat: Math.round(foods.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  };
}

const MAIN_MEAL_LABELS: Record<number, string[]> = {
  3: ["Desayuno", "Almuerzo", "Cena"],
  4: ["Desayuno", "Almuerzo", "Comida", "Cena"],
  5: ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"],
};

export function buildMealSlots(
  mainMeals: number,
  snacksPerDay: number
): Pick<MealSlot, "label" | "isSnack">[] {
  const mainLabels = MAIN_MEAL_LABELS[mainMeals] ?? MAIN_MEAL_LABELS[3];
  const result: { label: string; isSnack: boolean }[] = [];
  let snacksLeft = snacksPerDay;

  for (let i = 0; i < mainLabels.length; i++) {
    result.push({ label: mainLabels[i], isSnack: false });
    if (i < mainLabels.length - 1 && snacksLeft > 0) {
      result.push({ label: "Snack", isSnack: true });
      snacksLeft--;
    }
  }
  while (snacksLeft > 0) {
    result.push({ label: "Snack", isSnack: true });
    snacksLeft--;
  }

  return result;
}
