/**
 * Pure helper functions for the menu creator.
 * No React, no Supabase — only data transformations.
 */

import {
  DAYS_OF_WEEK,
  buildMealSlots,
  type DayPlan,
} from "./nutrition-types";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

export const MAIN_MEAL_LABELS: Record<number, string[]> = {
  3: ["Desayuno", "Almuerzo", "Cena"],
  4: ["Desayuno", "Almuerzo", "Comida", "Cena"],
  5: ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"],
};

export const DAY_ORDER: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
  domingo: 6,
};

const DAY_LABEL_MAP: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

/** Returns the ISO date string (YYYY-MM-DD) of the next Monday. */
export function getDefaultStartDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

/** Build an array of empty DayPlan objects for the given meal config and selected days. */
export function buildEmptyDays(
  mainMeals: number,
  snacksPerDay: number,
  selectedDays: string[]
): DayPlan[] {
  const slotDefs = buildMealSlots(mainMeals, snacksPerDay);
  const sorted = [...selectedDays].sort(
    (a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99)
  );
  return sorted.map((key, i) => ({
    day: DAY_LABEL_MAP[key] ?? key,
    meals: slotDefs.map((s) => ({ label: s.label, foods: [], isSnack: s.isSnack })),
    expanded: i === 0,
  }));
}

/** Deep-clone a single DayPlan's meals (foods + supplements + notes). */
export function cloneDayMeals(source: DayPlan): DayPlan["meals"] {
  return source.meals.map((m) => ({
    ...m,
    foods: m.foods.map((f) => ({ ...f })),
    supplements: m.supplements ? m.supplements.map((s) => ({ ...s })) : undefined,
    notes: m.notes,
  }));
}

/** Serialize DayPlan[] for DB storage (strips `expanded`). */
export function serializeDays(days: DayPlan[]) {
  return days.map((d) => ({
    day: d.day,
    meals: d.meals.map((m) => ({
      label: m.label,
      foods: m.foods,
      isSnack: m.isSnack,
      isCheatMeal: m.isCheatMeal,
      notes: m.notes,
      supplements: m.supplements,
    })),
  }));
}

/** Get default all-days selection keys. */
export function getDefaultSelectedDays(): string[] {
  return DAYS_OF_WEEK.map((d) => d.key);
}
