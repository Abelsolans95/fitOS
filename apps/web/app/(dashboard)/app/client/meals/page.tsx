"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { MealPlan, DayPlan, DAY_LABELS } from "./components/types";
import { MealCard } from "./components/MealCard";
import { DailyTotals } from "./components/DailyTotals";

export default function MealsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [completedMeals, setCompletedMeals] = useState<Record<string, boolean>>({});
  const [weekAdherence, setWeekAdherence] = useState(0);

  const calculateAdherence = useCallback(
    (plan: MealPlan, completed: Record<string, boolean>) => {
      if (!plan || !plan.days || plan.days.length === 0) return;
      let totalMeals = 0;
      let completedCount = 0;
      plan.days.forEach((day, dayIdx) => {
        day.meals.forEach((_, mealIdx) => {
          totalMeals++;
          if (completed[`${dayIdx}-${mealIdx}`]) completedCount++;
        });
      });
      setWeekAdherence(
        totalMeals > 0 ? Math.round((completedCount / totalMeals) * 100) : 0
      );
    },
    []
  );

  useEffect(() => {
    const loadMealPlan = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        if (authError || !session?.user) {
          setError("No se pudo obtener la sesion del usuario.");
          setLoading(false);
          return;
        }
        const user = session.user;

        setUserId(user.id);

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);

        // Meal plan and calendar entries are independent — fetch in parallel
        const [mealPlanRes, calendarRes] = await Promise.all([
          supabase
            .from("meal_plans")
            .select("id, title, period, meals_per_day, days, target_kcal, is_active, created_at")
            .eq("client_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("user_calendar")
            .select("date, completed, activity_details")
            .eq("user_id", user.id)
            .eq("activity_type", "meal")
            .gte("date", startOfWeek.toISOString().split("T")[0]),
        ]);

        if (mealPlanRes.error) {
          setError("Error al cargar el menu.");
          setLoading(false);
          return;
        }

        if (calendarRes.error) { console.error("[Meals] Error cargando adherencia:", calendarRes.error); } // No bloqueante

        if (mealPlanRes.data) {
          const plan = mealPlanRes.data as MealPlan;
          setMealPlan(plan);

          const calendarEntries = calendarRes.data;
          if (calendarEntries) {
            const completed: Record<string, boolean> = {};
            calendarEntries.forEach((entry) => {
              const details = entry.activity_details as {
                day_index?: number;
                meal_index?: number;
              };
              if (
                details?.day_index !== undefined &&
                details?.meal_index !== undefined
              ) {
                completed[`${details.day_index}-${details.meal_index}`] =
                  entry.completed;
              }
            });
            setCompletedMeals(completed);
            calculateAdherence(plan, completed);
          }
        }
      } catch {
        setError("Error inesperado al cargar el menu.");
      } finally {
        setLoading(false);
      }
    };

    loadMealPlan();
  }, [calculateAdherence]);

  const toggleMealCompleted = async (dayIdx: number, mealIdx: number) => {
    if (!userId || !mealPlan) return;
    const key = `${dayIdx}-${mealIdx}`;
    const newCompleted = !completedMeals[key];

    setCompletedMeals((prev) => {
      const updated = { ...prev, [key]: newCompleted };
      calculateAdherence(mealPlan, updated);
      return updated;
    });

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const { data: existing, error: lookupErr } = await supabase
        .from("user_calendar")
        .select("id")
        .eq("user_id", userId)
        .eq("date", today)
        .eq("activity_type", "meal")
        .maybeSingle();

      if (lookupErr) {
        console.error("[Meals] Error buscando entrada de calendario:", lookupErr);
        throw lookupErr;
      }

      if (existing) {
        const { error: updateErr } = await supabase
          .from("user_calendar")
          .update({
            completed: newCompleted,
            activity_details: {
              day_index: dayIdx,
              meal_index: mealIdx,
              meal_plan_id: mealPlan.id,
            },
          })
          .eq("id", existing.id);
        if (updateErr) { console.error("[Meals] Error actualizando comida:", updateErr); throw updateErr; }
      } else {
        const { error: insertErr } = await supabase.from("user_calendar").insert({
          user_id: userId,
          date: today,
          activity_type: "meal",
          completed: newCompleted,
          activity_details: {
            day_index: dayIdx,
            meal_index: mealIdx,
            meal_plan_id: mealPlan.id,
          },
        });
        if (insertErr) { console.error("[Meals] Error insertando comida:", insertErr); throw insertErr; }
      }
    } catch {
      // Revert on error
      setCompletedMeals((prev) => {
        const updated = { ...prev, [key]: !newCompleted };
        calculateAdherence(mealPlan, updated);
        return updated;
      });
    }
  };

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
        <button
          type="button"
          onClick={() => setError(null)}
          className="text-sm text-[#00E5FF] hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Mi Menu</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
            <svg
              className="h-7 w-7 text-[#8B8BA3]"
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
          <p className="text-sm font-medium text-white">Sin menu asignado</p>
          <p className="max-w-xs text-center text-xs text-[#8B8BA3]">
            Tu entrenador aun no te ha asignado un menu
          </p>
        </div>
      </div>
    );
  }

  const days = (mealPlan.days as DayPlan[]) || [];
  const currentDay = days[activeDay];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Menu</h1>
          <p className="mt-1 text-sm text-[#8B8BA3]">{mealPlan.title}</p>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-[#00C853]/10 px-3 py-2">
          <span className="text-lg font-bold text-[#00C853]">{weekAdherence}%</span>
          <span className="text-[10px] text-[#00C853]">Adherencia</span>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveDay(idx)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              activeDay === idx
                ? "bg-[#00C853] text-white"
                : "bg-white/[0.04] text-[#8B8BA3] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {DAY_LABELS[idx] || `Dia ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Day content */}
      {currentDay ? (
        <div className="space-y-4">
          {currentDay.meals.map((meal, mealIdx) => (
            <MealCard
              key={mealIdx}
              meal={meal}
              dayIdx={activeDay}
              mealIdx={mealIdx}
              isCompleted={completedMeals[`${activeDay}-${mealIdx}`] || false}
              onToggle={toggleMealCompleted}
            />
          ))}
          <DailyTotals day={currentDay} mealPlan={mealPlan} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl py-12">
          <p className="text-sm text-[#8B8BA3]">No hay datos para este dia</p>
        </div>
      )}
    </div>
  );
}
