"use client";

import { useReducer, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

import {
  type ClientOption,
  type DayPlan,
  type MealFood,
  type FoodItem,
  type SavedMenuTemplate,
} from "./nutrition-types";

import {
  buildEmptyDays,
  serializeDays,
} from "./menu-creator-helpers";

import {
  menuCreatorReducer,
  menuCreatorInitialState,
  type MenuCreatorState,
  type MenuCreatorAction,
} from "./menu-creator-reducer";

/* Re-export so the single import in useNutritionPage keeps working */
export { menuCreatorInitialState };
export type { MenuCreatorAction, MenuCreatorState };

/* ────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────── */

export function useMenuCreator(
  trainerId: string,
  clients: ClientOption[],
  _allFoods: FoodItem[],
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

  /* ── Send menu to client ── */

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

      const daysPayload =
        state.crMesocycleWeeks > 1
          ? {
              weeks: Object.fromEntries(
                Array.from({ length: state.crMesocycleWeeks }, (_, i) => {
                  const w = i + 1;
                  const weekDays =
                    allWeekDays[w] ??
                    buildEmptyDays(state.crMainMeals, state.crSnacksPerDay, state.crSelectedDays);
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

  const handleSaveTemplate = useCallback(
    async (templateName: string) => {
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
    },
    [
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
    ]
  );

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
