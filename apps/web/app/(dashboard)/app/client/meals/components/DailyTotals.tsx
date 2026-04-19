"use client";

import { DayPlan, MealPlan } from "./types";

interface DailyTotalsProps {
  day: DayPlan;
  mealPlan: MealPlan;
}

export function DailyTotals({ day, mealPlan }: DailyTotalsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">Totales del dia</h3>
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-white">
            {Math.round(day.daily_total_kcal || 0)}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
            kcal
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#00E5FF]">
            {Math.round(day.daily_macros?.protein || 0)}g
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
            Prot
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#FF9100]">
            {Math.round(day.daily_macros?.carbs || 0)}g
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
            Carbs
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#7C3AED]">
            {Math.round(day.daily_macros?.fat || 0)}g
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
            Grasa
          </p>
        </div>
      </div>

      {/* Target comparison */}
      <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2 text-xs">
        <span className="text-[#8B8BA3]">Objetivo:</span>
        <span className="font-medium text-[#00E5FF]">
          {Math.round(mealPlan.target_kcal)} kcal
        </span>
      </div>
    </div>
  );
}
