"use client";

import { useReducer, useCallback, useEffect, useMemo, useRef, type Dispatch } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

import { useFoodLibrary, type FoodLibraryAction } from "./useFoodLibrary";
import { useMenuCreator, type MenuCreatorAction, menuCreatorInitialState } from "./useMenuCreator";

// Re-export all shared types, constants and helpers so existing consumers don't break
export type {
  MainTab, ClientOption, FoodItem, MealFood, Supplement, MealSlot,
  DayPlan, MealPlanRow, WeekTarget, SavedMenuTemplate,
} from "./nutrition-types";
export {
  DAYS_OF_WEEK, getWeekDates, getWeekTarget, getMealTotals, buildMealSlots,
} from "./nutrition-types";

import type { MainTab, ClientOption, MealPlanRow, FoodItem, DayPlan, WeekTarget, SavedMenuTemplate } from "./nutrition-types";

/* ────────────────────────────────────────────
   Page-level (shared) state
   ──────────────────────────────────────────── */

interface PageState {
  activeTab: MainTab;
  loading: boolean;
  error: string | null;
  trainerId: string;
  mealPlans: MealPlanRow[];
  clients: ClientOption[];
  showCreator: boolean;
}

type PageAction =
  | { type: "SET_TAB"; tab: MainTab }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | {
      type: "LOAD_DATA_SUCCESS";
      trainerId: string;
      mealPlans: MealPlanRow[];
      clients: ClientOption[];
    }
  | { type: "SHOW_CREATOR" }
  | { type: "HIDE_CREATOR" };

const pageInitialState: PageState = {
  activeTab: "menus",
  loading: true,
  error: null,
  trainerId: "",
  mealPlans: [],
  clients: [],
  showCreator: false,
};

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
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
        loading: false,
        error: null,
      };
    case "SHOW_CREATOR":
      return { ...state, showCreator: true };
    case "HIDE_CREATOR":
      return { ...state, showCreator: false };
    default:
      return state;
  }
}

/* ────────────────────────────────────────────
   Combined NutritionState — backwards compatible
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
  libHasMore: boolean;
  libLoadingMore: boolean;
}

export type NutritionAction = PageAction | MenuCreatorAction | FoodLibraryAction;

/* ────────────────────────────────────────────
   Orchestrator Hook
   ──────────────────────────────────────────── */

export function useNutritionPage() {
  const [pageState, pageDispatch] = useReducer(pageReducer, pageInitialState);

  /* ── Sub-hooks (receive trainerId + reloadData once available) ── */

  const loadDataRef = useRef<() => Promise<void>>(async () => {});
  const foodLib = useFoodLibrary(pageState.trainerId, () => loadDataRef.current());
  const hideCreator = useCallback(() => {
    pageDispatch({ type: "HIDE_CREATOR" });
  }, []);

  // Refs to break circular dependency: loadData needs sub-hook methods,
  // but sub-hooks receive () => loadData() as a callback.
  const foodLibRef = useRef(foodLib);
  foodLibRef.current = foodLib;
  const menuCrRef = useRef<ReturnType<typeof useMenuCreator>>(null!);

  const menuCr = useMenuCreator(
    pageState.trainerId,
    pageState.clients,
    foodLib.state.foods,
    () => loadDataRef.current(),
    hideCreator
  );
  menuCrRef.current = menuCr;

  /* ── Load data ── */

  const loadData = useCallback(async () => {
    pageDispatch({ type: "SET_LOADING", loading: true });
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        pageDispatch({ type: "SET_ERROR", error: "No se pudo obtener la sesion del usuario." });
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
          .select("id,name,kcal,protein,carbs,fat,fiber,is_global,trainer_id,category")
          .or(`trainer_id.eq.${user.id},is_global.eq.true`)
          .order("name")
          .limit(50),
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

      pageDispatch({
        type: "LOAD_DATA_SUCCESS",
        trainerId: user.id,
        mealPlans: normalizedPlans,
        clients: normalizedClients,
      });

      // Seed sub-hooks with initial data (via refs to avoid circular deps)
      foodLibRef.current.setInitialFoods((foodsRes.data as FoodItem[]) ?? []);
      menuCrRef.current.setSavedMenus((savedMenusRes.data as SavedMenuTemplate[]) ?? []);
    } catch {
      pageDispatch({ type: "SET_ERROR", error: "Error inesperado al cargar los datos." });
    }
  }, []);

  loadDataRef.current = loadData;

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Compose combined state (backwards-compatible NutritionState) ── */

  const state: NutritionState = useMemo(
    () => ({
      // Page
      activeTab: pageState.activeTab,
      loading: pageState.loading,
      error: pageState.error,
      trainerId: pageState.trainerId,
      mealPlans: pageState.mealPlans,
      clients: pageState.clients,
      showCreator: pageState.showCreator,
      // Foods (from food library hook)
      foods: foodLib.state.foods,
      libSearch: foodLib.state.libSearch,
      libActiveCategory: foodLib.state.libActiveCategory,
      libShowForm: foodLib.state.libShowForm,
      libEditingFood: foodLib.state.libEditingFood,
      libSaving: foodLib.state.libSaving,
      libDeleting: foodLib.state.libDeleting,
      libFormName: foodLib.state.libFormName,
      libFormKcal: foodLib.state.libFormKcal,
      libFormProtein: foodLib.state.libFormProtein,
      libFormCarbs: foodLib.state.libFormCarbs,
      libFormFat: foodLib.state.libFormFat,
      libFormFiber: foodLib.state.libFormFiber,
      libFormCategory: foodLib.state.libFormCategory,
      libHasMore: foodLib.state.libHasMore,
      libLoadingMore: foodLib.state.libLoadingMore,
      // Menu creator (from menu creator hook)
      crSelectedClientId: menuCr.state.crSelectedClientId,
      crLoadedMenuId: menuCr.state.crLoadedMenuId,
      crTitle: menuCr.state.crTitle,
      crSelectedDays: menuCr.state.crSelectedDays,
      crMesocycleWeeks: menuCr.state.crMesocycleWeeks,
      crStartDate: menuCr.state.crStartDate,
      crMainMeals: menuCr.state.crMainMeals,
      crSnacksPerDay: menuCr.state.crSnacksPerDay,
      crTargetKcal: menuCr.state.crTargetKcal,
      crTargetProteinPct: menuCr.state.crTargetProteinPct,
      crTargetCarbsPct: menuCr.state.crTargetCarbsPct,
      crTargetFatPct: menuCr.state.crTargetFatPct,
      crDays: menuCr.state.crDays,
      crCurrentWeek: menuCr.state.crCurrentWeek,
      crWeekDays: menuCr.state.crWeekDays,
      crWeeklyTargets: menuCr.state.crWeeklyTargets,
      crSaving: menuCr.state.crSaving,
      crSavingTemplate: menuCr.state.crSavingTemplate,
      savedMenus: menuCr.state.savedMenus,
    }),
    [pageState, foodLib.state, menuCr.state]
  );

  /* ── Compose combined dispatch (routes actions to the correct sub-reducer) ── */

  const dispatch: Dispatch<NutritionAction> = useCallback(
    (action: NutritionAction) => {
      const { type } = action;
      if (type.startsWith("LIB_")) {
        foodLib.dispatch(action as FoodLibraryAction);
      } else if (type.startsWith("CR_") || type === "SET_SAVED_MENUS") {
        // Enrich CR_UPDATE_PORTION with original food data for macro recalculation
        if (type === "CR_UPDATE_PORTION") {
          const a = action as MenuCreatorAction & { type: "CR_UPDATE_PORTION" };
          if (!a.originalFood) {
            const dayPlan = menuCr.state.crDays[a.dayIndex];
            const meal = dayPlan?.meals[a.mealIndex];
            const mealFood = meal?.foods[a.foodIndex];
            const original = mealFood ? foodLib.state.foods.find((f) => f.id === mealFood.food_id) : undefined;
            if (original) {
              menuCr.dispatch({
                ...a,
                originalFood: { kcal: original.kcal, protein: original.protein, carbs: original.carbs, fat: original.fat },
              });
              return;
            }
          }
        }
        menuCr.dispatch(action as MenuCreatorAction);
      } else {
        // Page-level actions: SET_TAB, SET_LOADING, SET_ERROR, LOAD_DATA_SUCCESS, SHOW_CREATOR, HIDE_CREATOR
        // HIDE_CREATOR also needs to reset the menu creator state
        if (type === "HIDE_CREATOR") {
          menuCr.dispatch({ type: "CR_RESET" });
        }
        pageDispatch(action as PageAction);
      }
    },
    [foodLib, menuCr]
  );

  return {
    state,
    dispatch,
    // Computed
    selectedClient: menuCr.selectedClient,
    filteredFoods: foodLib.filteredFoods,
    // Actions
    addFoodToMeal: menuCr.addFoodToMeal,
    handleSendMenu: menuCr.handleSendMenu,
    handleSaveTemplate: menuCr.handleSaveTemplate,
    handleSaveFood: foodLib.handleSaveFood,
    handleDeleteFood: foodLib.handleDeleteFood,
    loadMoreFoods: foodLib.loadMoreFoods,
  };
}
