import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface TodayPlan {
  workout: { name: string; details: string } | null;
  meals: { name: string; details: string } | null;
}

interface WeeklyStats {
  adherence: number;
  streak: number;
  caloriesGoal: number;
  caloriesConsumed: number;
}

interface DashboardData {
  todayPlan: TodayPlan;
  weeklyStats: WeeklyStats;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEFAULT_STATE = {
  todayPlan: { workout: null, meals: null },
  weeklyStats: { adherence: 0, streak: 0, caloriesGoal: 2000, caloriesConsumed: 0 },
};

export function useDashboardData(user: User | null): DashboardData {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split("T")[0];

        // Start of current week (Monday)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

        const [calendarRes, mealPlanRes, caloriesRes] = await Promise.all([
          supabase
            .from("user_calendar")
            .select("*")
            .eq("user_id", user.id)
            .gte("date", startOfWeekStr)
            .lte("date", today),
          supabase
            .from("meal_plans")
            .select("id, title")
            .eq("client_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("food_log")
            .select("calories")
            .eq("client_id", user.id)
            .eq("date", today),
        ]);

        if (cancelled) return;

        const entries = calendarRes.data ?? [];
        const todayEntries = entries.filter((e: { date: string }) => e.date === today);
        const workoutEntry = todayEntries.find((e: { activity_type: string }) => e.activity_type === "workout");
        const mealEntry = todayEntries.find((e: { activity_type: string }) => e.activity_type === "meal");

        // Adherence
        const weekEntries = entries.filter((e: { activity_type: string }) => e.activity_type === "workout");
        const completed = weekEntries.filter((e: { completed: boolean }) => e.completed).length;
        const adherence = weekEntries.length > 0 ? Math.round((completed / weekEntries.length) * 100) : 0;

        // Streak — consecutive completed workouts
        const recentRes = await supabase
          .from("user_calendar")
          .select("date, completed")
          .eq("user_id", user.id)
          .eq("activity_type", "workout")
          .order("date", { ascending: false })
          .limit(30);

        if (cancelled) return;

        let streak = 0;
        for (const entry of recentRes.data ?? []) {
          if ((entry as { completed: boolean }).completed) streak++;
          else break;
        }

        // Calories today
        const caloriesConsumed = (caloriesRes.data ?? []).reduce(
          (sum: number, row: { calories: number }) => sum + (row.calories ?? 0),
          0
        );

        setState({
          todayPlan: {
            workout: workoutEntry
              ? {
                  name: (workoutEntry.activity_details as { nombre?: string })?.nombre ?? "Entrenamiento",
                  details: workoutEntry.completed ? "Completado" : "Pendiente",
                }
              : null,
            meals: mealPlanRes.data
              ? {
                  name: mealPlanRes.data.title ?? "Plan de comidas",
                  details: mealEntry?.completed ? "Completado" : "Pendiente",
                }
              : null,
          },
          weeklyStats: {
            adherence,
            streak,
            caloriesGoal: 2000,
            caloriesConsumed,
          },
        });
      } catch {
        if (!cancelled) setError("Error al cargar el dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, tick]);

  return { ...state, loading, error, refetch };
}
