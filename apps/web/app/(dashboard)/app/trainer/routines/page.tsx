"use client";

import { useRoutinesPage } from "./useRoutinesPage";
import RoutineList from "./components/RoutineList";
import RoutineEditor from "./components/RoutineEditor";
import ExerciseLibraryTab from "./components/ExerciseLibraryTab";

/* ────────────────────────────────────────────
   Trainer Routines Page — Orchestrator
   ──────────────────────────────────────────── */

export default function TrainerRoutinesPage() {
  const { state, dispatch, weekDates, totalSets, handleSave, handleSaveTemplate } = useRoutinesPage();

  /* ── Loading ── */
  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  /* ── Error ── */
  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/05 px-4 py-3">
          <p className="text-[13px] text-[#FF1744]">{state.error}</p>
        </div>
      </div>
    );
  }

  /* ── Creator (full-screen, no tabs) ── */
  if (state.showCreator) {
    return (
      <RoutineEditor
        state={state}
        dispatch={dispatch}
        weekDates={weekDates}
        totalSets={totalSets}
        handleSave={handleSave}
        handleSaveTemplate={handleSaveTemplate}
      />
    );
  }

  /* ── List + Library ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">Entrenamiento</p>
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">Rutinas</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[14px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-1">
        {(["rutinas", "ejercicios"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => dispatch({ type: "SET_TAB", tab })}
            className={`flex-1 flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-all ${
              state.activeTab === tab
                ? tab === "rutinas"
                  ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                  : "bg-[#7C3AED]/10 text-[#7C3AED]"
                : "text-[#8B8BA3] hover:text-white"
            }`}
          >
            {tab === "rutinas" ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0L22 16.5l-9.75 5.25L2.25 16.5l4.179-2.25" />
                </svg>
                Rutinas
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Mi Biblioteca de Ejercicios
              </>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {state.activeTab === "rutinas" && (
        <RoutineList
          templates={state.templates}
          onNewRoutine={() => dispatch({ type: "SHOW_CREATOR" })}
        />
      )}

      {state.activeTab === "ejercicios" && (
        <ExerciseLibraryTab />
      )}
    </div>
  );
}
