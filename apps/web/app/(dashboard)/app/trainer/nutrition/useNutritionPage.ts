"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

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
  category: string;
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

/** Labels for each main-meal count (3/4/5). */
const MAIN_MEAL_LABELS: Record<number, string[]> = {
  3: ["Desayuno", "Almuerzo", "Cena"],
  4: ["Desayuno", "Almuerzo", "Comida", "Cena"],
  5: ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"],
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function getDefaultStartDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

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

const DAY_ORDER: Record<string, number> = {
  lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4, sabado: 5, domingo: 6,
};

/**
 * Generates meal slots interleaving snacks between main meals.
 *
 * Strategy: place one snack after each main meal (except the last),
 * until the snack quota is exhausted. Remaining snacks are appended at the end.
 *
 * Examples (3 main meals):
 *   snacks=0 → [D, A, Cena]
 *   snacks=1 → [D, Snack, A, Cena]
 *   snacks=2 → [D, Snack, A, Snack, Cena]
 *   snacks=3 → [D, Snack, A, Snack, Cena, Snack]
 */
export function buildMealSlots(
  mainMeals: number,
  snacksPerDay: number
): Pick<MealSlot, "label" | "isSnack">[] {
  const mainLabels = MAIN_MEAL_LABELS[mainMeals] ?? MAIN_MEAL_LABELS[3];
  const result: { label: string; isSnack: boolean }[] = [];
  let snacksLeft = snacksPerDay;

  for (let i = 0; i < mainLabels.length; i++) {
    result.push({ label: mainLabels[i], isSnack: false });
    // After each meal except the last, insert a snack if quota remains
    if (i < mainLabels.length - 1 && snacksLeft > 0) {
      result.push({ label: "Snack", isSnack: true });
      snacksLeft--;
    }
  }
  // Append any remaining snacks after the last main meal
  while (snacksLeft > 0) {
    result.push({ label: "Snack", isSnack: true });
    snacksLeft--;
  }

  return result;
}

function buildEmptyDays(
  mainMeals: number,
  snacksPerDay: number,
  selectedDays: string[]
): DayPlan[] {
  const slotDefs = buildMealSlots(mainMeals, snacksPerDay);
  const dayLabelMap: Record<string, string> = {
    lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
    jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
  };
  const sorted = [...selectedDays].sort(
    (a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99)
  );
  return sorted.map((key, i) => ({
    day: dayLabelMap[key] ?? key,
    meals: slotDefs.map((s) => ({ label: s.label, foods: [], isSnack: s.isSnack })),
    expanded: i === 0,
  }));
}

/** Returns the target for a given week, falling back to the global defaults. */
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

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface NutritionState {
  /* Page */
  activeTab: MainTab;
  loading: boolean;
  error: string | null;
  trainerId: string;
  mealPlans: MealPlanRow[];
  clients: ClientOption[];
  foods: FoodItem[];
  showCreator: boolean;
  /* Menu Creator */
  crSelectedClientId: string;
  crLoadedMenuId: string;
  crTitle: string;
  crSelectedDays: string[];
  crMesocycleWeeks: number;
  crStartDate: string;
  crMainMeals: number;   // 3 / 4 / 5 — fixed main meals
  crSnacksPerDay: number; // 0 / 1 / 2 / 3 — base snacks to interleave
  crTargetKcal: number | "";
  crTargetProteinPct: number;
  crTargetCarbsPct: number;
  crTargetFatPct: number;
  crDays: DayPlan[];
  crCurrentWeek: number;
  crWeekDays: Record<number, DayPlan[]>;
  crWeeklyTargets: Record<number, WeekTarget>;
  crSaving: boolean;
  crSavingTemplate: boolean;
  savedMenus: SavedMenuTemplate[];
  /* Food Library */
  libSearch: string;
  libActiveCategory: string;
  libShowForm: boolean;
  libEditingFood: FoodItem | null;
  libSaving: boolean;
  libDeleting: string | null;
  libFormName: string;
  libFormKcal: number | "";
  libFormProtein: number | "";
  libFormCarbs: number | "";
  libFormFat: number | "";
  libFormFiber: number | "";
  libFormCategory: string;
}

const initialState: NutritionState = {
  activeTab: "menus",
  loading: true,
  error: null,
  trainerId: "",
  mealPlans: [],
  clients: [],
  foods: [],
  showCreator: false,

  crSelectedClientId: "",
  crLoadedMenuId: "",
  crTitle: "",
  crSelectedDays: DAYS_OF_WEEK.map((d) => d.key),
  crMesocycleWeeks: 1,
  crStartDate: getDefaultStartDate(),
  crMainMeals: 3,
  crSnacksPerDay: 0,
  crTargetKcal: 2000,
  crTargetProteinPct: 30,
  crTargetCarbsPct: 45,
  crTargetFatPct: 25,
  crDays: buildEmptyDays(3, 0, DAYS_OF_WEEK.map((d) => d.key)),
  crCurrentWeek: 1,
  crWeekDays: {},
  crWeeklyTargets: {},
  crSaving: false,
  crSavingTemplate: false,
  savedMenus: [],

  libSearch: "",
  libActiveCategory: "Todos",
  libShowForm: false,
  libEditingFood: null,
  libSaving: false,
  libDeleting: null,
  libFormName: "",
  libFormKcal: 0,
  libFormProtein: 0,
  libFormCarbs: 0,
  libFormFat: 0,
  libFormFiber: 0,
  libFormCategory: "Comida",
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type NutritionAction =
  /* Page */
  | { type: "SET_TAB"; tab: MainTab }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | {
      type: "LOAD_DATA_SUCCESS";
      trainerId: string;
      mealPlans: MealPlanRow[];
      clients: ClientOption[];
      foods: FoodItem[];
    }
  | { type: "SHOW_CREATOR" }
  | { type: "HIDE_CREATOR" }
  /* Creator — global config */
  | { type: "CR_SET_CLIENT"; clientId: string }
  | { type: "CR_SET_TITLE"; title: string }
  | { type: "CR_TOGGLE_DAY_SELECTION"; dayKey: string }
  | { type: "CR_SET_MESOCYCLE_WEEKS"; weeks: number }
  | { type: "CR_SET_START_DATE"; date: string }
  | { type: "CR_SET_MAIN_MEALS"; count: number }
  | { type: "CR_SET_SNACKS_PER_DAY"; count: number }
  | { type: "CR_SET_TARGET_KCAL"; value: number | "" }
  | { type: "CR_SET_TARGET_PROTEIN_PCT"; value: number }
  | { type: "CR_SET_TARGET_CARBS_PCT"; value: number }
  | { type: "CR_SET_TARGET_FAT_PCT"; value: number }
  | { type: "CR_SET_WEEK_TARGET_KCAL"; week: number; value: number | "" }
  | { type: "CR_SET_WEEK_TARGET_PROTEIN_PCT"; week: number; value: number }
  | { type: "CR_SET_WEEK_TARGET_CARBS_PCT"; week: number; value: number }
  | { type: "CR_SET_WEEK_TARGET_FAT_PCT"; week: number; value: number }
  /* Creator — day/meal operations */
  | { type: "CR_TOGGLE_DAY"; dayIndex: number }
  | { type: "CR_ADD_FOOD"; dayIndex: number; mealIndex: number; food: MealFood }
  | {
      type: "CR_UPDATE_PORTION";
      dayIndex: number;
      mealIndex: number;
      foodIndex: number;
      portion: number;
    }
  | { type: "CR_REMOVE_FOOD"; dayIndex: number; mealIndex: number; foodIndex: number }
  | { type: "CR_REMOVE_MEAL"; dayIndex: number; mealIndex: number }
  | { type: "CR_ADD_SNACK_TO_DAY"; dayIndex: number }
  | { type: "CR_TOGGLE_CHEAT_MEAL"; dayIndex: number; mealIndex: number }
  | { type: "CR_CLONE_DAY"; fromIndex: number; toIndex: number }
  | { type: "CR_SET_MEAL_NOTES"; dayIndex: number; mealIndex: number; notes: string }
  | { type: "CR_ADD_SUPPLEMENT"; dayIndex: number; mealIndex: number; supplement: Supplement }
  | { type: "CR_REMOVE_SUPPLEMENT"; dayIndex: number; mealIndex: number; suppIndex: number }
  | { type: "CR_SET_SAVING"; saving: boolean }
  | { type: "CR_NEXT_WEEK" }
  | { type: "CR_PREV_WEEK" }
  | { type: "CR_CLONE_WEEK_TO_REST" }
  | { type: "CR_SET_SAVING_TEMPLATE"; saving: boolean }
  | { type: "SET_SAVED_MENUS"; menus: SavedMenuTemplate[] }
  | { type: "CR_LOAD_SAVED_MENU"; menu: SavedMenuTemplate }
  | { type: "CR_RESET" }
  /* Library */
  | { type: "LIB_SET_SEARCH"; search: string }
  | { type: "LIB_SET_CATEGORY"; category: string }
  | { type: "LIB_SHOW_ADD_FORM" }
  | { type: "LIB_START_EDIT"; food: FoodItem }
  | { type: "LIB_SET_SAVING"; saving: boolean }
  | { type: "LIB_SET_DELETING"; id: string | null }
  | { type: "LIB_SET_FORM_NAME"; value: string }
  | { type: "LIB_SET_FORM_KCAL"; value: number | "" }
  | { type: "LIB_SET_FORM_PROTEIN"; value: number | "" }
  | { type: "LIB_SET_FORM_CARBS"; value: number | "" }
  | { type: "LIB_SET_FORM_FAT"; value: number | "" }
  | { type: "LIB_SET_FORM_FIBER"; value: number | "" }
  | { type: "LIB_SET_FORM_CATEGORY"; value: string }
  | { type: "LIB_RESET_FORM" };

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

function nutritionReducer(state: NutritionState, action: NutritionAction): NutritionState {
  switch (action.type) {
    /* ── Page ── */
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "LOAD_DATA_SUCCESS":
      return {
        ...state,
        trainerId: action.trainerId,
        mealPlans: action.mealPlans,
        clients: action.clients,
        foods: action.foods,
        loading: false,
        error: null,
      };
    case "SHOW_CREATOR":
      return { ...state, showCreator: true };
    case "HIDE_CREATOR":
      return {
        ...state,
        showCreator: false,
        crSelectedClientId: "",
        crLoadedMenuId: "",
        crTitle: "",
        crSelectedDays: DAYS_OF_WEEK.map((d) => d.key),
        crMesocycleWeeks: 1,
        crStartDate: getDefaultStartDate(),
        crMainMeals: 3,
        crSnacksPerDay: 0,
        crTargetKcal: 2000,
        crTargetProteinPct: 30,
        crTargetCarbsPct: 45,
        crTargetFatPct: 25,
        crDays: buildEmptyDays(3, 0, DAYS_OF_WEEK.map((d) => d.key)),
        crCurrentWeek: 1,
        crWeekDays: {},
        crWeeklyTargets: {},
        crSaving: false,
        crSavingTemplate: false,
      };

    /* ── Creator — global config ── */
    case "CR_SET_CLIENT":
      return { ...state, crSelectedClientId: action.clientId };
    case "CR_SET_TITLE":
      return { ...state, crTitle: action.title };
    case "CR_TOGGLE_DAY_SELECTION": {
      const days = state.crSelectedDays.includes(action.dayKey)
        ? state.crSelectedDays.filter((d) => d !== action.dayKey)
        : [...state.crSelectedDays, action.dayKey];
      return {
        ...state,
        crSelectedDays: days,
        crDays: buildEmptyDays(state.crMainMeals, state.crSnacksPerDay, days),
      };
    }
    case "CR_SET_MESOCYCLE_WEEKS":
      return { ...state, crMesocycleWeeks: action.weeks };
    case "CR_SET_START_DATE":
      return { ...state, crStartDate: action.date };
    case "CR_SET_MAIN_MEALS":
      return {
        ...state,
        crMainMeals: action.count,
        crDays: buildEmptyDays(action.count, state.crSnacksPerDay, state.crSelectedDays),
      };
    case "CR_SET_SNACKS_PER_DAY":
      return {
        ...state,
        crSnacksPerDay: action.count,
        crDays: buildEmptyDays(state.crMainMeals, action.count, state.crSelectedDays),
      };
    case "CR_SET_TARGET_KCAL":
      return { ...state, crTargetKcal: action.value };
    case "CR_SET_TARGET_PROTEIN_PCT":
      return { ...state, crTargetProteinPct: action.value };
    case "CR_SET_TARGET_CARBS_PCT":
      return { ...state, crTargetCarbsPct: action.value };
    case "CR_SET_TARGET_FAT_PCT":
      return { ...state, crTargetFatPct: action.value };
    case "CR_SET_WEEK_TARGET_KCAL": {
      const prev = state.crWeeklyTargets[action.week] ?? { kcal: state.crTargetKcal, proteinPct: state.crTargetProteinPct, carbsPct: state.crTargetCarbsPct, fatPct: state.crTargetFatPct };
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, kcal: action.value } } };
    }
    case "CR_SET_WEEK_TARGET_PROTEIN_PCT": {
      const prev = state.crWeeklyTargets[action.week] ?? { kcal: state.crTargetKcal, proteinPct: state.crTargetProteinPct, carbsPct: state.crTargetCarbsPct, fatPct: state.crTargetFatPct };
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, proteinPct: action.value } } };
    }
    case "CR_SET_WEEK_TARGET_CARBS_PCT": {
      const prev = state.crWeeklyTargets[action.week] ?? { kcal: state.crTargetKcal, proteinPct: state.crTargetProteinPct, carbsPct: state.crTargetCarbsPct, fatPct: state.crTargetFatPct };
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, carbsPct: action.value } } };
    }
    case "CR_SET_WEEK_TARGET_FAT_PCT": {
      const prev = state.crWeeklyTargets[action.week] ?? { kcal: state.crTargetKcal, proteinPct: state.crTargetProteinPct, carbsPct: state.crTargetCarbsPct, fatPct: state.crTargetFatPct };
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, fatPct: action.value } } };
    }

    /* ── Creator — day/meal operations ── */
    case "CR_TOGGLE_DAY":
      return {
        ...state,
        crDays: state.crDays.map((d, i) =>
          i === action.dayIndex ? { ...d, expanded: !d.expanded } : d
        ),
      };
    case "CR_ADD_FOOD":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: d.meals.map((m, mi) => {
              if (mi !== action.mealIndex) return m;
              return { ...m, foods: [...m.foods, action.food] };
            }),
          };
        }),
      };
    case "CR_UPDATE_PORTION": {
      const { dayIndex, mealIndex, foodIndex, portion } = action;
      const ratio = portion / 100;
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== dayIndex) return d;
          return {
            ...d,
            meals: d.meals.map((m, mi) => {
              if (mi !== mealIndex) return m;
              return {
                ...m,
                foods: m.foods.map((f, fi) => {
                  if (fi !== foodIndex) return f;
                  const original = state.foods.find((of) => of.id === f.food_id);
                  if (!original) return { ...f, portion_g: portion };
                  return {
                    ...f,
                    portion_g: portion,
                    kcal: Math.round(original.kcal * ratio * 10) / 10,
                    protein: Math.round(original.protein * ratio * 10) / 10,
                    carbs: Math.round(original.carbs * ratio * 10) / 10,
                    fat: Math.round(original.fat * ratio * 10) / 10,
                  };
                }),
              };
            }),
          };
        }),
      };
    }
    case "CR_REMOVE_FOOD":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: d.meals.map((m, mi) => {
              if (mi !== action.mealIndex) return m;
              return { ...m, foods: m.foods.filter((_, fi) => fi !== action.foodIndex) };
            }),
          };
        }),
      };
    case "CR_TOGGLE_CHEAT_MEAL":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: d.meals.map((m, mi) => {
              if (mi !== action.mealIndex) return m;
              return { ...m, isCheatMeal: !m.isCheatMeal };
            }),
          };
        }),
      };
    // Removes a meal slot from a day (only intended for snack slots)
    case "CR_REMOVE_MEAL":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: d.meals.filter((_, mi) => mi !== action.mealIndex),
          };
        }),
      };
    // Appends a new snack slot at the end of a day
    case "CR_ADD_SNACK_TO_DAY":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: [...d.meals, { label: "Snack", foods: [], isSnack: true }],
          };
        }),
      };
    case "CR_CLONE_DAY": {
      const sourceDay = state.crDays[action.fromIndex];
      if (!sourceDay) return state;
      return {
        ...state,
        crDays: state.crDays.map((d, i) => {
          if (i !== action.toIndex) return d;
          return {
            ...d,
            meals: sourceDay.meals.map((m) => ({
              ...m,
              foods: m.foods.map((f) => ({ ...f })),
              supplements: m.supplements ? m.supplements.map((s) => ({ ...s })) : undefined,
              notes: m.notes,
            })),
          };
        }),
      };
    }
    case "CR_SET_MEAL_NOTES":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: d.meals.map((m, mi) => {
              if (mi !== action.mealIndex) return m;
              return { ...m, notes: action.notes };
            }),
          };
        }),
      };
    case "CR_ADD_SUPPLEMENT":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: d.meals.map((m, mi) => {
              if (mi !== action.mealIndex) return m;
              return { ...m, supplements: [...(m.supplements ?? []), action.supplement] };
            }),
          };
        }),
      };
    case "CR_REMOVE_SUPPLEMENT":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return {
            ...d,
            meals: d.meals.map((m, mi) => {
              if (mi !== action.mealIndex) return m;
              return {
                ...m,
                supplements: (m.supplements ?? []).filter((_, si) => si !== action.suppIndex),
              };
            }),
          };
        }),
      };
    case "CR_NEXT_WEEK": {
      if (state.crCurrentWeek >= state.crMesocycleWeeks) return state;
      const nextWeek = state.crCurrentWeek + 1;
      const savedCurrent = { ...state.crWeekDays, [state.crCurrentWeek]: state.crDays };
      const nextDays = savedCurrent[nextWeek] ?? buildEmptyDays(state.crMainMeals, state.crSnacksPerDay, state.crSelectedDays);
      return { ...state, crWeekDays: savedCurrent, crCurrentWeek: nextWeek, crDays: nextDays };
    }
    case "CR_PREV_WEEK": {
      if (state.crCurrentWeek <= 1) return state;
      const prevWeek = state.crCurrentWeek - 1;
      const savedCurrent = { ...state.crWeekDays, [state.crCurrentWeek]: state.crDays };
      const prevDays = savedCurrent[prevWeek] ?? buildEmptyDays(state.crMainMeals, state.crSnacksPerDay, state.crSelectedDays);
      return { ...state, crWeekDays: savedCurrent, crCurrentWeek: prevWeek, crDays: prevDays };
    }
    case "CR_CLONE_WEEK_TO_REST": {
      const cloned: Record<number, DayPlan[]> = { ...state.crWeekDays, [state.crCurrentWeek]: state.crDays };
      for (let w = 1; w <= state.crMesocycleWeeks; w++) {
        if (w === state.crCurrentWeek) continue;
        cloned[w] = state.crDays.map((d) => ({
          ...d,
          meals: d.meals.map((m) => ({
            ...m,
            foods: m.foods.map((f) => ({ ...f })),
            supplements: m.supplements ? m.supplements.map((s) => ({ ...s })) : undefined,
            notes: m.notes,
          })),
        }));
      }
      return { ...state, crWeekDays: cloned };
    }
    case "CR_SET_SAVING":
      return { ...state, crSaving: action.saving };
    case "CR_SET_SAVING_TEMPLATE":
      return { ...state, crSavingTemplate: action.saving };
    case "SET_SAVED_MENUS":
      return { ...state, savedMenus: action.menus };
    case "CR_LOAD_SAVED_MENU": {
      const cfg = action.menu.config;
      return {
        ...state,
        crLoadedMenuId: action.menu.id,
        crTitle: cfg.title,
        crSelectedDays: cfg.selectedDays,
        crMesocycleWeeks: cfg.mesocycleWeeks,
        crMainMeals: cfg.mainMeals,
        crSnacksPerDay: cfg.snacksPerDay,
        crTargetKcal: cfg.targetKcal,
        crTargetProteinPct: cfg.targetProteinPct,
        crTargetCarbsPct: cfg.targetCarbsPct,
        crTargetFatPct: cfg.targetFatPct,
        crDays: cfg.days.length > 0 ? cfg.days : buildEmptyDays(cfg.mainMeals, cfg.snacksPerDay, cfg.selectedDays),
        crCurrentWeek: 1,
        crWeekDays: cfg.weekDays ?? {},
        crWeeklyTargets: cfg.weeklyTargets ?? {},
      };
    }
    case "CR_RESET":
      return {
        ...state,
        crSelectedClientId: "",
        crLoadedMenuId: "",
        crTitle: "",
        crSelectedDays: DAYS_OF_WEEK.map((d) => d.key),
        crMesocycleWeeks: 1,
        crStartDate: getDefaultStartDate(),
        crMainMeals: 3,
        crSnacksPerDay: 0,
        crTargetKcal: 2000,
        crTargetProteinPct: 30,
        crTargetCarbsPct: 45,
        crTargetFatPct: 25,
        crDays: buildEmptyDays(3, 0, DAYS_OF_WEEK.map((d) => d.key)),
        crCurrentWeek: 1,
        crWeekDays: {},
        crWeeklyTargets: {},
        crSaving: false,
        crSavingTemplate: false,
      };

    /* ── Library ── */
    case "LIB_SET_SEARCH":
      return { ...state, libSearch: action.search };
    case "LIB_SET_CATEGORY":
      return { ...state, libActiveCategory: action.category };
    case "LIB_SHOW_ADD_FORM":
      return { ...state, libShowForm: true };
    case "LIB_START_EDIT":
      return {
        ...state,
        libEditingFood: action.food,
        libFormName: action.food.name,
        libFormKcal: action.food.kcal,
        libFormProtein: action.food.protein,
        libFormCarbs: action.food.carbs,
        libFormFat: action.food.fat,
        libFormFiber: action.food.fiber,
        libFormCategory: action.food.category,
        libShowForm: true,
      };
    case "LIB_SET_SAVING":
      return { ...state, libSaving: action.saving };
    case "LIB_SET_DELETING":
      return { ...state, libDeleting: action.id };
    case "LIB_SET_FORM_NAME":
      return { ...state, libFormName: action.value };
    case "LIB_SET_FORM_KCAL":
      return { ...state, libFormKcal: action.value };
    case "LIB_SET_FORM_PROTEIN":
      return { ...state, libFormProtein: action.value };
    case "LIB_SET_FORM_CARBS":
      return { ...state, libFormCarbs: action.value };
    case "LIB_SET_FORM_FAT":
      return { ...state, libFormFat: action.value };
    case "LIB_SET_FORM_FIBER":
      return { ...state, libFormFiber: action.value };
    case "LIB_SET_FORM_CATEGORY":
      return { ...state, libFormCategory: action.value };
    case "LIB_RESET_FORM":
      return {
        ...state,
        libFormName: "",
        libFormKcal: 0,
        libFormProtein: 0,
        libFormCarbs: 0,
        libFormFat: 0,
        libFormFiber: 0,
        libFormCategory: "Comida",
        libEditingFood: null,
        libShowForm: false,
      };

    default:
      return state;
  }
}

/* ────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────── */

export function useNutritionPage() {
  const [state, dispatch] = useReducer(nutritionReducer, initialState);

  /* ── Load data ── */

  const loadData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        dispatch({ type: "SET_ERROR", error: "No se pudo obtener la sesion del usuario." });
        return;
      }

      const [plansRes, tcRes, foodsRes, savedMenusRes] = await Promise.all([
        supabase
          .from("meal_plans")
          .select("id, title, period, target_kcal, is_active, sent_at, created_at, client_id")
          .eq("trainer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("trainer_clients")
          .select("client_id")
          .eq("trainer_id", user.id)
          .eq("status", "active"),
        supabase
          .from("trainer_food_library")
          .select("*")
          .or(`trainer_id.eq.${user.id},is_global.eq.true`)
          .order("name"),
        supabase
          .from("saved_menu_templates")
          .select("id, name, config, created_at")
          .eq("trainer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (plansRes.error) {
        console.error("[NutritionPage] Error al cargar planes:", plansRes.error);
        toast.error("Error al cargar los menús");
      }
      if (tcRes.error) {
        console.error("[NutritionPage] Error al cargar clientes:", tcRes.error);
        toast.error("Error al cargar los clientes");
      }
      if (foodsRes.error) {
        console.error("[NutritionPage] Error al cargar alimentos:", foodsRes.error);
        toast.error("Error al cargar la biblioteca de alimentos");
      }
      if (savedMenusRes.error) {
        console.error("[NutritionPage] Error al cargar menus guardados:", savedMenusRes.error);
        // No bloqueante
      }

      const clientIds = (tcRes.data ?? []).map((r) => r.client_id);
      const planUserIds = (plansRes.data ?? []).map((r) => r.client_id).filter(Boolean);
      const allUserIds = [...new Set([...clientIds, ...planUserIds])];

      const { data: profileRows, error: profilesErr } =
        allUserIds.length > 0
          ? await supabase
              .from("profiles")
              .select("user_id, full_name, email, food_preferences")
              .in("user_id", allUserIds)
          : { data: [], error: null };

      if (profilesErr) {
        console.error("[NutritionPage] Error al cargar perfiles:", profilesErr);
      }

      const profileMap = new Map(
        (profileRows ?? []).map((p) => [p.user_id, p])
      );

      const normalizedPlans: MealPlanRow[] = (plansRes.data ?? []).map((row) => ({
        id: row.id as string,
        title: (row.title as string) || "Sin titulo",
        period: (row.period as string) || "weekly",
        target_kcal: row.target_kcal as number | null,
        is_active: row.is_active as boolean,
        sent_at: row.sent_at as string | null,
        created_at: row.created_at as string,
        client_name: profileMap.get(row.client_id as string)?.full_name ?? null,
      }));

      const normalizedClients: ClientOption[] = clientIds.map((client_id) => {
        const p = profileMap.get(client_id);
        return {
          client_id,
          full_name: p?.full_name ?? null,
          email: p?.email ?? null,
          food_preferences: p?.food_preferences ?? null,
        };
      });

      dispatch({
        type: "LOAD_DATA_SUCCESS",
        trainerId: user.id,
        mealPlans: normalizedPlans,
        clients: normalizedClients,
        foods: (foodsRes.data as FoodItem[]) ?? [],
      });
      dispatch({
        type: "SET_SAVED_MENUS",
        menus: (savedMenusRes.data as SavedMenuTemplate[]) ?? [],
      });
    } catch {
      dispatch({ type: "SET_ERROR", error: "Error inesperado al cargar los datos." });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Computed ── */

  const selectedClient = useMemo(
    () => state.clients.find((c) => c.client_id === state.crSelectedClientId) ?? null,
    [state.clients, state.crSelectedClientId]
  );

  const filteredFoods = useMemo(() => {
    let result = state.foods;
    if (state.libActiveCategory !== "Todos") {
      result = result.filter(
        (f) => f.category.toLowerCase() === state.libActiveCategory.toLowerCase()
      );
    }
    if (state.libSearch.trim()) {
      const q = state.libSearch.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    return result;
  }, [state.foods, state.libSearch, state.libActiveCategory]);

  /* ── Creator: add food to meal ── */

  const addFoodToMeal = useCallback(
    (dayIndex: number, mealIndex: number, food: FoodItem) => {
      const mealFood: MealFood = {
        food_id: food.id,
        name: food.name,
        portion_g: 100,
        kcal: food.kcal,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      };
      dispatch({ type: "CR_ADD_FOOD", dayIndex, mealIndex, food: mealFood });
    },
    []
  );

  /* ── Creator: send menu ── */

  const handleSendMenu = useCallback(async () => {
    if (!state.crSelectedClientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!state.crTitle.trim()) {
      toast.error("Ingresa un titulo para el menu");
      return;
    }

    dispatch({ type: "CR_SET_SAVING", saving: true });
    try {
      const supabase = createClient();
      // meals_per_day stores main meals count (3/4/5) — DB CHECK constraint accepts 3,4,5.
      const mealsPerDay = state.crMainMeals as 3 | 4 | 5;

      // Build all weeks' data: merge crWeekDays with current crDays
      const allWeekDays = { ...state.crWeekDays, [state.crCurrentWeek]: state.crDays };
      const serializeDays = (days: DayPlan[]) =>
        days.map((d) => ({
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

      // If multi-week, save as { weeks: { 1: [...], 2: [...] } }; otherwise flat array for backward compat
      const daysPayload =
        state.crMesocycleWeeks > 1
          ? {
              weeks: Object.fromEntries(
                Array.from({ length: state.crMesocycleWeeks }, (_, i) => {
                  const w = i + 1;
                  const weekDays = allWeekDays[w] ?? buildEmptyDays(state.crMainMeals, state.crSnacksPerDay, state.crSelectedDays);
                  return [w, serializeDays(weekDays)];
                })
              ),
              total_weeks: state.crMesocycleWeeks,
              start_date: state.crStartDate,
              weekly_targets: state.crWeeklyTargets,
            }
          : serializeDays(state.crDays);

      const planData = {
        trainer_id: state.trainerId,
        client_id: state.crSelectedClientId,
        title: state.crTitle,
        period: "weekly",
        meals_per_day: mealsPerDay,
        target_kcal: state.crTargetKcal || 2000,
        days: daysPayload,
        is_active: true,
        sent_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("meal_plans").insert(planData);

      if (error) {
        toast.error("Error al guardar el menu");
        console.error("[NutritionPage] Error guardando plan:", error);
        dispatch({ type: "CR_SET_SAVING", saving: false });
        return;
      }

      toast.success("Menu enviado al cliente correctamente");
      dispatch({ type: "HIDE_CREATOR" });
      loadData();
    } catch {
      toast.error("Error inesperado al guardar el menu");
      dispatch({ type: "CR_SET_SAVING", saving: false });
    }
  }, [
    state.crSelectedClientId,
    state.crTitle,
    state.crMainMeals,
    state.crSnacksPerDay,
    state.crTargetKcal,
    state.crDays,
    state.crCurrentWeek,
    state.crWeekDays,
    state.crWeeklyTargets,
    state.crMesocycleWeeks,
    state.crSelectedDays,
    state.crStartDate,
    state.trainerId,
    loadData,
  ]);

  /* ── Library: save food ── */

  const handleSaveFood = useCallback(async () => {
    if (!state.libFormName.trim()) {
      toast.error("Ingresa un nombre para el alimento");
      return;
    }

    dispatch({ type: "LIB_SET_SAVING", saving: true });
    try {
      const supabase = createClient();
      const payload = {
        trainer_id: state.trainerId,
        name: state.libFormName.trim(),
        kcal: Number(state.libFormKcal) || 0,
        protein: Number(state.libFormProtein) || 0,
        carbs: Number(state.libFormCarbs) || 0,
        fat: Number(state.libFormFat) || 0,
        fiber: Number(state.libFormFiber) || 0,
        category: state.libFormCategory,
        is_global: false,
      };

      if (state.libEditingFood) {
        const { error } = await supabase
          .from("trainer_food_library")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", state.libEditingFood.id);

        if (error) {
          toast.error("Error al actualizar el alimento");
          console.error("[NutritionPage] Error actualizando alimento:", error);
          dispatch({ type: "LIB_SET_SAVING", saving: false });
          return;
        }
        toast.success("Alimento actualizado");
      } else {
        const { error } = await supabase.from("trainer_food_library").insert(payload);
        if (error) {
          toast.error("Error al guardar el alimento");
          console.error("[NutritionPage] Error insertando alimento:", error);
          dispatch({ type: "LIB_SET_SAVING", saving: false });
          return;
        }
        toast.success("Alimento anadido a tu biblioteca");
      }

      dispatch({ type: "LIB_RESET_FORM" });
      loadData();
    } catch {
      toast.error("Error inesperado");
      dispatch({ type: "LIB_SET_SAVING", saving: false });
    }
  }, [
    state.libFormName,
    state.libFormKcal,
    state.libFormProtein,
    state.libFormCarbs,
    state.libFormFat,
    state.libFormFiber,
    state.libFormCategory,
    state.libEditingFood,
    state.trainerId,
    loadData,
  ]);

  /* ── Library: delete food ── */

  const handleDeleteFood = useCallback(
    async (foodId: string) => {
      dispatch({ type: "LIB_SET_DELETING", id: foodId });
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("trainer_food_library")
          .delete()
          .eq("id", foodId);
        if (error) {
          toast.error("Error al eliminar el alimento");
          console.error("[NutritionPage] Error eliminando alimento:", error);
          dispatch({ type: "LIB_SET_DELETING", id: null });
          return;
        }
        toast.success("Alimento eliminado");
        loadData();
      } catch {
        toast.error("Error inesperado");
      } finally {
        dispatch({ type: "LIB_SET_DELETING", id: null });
      }
    },
    [loadData]
  );

  /* ── Creator: save as template ── */

  const handleSaveTemplate = useCallback(async (templateName: string) => {
    if (!templateName.trim()) {
      toast.error("Ingresa un nombre para guardar el menu");
      return;
    }

    dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: true });
    try {
      const supabase = createClient();
      const allWeekDays = { ...state.crWeekDays, [state.crCurrentWeek]: state.crDays };
      const config = {
        title: state.crTitle,
        selectedDays: state.crSelectedDays,
        mesocycleWeeks: state.crMesocycleWeeks,
        mainMeals: state.crMainMeals,
        snacksPerDay: state.crSnacksPerDay,
        targetKcal: state.crTargetKcal,
        targetProteinPct: state.crTargetProteinPct,
        targetCarbsPct: state.crTargetCarbsPct,
        targetFatPct: state.crTargetFatPct,
        days: state.crDays,
        weekDays: allWeekDays,
        weeklyTargets: state.crWeeklyTargets,
      };

      const { error } = await supabase.from("saved_menu_templates").insert({
        trainer_id: state.trainerId,
        name: templateName.trim(),
        config,
      });

      if (error) {
        toast.error("Error al guardar el menu");
        console.error("[NutritionPage] Error guardando template:", error);
        dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
        return;
      }

      toast.success("Menu guardado correctamente");
      dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
      loadData();
    } catch {
      toast.error("Error inesperado al guardar el menu");
      dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
    }
  }, [
    state.crTitle,
    state.crSelectedDays,
    state.crMesocycleWeeks,
    state.crMainMeals,
    state.crSnacksPerDay,
    state.crTargetKcal,
    state.crTargetProteinPct,
    state.crTargetCarbsPct,
    state.crTargetFatPct,
    state.crDays,
    state.crCurrentWeek,
    state.crWeekDays,
    state.trainerId,
    loadData,
  ]);

  return {
    state,
    dispatch,
    // Computed
    selectedClient,
    filteredFoods,
    // Actions
    addFoodToMeal,
    handleSendMenu,
    handleSaveTemplate,
    handleSaveFood,
    handleDeleteFood,
  };
}
