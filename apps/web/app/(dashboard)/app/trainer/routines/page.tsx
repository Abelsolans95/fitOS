"use client";

import { useRoutinesPage } from "./useRoutinesPage";
import RoutineList from "./components/RoutineList";
import RoutineEditor from "./components/RoutineEditor";

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

  /* ── Creator ── */
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

  /* ── List ── */
  return (
    <RoutineList
      routines={state.routines}
      onNewRoutine={() => dispatch({ type: "SHOW_CREATOR" })}
    />
  );
}
