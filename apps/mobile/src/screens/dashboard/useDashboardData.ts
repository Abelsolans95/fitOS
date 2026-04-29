import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { updateWidget } from "../../lib/widget-sync";

export interface DailyStats {
  kcalConsumed: number;
  kcalTarget: number;
  workoutDone: boolean;
  streak: number;
}

export function useDashboardData(userId: string | undefined) {
  const [name, setName] = useState("");
  const [stats, setStats] = useState<DailyStats>({
    kcalConsumed: 0,
    kcalTarget: 2200,
    workoutDone: false,
    streak: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];

    // Run all three queries in parallel (rule: Promise.all for independent queries).
    const [profileRes, foodRes, workoutRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", userId).single(),
      supabase
        .from("food_log")
        .select("total_kcal")
        .eq("client_id", userId)
        .gte("logged_at", today)
        .lte("logged_at", today + "T23:59:59")
        .limit(100),
      supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", userId)
        .gte("logged_at", today)
        .limit(1),
    ]);

    // Non-blocking Patrón C — secondary display data, never block rendering.
    if (profileRes.data) setName(profileRes.data.full_name || "");

    const kcalConsumed =
      foodRes.data?.reduce((sum, log) => sum + (log.total_kcal || 0), 0) || 0;

    setStats((prev) => ({
      ...prev,
      kcalConsumed: Math.round(kcalConsumed),
      workoutDone: (workoutRes.data?.length || 0) > 0,
    }));

    // Background widget sync — fire-and-forget is OK here (non-critical side effect).
    updateWidget(userId).catch(() => {});
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(
    async (healthRefresh?: () => Promise<void>) => {
      setRefreshing(true);
      await Promise.all([loadData(), healthRefresh?.() ?? Promise.resolve()]);
      setRefreshing(false);
    },
    [loadData]
  );

  return { name, stats, refreshing, loadData, refresh };
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}
