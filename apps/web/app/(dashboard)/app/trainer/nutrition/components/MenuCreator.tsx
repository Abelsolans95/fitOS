"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  getMealTotals,
  getWeekTarget,
  DAYS_OF_WEEK,
  getWeekDates,
  type useNutritionPage,
  type FoodItem,
  type MealFood,
  type Supplement,
} from "../useNutritionPage";
import { DarkSelect } from "@/components/ui/DarkSelect";
import { FoodPreferencesCard } from "./FoodPreferencesCard";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import { SupplementAdder } from "./SupplementAdder";
import { MacroRow } from "./MacroRow";

type NutritionHook = ReturnType<typeof useNutritionPage>;

export function MenuCreator({ n }: { n: NutritionHook }) {
  const { state, dispatch, selectedClient, addFoodToMeal, handleSendMenu, handleSaveTemplate } = n;

  // Clone dropdown: which day is open
  const [showCloneFor, setShowCloneFor] = useState<number | null>(null);

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

  /* Daily average macro totals (for floating panel) — recalculates on every crDays change */
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
    const n = state.crDays.length || 1;
    return {
      kcal: Math.round((kcal / n) * 10) / 10,
      protein: Math.round((protein / n) * 10) / 10,
      carbs: Math.round((carbs / n) * 10) / 10,
      fat: Math.round((fat / n) * 10) / 10,
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

      {/* ── Config card — ancho completo ── */}
      <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6 space-y-5">

        {/* Load saved menu */}
        {state.savedMenus.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#7C3AED]">Cargar menu guardado</label>
            <DarkSelect
              value={state.crLoadedMenuId}
              onChange={(val) => {
                const menu = state.savedMenus.find((m) => m.id === val);
                if (menu) {
                  dispatch({ type: "CR_LOAD_SAVED_MENU", menu });
                  toast.success(`Menu "${menu.name}" cargado`);
                }
              }}
              placeholder="Seleccionar menu guardado..."
              options={state.savedMenus.map((m) => ({ value: m.id, label: m.name }))}
            />
            {state.crLoadedMenuId && (
              <p className="text-[11px] text-[#7C3AED]/70">
                Menu cargado — los días, semanas, macros y comidas se han pre-configurado automáticamente.
              </p>
            )}
          </div>
        )}

        {/* Client */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Cliente</label>
          <DarkSelect
            value={state.crSelectedClientId}
            onChange={(val) => dispatch({ type: "CR_SET_CLIENT", clientId: val })}
            placeholder="Seleccionar cliente..."
            options={state.clients.map((c) => ({ value: c.client_id, label: c.full_name ?? c.email ?? "Sin nombre" }))}
          />
        </div>

        {selectedClient?.food_preferences && (
          <FoodPreferencesCard prefs={selectedClient.food_preferences} />
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Titulo del menu</label>
          <input
            type="text"
            value={state.crTitle}
            onChange={(e) => dispatch({ type: "CR_SET_TITLE", title: e.target.value })}
            placeholder="Ej: Menu de definicion - Semana 1"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>

        {/* Days of week */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Dias de la semana</label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DAYS_OF_WEEK.map((d) => {
              const active = state.crSelectedDays.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => dispatch({ type: "CR_TOGGLE_DAY_SELECTION", dayKey: d.key })}
                  className={`rounded-xl border px-2 py-2.5 text-[12px] font-medium transition-all ${
                    active
                      ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                      : "border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] hover:border-white/[0.15] hover:text-white"
                  }`}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weeks + Start date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Semanas</label>
            <DarkSelect
              value={String(state.crMesocycleWeeks)}
              onChange={(val) => dispatch({ type: "CR_SET_MESOCYCLE_WEEKS", weeks: Number(val) })}
              options={[1, 2, 3, 4, 5, 6, 7, 8].map((w) => ({ value: String(w), label: `${w} semana${w > 1 ? "s" : ""}` }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Fecha de inicio</label>
            <input
              type="date"
              value={state.crStartDate}
              onChange={(e) => dispatch({ type: "CR_SET_START_DATE", date: e.target.value })}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
            />
          </div>
        </div>

        {/* Comidas principales */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Comidas principales
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => dispatch({ type: "CR_SET_MAIN_MEALS", count: n })}
                className={`rounded-xl border px-4 py-3 text-[13px] font-semibold transition-all ${
                  state.crMainMeals === n
                    ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                    : "border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] hover:border-white/[0.15] hover:text-white"
                }`}
              >
                {n} comidas
              </button>
            ))}
          </div>
        </div>

        {/* Snacks base */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Snacks diarios (base)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => dispatch({ type: "CR_SET_SNACKS_PER_DAY", count: n })}
                className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                  state.crSnacksPerDay === n
                    ? "border-[#FF9100]/50 bg-[#FF9100]/10 text-[#FF9100]"
                    : "border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] hover:border-white/[0.15] hover:text-white"
                }`}
              >
                <span className="block text-[15px] font-bold">{n}</span>
                <span className="block text-[10px] opacity-70">{n === 1 ? "snack" : "snacks"}</span>
              </button>
            ))}
          </div>
          {state.crSnacksPerDay > 0 && (
            <p className="text-[11px] text-[#5A5A72]">
              Los snacks se intercalan entre las comidas. Puedes añadir o quitar snacks por día desde el planificador.
            </p>
          )}
        </div>

        {/* Macro percentages */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Distribucion de macros (%)
            {state.crMesocycleWeeks > 1 && (
              <span className="ml-2 text-[#7C3AED]">— Semana {state.crCurrentWeek}</span>
            )}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "protein", label: "Proteína", color: "#00C853", value: weekTarget.proteinPct, weekAction: "CR_SET_WEEK_TARGET_PROTEIN_PCT" as const, globalAction: "CR_SET_TARGET_PROTEIN_PCT" as const },
              { key: "carbs", label: "Carbos", color: "#FF9100", value: weekTarget.carbsPct, weekAction: "CR_SET_WEEK_TARGET_CARBS_PCT" as const, globalAction: "CR_SET_TARGET_CARBS_PCT" as const },
              { key: "fat", label: "Grasas", color: "#7C3AED", value: weekTarget.fatPct, weekAction: "CR_SET_WEEK_TARGET_FAT_PCT" as const, globalAction: "CR_SET_TARGET_FAT_PCT" as const },
            ].map(({ key, label, color, value, weekAction, globalAction }) => (
              <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color }}>{label}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    if (state.crMesocycleWeeks > 1) {
                      dispatch({ type: weekAction, week: state.crCurrentWeek, value: v });
                    } else {
                      dispatch({ type: globalAction, value: v });
                    }
                  }}
                  className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-2 text-center text-[14px] font-bold text-white outline-none focus:border-[#00E5FF]/40"
                />
              </div>
            ))}
          </div>
          {!macroSumOk && (
            <p className="text-[11px] text-[#FF1744]">
              Los porcentajes deben sumar 100% (actual: {weekTarget.proteinPct + weekTarget.carbsPct + weekTarget.fatPct}%)
            </p>
          )}
        </div>

        {/* Target kcal */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Calorias objetivo (kcal/dia)
            {state.crMesocycleWeeks > 1 && (
              <span className="ml-2 text-[#7C3AED]">— Semana {state.crCurrentWeek}</span>
            )}
          </label>
          <input
            type="number"
            value={weekTarget.kcal}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : "";
              if (state.crMesocycleWeeks > 1) {
                dispatch({ type: "CR_SET_WEEK_TARGET_KCAL", week: state.crCurrentWeek, value: v });
              } else {
                dispatch({ type: "CR_SET_TARGET_KCAL", value: v });
              }
            }}
            placeholder="Ej: 2000"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
          {state.crMesocycleWeeks > 1 && (
            <p className="flex items-center gap-1.5 text-[11px] text-[#5A5A72]">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              Las semanas sin valores propios heredan los de la semana&nbsp;1.
            </p>
          )}
        </div>
      </div>

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

      {/* ── Week navigation (only when mesocycle > 1 week) ── */}
      {state.crMesocycleWeeks > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "CR_PREV_WEEK" })}
            disabled={state.crCurrentWeek <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-[13px] font-semibold text-white">
            Semana {state.crCurrentWeek} <span className="text-[#5A5A72]">/ {state.crMesocycleWeeks}</span>
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: "CR_NEXT_WEEK" })}
            disabled={state.crCurrentWeek >= state.crMesocycleWeeks}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Dos columnas: días + info panel ── */}
      <div ref={flexRef} className="flex gap-6 items-start">
      <div className="flex-1 min-w-0 space-y-4">
          <div className="space-y-4">
            {state.crDays.map((day, dayIndex) => (
              <div key={dayIndex} className={`rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl${showCloneFor === dayIndex ? " relative z-[60]" : ""}`}>

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
                  {state.crDays.length > 1 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCloneFor(showCloneFor === dayIndex ? null : dayIndex)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 text-[11px] font-medium text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                        </svg>
                        Copiar a...
                      </button>
                      {showCloneFor === dayIndex && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCloneFor(null)} />
                          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-white/[0.08] bg-[#0E0E18]/95 backdrop-blur-xl shadow-xl overflow-hidden">
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Copiar a:</p>
                            {state.crDays.map((td, ti) => {
                              if (ti === dayIndex) return null;
                              return (
                                <button
                                  key={ti}
                                  type="button"
                                  onClick={() => {
                                    dispatch({ type: "CR_CLONE_DAY", fromIndex: dayIndex, toIndex: ti });
                                    setShowCloneFor(null);
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
                    {day.meals.map((meal, mealIndex) => {
                      const totals = getMealTotals(meal.foods);
                      return (
                        <div
                          key={mealIndex}
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
                              {/* Cheat meal toggle — all meal types */}
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
                              {/* Remove snack button — only for snack slots */}
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
                            foods={state.foods}
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
                    })}

                    {/* + Añadir Snack — always visible at the bottom of each day */}
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
            ))}
          </div>

          {/* Week navigation */}
          {state.crMesocycleWeeks > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "CR_PREV_WEEK" })}
                disabled={state.crCurrentWeek <= 1}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                Semana anterior
              </button>
              <span className="text-[12px] font-semibold text-[#5A5A72]">
                Semana {state.crCurrentWeek} / {state.crMesocycleWeeks}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: "CR_NEXT_WEEK" })}
                disabled={state.crCurrentWeek >= state.crMesocycleWeeks}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Semana siguiente
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            {state.crMesocycleWeeks > 1 && (
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "CR_CLONE_WEEK_TO_REST" });
                  toast.success(`Menu de semana ${state.crCurrentWeek} copiado al resto de semanas`);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-5 py-2.5 text-[13px] font-semibold text-[#00E5FF] transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
                Copiar menu al resto de semanas
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("Nombre para guardar este menu:");
                if (name) handleSaveTemplate(name);
              }}
              disabled={state.crSavingTemplate}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-5 py-2.5 text-[13px] font-semibold text-[#7C3AED] transition-all hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/20 disabled:opacity-50"
            >
              {state.crSavingTemplate ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  Guardar menu
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSendMenu}
              disabled={state.crSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#00C853] px-6 py-2.5 text-[13px] font-bold text-[#0A0A0F] transition-all hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)] disabled:opacity-50"
            >
              {state.crSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                  Enviar al cliente
                </>
              )}
            </button>
          </div>
        </div>

      {/* ── Sticky info panel (right column) ── */}
      <div ref={panelRef} className="hidden lg:block w-72 shrink-0">
          <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5 space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#00E5FF]">Info nutricional</h4>

            {/* Kcal */}
            <MacroRow
              label="Calorías / día"
              color="#00E5FF"
              actual={dailyTotals.kcal}
              target={targetKcal}
              unit="kcal"
              delta={deltaKcal}
              pctActual={null}
              pctTarget={null}
            />

            <div className="h-px bg-white/[0.06]" />

            {/* Protein */}
            <MacroRow
              label="Proteína"
              color="#00C853"
              actual={dailyTotals.protein}
              target={targetProteinG}
              unit="g"
              delta={deltaProtein}
              pctActual={actualProteinPct}
              pctTarget={weekTarget.proteinPct}
            />

            {/* Carbs */}
            <MacroRow
              label="Carbohidratos"
              color="#FF9100"
              actual={dailyTotals.carbs}
              target={targetCarbsG}
              unit="g"
              delta={deltaCarbs}
              pctActual={actualCarbsPct}
              pctTarget={weekTarget.carbsPct}
            />

            {/* Fat */}
            <MacroRow
              label="Grasas"
              color="#7C3AED"
              actual={dailyTotals.fat}
              target={targetFatG}
              unit="g"
              delta={deltaFat}
              pctActual={actualFatPct}
              pctTarget={weekTarget.fatPct}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable macro row for the sidebar */
