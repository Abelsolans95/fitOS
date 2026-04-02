"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { FoodItem } from "./useNutritionPage";

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface FoodLibraryState {
  foods: FoodItem[];
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

export const foodLibraryInitialState: FoodLibraryState = {
  foods: [],
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
  libHasMore: false,
  libLoadingMore: false,
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type FoodLibraryAction =
  | { type: "LIB_SET_FOODS"; foods: FoodItem[]; hasMore: boolean }
  | { type: "LIB_APPEND_FOODS"; foods: FoodItem[]; hasMore: boolean }
  | { type: "LIB_SET_LOADING_MORE"; loading: boolean }
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

export function foodLibraryReducer(
  state: FoodLibraryState,
  action: FoodLibraryAction
): FoodLibraryState {
  switch (action.type) {
    case "LIB_SET_FOODS":
      return { ...state, foods: action.foods, libHasMore: action.hasMore, libLoadingMore: false };
    case "LIB_APPEND_FOODS":
      return { ...state, foods: [...state.foods, ...action.foods], libHasMore: action.hasMore, libLoadingMore: false };
    case "LIB_SET_LOADING_MORE":
      return { ...state, libLoadingMore: action.loading };
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
        libFormCategory: Array.isArray(action.food.category) ? (action.food.category[0] ?? "Comida") : (action.food.category ?? "Comida"),
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

export function useFoodLibrary(trainerId: string, reloadData: () => void) {
  const [state, dispatch] = useReducer(foodLibraryReducer, foodLibraryInitialState);

  /* ── Load foods (paginated or search) ── */

  const loadLibFoods = useCallback(
    async (opts?: { append?: boolean; offset?: number; searchQuery?: string }) => {
      if (!trainerId) return;
      const { append = false, offset = 0, searchQuery } = opts ?? {};
      const isSearch = typeof searchQuery === "string" && searchQuery.trim().length > 0;

      if (append) dispatch({ type: "LIB_SET_LOADING_MORE", loading: true });

      const supabase = createClient();
      let query = supabase
        .from("trainer_food_library")
        .select("id,name,kcal,protein,carbs,fat,fiber,is_global,trainer_id,category")
        .or(`trainer_id.eq.${trainerId},is_global.eq.true`)
        .order("name");

      if (isSearch) {
        query = query.ilike("name", `%${searchQuery!.trim()}%`);
      } else {
        query = query.range(offset, offset + 49);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[FoodLibrary] Error loading foods:", error);
        return;
      }

      const rows = (data as FoodItem[]) ?? [];
      const hasMore = !isSearch && rows.length === 50;

      if (append) {
        dispatch({ type: "LIB_APPEND_FOODS", foods: rows, hasMore });
      } else {
        dispatch({ type: "LIB_SET_FOODS", foods: rows, hasMore });
      }
    },
    [trainerId]
  );

  const loadMoreFoods = useCallback(() => {
    if (!state.libHasMore || state.libLoadingMore) return;
    loadLibFoods({ append: true, offset: state.foods.length });
  }, [state.libHasMore, state.libLoadingMore, state.foods.length, loadLibFoods]);

  // Debounced search for food library
  useEffect(() => {
    if (!trainerId) return;

    if (!state.libSearch.trim()) {
      // Reset to paginated view
      loadLibFoods();
      return;
    }

    const timer = setTimeout(() => {
      loadLibFoods({ searchQuery: state.libSearch });
    }, 300);

    return () => clearTimeout(timer);
  }, [state.libSearch, trainerId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Computed ── */

  const filteredFoods = useMemo(() => {
    let result = state.foods;
    if (state.libActiveCategory !== "Todos") {
      result = result.filter((f) => {
        const cats = Array.isArray(f.category) ? f.category : [f.category];
        return cats.some((c) => c?.toLowerCase() === state.libActiveCategory.toLowerCase());
      });
    }
    return result;
  }, [state.foods, state.libActiveCategory]);

  /* ── Save food ── */

  const handleSaveFood = useCallback(async () => {
    if (!state.libFormName.trim()) {
      toast.error("Ingresa un nombre para el alimento");
      return;
    }

    dispatch({ type: "LIB_SET_SAVING", saving: true });
    try {
      const supabase = createClient();
      const payload = {
        trainer_id: trainerId,
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
          console.error("[FoodLibrary] Error actualizando alimento:", error);
          dispatch({ type: "LIB_SET_SAVING", saving: false });
          return;
        }
        toast.success("Alimento actualizado");
      } else {
        const { error } = await supabase.from("trainer_food_library").insert(payload);
        if (error) {
          toast.error("Error al guardar el alimento");
          console.error("[FoodLibrary] Error insertando alimento:", error);
          dispatch({ type: "LIB_SET_SAVING", saving: false });
          return;
        }
        toast.success("Alimento anadido a tu biblioteca");
      }

      dispatch({ type: "LIB_RESET_FORM" });
      reloadData();
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
    trainerId,
    reloadData,
  ]);

  /* ── Delete food ── */

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
          console.error("[FoodLibrary] Error eliminando alimento:", error);
          dispatch({ type: "LIB_SET_DELETING", id: null });
          return;
        }
        toast.success("Alimento eliminado");
        reloadData();
      } catch {
        toast.error("Error inesperado");
      } finally {
        dispatch({ type: "LIB_SET_DELETING", id: null });
      }
    },
    [reloadData]
  );

  /** Initialize foods from parent data load (called once after LOAD_DATA_SUCCESS). */
  const setInitialFoods = useCallback((foods: FoodItem[]) => {
    dispatch({ type: "LIB_SET_FOODS", foods, hasMore: foods.length === 50 });
  }, []);

  return {
    state,
    dispatch,
    filteredFoods,
    handleSaveFood,
    handleDeleteFood,
    loadMoreFoods,
    setInitialFoods,
  };
}
