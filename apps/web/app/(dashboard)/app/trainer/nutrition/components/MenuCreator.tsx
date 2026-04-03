"use client";

import { useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  getWeekTarget,
  getWeekDates,
  type useNutritionPage,
} from "../useNutritionPage";
import { DayCard } from "./DayCard";
import { MacroInfoPanel } from "./MacroInfoPanel";
import { MenuConfigCard } from "./MenuConfigCard";
import { WeekNavigationCompact, WeekNavigationFull, MenuActionButtons } from "./MenuActions";

type NutritionHook = ReturnType<typeof useNutritionPage>;

export function MenuCreator({ n }: { n: NutritionHook }) {
  const { state, dispatch, selectedClient, addFoodToMeal, handleSendMenu, handleSaveTemplate } = n;

  /* Sticky info panel via scroll listener */
  const flexRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const TOP_OFFSET = 24;
    const update = () => {
      const panel = panelRef.current;
      const flex = flexRef.current;
      if (!panel || !flex) return;
      const flexTop = flex.getBoundingClientRect().top;
      const shift = Math.max(0, TOP_OFFSET - flexTop);
      panel.style.transform = shift > 0 ? `translateY(${shift}px)` : "";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  /* Week dates for day headers */
  const weekDates = useMemo(
    () =>
      state.crSelectedDays.length > 0 && state.crStartDate
        ? getWeekDates(new Date(state.crStartDate), state.crCurrentWeek, state.crSelectedDays)
        : [],
    [state.crSelectedDays, state.crStartDate, state.crCurrentWeek]
  );

  /* Daily average macro totals (for floating panel) */
  const dailyTotals = useMemo(() => {
    let kcal = 0, protein = 0, carbs = 0, fat = 0;
    for (const day of state.crDays) {
      for (const meal of day.meals) {
        for (const food of meal.foods) {
          kcal += food.kcal; protein += food.protein;
          carbs += food.carbs; fat += food.fat;
        }
      }
    }
    const count = state.crDays.length || 1;
    return {
      kcal: Math.round((kcal / count) * 10) / 10,
      protein: Math.round((protein / count) * 10) / 10,
      carbs: Math.round((carbs / count) * 10) / 10,
      fat: Math.round((fat / count) * 10) / 10,
    };
  }, [state.crDays]);

  // Per-week targets (fall back to global defaults)
  const weekTarget = getWeekTarget(state.crCurrentWeek, state.crWeeklyTargets, {
    kcal: state.crTargetKcal,
    proteinPct: state.crTargetProteinPct,
    carbsPct: state.crTargetCarbsPct,
    fatPct: state.crTargetFatPct,
  });
  const targetKcal = Number(weekTarget.kcal) || 0;
  const targetProteinG = Math.round((targetKcal * weekTarget.proteinPct) / 100 / 4);
  const targetCarbsG = Math.round((targetKcal * weekTarget.carbsPct) / 100 / 4);
  const targetFatG = Math.round((targetKcal * weekTarget.fatPct) / 100 / 9);
  const totalMacroG = dailyTotals.protein + dailyTotals.carbs + dailyTotals.fat;
  const actualProteinPct = totalMacroG > 0 ? Math.round((dailyTotals.protein / totalMacroG) * 100) : 0;
  const actualCarbsPct = totalMacroG > 0 ? Math.round((dailyTotals.carbs / totalMacroG) * 100) : 0;
  const actualFatPct = totalMacroG > 0 ? Math.round((dailyTotals.fat / totalMacroG) * 100) : 0;
  const deltaKcal = Math.round((targetKcal - dailyTotals.kcal) * 10) / 10;
  const deltaProtein = Math.round((targetProteinG - dailyTotals.protein) * 10) / 10;
  const deltaCarbs = Math.round((targetCarbsG - dailyTotals.carbs) * 10) / 10;
  const deltaFat = Math.round((targetFatG - dailyTotals.fat) * 10) / 10;

  const macroSumOk = weekTarget.proteinPct + weekTarget.carbsPct + weekTarget.fatPct === 100;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => dispatch({ type: "HIDE_CREATOR" })}
        className="flex items-center gap-2 text-[13px] text-[#8B8BA3] transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a menus
      </button>

      <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Nuevo Menu</h2>

      {/* ── Config card ── */}
      <MenuConfigCard
        state={state}
        dispatch={dispatch}
        selectedClient={selectedClient}
        weekTarget={weekTarget}
        macroSumOk={macroSumOk}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold tracking-[-0.02em] text-white">Planificacion por dia</h3>
        <button
          type="button"
          onClick={() => toast.info("Generacion IA disponible proximamente")}
          className="flex items-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-2 text-[13px] font-semibold text-[#7C3AED] transition-all hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
          Generar con IA
        </button>
      </div>

      {/* ── Week navigation (top) ── */}
      {state.crMesocycleWeeks > 1 && (
        <WeekNavigationCompact
          currentWeek={state.crCurrentWeek}
          totalWeeks={state.crMesocycleWeeks}
          dispatch={dispatch}
        />
      )}

      {/* ── Two columns: days + info panel ── */}
      <div ref={flexRef} className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="space-y-4">
            {state.crDays.map((day, dayIndex) => (
              <DayCard
                key={dayIndex}
                day={day}
                dayIndex={dayIndex}
                allDays={state.crDays}
                weekDates={weekDates}
                foods={state.foods}
                addFoodToMeal={addFoodToMeal}
                dispatch={dispatch}
              />
            ))}
          </div>

          {/* Bottom week navigation */}
          {state.crMesocycleWeeks > 1 && (
            <WeekNavigationFull
              currentWeek={state.crCurrentWeek}
              totalWeeks={state.crMesocycleWeeks}
              dispatch={dispatch}
            />
          )}

          {/* Action buttons */}
          <MenuActionButtons
            state={state}
            dispatch={dispatch}
            handleSendMenu={handleSendMenu}
            handleSaveTemplate={handleSaveTemplate}
          />
        </div>

        {/* ── Sticky info panel (right column) ── */}
        <MacroInfoPanel
          ref={panelRef}
          dailyTotals={dailyTotals}
          targetKcal={targetKcal}
          targetProteinG={targetProteinG}
          targetCarbsG={targetCarbsG}
          targetFatG={targetFatG}
          deltaKcal={deltaKcal}
          deltaProtein={deltaProtein}
          deltaCarbs={deltaCarbs}
          deltaFat={deltaFat}
          actualProteinPct={actualProteinPct}
          actualCarbsPct={actualCarbsPct}
          actualFatPct={actualFatPct}
          weekTarget={weekTarget}
        />
      </div>
    </div>
  );
}
