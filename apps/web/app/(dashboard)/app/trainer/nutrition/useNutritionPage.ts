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

export interface MealSlot {
  label: string;
  foods: MealFood[];
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

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const MEAL_LABELS: Record<number, string[]> = {
  3: ["Desayuno", "Comida", "Cena"],
  4: ["Desayuno", "Almuerzo", "Comida", "Cena"],
  5: ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"],
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function buildEmptyDays(mealsPerDay: number, period: "weekly" | "monthly"): DayPlan[] {
  const dayCount = period === "weekly" ? 7 : 28;
  const labels = MEAL_LABELS[mealsPerDay] ?? MEAL_LABELS[3];
  const days: DayPlan[] = [];
  for (let i = 0; i < dayCount; i++) {
    days.push({
      day: period === "weekly" ? DAYS[i] : `Dia ${i + 1}`,
      meals: labels.map((label) => ({ label, foods: [] })),
      expanded: i === 0,
    });
  }
  return days;
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
  crTitle: string;
  crPeriod: "weekly" | "monthly";
  crMealsPerDay: number;
  crTargetKcal: number | "";
  crDays: DayPlan[];
  crSaving: boolean;
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
  crTitle: "",
  crPeriod: "weekly",
  crMealsPerDay: 3,
  crTargetKcal: 2000,
  crDays: buildEmptyDays(3, "weekly"),
  crSaving: false,

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
  /* Creator */
  | { type: "CR_SET_CLIENT"; clientId: string }
  | { type: "CR_SET_TITLE"; title: string }
  | { type: "CR_SET_PERIOD"; period: "weekly" | "monthly" }
  | { type: "CR_SET_MEALS_PER_DAY"; count: number }
  | { type: "CR_SET_TARGET_KCAL"; value: number | "" }
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
  | { type: "CR_SET_SAVING"; saving: boolean }
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
        crTitle: "",
        crPeriod: "weekly",
        crMealsPerDay: 3,
        crTargetKcal: 2000,
        crDays: buildEmptyDays(3, "weekly"),
        crSaving: false,
      };

    /* ── Creator ── */
    case "CR_SET_CLIENT":
      return { ...state, crSelectedClientId: action.clientId };
    case "CR_SET_TITLE":
      return { ...state, crTitle: action.title };
    case "CR_SET_PERIOD":
      return {
        ...state,
        crPeriod: action.period,
        crDays: buildEmptyDays(state.crMealsPerDay, action.period),
      };
    case "CR_SET_MEALS_PER_DAY":
      return {
        ...state,
        crMealsPerDay: action.count,
        crDays: buildEmptyDays(action.count, state.crPeriod),
      };
    case "CR_SET_TARGET_KCAL":
      return { ...state, crTargetKcal: action.value };
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
    case "CR_SET_SAVING":
      return { ...state, crSaving: action.saving };
    case "CR_RESET":
      return {
        ...state,
        crSelectedClientId: "",
        crTitle: "",
        crPeriod: "weekly",
        crMealsPerDay: 3,
        crTargetKcal: 2000,
        crDays: buildEmptyDays(3, "weekly"),
        crSaving: false,
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

      const [plansRes, tcRes, foodsRes] = await Promise.all([
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
      const planData = {
        trainer_id: state.trainerId,
        client_id: state.crSelectedClientId,
        title: state.crTitle,
        period: state.crPeriod,
        meals_per_day: state.crMealsPerDay,
        target_kcal: state.crTargetKcal || 2000,
        days: state.crDays.map((d) => ({
          day: d.day,
          meals: d.meals.map((m) => ({
            label: m.label,
            foods: m.foods,
          })),
        })),
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
    state.crPeriod,
    state.crMealsPerDay,
    state.crTargetKcal,
    state.crDays,
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

  return {
    state,
    dispatch,
    // Computed
    selectedClient,
    filteredFoods,
    // Actions
    addFoodToMeal,
    handleSendMenu,
    handleSaveFood,
    handleDeleteFood,
  };
}
