"use client";

import { type Dispatch } from "react";
import {
  type TrainingDay,
  type SetConfig,
  type RoutineExercise,
  DAYS_OF_WEEK,
  buildScheme,
} from "../types";
import { type RoutinesAction } from "../useRoutinesPage";

/* ────────────────────────────────────────────
   DaySchedule — Single training day card
   ──────────────────────────────────────────── */

interface DayScheduleProps {
  day: TrainingDay;
  totalSets: number;
  dateStr?: string;
  dispatch: Dispatch<RoutinesAction>;
}

export default function DaySchedule({
  day,
  totalSets,
  dateStr,
  dispatch,
}: DayScheduleProps) {
  const dayInfo = DAYS_OF_WEEK.find((d) => d.key === day.key);

  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00E5FF]/10">
            <span className="text-[11px] font-bold text-[#00E5FF]">
              {dayInfo?.short}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white">
                {day.dayLabel || day.label}
              </span>
              {dateStr && (
                <span className="text-[11px] text-[#5A5A72]">{dateStr}</span>
              )}
            </div>
            <span className="text-[10px] text-[#5A5A72]">
              {day.exercises.length} ejercicios · {totalSets} series totales
            </span>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 py-3 space-y-3">
        {day.exercises.length === 0 && (
          <p className="py-6 text-center text-[11px] text-[#5A5A72]">
            Sin ejercicios — añade el primero
          </p>
        )}

        {day.exercises.map((exercise, exIndex) => (
          <ExerciseRow
            key={`${exercise.exercise_id}-${exIndex}`}
            dayKey={day.key}
            exercise={exercise}
            exIndex={exIndex}
            isFirst={exIndex === 0}
            isLast={exIndex === day.exercises.length - 1}
            dispatch={dispatch}
          />
        ))}

        {/* Add exercise button */}
        <button
          type="button"
          onClick={() => dispatch({ type: "CR_OPEN_SEARCH_MODAL", dayKey: day.key })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-[11px] font-medium text-[#8B8BA3] transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5 hover:text-[#00E5FF]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir ejercicio
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   ExerciseRow — Single exercise within a day
   ──────────────────────────────────────────── */

interface ExerciseRowProps {
  dayKey: string;
  exercise: RoutineExercise;
  exIndex: number;
  isFirst: boolean;
  isLast: boolean;
  dispatch: Dispatch<RoutinesAction>;
}

function ExerciseRow({
  dayKey,
  exercise,
  exIndex,
  isFirst,
  isLast,
  dispatch,
}: ExerciseRowProps) {
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

      {/* Esquema auto-generado */}
      {(exercise.mode === "equal" || exercise.sets_config.length > 0) && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Esquema:</span>
          <span className="text-[11px] font-bold text-[#00E5FF]">{buildScheme(exercise)}</span>
        </div>
      )}

      {/* EQUAL MODE */}
      {exercise.mode === "equal" && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <NumField label="Series" value={exercise.sets} min={1} max={20}
            onChange={(v) => update({ sets: v || 1 })} />
          <NumField label="Reps mín" value={exercise.reps_min} min={1}
            onChange={(v) => update({ reps_min: v || 1 })} />
          <NumField label="Reps máx" value={exercise.reps_max} min={1}
            onChange={(v) => update({ reps_max: v || 1 })} />
          <NumField label="RIR" value={exercise.rir} min={0} max={5}
            onChange={(v) => update({ rir: v || 0 })} />
          <NumField label="Carga (kg)" value={exercise.target_weight ?? ""} min={0} step={0.5}
            placeholder="—"
            onChange={(v) => update({ target_weight: v === "" ? null : Number(v) })} />
          <NumField label="Desc. (s)" value={exercise.rest_s} min={0} step={15}
            onChange={(v) => update({ rest_s: v || 0 })} />
        </div>
      )}

      {/* DIFFERENT MODE */}
      {exercise.mode === "different" && (
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
              <div className="grid grid-cols-6 gap-1.5 px-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Serie</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps mín</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps máx</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">RIR</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Carga (kg)</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Desc. (s)</span>
              </div>
              {exercise.sets_config.map((sc, setIdx) => (
                <div key={setIdx} className="grid grid-cols-6 gap-1.5 rounded-lg bg-white/[0.04] px-1 py-1.5">
                  <div className="flex items-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                      {setIdx + 1}
                    </span>
                  </div>
                  <input type="number" min={1} value={sc.reps_min}
                    onChange={(e) => updateSet(setIdx, { reps_min: Number(e.target.value) || 1 })}
                    className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40" />
                  <input type="number" min={1} value={sc.reps_max}
                    onChange={(e) => updateSet(setIdx, { reps_max: Number(e.target.value) || 1 })}
                    className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40" />
                  <input type="number" min={0} max={5} value={sc.rir}
                    onChange={(e) => updateSet(setIdx, { rir: Number(e.target.value) || 0 })}
                    className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40" />
                  <input type="number" min={0} step={0.5} value={sc.target_weight ?? ""}
                    onChange={(e) => updateSet(setIdx, { target_weight: e.target.value ? Number(e.target.value) : null })}
                    placeholder="—"
                    className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40" />
                  <input type="number" min={0} step={15} value={sc.rest_s}
                    onChange={(e) => updateSet(setIdx, { rest_s: Number(e.target.value) || 0 })}
                    className="h-7 w-full rounded border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40" />
                </div>
              ))}
            </div>
          )}
        </div>
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
    </div>
  );
}

/* ────────────────────────────────────────────
   NumField — DRY helper for number inputs
   (equal mode has 6 identical-styled inputs)
   ──────────────────────────────────────────── */

function NumField({
  label,
  value,
  min,
  max,
  step,
  placeholder,
  onChange,
}: {
  label: string;
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  onChange: (v: number | "") => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? "" : Number(raw));
        }}
        placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl px-2 text-center text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
      />
    </div>
  );
}
