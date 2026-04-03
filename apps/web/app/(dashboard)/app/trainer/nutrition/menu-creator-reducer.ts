/**
 * Reducer, state interface, action type and initial state for the menu creator.
 * Pure function — no React hooks, no side effects.
 */

import {
  DAYS_OF_WEEK,
  type DayPlan,
  type MealFood,
  type Supplement,
  type WeekTarget,
  type SavedMenuTemplate,
} from "./nutrition-types";

import {
  buildEmptyDays,
  cloneDayMeals,
  getDefaultStartDate,
  getDefaultSelectedDays,
} from "./menu-creator-helpers";

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface MenuCreatorState {
  crSelectedClientId: string;
  crLoadedMenuId: string;
  crTitle: string;
  crSelectedDays: string[];
  crMesocycleWeeks: number;
  crStartDate: string;
  crMainMeals: number;
  crSnacksPerDay: number;
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
}

export const menuCreatorInitialState: MenuCreatorState = {
  crSelectedClientId: "",
  crLoadedMenuId: "",
  crTitle: "",
  crSelectedDays: getDefaultSelectedDays(),
  crMesocycleWeeks: 1,
  crStartDate: getDefaultStartDate(),
  crMainMeals: 3,
  crSnacksPerDay: 0,
  crTargetKcal: 2000,
  crTargetProteinPct: 30,
  crTargetCarbsPct: 45,
  crTargetFatPct: 25,
  crDays: buildEmptyDays(3, 0, getDefaultSelectedDays()),
  crCurrentWeek: 1,
  crWeekDays: {},
  crWeeklyTargets: {},
  crSaving: false,
  crSavingTemplate: false,
  savedMenus: [],
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type MenuCreatorAction =
  /* global config */
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
  /* day/meal operations */
  | { type: "CR_TOGGLE_DAY"; dayIndex: number }
  | { type: "CR_ADD_FOOD"; dayIndex: number; mealIndex: number; food: MealFood }
  | { type: "CR_UPDATE_PORTION"; dayIndex: number; mealIndex: number; foodIndex: number; portion: number; originalFood?: { kcal: number; protein: number; carbs: number; fat: number } }
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
  | { type: "CR_RESET" };

/* ────────────────────────────────────────────
   Reducer helper: update a specific day's meals
   ──────────────────────────────────────────── */

function updateDay(
  days: DayPlan[],
  dayIndex: number,
  updater: (d: DayPlan) => DayPlan
): DayPlan[] {
  return days.map((d, i) => (i === dayIndex ? updater(d) : d));
}

function updateMealInDay(
  day: DayPlan,
  mealIndex: number,
  updater: (m: DayPlan["meals"][number]) => DayPlan["meals"][number]
): DayPlan {
  return { ...day, meals: day.meals.map((m, mi) => (mi === mealIndex ? updater(m) : m)) };
}

/** Helper to get default WeekTarget from global targets. */
function defaultWeekTarget(state: MenuCreatorState): WeekTarget {
  return {
    kcal: state.crTargetKcal,
    proteinPct: state.crTargetProteinPct,
    carbsPct: state.crTargetCarbsPct,
    fatPct: state.crTargetFatPct,
  };
}

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

export function menuCreatorReducer(
  state: MenuCreatorState,
  action: MenuCreatorAction
): MenuCreatorState {
  switch (action.type) {
    /* ── global config ── */
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
      const prev = state.crWeeklyTargets[action.week] ?? defaultWeekTarget(state);
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, kcal: action.value } } };
    }
    case "CR_SET_WEEK_TARGET_PROTEIN_PCT": {
      const prev = state.crWeeklyTargets[action.week] ?? defaultWeekTarget(state);
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, proteinPct: action.value } } };
    }
    case "CR_SET_WEEK_TARGET_CARBS_PCT": {
      const prev = state.crWeeklyTargets[action.week] ?? defaultWeekTarget(state);
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, carbsPct: action.value } } };
    }
    case "CR_SET_WEEK_TARGET_FAT_PCT": {
      const prev = state.crWeeklyTargets[action.week] ?? defaultWeekTarget(state);
      return { ...state, crWeeklyTargets: { ...state.crWeeklyTargets, [action.week]: { ...prev, fatPct: action.value } } };
    }

    /* ── day/meal operations ── */
    case "CR_TOGGLE_DAY":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) => ({ ...d, expanded: !d.expanded })),
      };
    case "CR_ADD_FOOD":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) =>
          updateMealInDay(d, action.mealIndex, (m) => ({ ...m, foods: [...m.foods, action.food] }))
        ),
      };
    case "CR_UPDATE_PORTION": {
      const { dayIndex, mealIndex, foodIndex, portion, originalFood } = action;
      const ratio = portion / 100;
      return {
        ...state,
        crDays: updateDay(state.crDays, dayIndex, (d) =>
          updateMealInDay(d, mealIndex, (m) => ({
            ...m,
            foods: m.foods.map((f, fi) => {
              if (fi !== foodIndex) return f;
              if (!originalFood) return { ...f, portion_g: portion };
              return {
                ...f,
                portion_g: portion,
                kcal: Math.round(originalFood.kcal * ratio * 10) / 10,
                protein: Math.round(originalFood.protein * ratio * 10) / 10,
                carbs: Math.round(originalFood.carbs * ratio * 10) / 10,
                fat: Math.round(originalFood.fat * ratio * 10) / 10,
              };
            }),
          }))
        ),
      };
    }
    case "CR_REMOVE_FOOD":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) =>
          updateMealInDay(d, action.mealIndex, (m) => ({
            ...m,
            foods: m.foods.filter((_, fi) => fi !== action.foodIndex),
          }))
        ),
      };
    case "CR_TOGGLE_CHEAT_MEAL":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) =>
          updateMealInDay(d, action.mealIndex, (m) => ({ ...m, isCheatMeal: !m.isCheatMeal }))
        ),
      };
    case "CR_REMOVE_MEAL":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) => ({
          ...d,
          meals: d.meals.filter((_, mi) => mi !== action.mealIndex),
        })),
      };
    case "CR_ADD_SNACK_TO_DAY":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) => ({
          ...d,
          meals: [...d.meals, { label: "Snack", foods: [], isSnack: true }],
        })),
      };
    case "CR_CLONE_DAY": {
      const sourceDay = state.crDays[action.fromIndex];
      if (!sourceDay) return state;
      return {
        ...state,
        crDays: updateDay(state.crDays, action.toIndex, (d) => ({
          ...d,
          meals: cloneDayMeals(sourceDay),
        })),
      };
    }
    case "CR_SET_MEAL_NOTES":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) =>
          updateMealInDay(d, action.mealIndex, (m) => ({ ...m, notes: action.notes }))
        ),
      };
    case "CR_ADD_SUPPLEMENT":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) =>
          updateMealInDay(d, action.mealIndex, (m) => ({
            ...m,
            supplements: [...(m.supplements ?? []), action.supplement],
          }))
        ),
      };
    case "CR_REMOVE_SUPPLEMENT":
      return {
        ...state,
        crDays: updateDay(state.crDays, action.dayIndex, (d) =>
          updateMealInDay(d, action.mealIndex, (m) => ({
            ...m,
            supplements: (m.supplements ?? []).filter((_, si) => si !== action.suppIndex),
          }))
        ),
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
          meals: cloneDayMeals(d),
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
        crSelectedDays: getDefaultSelectedDays(),
        crMesocycleWeeks: 1,
        crStartDate: getDefaultStartDate(),
        crMainMeals: 3,
        crSnacksPerDay: 0,
        crTargetKcal: 2000,
        crTargetProteinPct: 30,
        crTargetCarbsPct: 45,
        crTargetFatPct: 25,
        crDays: buildEmptyDays(3, 0, getDefaultSelectedDays()),
        crCurrentWeek: 1,
        crWeekDays: {},
        crWeeklyTargets: {},
        crSaving: false,
        crSavingTemplate: false,
      };

    default:
      return state;
  }
}
