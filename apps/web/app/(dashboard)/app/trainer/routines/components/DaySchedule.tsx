"use client";

import { type Dispatch, useState } from "react";
import { createPortal } from "react-dom";
import {
  type TrainingDay,
  type SetConfig,
  type RoutineExercise,
  type WeekConfig,
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
  mesocycleWeeks: number;
  dispatch: Dispatch<RoutinesAction>;
}

export default function DaySchedule({
  day,
  totalSets,
  dateStr,
  mesocycleWeeks,
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
            mesocycleWeeks={mesocycleWeeks}
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
  mesocycleWeeks: number;
  dispatch: Dispatch<RoutinesAction>;
}

function ExerciseRow({
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

/* ────────────────────────────────────────────
   WeeklyConfigModal — Per-week progression
   ──────────────────────────────────────────── */

type EqualField = { key: "sets" | "reps_min" | "reps_max" | "rir" | "target_rpe" | "target_weight" | "rest_s"; label: string; min: number; max?: number; step?: number; nullable?: boolean };
type SetField   = { key: "reps_min" | "reps_max" | "rir" | "target_rpe" | "target_weight" | "rest_s"; label: string; min: number; max?: number; step?: number; nullable?: boolean };

const EQUAL_FIELDS: EqualField[] = [
  { key: "sets", label: "Series", min: 1, max: 20 },
  { key: "reps_min", label: "Reps mín", min: 1 },
  { key: "reps_max", label: "Reps máx", min: 1 },
  { key: "rir", label: "RIR", min: 0, max: 5 },
  { key: "target_rpe", label: "RPE", min: 1, max: 10, nullable: true },
  { key: "target_weight", label: "Carga (kg)", min: 0, step: 0.5, nullable: true },
  { key: "rest_s", label: "Desc. (s)", min: 0, step: 15 },
];

const SET_FIELDS: SetField[] = [
  { key: "reps_min", label: "Reps mín", min: 1 },
  { key: "reps_max", label: "Reps máx", min: 1 },
  { key: "rir", label: "RIR", min: 0, max: 5 },
  { key: "target_rpe", label: "RPE", min: 1, max: 10, nullable: true },
  { key: "target_weight", label: "Carga (kg)", min: 0, step: 0.5, nullable: true },
  { key: "rest_s", label: "Desc. (s)", min: 0, step: 15 },
];

function buildDefaultWeek(exercise: RoutineExercise): WeekConfig {
  const base: WeekConfig = {
    sets: exercise.sets,
    reps_min: exercise.reps_min,
    reps_max: exercise.reps_max,
    rir: exercise.rir,
    target_weight: exercise.target_weight,
    rest_s: exercise.rest_s,
    target_rpe: exercise.target_rpe ?? null,
  };
  if (exercise.mode === "different") {
    base.sets_detail = exercise.sets_config.length > 0
      ? exercise.sets_config.map((sc) => ({ ...sc }))
      : Array.from({ length: exercise.sets }, () => ({
          reps_min: exercise.reps_min,
          reps_max: exercise.reps_max,
          rir: exercise.rir,
          target_weight: exercise.target_weight,
          rest_s: exercise.rest_s,
          target_rpe: exercise.target_rpe ?? null,
        }));
  }
  return base;
}

function WeeklyConfigModal({
  exercise,
  mesocycleWeeks,
  onSave,
  onClose,
}: {
  exercise: RoutineExercise;
  mesocycleWeeks: number;
  onSave: (weeklyConfig: Record<number, WeekConfig>) => void;
  onClose: () => void;
}) {
  const isDifferent = exercise.mode === "different";

  const [weeks, setWeeks] = useState<Record<number, WeekConfig>>(() => {
    const init: Record<number, WeekConfig> = {};
    for (let w = 1; w <= mesocycleWeeks; w++) {
      const existing = exercise.weekly_config?.[w];
      if (existing) {
        // Ensure sets_detail exists for different mode
        if (isDifferent && !existing.sets_detail) {
          init[w] = { ...existing, sets_detail: buildDefaultWeek(exercise).sets_detail };
        } else {
          init[w] = { ...existing };
        }
      } else {
        init[w] = buildDefaultWeek(exercise);
      }
    }
    return init;
  });

  const updateWeekField = (week: number, field: keyof WeekConfig, value: number | string | null) => {
    setWeeks((prev) => ({
      ...prev,
      [week]: { ...prev[week], [field]: value },
    }));
  };

  const updateSetDetail = (week: number, setIdx: number, field: keyof SetConfig, value: number | null) => {
    setWeeks((prev) => {
      const wk = prev[week];
      const detail = [...(wk.sets_detail ?? [])];
      detail[setIdx] = { ...detail[setIdx], [field]: value };
      return { ...prev, [week]: { ...wk, sets_detail: detail } };
    });
  };

  const updateWeekSets = (week: number, newSets: number) => {
    setWeeks((prev) => {
      const wk = prev[week];
      const oldDetail = wk.sets_detail ?? [];
      // Only count normal sets for resize logic
      const normalSets = oldDetail.filter((s) => !s.set_type || s.set_type === "normal");
      const currentNormalCount = normalSets.length;
      let detail: SetConfig[];
      if (newSets > currentNormalCount) {
        // Add new normal sets at the end
        const template = normalSets.length > 0
          ? normalSets[normalSets.length - 1]
          : { reps_min: exercise.reps_min, reps_max: exercise.reps_max, rir: exercise.rir, target_weight: exercise.target_weight, rest_s: exercise.rest_s, target_rpe: exercise.target_rpe ?? null };
        detail = [...oldDetail, ...Array.from({ length: newSets - currentNormalCount }, () => ({ ...template, set_type: undefined }))];
      } else {
        // Remove normal sets from the end (keep derivatives attached to remaining normals)
        let removed = 0;
        detail = [];
        for (const s of oldDetail) {
          const isNormal = !s.set_type || s.set_type === "normal";
          if (isNormal && removed >= newSets) continue; // skip excess normals
          detail.push(s);
          if (isNormal) removed++;
        }
      }
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  const addWeekDerivativeSet = (week: number, afterSetIdx: number, setType: "rest_pause" | "drop_set") => {
    setWeeks((prev) => {
      const wk = prev[week];
      const detail = [...(wk.sets_detail ?? [])];
      const source = detail[afterSetIdx];
      const newSet: SetConfig = {
        reps_min: source.reps_min,
        reps_max: source.reps_max,
        rir: source.rir,
        target_weight: setType === "drop_set" ? (source.target_weight ? Math.round(source.target_weight * 0.8 * 10) / 10 : null) : source.target_weight,
        rest_s: setType === "rest_pause" ? 15 : 0,
        target_rpe: source.target_rpe,
        set_type: setType,
      };
      detail.splice(afterSetIdx + 1, 0, newSet);
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  const removeWeekDerivativeSet = (week: number, setIdx: number) => {
    setWeeks((prev) => {
      const wk = prev[week];
      const detail = (wk.sets_detail ?? []).filter((_, i) => i !== setIdx);
      // If no derivatives remain, collapse back to scalar (equal mode)
      const hasDerivatives = detail.some((s) => s.set_type && s.set_type !== "normal");
      if (!isDifferent && !hasDerivatives) {
        return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: undefined } };
      }
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  /** In equal mode, expand scalar values into sets_detail and add a derivative set */
  const expandEqualAndAddDerivative = (week: number, setType: "rest_pause" | "drop_set") => {
    setWeeks((prev) => {
      const wk = prev[week];
      const count = wk.sets || exercise.sets;
      const normalSet: SetConfig = {
        reps_min: wk.reps_min ?? exercise.reps_min,
        reps_max: wk.reps_max ?? exercise.reps_max,
        rir: wk.rir ?? exercise.rir,
        target_weight: wk.target_weight ?? exercise.target_weight,
        rest_s: wk.rest_s ?? exercise.rest_s,
        target_rpe: wk.target_rpe ?? exercise.target_rpe ?? null,
      };
      // Create N normal sets + 1 derivative after the last one
      const detail: SetConfig[] = Array.from({ length: count }, () => ({ ...normalSet }));
      const derivSet: SetConfig = {
        reps_min: normalSet.reps_min,
        reps_max: normalSet.reps_max,
        rir: normalSet.rir,
        target_weight: setType === "drop_set" ? (normalSet.target_weight ? Math.round(normalSet.target_weight * 0.8 * 10) / 10 : null) : normalSet.target_weight,
        rest_s: setType === "rest_pause" ? 15 : 0,
        target_rpe: normalSet.target_rpe,
        set_type: setType,
      };
      detail.push(derivSet);
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  const replicateFromWeek = (fromWeek: number) => {
    setWeeks((prev) => {
      const source = prev[fromWeek];
      const next = { ...prev };
      for (let w = fromWeek + 1; w <= mesocycleWeeks; w++) {
        next[w] = {
          ...source,
          sets_detail: source.sets_detail?.map((s) => ({ ...s })),
        };
      }
      return next;
    });
  };

  const handleReset = () => {
    const reset: Record<number, WeekConfig> = {};
    for (let w = 1; w <= mesocycleWeeks; w++) {
      reset[w] = buildDefaultWeek(exercise);
    }
    setWeeks(reset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#12121A] shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Progresión semanal</h2>
            <p className="text-[12px] text-[#8B8BA3] mt-0.5">
              {exercise.name} — {mesocycleWeeks} semanas
              {isDifferent && " · series diferentes"}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A5A72] transition-colors hover:bg-white/[0.06] hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto px-6 py-4 flex-1 space-y-0">
          {Array.from({ length: mesocycleWeeks }, (_, i) => i + 1).map((week) => (
            <div key={week}>
              {/* Week separator */}
              <div className="flex items-center gap-3 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[11px] font-bold text-[#7C3AED]">
                  {week}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7C3AED]/70">
                  Semana {week}
                </span>
                <div className="flex-1 h-px bg-[#7C3AED]/20" />
              </div>

              {/* EQUAL MODE — scalar row OR expanded per-set view if has derivatives */}
              {!isDifferent && (() => {
                const weekHasDetail = (weeks[week]?.sets_detail?.length ?? 0) > 0;
                return weekHasDetail ? (
                  /* Expanded per-set view (equal mode with derivatives) */
                  <div className="pb-2 space-y-1">
                    <div className="flex items-center gap-3 mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72] whitespace-nowrap">
                        Series
                      </label>
                      <input
                        type="number" min={1} max={20}
                        value={weeks[week]?.sets_detail?.filter((s) => !s.set_type || s.set_type === "normal").length ?? weeks[week]?.sets ?? exercise.sets}
                        onChange={(e) => updateWeekSets(week, Math.max(1, Number(e.target.value) || 1))}
                        className="h-7 w-14 rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 px-2 text-center text-[11px] text-white outline-none focus:border-[#7C3AED]/40"
                      />
                    </div>
                    {week === 1 && (
                      <div className="grid grid-cols-[40px_repeat(6,1fr)_52px] gap-1.5 px-1 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Serie</span>
                        {SET_FIELDS.map((f) => (
                          <span key={f.key} className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] ${f.key === "rir" ? "text-[#00E5FF]" : f.key === "target_rpe" ? "text-[#FF9100]" : "text-[#5A5A72]"}`}>
                            {f.label}
                          </span>
                        ))}
                        <span />
                      </div>
                    )}
                    {(weeks[week]?.sets_detail ?? []).map((sc, setIdx) => {
                      const isDerivSet = sc.set_type === "rest_pause" || sc.set_type === "drop_set";
                      const isRPSet = sc.set_type === "rest_pause";
                      const isDSSet = sc.set_type === "drop_set";
                      let normalNum = 0;
                      if (!isDerivSet) {
                        for (let k = 0; k <= setIdx; k++) {
                          const t = (weeks[week]?.sets_detail ?? [])[k]?.set_type;
                          if (!t || t === "normal") normalNum++;
                        }
                      }
                      return (
                        <div key={setIdx} className={`grid grid-cols-[40px_repeat(6,1fr)_52px] gap-1.5 rounded-lg px-1 py-1.5 ${isDerivSet ? "ml-6 border-l-2" : "bg-white/[0.02]"} ${isRPSet ? "border-[#FF9100]/40 bg-[#FF9100]/[0.04]" : ""} ${isDSSet ? "border-[#7C3AED]/40 bg-[#7C3AED]/[0.04]" : ""}`}>
                          <div className="flex items-center justify-center">
                            {isDerivSet ? (
                              <span className={`flex h-5 items-center justify-center rounded px-1.5 text-[9px] font-bold ${isRPSet ? "bg-[#FF9100]/10 text-[#FF9100]" : "bg-[#7C3AED]/10 text-[#7C3AED]"}`}>
                                {isRPSet ? "RP" : "DS"}
                              </span>
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                                {normalNum}
                              </span>
                            )}
                          </div>
                          {SET_FIELDS.map((f) => (
                            <input
                              key={f.key}
                              type="number"
                              min={f.min} max={f.max} step={f.step}
                              value={sc[f.key] ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                updateSetDetail(week, setIdx, f.key, f.nullable && raw === "" ? null : Number(raw) || 0);
                              }}
                              placeholder={f.nullable ? "—" : undefined}
                              className={`h-7 w-full rounded border bg-[#0E0E18]/60 px-1 text-center text-[11px] placeholder:text-[#5A5A72] outline-none transition-colors ${f.key === "rir" ? "border-[#00E5FF]/20 text-[#00E5FF] focus:border-[#00E5FF]/40" : f.key === "target_rpe" ? "border-[#FF9100]/20 text-[#FF9100] focus:border-[#FF9100]/40" : "border-white/[0.06] text-white focus:border-[#7C3AED]/40"}`}
                            />
                          ))}
                          <div className="flex items-center gap-0.5">
                            {isDerivSet ? (
                              <button type="button" title="Eliminar"
                                onClick={() => removeWeekDerivativeSet(week, setIdx)}
                                className="flex h-5 w-5 items-center justify-center rounded text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            ) : (
                              <>
                                <button type="button" title="Añadir Rest-Pause"
                                  onClick={() => addWeekDerivativeSet(week, setIdx, "rest_pause")}
                                  className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#FF9100] hover:bg-[#FF9100]/10 transition-colors"
                                >RP</button>
                                <button type="button" title="Añadir Drop Set"
                                  onClick={() => addWeekDerivativeSet(week, setIdx, "drop_set")}
                                  className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
                                >DS</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Scalar view (default equal mode without derivatives) */
                  <div className="pb-2">
                    {week === 1 && (
                      <div className="grid grid-cols-[repeat(7,1fr)_52px] gap-1.5 px-1 mb-1.5">
                        {EQUAL_FIELDS.map((f) => (
                          <span key={f.key} className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] ${f.key === "rir" ? "text-[#00E5FF]" : f.key === "target_rpe" ? "text-[#FF9100]" : "text-[#5A5A72]"}`}>
                            {f.label}
                          </span>
                        ))}
                        <span />
                      </div>
                    )}
                    <div className="grid grid-cols-[repeat(7,1fr)_52px] gap-1.5 rounded-lg bg-white/[0.02] px-1 py-1.5">
                      {EQUAL_FIELDS.map((f) => (
                        <input
                          key={f.key}
                          type="number"
                          min={f.min} max={f.max} step={f.step}
                          value={weeks[week]?.[f.key] ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            updateWeekField(week, f.key, f.nullable && raw === "" ? null : Number(raw) || 0);
                          }}
                          placeholder={f.nullable ? "—" : undefined}
                          className={`h-8 w-full rounded-lg border bg-[#0E0E18]/60 px-2 text-center text-[11px] placeholder:text-[#5A5A72] outline-none transition-colors ${f.key === "rir" ? "border-[#00E5FF]/20 text-[#00E5FF] focus:border-[#00E5FF]/40" : f.key === "target_rpe" ? "border-[#FF9100]/20 text-[#FF9100] focus:border-[#FF9100]/40" : "border-white/[0.08] text-white focus:border-[#7C3AED]/40"}`}
                        />
                      ))}
                      <div className="flex items-center gap-0.5">
                        <button type="button" title="Añadir Rest-Pause"
                          onClick={() => expandEqualAndAddDerivative(week, "rest_pause")}
                          className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#FF9100] hover:bg-[#FF9100]/10 transition-colors"
                        >RP</button>
                        <button type="button" title="Añadir Drop Set"
                          onClick={() => expandEqualAndAddDerivative(week, "drop_set")}
                          className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
                        >DS</button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DIFFERENT MODE — one row per set */}
              {isDifferent && (
                <div className="pb-2 space-y-1">
                  {/* Sets count */}
                  <div className="flex items-center gap-3 mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72] whitespace-nowrap">
                      Series
                    </label>
                    <input
                      type="number" min={1} max={20}
                      value={weeks[week]?.sets ?? exercise.sets}
                      onChange={(e) => updateWeekSets(week, Math.max(1, Number(e.target.value) || 1))}
                      className="h-7 w-14 rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 px-2 text-center text-[11px] text-white outline-none focus:border-[#7C3AED]/40"
                    />
                  </div>
                  {/* Column headers on first week only */}
                  {week === 1 && (
                    <div className="grid grid-cols-[40px_repeat(6,1fr)_52px] gap-1.5 px-1 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Serie</span>
                      {SET_FIELDS.map((f) => (
                        <span key={f.key} className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] ${f.key === "rir" ? "text-[#00E5FF]" : f.key === "target_rpe" ? "text-[#FF9100]" : "text-[#5A5A72]"}`}>
                          {f.label}
                        </span>
                      ))}
                      <span />
                    </div>
                  )}
                  {(weeks[week]?.sets_detail ?? []).map((sc, setIdx) => {
                    const isDeriv = sc.set_type === "rest_pause" || sc.set_type === "drop_set";
                    const isRP = sc.set_type === "rest_pause";
                    const isDS = sc.set_type === "drop_set";
                    let normalNum = 0;
                    if (!isDeriv) {
                      for (let k = 0; k <= setIdx; k++) {
                        const t = (weeks[week]?.sets_detail ?? [])[k]?.set_type;
                        if (!t || t === "normal") normalNum++;
                      }
                    }
                    return (
                      <div key={setIdx} className={`grid grid-cols-[40px_repeat(6,1fr)_52px] gap-1.5 rounded-lg px-1 py-1.5 ${isDeriv ? "ml-6 border-l-2" : "bg-white/[0.02]"} ${isRP ? "border-[#FF9100]/40 bg-[#FF9100]/[0.04]" : ""} ${isDS ? "border-[#7C3AED]/40 bg-[#7C3AED]/[0.04]" : ""}`}>
                        <div className="flex items-center justify-center">
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
                        {SET_FIELDS.map((f) => (
                          <input
                            key={f.key}
                            type="number"
                            min={f.min} max={f.max} step={f.step}
                            value={sc[f.key] ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              updateSetDetail(week, setIdx, f.key, f.nullable && raw === "" ? null : Number(raw) || 0);
                            }}
                            placeholder={f.nullable ? "—" : undefined}
                            className={`h-7 w-full rounded border bg-[#0E0E18]/60 px-1 text-center text-[11px] placeholder:text-[#5A5A72] outline-none transition-colors ${f.key === "rir" ? "border-[#00E5FF]/20 text-[#00E5FF] focus:border-[#00E5FF]/40" : f.key === "target_rpe" ? "border-[#FF9100]/20 text-[#FF9100] focus:border-[#FF9100]/40" : "border-white/[0.06] text-white focus:border-[#7C3AED]/40"}`}
                          />
                        ))}
                        <div className="flex items-center gap-0.5">
                          {isDeriv ? (
                            <button type="button" title="Eliminar"
                              onClick={() => removeWeekDerivativeSet(week, setIdx)}
                              className="flex h-5 w-5 items-center justify-center rounded text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          ) : (
                            <>
                              <button type="button" title="Añadir Rest-Pause"
                                onClick={() => addWeekDerivativeSet(week, setIdx, "rest_pause")}
                                className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#FF9100] hover:bg-[#FF9100]/10 transition-colors"
                              >RP</button>
                              <button type="button" title="Añadir Drop Set"
                                onClick={() => addWeekDerivativeSet(week, setIdx, "drop_set")}
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

              {/* Coach notes per week (shared across both modes) */}
              <div className="mt-1.5 pb-1">
                <textarea
                  rows={1}
                  value={weeks[week]?.coach_notes ?? ""}
                  onChange={(e) => updateWeekField(week, "coach_notes", e.target.value)}
                  placeholder="Notas del entrenador para esta semana..."
                  className="w-full resize-none rounded-lg border border-white/[0.06] bg-[#0E0E18]/60 px-3 py-1.5 text-[11px] text-white placeholder:text-[#5A5A72]/60 outline-none transition-colors focus:border-[#7C3AED]/40"
                />
              </div>

              {/* Replicate button */}
              {week < mesocycleWeeks && (
                <div className="mt-0.5 mb-1 flex justify-end">
                  <button type="button" onClick={() => replicateFromWeek(week)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/10">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 0 0 2 2h6M8 7V5a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707V15a2 2 0 0 1-2 2h-2" />
                    </svg>
                    Replicar para siguientes semanas
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={handleReset}
            className="rounded-xl border border-white/[0.08] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-colors hover:text-white hover:border-white/[0.15]">
            Restablecer valores base
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-colors hover:text-white">
              Cancelar
            </button>
            <button type="button" onClick={() => onSave(weeks)}
              className="rounded-xl bg-[#7C3AED] px-5 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90">
              Guardar progresión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
