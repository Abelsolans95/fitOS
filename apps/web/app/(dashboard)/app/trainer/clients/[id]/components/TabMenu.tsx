"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { MealPlan, FoodLogEntry } from "./types";
import { EmptyState, formatDate } from "./shared";

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

const MEAL_ORDER = ["desayuno", "almuerzo", "comida", "merienda", "cena", "snack"];

export function TabMenu({
  mealPlan,
  clientId,
}: {
  mealPlan: MealPlan | null;
  clientId: string;
}) {
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const load = async () => {
      setLoadingLogs(true);
      const supabase = createClient();
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;
      const { data, error: logsError } = await supabase
        .from("food_log")
        .select(
          "id, meal_type, foods, total_kcal, total_protein, total_carbs, total_fat, photo_url, source, notes, logged_at"
        )
        .eq("client_id", clientId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: true });
      if (logsError) {
        toast.error("Error al cargar el registro de comidas");
        console.error("[TabMenu] Error cargando food_log:", logsError);
      }
      setFoodLogs((data ?? []) as FoodLogEntry[]);
      setLoadingLogs(false);
    };
    load();
  }, [clientId, selectedDate]);

  const dailyTotals = foodLogs.reduce(
    (acc, log) => ({
      kcal: acc.kcal + (log.total_kcal || 0),
      protein: acc.protein + (log.total_protein || 0),
      carbs: acc.carbs + (log.total_carbs || 0),
      fat: acc.fat + (log.total_fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const logsByMeal = MEAL_ORDER.reduce<Record<string, FoodLogEntry[]>>((acc, meal) => {
    const entries = foodLogs.filter((l) => l.meal_type === meal);
    if (entries.length > 0) acc[meal] = entries;
    return acc;
  }, {});

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  if (!mealPlan) {
    return (
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z" />
          </svg>
        }
        title="Sin menú asignado"
        description="Este cliente aún no tiene un plan de alimentación"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan info */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-semibold text-white">{mealPlan.title}</h4>
          <span className="inline-flex items-center rounded-full bg-[#00C853]/10 px-2.5 py-0.5 text-xs font-medium text-[#00C853]">
            Activo
          </span>
        </div>
        <p className="mt-3 text-xs text-[#8B8BA3]">Creado el {formatDate(mealPlan.created_at)}</p>
      </div>

      {/* Date selector */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <button
          type="button"
          onClick={() => changeDate(-1)}
          className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white">{formatDate(selectedDate)}</span>
        <button
          type="button"
          onClick={() => changeDate(1)}
          className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Daily totals */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Kcal", value: Math.round(dailyTotals.kcal), color: "#00E5FF" },
          { label: "Proteína", value: `${Math.round(dailyTotals.protein)}g`, color: "#FF9100" },
          { label: "Carbos", value: `${Math.round(dailyTotals.carbs)}g`, color: "#7C3AED" },
          { label: "Grasa", value: `${Math.round(dailyTotals.fat)}g`, color: "#00C853" },
        ].map((macro) => (
          <div key={macro.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="text-lg font-black" style={{ color: macro.color }}>
              {macro.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">{macro.label}</p>
          </div>
        ))}
      </div>

      {/* Meals */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">
          Registro del día
        </h3>

        {loadingLogs ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : foodLogs.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center text-sm text-[#5A5A72]">
            Sin registros este día
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(logsByMeal).map(([meal, entries]) => (
              <div key={meal} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#00E5FF]">
                  {MEAL_LABELS[meal] ?? meal}
                </h4>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-white/[0.04] bg-[#0E0E18]/60 backdrop-blur-xl p-3"
                    >
                      <div className="space-y-1">
                        {(entry.foods ?? []).map((food, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-[#E8E8ED]">{food.name}</span>
                            <span className="text-[#5A5A72]">
                              {food.portion_g ? `${food.portion_g}g` : ""}{" "}
                              {food.kcal ? `· ${Math.round(food.kcal)} kcal` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-3 border-t border-white/[0.04] pt-2 text-[10px] text-[#8B8BA3]">
                        <span>
                          <span className="font-semibold text-white">{Math.round(entry.total_kcal)}</span> kcal
                        </span>
                        <span>
                          <span className="font-semibold text-[#FF9100]">{Math.round(entry.total_protein)}</span>g P
                        </span>
                        <span>
                          <span className="font-semibold text-[#7C3AED]">{Math.round(entry.total_carbs)}</span>g C
                        </span>
                        <span>
                          <span className="font-semibold text-[#00C853]">{Math.round(entry.total_fat)}</span>g G
                        </span>
                        {entry.source === "ai_vision" && (
                          <span className="ml-auto rounded-full bg-[#00E5FF]/10 px-2 py-0.5 text-[10px] font-medium text-[#00E5FF]">
                            IA
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="mt-2 rounded-md bg-[#7C3AED]/5 px-3 py-2 text-xs text-[#7C3AED]">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
