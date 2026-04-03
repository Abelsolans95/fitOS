"use client";

import { memo, useState } from "react";
import { toast } from "sonner";
import type { Dispatch } from "react";
import type { DayPlan, FoodItem } from "../nutrition-types";
import type { NutritionAction } from "../useNutritionPage";
import { MealSlotCard } from "./MealSlotCard";

interface WeekDateInfo {
  date: string;
}

interface DayCardProps {
  day: DayPlan;
  dayIndex: number;
  allDays: DayPlan[];
  weekDates: WeekDateInfo[];
  foods: FoodItem[];
  addFoodToMeal: (dayIndex: number, mealIndex: number, food: FoodItem) => void;
  dispatch: Dispatch<NutritionAction>;
}

export const DayCard = memo(function DayCard({
  day,
  dayIndex,
  allDays,
  weekDates,
  foods,
  addFoodToMeal,
  dispatch,
}: DayCardProps) {
  const [showClone, setShowClone] = useState(false);

  return (
    <div className={`rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl${showClone ? " relative z-[60]" : ""}`}>
      {/* Day header */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-4">
        <button
          type="button"
          onClick={() => dispatch({ type: "CR_TOGGLE_DAY", dayIndex })}
          className="flex flex-1 items-center justify-between text-left rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-white/[0.02]"
        >
          <span className="text-[13px] font-semibold text-white">
            {day.day}
            {weekDates[dayIndex] && (
              <span className="ml-2 text-[11px] font-normal text-[#8B8BA3]">{weekDates[dayIndex].date}</span>
            )}
          </span>
          <svg
            className={`h-4 w-4 text-[#8B8BA3] transition-transform ${day.expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* Clone day */}
        {allDays.length > 1 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowClone(!showClone)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 text-[11px] font-medium text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
              Copiar a...
            </button>
            {showClone && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowClone(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-white/[0.08] bg-[#0E0E18]/95 backdrop-blur-xl shadow-xl overflow-hidden">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Copiar a:</p>
                  {allDays.map((td, ti) => {
                    if (ti === dayIndex) return null;
                    return (
                      <button
                        key={ti}
                        type="button"
                        onClick={() => {
                          dispatch({ type: "CR_CLONE_DAY", fromIndex: dayIndex, toIndex: ti });
                          setShowClone(false);
                          toast.success(`Copiado a ${td.day}`);
                        }}
                        className="flex w-full items-center px-3 py-2 text-[13px] text-[#E8E8ED] transition-colors hover:bg-white/[0.05]"
                      >
                        {td.day}
                        {weekDates[ti] && (
                          <span className="ml-1.5 text-[11px] text-[#5A5A72]">{weekDates[ti].date}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Day content */}
      {day.expanded && (
        <div className="border-t border-white/[0.06] px-6 py-4 space-y-4">
          {day.meals.map((meal, mealIndex) => (
            <MealSlotCard
              key={mealIndex}
              meal={meal}
              dayIndex={dayIndex}
              mealIndex={mealIndex}
              foods={foods}
              addFoodToMeal={addFoodToMeal}
              dispatch={dispatch}
            />
          ))}

          {/* + Add Snack */}
          <button
            type="button"
            onClick={() => dispatch({ type: "CR_ADD_SNACK_TO_DAY", dayIndex })}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#FF9100]/25 py-2.5 text-[12px] font-medium text-[#FF9100]/60 transition-all hover:border-[#FF9100]/50 hover:text-[#FF9100]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Añadir Snack
          </button>
        </div>
      )}
    </div>
  );
});
