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

const DAYS_ES = ["D", "L", "M", "X", "J", "V", "S"];

export default function ClientDashboardPage() {
  const [clientName, setClientName] = useState("");
  const [todayPlan, setTodayPlan] = useState<TodayPlan>({ workout: null, meals: null });
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ adherence: 0, streak: 0, nextWorkout: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const todayDayIndex = today.getDay(); // 0=Sunday
  const formattedDate = today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesion del usuario.");
          setLoading(false);
          return;
        }

        await fetch("/api/activate-client", { method: "POST" });

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Cliente";
        setClientName(fullName);

        const todayStr = today.toISOString().split("T")[0];

        const { data: activeMealPlan } = await supabase
          .from("meal_plans")
          .select("id, title")
          .eq("client_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: calendarEntries } = await supabase
          .from("user_calendar")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", todayStr);

        const workoutEntry = calendarEntries?.find((e: { activity_type: string }) => e.activity_type === "workout");
        const mealEntry = calendarEntries?.find((e: { activity_type: string }) => e.activity_type === "meal");

        setTodayPlan({
          workout: workoutEntry
            ? {
                name: (workoutEntry.activity_details as { nombre?: string })?.nombre || "Entrenamiento",
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

        // Weekly stats
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

        const { data: weekEntries } = await supabase
          .from("user_calendar")
          .select("date, completed, activity_type")
          .eq("user_id", user.id)
          .gte("date", startOfWeekStr)
          .lte("date", todayStr);

        if (weekEntries && weekEntries.length > 0) {
          const completedCount = weekEntries.filter((e: { completed: boolean }) => e.completed).length;
          setWeeklyStats((prev) => ({ ...prev, adherence: Math.round((completedCount / weekEntries.length) * 100) }));
        }

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
            if ((entry as { completed: boolean }).completed) streak++;
            else break;
          }
          setWeeklyStats((prev) => ({ ...prev, streak }));
        }

        const { data: nextWorkouts } = await supabase
          .from("user_calendar")
          .select("date, activity_details")
          .eq("user_id", user.id)
          .eq("activity_type", "workout")
          .eq("completed", false)
          .gt("date", todayStr)
          .order("date", { ascending: true })
          .limit(1);

        if (nextWorkouts && nextWorkouts.length > 0) {
          const nextDate = new Date(nextWorkouts[0].date + "T00:00:00");
          const dayName = nextDate.toLocaleDateString("es-ES", { weekday: "long" });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const firstName = clientName.split(" ")[0];

  return (
    <div className="space-y-8">

      {/* ── Header row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            {formattedDate}
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-white">
            Hola, {firstName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div className="flex items-center gap-2 rounded-xl border border-[#FF9100]/20 bg-[#FF9100]/[0.06] px-4 py-2">
            <svg className="h-4 w-4 text-[#FF9100]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            </svg>
            <span className="text-sm font-bold text-[#FF9100]">{weeklyStats.streak}</span>
            <span className="text-xs text-[#5A5A72]">racha</span>
          </div>

          {/* Adherence badge */}
          <div className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/[0.06] px-4 py-2">
            <svg className="h-4 w-4 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-bold text-[#00E5FF]">{weeklyStats.adherence}%</span>
            <span className="text-xs text-[#5A5A72]">adherencia</span>
          </div>
        </div>
      </div>

      {/* ── Week pills ── */}
      <div className="flex items-center gap-2">
        {DAYS_ES.map((day, i) => {
          // Convert: 0=Sun → show Mon-Sun in order (i=0→Mon, i=6→Sun)
          const dayIndex = i === 6 ? 0 : i + 1;
          const isToday = dayIndex === todayDayIndex;
          const isPast = (() => {
            if (dayIndex === todayDayIndex) return false;
            if (todayDayIndex === 0) return dayIndex !== 0; // Sunday is today, all others are past
            return dayIndex < todayDayIndex && dayIndex !== 0;
          })();

          return (
            <div
              key={day}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                isToday
                  ? "bg-[#00E5FF] text-[#0A0A0F]"
                  : isPast
                  ? "bg-white/[0.06] text-[#8B8BA3]"
                  : "border border-white/[0.06] text-[#5A5A72]"
              }`}
            >
              {day}
            </div>
          );
        })}
        <div className="ml-auto text-xs text-[#5A5A72]">
          {weeklyStats.nextWorkout && (
            <span>
              Próximo entreno:{" "}
              <span className="font-semibold text-[#7C3AED]">{weeklyStats.nextWorkout}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        {/* Today's workout — 2 cols */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6 md:col-span-2">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#7C3AED]/[0.06] blur-3xl pointer-events-none" />

          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Plan de hoy
            </p>
            {todayPlan.workout && (
              <Link
                href="/app/client/routine"
                className="flex items-center gap-1 text-xs font-semibold text-[#7C3AED] transition-colors hover:text-[#7C3AED]/80"
              >
                Ver rutina completa
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {/* Workout */}
            <div className="flex items-center gap-4 rounded-xl bg-white/[0.02]/60 p-4 ring-1 ring-white/[0.04]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                <svg className="h-5 w-5 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  {todayPlan.workout ? todayPlan.workout.name : "Sin entrenamiento hoy"}
                </p>
                <p className="mt-0.5 text-xs text-[#5A5A72]">
                  {todayPlan.workout ? todayPlan.workout.details : "Día de descanso — recarga energías"}
                </p>
              </div>
              <div className={`h-2 w-2 rounded-full ${
                todayPlan.workout?.details === "Completado" ? "bg-[#00C853]" : "bg-[#5A5A72]"
              }`} />
            </div>

            {/* Meals */}
            <div className="flex items-center gap-4 rounded-xl bg-white/[0.02]/60 p-4 ring-1 ring-white/[0.04]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00C853]/10">
                <svg className="h-5 w-5 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {todayPlan.meals ? todayPlan.meals.name : "Sin menú asignado"}
                </p>
                <p className="mt-0.5 text-xs text-[#5A5A72]">
                  {todayPlan.meals ? todayPlan.meals.details : "Consulta con tu entrenador"}
                </p>
              </div>
              {todayPlan.meals && (
                <Link
                  href="/app/client/meals"
                  className="flex h-8 items-center rounded-lg bg-[#00C853]/10 px-3 text-xs font-semibold text-[#00C853] transition-colors hover:bg-[#00C853]/20"
                >
                  Ver
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats column — 1 col */}
        <div className="flex flex-col gap-4">
          {/* Adherence */}
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Adherencia
            </p>
            <p className="text-4xl font-black tracking-tight text-[#00E5FF]">
              {weeklyStats.adherence}<span className="text-2xl">%</span>
            </p>
            <p className="mt-1 text-xs text-[#5A5A72]">esta semana</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] transition-all duration-700"
                style={{ width: `${weeklyStats.adherence}%` }}
              />
            </div>
          </div>

          {/* Next workout */}
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Próximo
            </p>
            <p className="text-lg font-bold text-[#7C3AED]">
              {weeklyStats.nextWorkout || "—"}
            </p>
            <p className="mt-1 text-xs text-[#5A5A72]">próximo entreno</p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Acciones rápidas
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/app/client/calories"
            className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-5 py-4 transition-all hover:border-[#00E5FF]/20 hover:bg-[#00E5FF]/[0.03]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/[0.08] transition-colors group-hover:bg-[#00E5FF]/[0.14]">
              <svg className="h-5 w-5 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Escanear comida</p>
              <p className="text-xs text-[#5A5A72]">Registrar con IA</p>
            </div>
          </Link>

          <Link
            href="/app/client/routine"
            className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-5 py-4 transition-all hover:border-[#7C3AED]/20 hover:bg-[#7C3AED]/[0.03]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/[0.08] transition-colors group-hover:bg-[#7C3AED]/[0.14]">
              <svg className="h-5 w-5 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Ver rutina</p>
              <p className="text-xs text-[#5A5A72]">Entrenamiento de hoy</p>
            </div>
          </Link>

          <Link
            href="/app/client/progress"
            className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-5 py-4 transition-all hover:border-[#00C853]/20 hover:bg-[#00C853]/[0.03]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00C853]/[0.08] transition-colors group-hover:bg-[#00C853]/[0.14]">
              <svg className="h-5 w-5 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Registrar progreso</p>
              <p className="text-xs text-[#5A5A72]">Peso y medidas</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
