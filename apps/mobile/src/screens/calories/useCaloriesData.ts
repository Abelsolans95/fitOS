import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import type { FoodLogEntry, Macros } from "./types";

export function useCaloriesData(userId: string | undefined) {
  const [todayLogs, setTodayLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetMacros, setTargetMacros] = useState<Macros>({
    kcal: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  });

  const today = new Date().toISOString().split("T")[0];

  const loadTodayLogs = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("food_log")
      .select(
        "id, logged_at, meal_type, total_kcal, total_protein, total_carbs, total_fat, source, photo_url, foods"
      )
      .eq("client_id", userId)
      .gte("logged_at", today)
      .lte("logged_at", today + "T23:59:59")
      .order("logged_at", { ascending: true })
      .limit(100);

    if (error) {
      Alert.alert("Error", "No se pudieron cargar los registros de hoy");
    }
    if (data) setTodayLogs(data as FoodLogEntry[]);
    setLoading(false);
  }, [userId, today]);

  const loadTargetMacros = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("meal_plans")
      .select("target_kcal")
      .eq("client_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.target_kcal) {
      const kcal = data.target_kcal;
      setTargetMacros({
        kcal,
        protein: Math.round((kcal * 0.3) / 4),
        carbs: Math.round((kcal * 0.4) / 4),
        fat: Math.round((kcal * 0.3) / 9),
      });
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      Promise.all([loadTodayLogs(), loadTargetMacros()]);
    }
  }, [userId, loadTodayLogs, loadTargetMacros]);

  const totals: Macros = {
    kcal: todayLogs.reduce((sum, l) => sum + (l.total_kcal ?? 0), 0),
    protein: todayLogs.reduce((sum, l) => sum + (l.total_protein ?? 0), 0),
    carbs: todayLogs.reduce((sum, l) => sum + (l.total_carbs ?? 0), 0),
    fat: todayLogs.reduce((sum, l) => sum + (l.total_fat ?? 0), 0),
  };

  const remainingMacros: Macros = {
    kcal: Math.max(0, targetMacros.kcal - totals.kcal),
    protein: Math.max(0, targetMacros.protein - totals.protein),
    carbs: Math.max(0, targetMacros.carbs - totals.carbs),
    fat: Math.max(0, targetMacros.fat - totals.fat),
  };

  const alreadyEatenToday = todayLogs.flatMap((entry) =>
    (entry.foods ?? []).map((f) => f.name)
  );

  return {
    todayLogs,
    loading,
    targetMacros,
    totals,
    remainingMacros,
    alreadyEatenToday,
    loadTodayLogs,
  };
}
