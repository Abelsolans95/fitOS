"use client";

import { memo, type Dispatch } from "react";
import {
  getMealTotals,
  type MealSlot,
  type FoodItem,
} from "../nutrition-types";
import type { NutritionAction } from "../useNutritionPage";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import { SupplementAdder } from "./SupplementAdder";

interface MealSlotCardProps {
  meal: MealSlot;
  dayIndex: number;
  mealIndex: number;
  foods: FoodItem[];
  addFoodToMeal: (dayIndex: number, mealIndex: number, food: FoodItem) => void;
  dispatch: Dispatch<NutritionAction>;
}

export const MealSlotCard = memo(function MealSlotCard({
  meal,
  dayIndex,
  mealIndex,
  foods,
  addFoodToMeal,
  dispatch,
}: MealSlotCardProps) {
  const totals = getMealTotals(meal.foods);

  return (
    <div
      className={`space-y-3 rounded-xl p-4 transition-all ${
        meal.isCheatMeal
          ? "border border-[#FF1744]/30 bg-[#FF1744]/[0.04]"
          : meal.isSnack
          ? "border border-[#FF9100]/20 bg-[#FF9100]/[0.04]"
          : "border border-white/[0.05] bg-transparent"
      }`}
    >
      {/* Meal / Snack header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className={`text-[13px] font-semibold ${
            meal.isCheatMeal ? "text-[#FF1744]" : meal.isSnack ? "text-[#FF9100]" : "text-[#00E5FF]"
          }`}>
            {meal.label}
          </h4>
          {meal.isSnack && !meal.isCheatMeal && (
            <span className="rounded-full border border-[#FF9100]/30 bg-[#FF9100]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#FF9100]">
              Snack
            </span>
          )}
          {meal.isCheatMeal && (
            <span className="rounded-full border border-[#FF1744]/40 bg-[#FF1744]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#FF1744]">
              Cheat Meal
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {meal.foods.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#8B8BA3]">
              <span>{totals.kcal} kcal</span>
              <span>P:{totals.protein}g</span>
              <span>C:{totals.carbs}g</span>
              <span>G:{totals.fat}g</span>
            </div>
          )}
          {/* Cheat meal toggle */}
          <button
            type="button"
            onClick={() => dispatch({ type: "CR_TOGGLE_CHEAT_MEAL", dayIndex, mealIndex })}
            title={meal.isCheatMeal ? "Quitar cheat meal" : "Marcar como cheat meal"}
            className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
              meal.isCheatMeal
                ? "border-[#FF1744]/40 bg-[#FF1744]/15 text-[#FF1744] hover:bg-[#FF1744]/25"
                : "border-white/[0.08] bg-white/[0.02] text-[#5A5A72] hover:border-white/[0.15] hover:text-white"
            }`}
          >
            <svg className="h-3 w-3" fill={meal.isCheatMeal ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>
            Cheat
          </button>
          {/* Remove snack button */}
          {meal.isSnack && (
            <button
              type="button"
              onClick={() => dispatch({ type: "CR_REMOVE_MEAL", dayIndex, mealIndex })}
              title="Quitar snack de este día"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[#FF9100]/50 transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Food items */}
      {meal.foods.map((food, foodIndex) => (
        <div
          key={foodIndex}
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
        >
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] text-[#E8E8ED]">{food.name}</p>
            <p className="text-[11px] text-[#8B8BA3]">
              {food.kcal} kcal · P:{food.protein}g · C:{food.carbs}g · G:{food.fat}g
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={food.portion_g}
              onChange={(e) =>
                dispatch({
                  type: "CR_UPDATE_PORTION",
                  dayIndex, mealIndex, foodIndex,
                  portion: Number(e.target.value) || 0,
                })
              }
              className="h-8 w-20 rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
            />
            <span className="text-[11px] text-[#8B8BA3]">g</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "CR_REMOVE_FOOD", dayIndex, mealIndex, foodIndex })}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Add food */}
      <FoodSearchCombobox
        foods={foods}
        onSelect={(food) => addFoodToMeal(dayIndex, mealIndex, food)}
      />

      {/* Coach notes */}
      <textarea
        value={meal.notes ?? ""}
        onChange={(e) =>
          dispatch({ type: "CR_SET_MEAL_NOTES", dayIndex, mealIndex, notes: e.target.value })
        }
        placeholder="Notas del coach (ej: Beber 500ml de agua antes)..."
        rows={1}
        className="w-full resize-none rounded-lg border border-white/[0.05] bg-transparent px-3 py-2 text-[12px] text-[#8B8BA3] placeholder:text-[#3A3A52] outline-none transition-colors hover:border-white/[0.08] focus:border-white/[0.12] focus:text-[#E8E8ED]"
        style={{ minHeight: "34px" }}
        onInput={(e) => {
          const t = e.currentTarget;
          t.style.height = "auto";
          t.style.height = `${t.scrollHeight}px`;
        }}
      />

      {/* Supplements */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF9100]/60">
          Suplementos
        </span>
        {(meal.supplements ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(meal.supplements ?? []).map((supp, suppIndex) => (
              <div
                key={suppIndex}
                className="flex items-center gap-1.5 rounded-full border border-[#FF9100]/20 bg-[#FF9100]/5 pl-3 pr-1.5 py-1"
              >
                <span className="text-[11px] text-[#FF9100]">{supp.name}</span>
                {supp.timing && (
                  <span className="text-[10px] text-[#FF9100]/60">· {supp.timing}</span>
                )}
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CR_REMOVE_SUPPLEMENT", dayIndex, mealIndex, suppIndex })}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[#FF9100]/50 transition-colors hover:bg-[#FF1744]/20 hover:text-[#FF1744]"
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <SupplementAdder
          onAdd={(supp) =>
            dispatch({ type: "CR_ADD_SUPPLEMENT", dayIndex, mealIndex, supplement: supp })
          }
        />
      </div>
    </div>
  );
});
