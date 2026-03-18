"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface TodayPlan {
  workout: { name: string; details: string } | null;
  meals: { name: string; details: string } | null;
}

interface WeeklyStats {
  adherence: number;
  streak: number;
  nextWorkout: string | null;
}

export default function ClientDashboardPage() {
  const [clientName, setClientName] = useState("");
  const [todayPlan, setTodayPlan] = useState<TodayPlan>({
    workout: null,
    meals: null,
  });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    adherence: 0,
    streak: 0,
    nextWorkout: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesion del usuario.");
          setLoading(false);
          return;
        }

        // Activate trainer_clients status if still pending (client confirmed email and logged in)
        // Uses API route with service_role to bypass RLS
        await fetch("/api/activate-client", { method: "POST" });

        // Get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        const fullName =
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Cliente";
        setClientName(fullName);

        const today = new Date().toISOString().split("T")[0];

        // Get active meal plan directly from meal_plans
        const { data: activeMealPlan } = await supabase
          .from("meal_plans")
          .select("id, title")
          .eq("client_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get today's calendar entries for workout + meal completion status
        const { data: calendarEntries } = await supabase
          .from("user_calendar")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today);

        const workoutEntry = calendarEntries?.find(
          (e: { activity_type: string }) => e.activity_type === "workout"
        );
        const mealEntry = calendarEntries?.find(
          (e: { activity_type: string }) => e.activity_type === "meal"
        );

        setTodayPlan({
          workout: workoutEntry
            ? {
                name:
                  (workoutEntry.activity_details as { nombre?: string })
                    ?.nombre || "Entrenamiento",
                details: workoutEntry.completed ? "Completado" : "Pendiente",
              }
            : null,
          meals: activeMealPlan
            ? {
                name: activeMealPlan.title || "Plan de comidas",
                details: mealEntry?.completed ? "Completado" : "Pendiente",
              }
            : null,
        });

        // Calculate weekly stats
        const startOfWeek = new Date();
        startOfWeek.setDate(
          startOfWeek.getDate() - startOfWeek.getDay() + 1
        );
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

        const { data: weekEntries } = await supabase
          .from("user_calendar")
          .select("date, completed, activity_type")
          .eq("user_id", user.id)
          .gte("date", startOfWeekStr)
          .lte("date", today);

        if (weekEntries && weekEntries.length > 0) {
          const completedCount = weekEntries.filter(
            (e: { completed: boolean }) => e.completed
          ).length;
          const adherence = Math.round(
            (completedCount / weekEntries.length) * 100
          );
          setWeeklyStats((prev) => ({ ...prev, adherence }));
        }

        // Calculate streak
        const { data: recentEntries } = await supabase
          .from("user_calendar")
          .select("date, completed")
          .eq("user_id", user.id)
          .eq("activity_type", "workout")
          .order("date", { ascending: false })
          .limit(30);

        if (recentEntries) {
          let streak = 0;
          for (const entry of recentEntries) {
            if ((entry as { completed: boolean }).completed) {
              streak++;
            } else {
              break;
            }
          }
          setWeeklyStats((prev) => ({ ...prev, streak }));
        }

        // Get next workout
        const { data: nextWorkouts } = await supabase
          .from("user_calendar")
          .select("date, activity_details")
          .eq("user_id", user.id)
          .eq("activity_type", "workout")
          .eq("completed", false)
          .gt("date", today)
          .order("date", { ascending: true })
          .limit(1);

        if (nextWorkouts && nextWorkouts.length > 0) {
          const nextDate = new Date(
            nextWorkouts[0].date + "T00:00:00"
          );
          const dayName = nextDate.toLocaleDateString("es-ES", {
            weekday: "long",
          });
          setWeeklyStats((prev) => ({
            ...prev,
            nextWorkout: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          }));
        }
      } catch {
        setError("Error al cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hola, {clientName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Aqui tienes tu plan para hoy
        </p>
      </div>

      {/* Plan de hoy */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-5">
        <h2 className="mb-4 text-base font-semibold text-white">
          Plan de hoy
        </h2>

        {/* Workout */}
        <div className="flex items-start gap-3 rounded-xl bg-[#0A0A0F] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10">
            <svg
              className="h-5 w-5 text-[#7C3AED]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {todayPlan.workout
                ? todayPlan.workout.name
                : "No hay entrenamiento hoy"}
            </p>
            <p className="mt-0.5 text-xs text-[#8B8BA3]">
              {todayPlan.workout
                ? todayPlan.workout.details
                : "Descansa o revisa tu rutina"}
            </p>
          </div>
          {todayPlan.workout && (
            <Link
              href="/app/client/routine"
              className="flex h-8 items-center rounded-lg bg-[#7C3AED]/10 px-3 text-xs font-medium text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/20"
            >
              Ver
            </Link>
          )}
        </div>

        <div className="my-3 border-t border-white/[0.04]" />

        {/* Meals */}
        <div className="flex items-start gap-3 rounded-xl bg-[#0A0A0F] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00C853]/10">
            <svg
              className="h-5 w-5 text-[#00C853]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {todayPlan.meals
                ? todayPlan.meals.name
                : "No hay menu asignado"}
            </p>
            <p className="mt-0.5 text-xs text-[#8B8BA3]">
              {todayPlan.meals
                ? todayPlan.meals.details
                : "Consulta con tu entrenador"}
            </p>
          </div>
          {todayPlan.meals && (
            <Link
              href="/app/client/meals"
              className="flex h-8 items-center rounded-lg bg-[#00C853]/10 px-3 text-xs font-medium text-[#00C853] transition-colors hover:bg-[#00C853]/20"
            >
              Ver
            </Link>
          )}
        </div>
      </div>

      {/* Weekly stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
          <p className="text-2xl font-bold text-[#00E5FF]">
            {weeklyStats.adherence}%
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
            Adherencia
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
          <p className="text-2xl font-bold text-[#FF9100]">
            {weeklyStats.streak}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
            Racha
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
          <p className="truncate text-sm font-bold text-[#7C3AED]">
            {weeklyStats.nextWorkout || "---"}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
            Proximo
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">
          Acciones rapidas
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/app/client/calories"
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 transition-all hover:border-white/[0.12]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00E5FF]/10">
              <svg
                className="h-5 w-5 text-[#00E5FF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#E8E8ED]">
              Escanear comida
            </span>
          </Link>

          <Link
            href="/app/client/routine"
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 transition-all hover:border-white/[0.12]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED]/10">
              <svg
                className="h-5 w-5 text-[#7C3AED]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#E8E8ED]">
              Ver rutina
            </span>
          </Link>

          <Link
            href="/app/client/progress"
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 transition-all hover:border-white/[0.12]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00C853]/10">
              <svg
                className="h-5 w-5 text-[#00C853]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
                />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#E8E8ED]">
              Registrar progreso
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
