"use client";

import { toast } from "sonner";
import type { useNutritionPage } from "../useNutritionPage";

type NutritionHook = ReturnType<typeof useNutritionPage>;

/* ── Compact week navigation (arrows + label) ── */

interface WeekNavProps {
  currentWeek: number;
  totalWeeks: number;
  dispatch: NutritionHook["dispatch"];
}

export function WeekNavigationCompact({ currentWeek, totalWeeks, dispatch }: WeekNavProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => dispatch({ type: "CR_PREV_WEEK" })}
        disabled={currentWeek <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span className="text-[13px] font-semibold text-white">
        Semana {currentWeek} <span className="text-[#5A5A72]">/ {totalWeeks}</span>
      </span>
      <button
        type="button"
        onClick={() => dispatch({ type: "CR_NEXT_WEEK" })}
        disabled={currentWeek >= totalWeeks}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

/* ── Full-width week navigation (bottom) ── */

export function WeekNavigationFull({ currentWeek, totalWeeks, dispatch }: WeekNavProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        onClick={() => dispatch({ type: "CR_PREV_WEEK" })}
        disabled={currentWeek <= 1}
        className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Semana anterior
      </button>
      <span className="text-[12px] font-semibold text-[#5A5A72]">
        Semana {currentWeek} / {totalWeeks}
      </span>
      <button
        type="button"
        onClick={() => dispatch({ type: "CR_NEXT_WEEK" })}
        disabled={currentWeek >= totalWeeks}
        className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Semana siguiente
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

/* ── Send / save / clone-week action buttons ── */

interface ActionButtonsProps {
  state: NutritionHook["state"];
  dispatch: NutritionHook["dispatch"];
  handleSendMenu: NutritionHook["handleSendMenu"];
  handleSaveTemplate: NutritionHook["handleSaveTemplate"];
}

export function MenuActionButtons({ state, dispatch, handleSendMenu, handleSaveTemplate }: ActionButtonsProps) {
  return (
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
  );
}
