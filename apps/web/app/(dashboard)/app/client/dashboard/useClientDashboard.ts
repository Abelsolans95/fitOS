"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { QUERY_LIMITS } from "@/lib/constants";

export interface TodayPlan {
  workout: { name: string; details: string } | null;
  meals: { name: string; details: string } | null;
}

export interface WeeklyStats {
  adherence: number;
  streak: number;
  nextWorkout: string | null;
}

export function useClientDashboard() {
  const [clientName, setClientName] = useState("");
  const [todayPlan, setTodayPlan] = useState<TodayPlan>({ workout: null, meals: null });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ adherence: 0, streak: 0, nextWorkout: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.user) { setError("No se pudo obtener la sesion del usuario."); setLoading(false); return; }
        const user = session.user;

        fetch("/api/activate-client", { method: "POST" }).catch(() => {});

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        // Profile, meal plan, and today's calendar are all independent — fetch in parallel
        const [profileRes, mealPlanRes, calendarRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
          supabase.from("meal_plans").select("id, title").eq("client_id", user.id).eq("is_active", true)
            .order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("user_calendar").select("date, completed, activity_type, activity_details")
            .eq("user_id", user.id).eq("date", todayStr),
        ]);

        if (profileRes.error) { console.error("[useClientDashboard] Error perfil:", profileRes.error); } // No bloqueante
        if (mealPlanRes.error) { console.error("[useClientDashboard] Error meal plan:", mealPlanRes.error); } // No bloqueante
        if (calendarRes.error) { console.error("[useClientDashboard] Error calendar:", calendarRes.error); } // No bloqueante

        setClientName(profileRes.data?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Cliente");

        const workoutEntry = calendarRes.data?.find((e: { activity_type: string }) => e.activity_type === "workout");
        const mealEntry = calendarRes.data?.find((e: { activity_type: string }) => e.activity_type === "meal");

        setTodayPlan({
          workout: workoutEntry
            ? { name: (workoutEntry.activity_details as { nombre?: string })?.nombre || "Entrenamiento", details: workoutEntry.completed ? "Completado" : "Pendiente" }
            : null,
          meals: mealPlanRes.data
            ? { name: mealPlanRes.data.title || "Plan de comidas", details: mealEntry?.completed ? "Completado" : "Pendiente" }
            : null,
        });

        // Weekly stats
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

        const [weekRes, recentRes, nextRes] = await Promise.all([
          supabase.from("user_calendar").select("date, completed, activity_type")
            .eq("user_id", user.id).gte("date", startOfWeekStr).lte("date", todayStr),
          supabase.from("user_calendar").select("date, completed")
            .eq("user_id", user.id).eq("activity_type", "workout")
            .order("date", { ascending: false }).limit(QUERY_LIMITS.DASHBOARD_RECENT),
          supabase.from("user_calendar").select("date, activity_details")
            .eq("user_id", user.id).eq("activity_type", "workout").eq("completed", false)
            .gt("date", todayStr).order("date", { ascending: true }).limit(1),
        ]);

        if (weekRes.error) { console.error("[useClientDashboard] Error semana:", weekRes.error); } // No bloqueante
        if (recentRes.error) { console.error("[useClientDashboard] Error recientes:", recentRes.error); } // No bloqueante
        if (nextRes.error) { console.error("[useClientDashboard] Error próximo:", nextRes.error); } // No bloqueante

        if (weekRes.data && weekRes.data.length > 0) {
          const completed = weekRes.data.filter((e: { completed: boolean }) => e.completed).length;
          setWeeklyStats((prev) => ({ ...prev, adherence: Math.round((completed / (weekRes.data?.length || 1)) * 100) }));
        }

        if (recentRes.data) {
          let streak = 0;
          for (const entry of recentRes.data) {
            if ((entry as { completed: boolean }).completed) streak++;
            else break;
          }
          setWeeklyStats((prev) => ({ ...prev, streak }));
        }

        if (nextRes.data && nextRes.data.length > 0) {
          const nextDate = new Date(nextRes.data[0].date + "T00:00:00");
          const dayName = nextDate.toLocaleDateString("es-ES", { weekday: "long" });
          setWeeklyStats((prev) => ({ ...prev, nextWorkout: dayName.charAt(0).toUpperCase() + dayName.slice(1) }));
        }
      } catch {
        setError("Error al cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []); // mount-only: load creates its own supabase client inside

  return { clientName, todayPlan, weeklyStats, loading, error };
}
