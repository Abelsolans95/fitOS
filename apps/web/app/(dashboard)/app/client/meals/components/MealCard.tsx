"use client";

import { memo } from "react";
import { Meal, MEAL_TYPE_LABELS } from "./types";

interface MealCardProps {
  meal: Meal;
  dayIdx: number;
  mealIdx: number;
  isCompleted: boolean;
  onToggle: (dayIdx: number, mealIdx: number) => void;
}

export const MealCard = memo(function MealCard({
  meal,
  dayIdx,
  mealIdx,
  isCompleted,
  onToggle,
}: MealCardProps) {
  const totalKcal = Math.round(
    Number(meal.total_kcal) ||
      meal.foods.reduce((sum, f) => sum + (Number(f.kcal) || 0), 0)
  );

  return (
    <div
      className={`rounded-2xl border bg-[#0E0E18]/60 backdrop-blur-xl p-4 transition-all ${
        isCompleted ? "border-[#00C853]/20" : "border-white/[0.06]"
      }`}
    >
      {/* Meal header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggle(dayIdx, mealIdx)}
            className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
              isCompleted
                ? "border-[#00C853] bg-[#00C853]"
                : "border-white/[0.15] bg-transparent hover:border-[#00C853]/50"
            }`}
          >
            {isCompleted && (
              <svg
                className="h-3.5 w-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
          <span
            className={`text-sm font-semibold ${
              isCompleted ? "text-[#00C853] line-through" : "text-white"
            }`}
          >
            {MEAL_TYPE_LABELS[meal.type] || meal.type}
          </span>
        </div>
        <span className="text-xs font-medium text-[#8B8BA3]">
          {totalKcal} kcal
        </span>
      </div>

      {/* Foods list */}
      <div className="mt-3 space-y-2">
        {meal.foods.map((food, foodIdx) => (
          <div
            key={foodIdx}
            className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
          >
            <div>
              <p className="text-xs font-medium text-white">{food.name}</p>
              <p className="text-[10px] text-[#8B8BA3]">{food.portion_g}g</p>
            </div>
            <div className="flex gap-3 text-[10px] text-[#8B8BA3]">
              <span className="text-[#00E5FF]">P:{food.protein}g</span>
              <span className="text-[#FF9100]">C:{food.carbs}g</span>
              <span className="text-[#7C3AED]">G:{food.fat}g</span>
            </div>
          </div>
        ))}
      </div>

      {/* Meal macro totals */}
      {meal.macros && (
        <div className="mt-3 flex gap-3 border-t border-white/[0.04] pt-3 text-[10px]">
          <span className="text-[#00E5FF]">
            Proteina: {Math.round(meal.macros.protein)}g
          </span>
          <span className="text-[#FF9100]">
            Carbos: {Math.round(meal.macros.carbs)}g
          </span>
          <span className="text-[#7C3AED]">
            Grasa: {Math.round(meal.macros.fat)}g
          </span>
        </div>
      )}
    </div>
  );
});
