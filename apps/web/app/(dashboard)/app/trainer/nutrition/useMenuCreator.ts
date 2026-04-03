"use client";

import { useReducer, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DAYS_OF_WEEK,
  buildMealSlots,
  getWeekDates,
  type ClientOption,
  type DayPlan,
  type MealFood,
  type FoodItem,
  type Supplement,
  type WeekTarget,
  type SavedMenuTemplate,
  type MealPlanRow,
} from "./useNutritionPage";

/* ────────────────────────────────────────────
   Constants (local)
   ──────────────────────────────────────────── */

const MAIN_MEAL_LABELS: Record<number, string[]> = {
  3: ["Desayuno", "Almuerzo", "Cena"],
  4: ["Desayuno", "Almuerzo", "Comida", "Cena"],
  5: ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"],
};

const DAY_ORDER: Record<string, number> = {
  lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4, sabado: 5, domingo: 6,
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

    /* ── day/meal operations ── */
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
      const { dayIndex, mealIndex, foodIndex, portion, originalFood } = action;
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
    case "CR_REMOVE_MEAL":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return { ...d, meals: d.meals.filter((_, mi) => mi !== action.mealIndex) };
        }),
      };
    case "CR_ADD_SNACK_TO_DAY":
      return {
        ...state,
        crDays: state.crDays.map((d, di) => {
          if (di !== action.dayIndex) return d;
          return { ...d, meals: [...d.meals, { label: "Snack", foods: [], isSnack: true }] };
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

    default:
      return state;
  }
}

/* ────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────── */

export function useMenuCreator(
  trainerId: string,
  clients: ClientOption[],
  allFoods: FoodItem[],
  reloadData: () => void,
  onHideCreator?: () => void
) {
  const [state, dispatch] = useReducer(menuCreatorReducer, menuCreatorInitialState);

  /* ── Computed ── */

  const selectedClient = useMemo(
    () => clients.find((c) => c.client_id === state.crSelectedClientId) ?? null,
    [clients, state.crSelectedClientId]
  );

  /* ── Add food to meal ── */

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

  /* ── Send menu ── */

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
      const mealsPerDay = state.crMainMeals as 3 | 4 | 5;

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
        trainer_id: trainerId,
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
        console.error("[MenuCreator] Error guardando plan:", error);
        dispatch({ type: "CR_SET_SAVING", saving: false });
        return;
      }

      toast.success("Menu enviado al cliente correctamente");
      dispatch({ type: "CR_RESET" });
      onHideCreator?.();
      reloadData();
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
    trainerId,
    reloadData,
    onHideCreator,
  ]);

  /* ── Save as template ── */

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
        trainer_id: trainerId,
        name: templateName.trim(),
        config,
      });

      if (error) {
        toast.error("Error al guardar el menu");
        console.error("[MenuCreator] Error guardando template:", error);
        dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
        return;
      }

      toast.success("Menu guardado correctamente");
      dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
      reloadData();
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
    state.crWeeklyTargets,
    trainerId,
    reloadData,
  ]);

  /** Initialize saved menus from parent data load. */
  const setSavedMenus = useCallback((menus: SavedMenuTemplate[]) => {
    dispatch({ type: "SET_SAVED_MENUS", menus });
  }, []);

  return {
    state,
    dispatch,
    selectedClient,
    addFoodToMeal,
    handleSendMenu,
    handleSaveTemplate,
    setSavedMenus,
  };
}
