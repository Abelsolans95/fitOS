"use client";

import { type Dispatch } from "react";
import { type ClientOption, DAYS_OF_WEEK } from "../types";
import { type RoutinesState, type RoutinesAction } from "../useRoutinesPage";
import DaySchedule from "./DaySchedule";
import ExerciseSelector from "./ExerciseSelector";

/* ────────────────────────────────────────────
   RoutineEditor — 3-step wizard
   ──────────────────────────────────────────── */

interface RoutineEditorProps {
  state: RoutinesState;
  dispatch: Dispatch<RoutinesAction>;
  weekDates: { day: string; date: string }[];
  totalSets: (dayKey: string) => number;
  handleSave: () => void;
}

export default function RoutineEditor({
  state,
  dispatch,
  weekDates,
  totalSets,
  handleSave,
}: RoutineEditorProps) {
  const {
    step,
    crSelectedClientId,
    crTitle,
    crGoal,
    crMesocycleWeeks,
    crStartDate,
    crSelectedDays,
    crDayLabels,
    crTrainingDays,
    crSearchModalDayKey,
    crSaving,
    clients,
    exercises,
  } = state;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => dispatch({ type: "HIDE_CREATOR" })}
        className="flex items-center gap-2 text-[13px] text-[#8B8BA3] transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a rutinas
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === s
                  ? "bg-[#00E5FF] text-[#0A0A0F]"
                  : step > s
                  ? "bg-[#00E5FF]/20 text-[#00E5FF]"
                  : "bg-white/[0.06] text-[#5A5A72]"
              }`}
            >
              {step > s ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`h-px w-12 ${
                  step > s ? "bg-[#00E5FF]/40" : "bg-white/[0.06]"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-[13px] text-[#8B8BA3]">
          {step === 1
            ? "Configuración"
            : step === 2
            ? "Días de entrenamiento"
            : "Ejercicios"}
        </span>
      </div>

      {/* ── STEP 1: Basic Info ── */}
      {step === 1 && (
        <Step1Config
          clients={clients}
          selectedClientId={crSelectedClientId}
          title={crTitle}
          goal={crGoal}
          mesocycleWeeks={crMesocycleWeeks}
          startDate={crStartDate}
          dispatch={dispatch}
        />
      )}

      {/* ── STEP 2: Day Selection ── */}
      {step === 2 && (
        <Step2Days
          selectedDays={crSelectedDays}
          dayLabels={crDayLabels}
          weekDates={weekDates}
          dispatch={dispatch}
        />
      )}

      {/* ── STEP 3: Exercises per Day ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Ejercicios por día</h2>
            <span className="text-[11px] text-[#5A5A72]">
              {crMesocycleWeeks} sem · {crSelectedDays.length} días/sem
            </span>
          </div>

          {crTrainingDays.map((day) => (
            <DaySchedule
              key={day.key}
              day={day}
              totalSets={totalSets(day.key)}
              dateStr={weekDates.find((wd) => wd.day === day.key)?.date}
              dispatch={dispatch}
            />
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
              className="border border-white/[0.1] text-[#8B8BA3] rounded-xl px-5 py-2.5 text-[13px] font-medium hover:border-white/[0.18] hover:bg-white/[0.04] hover:text-white transition-all"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={crSaving}
              className="flex items-center justify-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-50"
            >
              {crSaving ? (
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
      )}

      {/* Exercise search modal */}
      {crSearchModalDayKey !== null && (
        <ExerciseSelector
          exercises={exercises}
          onSelect={(exercise) =>
            dispatch({ type: "CR_ADD_EXERCISE", dayKey: crSearchModalDayKey, exercise })
          }
          onClose={() => dispatch({ type: "CR_CLOSE_SEARCH_MODAL" })}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Step 1 — Configuration
   ──────────────────────────────────────────── */

function Step1Config({
  clients,
  selectedClientId,
  title,
  goal,
  mesocycleWeeks,
  startDate,
  dispatch,
}: {
  clients: ClientOption[];
  selectedClientId: string;
  title: string;
  goal: "fuerza" | "hipertrofia";
  mesocycleWeeks: number;
  startDate: string;
  dispatch: Dispatch<RoutinesAction>;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Configurar mesociclo</h2>

      <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6 space-y-5">
        {/* Client */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Cliente
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => dispatch({ type: "CR_SET_CLIENT", clientId: e.target.value })}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map((c) => (
              <option key={c.client_id} value={c.client_id}>
                {c.full_name ?? c.email ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Título del bloque
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => dispatch({ type: "CR_SET_TITLE", title: e.target.value })}
            placeholder="Ej: Mesociclo Hipertrofia — Pierna/Torso"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>

        {/* Goal */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Objetivo
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["fuerza", "hipertrofia"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => dispatch({ type: "CR_SET_GOAL", goal: g })}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  goal === g
                    ? "border-[#00E5FF]/40 bg-[#00E5FF]/5"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                }`}
              >
                <span
                  className={`text-[13px] font-semibold ${
                    goal === g ? "text-[#00E5FF]" : "text-[#8B8BA3]"
                  }`}
                >
                  {g === "fuerza" ? "Fuerza" : "Hipertrofia"}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#5A5A72]">
                  {g === "fuerza" ? "3-6 reps · descanso largo" : "8-12 reps · descanso moderado"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration & Start */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
              Semanas del bloque
            </label>
            <select
              value={mesocycleWeeks}
              onChange={(e) => dispatch({ type: "CR_SET_WEEKS", weeks: Number(e.target.value) })}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  {w} semana{w > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => dispatch({ type: "CR_SET_START_DATE", date: e.target.value })}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
          disabled={!selectedClientId || !title.trim()}
          className="flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-40"
        >
          Siguiente
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Step 2 — Day Selection
   ──────────────────────────────────────────── */

function Step2Days({
  selectedDays,
  dayLabels,
  weekDates,
  dispatch,
}: {
  selectedDays: string[];
  dayLabels: Record<string, string>;
  weekDates: { day: string; date: string }[];
  dispatch: Dispatch<RoutinesAction>;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Días de entrenamiento</h2>
      <p className="text-[13px] text-[#8B8BA3]">
        Selecciona los días y asigna un nombre a cada sesión (ej: PIERNA, TORSO, FULL BODY).
      </p>

      {/* Week preview with dates */}
      {weekDates.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Semana 1 — Vista previa
          </p>
          <div className="flex flex-wrap gap-2">
            {weekDates.map((wd) => {
              const dayInfo = DAYS_OF_WEEK.find((d) => d.key === wd.day);
              return (
                <div
                  key={wd.day}
                  className="flex items-center gap-2 rounded-lg bg-[#00E5FF]/5 px-3 py-1.5"
                >
                  <span className="text-[11px] font-bold text-[#00E5FF]">
                    {dayInfo?.short}
                  </span>
                  <span className="text-[11px] text-[#8B8BA3]">{wd.date}</span>
                  {dayLabels[wd.day] && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00E5FF]/60">
                      {dayLabels[wd.day]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDays.includes(day.key);
          return (
            <div
              key={day.key}
              className={`rounded-[18px] border p-4 transition-all ${
                isSelected
                  ? "border-[#00E5FF]/30 bg-[#00E5FF]/5"
                  : "border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CR_TOGGLE_DAY", key: day.key })}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold transition-all ${
                      isSelected
                        ? "bg-[#00E5FF] text-[#0A0A0F]"
                        : "bg-white/[0.06] text-[#5A5A72]"
                    }`}
                  >
                    {day.short}
                  </div>
                  <span
                    className={`text-[13px] font-medium ${
                      isSelected ? "text-white" : "text-[#8B8BA3]"
                    }`}
                  >
                    {day.label}
                  </span>
                </button>
              </div>

              {isSelected && (
                <input
                  type="text"
                  placeholder="Nombre de sesión (ej: PIERNA)"
                  value={dayLabels[day.key] || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "CR_SET_DAY_LABEL",
                      key: day.key,
                      label: e.target.value.toUpperCase(),
                    })
                  }
                  className="mt-3 h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00E5FF] placeholder:text-[#5A5A72] placeholder:normal-case placeholder:tracking-normal outline-none transition-colors focus:border-[#00E5FF]/40"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
          className="border border-white/[0.1] text-[#8B8BA3] rounded-xl px-5 py-2.5 text-[13px] font-medium hover:border-white/[0.18] hover:bg-white/[0.04] hover:text-white transition-all"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "INIT_TRAINING_DAYS" });
            dispatch({ type: "SET_STEP", step: 3 });
          }}
          disabled={selectedDays.length === 0}
          className="flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-40"
        >
          Siguiente
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
