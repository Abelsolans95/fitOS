"use client";

import { toast } from "sonner";
import {
  getWeekTarget,
  DAYS_OF_WEEK,
  type useNutritionPage,
} from "../useNutritionPage";
import { DarkSelect } from "@/components/ui/DarkSelect";
import { FoodPreferencesCard } from "./FoodPreferencesCard";

type NutritionHook = ReturnType<typeof useNutritionPage>;

interface MenuConfigCardProps {
  state: NutritionHook["state"];
  dispatch: NutritionHook["dispatch"];
  selectedClient: NutritionHook["selectedClient"];
  weekTarget: ReturnType<typeof getWeekTarget>;
  macroSumOk: boolean;
}

export function MenuConfigCard({
  state,
  dispatch,
  selectedClient,
  weekTarget,
  macroSumOk,
}: MenuConfigCardProps) {
  return (
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

      {/* Main meals */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
          Comidas principales
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[3, 4, 5].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => dispatch({ type: "CR_SET_MAIN_MEALS", count })}
              className={`rounded-xl border px-4 py-3 text-[13px] font-semibold transition-all ${
                state.crMainMeals === count
                  ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                  : "border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] hover:border-white/[0.15] hover:text-white"
              }`}
            >
              {count} comidas
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
          {[0, 1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => dispatch({ type: "CR_SET_SNACKS_PER_DAY", count })}
              className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                state.crSnacksPerDay === count
                  ? "border-[#FF9100]/50 bg-[#FF9100]/10 text-[#FF9100]"
                  : "border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] hover:border-white/[0.15] hover:text-white"
              }`}
            >
              <span className="block text-[15px] font-bold">{count}</span>
              <span className="block text-[10px] opacity-70">{count === 1 ? "snack" : "snacks"}</span>
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
  );
}
