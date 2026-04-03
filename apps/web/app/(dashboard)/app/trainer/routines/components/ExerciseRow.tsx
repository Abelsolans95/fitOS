"use client";

import { type Dispatch, memo, useState } from "react";
import { createPortal } from "react-dom";
import {
  type RoutineExercise,
  type SetConfig,
  buildScheme,
} from "../types";
import { type RoutinesAction } from "../useRoutinesPage";
import { NumField } from "./NumField";
import WeeklyConfigModal from "./WeeklyConfigModal";

/* ────────────────────────────────────────────
   ExerciseRow — Single exercise within a day
   ──────────────────────────────────────────── */

interface ExerciseRowProps {
  dayKey: string;
  exercise: RoutineExercise;
  exIndex: number;
  isFirst: boolean;
  isLast: boolean;
  mesocycleWeeks: number;
  dispatch: Dispatch<RoutinesAction>;
}

export const ExerciseRow = memo(function ExerciseRow({
  dayKey,
  exercise,
  exIndex,
  isFirst,
  isLast,
  mesocycleWeeks,
  dispatch,
}: ExerciseRowProps) {
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  const update = (updates: Partial<RoutineExercise>) =>
    dispatch({ type: "CR_UPDATE_EXERCISE", dayKey, exIndex, updates });

  const updateSet = (setIndex: number, updates: Partial<SetConfig>) =>
    dispatch({ type: "CR_UPDATE_SET_CONFIG", dayKey, exIndex, setIndex, updates });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
            {exIndex + 1}
          </span>
          <p className="text-[13px] font-medium text-white">{exercise.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "CR_MOVE_EXERCISE", dayKey, exIndex, direction: -1 })}
            disabled={isFirst}
            className="flex h-6 w-6 items-center justify-center rounded text-[#5A5A72] transition-colors hover:text-white disabled:opacity-30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "CR_MOVE_EXERCISE", dayKey, exIndex, direction: 1 })}
            disabled={isLast}
            className="flex h-6 w-6 items-center justify-center rounded text-[#5A5A72] transition-colors hover:text-white disabled:opacity-30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "CR_REMOVE_EXERCISE", dayKey, exIndex })}
            className="flex h-6 w-6 items-center justify-center rounded text-[#5A5A72] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex overflow-hidden rounded-lg border border-white/[0.06]">
        <button
          type="button"
          onClick={() => update({ mode: "equal" })}
          className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors ${
            exercise.mode === "equal"
              ? "bg-[#00E5FF] text-[#0A0A0F]"
              : "text-[#5A5A72] hover:text-white"
          }`}
        >
          Todas las series igual
        </button>
        <button
          type="button"
          onClick={() => update({ mode: "different" })}
          className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors ${
            exercise.mode === "different"
              ? "bg-[#00E5FF] text-[#0A0A0F]"
              : "text-[#5A5A72] hover:text-white"
          }`}
        >
          Series diferentes
        </button>
      </div>

      {/* Esquema auto-generado + botón semanas */}
      {(exercise.mode === "equal" || exercise.sets_config.length > 0) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Esquema:</span>
            <span className="text-[11px] font-bold text-[#00E5FF]">{buildScheme(exercise)}</span>
          </div>
          {mesocycleWeeks > 1 && (
            <button
              type="button"
              onClick={() => setShowWeeklyModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/5 px-3 py-1.5 text-[10px] font-semibold text-[#7C3AED] transition-all hover:bg-[#7C3AED]/10 hover:border-[#7C3AED]/50"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {exercise.weekly_config && Object.keys(exercise.weekly_config).length > 0
                ? "Progresión semanal configurada"
                : "Configurar por semanas"}
            </button>
          )}
        </div>
      )}

      {/* EQUAL MODE */}
      {exercise.mode === "equal" && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          <NumField label="Series" value={exercise.sets} min={1} max={20}
            onChange={(v) => update({ sets: v || 1 })} />
          <NumField label="Reps mín" value={exercise.reps_min} min={1}
            onChange={(v) => update({ reps_min: v || 1 })} />
          <NumField label="Reps máx" value={exercise.reps_max} min={1}
            onChange={(v) => update({ reps_max: v || 1 })} />
          <NumField label="RIR" value={exercise.rir} min={0} max={5}
            onChange={(v) => update({ rir: v || 0 })} />
          <NumField label="RPE obj." value={exercise.target_rpe ?? ""} min={1} max={10}
            placeholder="—"
            onChange={(v) => update({ target_rpe: v === "" ? null : Number(v) })} />
          <NumField label="Carga (kg)" value={exercise.target_weight ?? ""} min={0} step={0.5}
            placeholder="—"
            onChange={(v) => update({ target_weight: v === "" ? null : Number(v) })} />
          <NumField label="Desc. (s)" value={exercise.rest_s} min={0} step={15}
            onChange={(v) => update({ rest_s: v || 0 })} />
        </div>
      )}

      {/* DIFFERENT MODE */}
      {exercise.mode === "different" && (
        <DifferentModeGrid
          exercise={exercise}
          dayKey={dayKey}
          exIndex={exIndex}
          updateSet={updateSet}
          dispatch={dispatch}
        />
      )}

      {/* Progression Rule */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
          Cómo progresar
        </label>
        <input
          type="text"
          value={exercise.progression_rule}
          onChange={(e) => update({ progression_rule: e.target.value })}
          placeholder="Ej: Al llegar a 12 en la 1ª, añadir mínima carga posible"
          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl px-3 text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
        />
      </div>

      {/* Coach Notes */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
          Notas coach
        </label>
        <input
          type="text"
          value={exercise.coach_notes}
          onChange={(e) => update({ coach_notes: e.target.value })}
          placeholder="Instrucciones técnicas para el cliente"
          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl px-3 text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
        />
      </div>

      {/* Weekly config modal — portal to escape overflow-hidden parent */}
      {showWeeklyModal && createPortal(
        <WeeklyConfigModal
          exercise={exercise}
          mesocycleWeeks={mesocycleWeeks}
          onSave={(weeklyConfig) => {
            dispatch({ type: "CR_UPDATE_WEEKLY_CONFIG", dayKey, exIndex, weeklyConfig });
            setShowWeeklyModal(false);
          }}
          onClose={() => setShowWeeklyModal(false)}
        />,
        document.body
      )}
    </div>
  );
});

/* ────────────────────────────────────────────
   DifferentModeGrid — per-set config grid
   ──────────────────────────────────────────── */

function DifferentModeGrid({
  exercise,
  dayKey,
  exIndex,
  updateSet,
  dispatch,
}: {
  exercise: RoutineExercise;
  dayKey: string;
  exIndex: number;
  updateSet: (setIndex: number, updates: Partial<SetConfig>) => void;
  dispatch: Dispatch<RoutinesAction>;
}) {
  const update = (updates: Partial<RoutineExercise>) =>
    dispatch({ type: "CR_UPDATE_EXERCISE", dayKey, exIndex, updates });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72] whitespace-nowrap">
          Número de series
        </label>
        <input
          type="number" min={1} max={20}
          value={exercise.sets}
          onChange={(e) => update({ sets: Math.max(1, Number(e.target.value) || 1) })}
          className="h-7 w-16 rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
        />
      </div>

      {exercise.sets_config.length > 0 && (
        <div className="space-y-1.5">
          {/* Header */}
          <div className="grid gap-1.5 px-1" style={{ gridTemplateColumns: "minmax(0,1fr) repeat(6,minmax(0,1fr)) 60px" }}>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Serie</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps mín</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps máx</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#00E5FF]">RIR</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#FF9100]">RPE</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Carga (kg)</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Desc. (s)</span>
            <span />
          </div>
          {exercise.sets_config.map((sc, setIdx) => {
            const isDeriv = sc.set_type === "rest_pause" || sc.set_type === "drop_set";
            const isRP = sc.set_type === "rest_pause";
            const isDS = sc.set_type === "drop_set";
            let normalNum = 0;
            for (let k = 0; k <= setIdx; k++) {
              const t = exercise.sets_config[k].set_type;
              if (!t || t === "normal") normalNum++;
            }
            return (
              <div key={setIdx} className={`grid gap-1.5 rounded-lg px-1 py-1.5 ${isDeriv ? "ml-6 border-l-2" : "bg-white/[0.04]"} ${isRP ? "border-[#FF9100]/40 bg-[#FF9100]/[0.04]" : ""} ${isDS ? "border-[#7C3AED]/40 bg-[#7C3AED]/[0.04]" : ""}`} style={{ gridTemplateColumns: "minmax(0,1fr) repeat(6,minmax(0,1fr)) 60px" }}>
                <div className="flex items-center gap-1">
                  {isDeriv ? (
                    <span className={`flex h-5 items-center justify-center rounded px-1.5 text-[9px] font-bold ${isRP ? "bg-[#FF9100]/10 text-[#FF9100]" : "bg-[#7C3AED]/10 text-[#7C3AED]"}`}>
                      {isRP ? "RP" : "DS"}
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                      {normalNum}
                    </span>
                  )}
                </div>
                <input type="number" min={1} value={sc.reps_min}
                  onChange={(e) => updateSet(setIdx, { reps_min: Number(e.target.value) || 1 })}
                  className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40" />
                <input type="number" min={1} value={sc.reps_max}
                  onChange={(e) => updateSet(setIdx, { reps_max: Number(e.target.value) || 1 })}
                  className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40" />
                <input type="number" min={0} max={5} value={sc.rir}
                  onChange={(e) => updateSet(setIdx, { rir: Number(e.target.value) || 0 })}
                  className="h-7 w-full rounded border border-[#00E5FF]/20 bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-[#00E5FF] outline-none focus:border-[#00E5FF]/40" />
                <input type="number" min={1} max={10} value={sc.target_rpe ?? ""}
                  onChange={(e) => updateSet(setIdx, { target_rpe: e.target.value ? Number(e.target.value) : null })}
                  placeholder="—"
                  className="h-7 w-full rounded border border-[#FF9100]/20 bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-[#FF9100] placeholder:text-[#5A5A72] outline-none focus:border-[#FF9100]/40" />
                <input type="number" min={0} step={0.5} value={sc.target_weight ?? ""}
                  onChange={(e) => updateSet(setIdx, { target_weight: e.target.value ? Number(e.target.value) : null })}
                  placeholder="—"
                  className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40" />
                <input type="number" min={0} step={15} value={sc.rest_s}
                  onChange={(e) => updateSet(setIdx, { rest_s: Number(e.target.value) || 0 })}
                  className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40" />
                <div className="flex items-center gap-0.5">
                  {isDeriv ? (
                    <button type="button" title="Eliminar"
                      onClick={() => dispatch({ type: "CR_REMOVE_DERIVATIVE_SET", dayKey, exIndex, setIndex: setIdx })}
                      className="flex h-5 w-5 items-center justify-center rounded text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  ) : (
                    <>
                      <button type="button" title="Añadir Rest-Pause"
                        onClick={() => dispatch({ type: "CR_ADD_DERIVATIVE_SET", dayKey, exIndex, afterSetIndex: setIdx, setType: "rest_pause" })}
                        className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#FF9100] hover:bg-[#FF9100]/10 transition-colors"
                      >RP</button>
                      <button type="button" title="Añadir Drop Set"
                        onClick={() => dispatch({ type: "CR_ADD_DERIVATIVE_SET", dayKey, exIndex, afterSetIndex: setIdx, setType: "drop_set" })}
                        className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
                      >DS</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
