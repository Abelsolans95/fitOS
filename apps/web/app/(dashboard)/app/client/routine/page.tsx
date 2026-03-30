"use client";

import { useClientRoutine, DAY_LABELS, DAY_SHORT } from "./useClientRoutine";
import { getDateForDay, calculateProgressLabel, getProgressColor } from "./active/utils";
import { ExerciseCard } from "./components/ExerciseCard";

/* ────────────────────────────────────────────
   Main Page (orchestrator)
   ──────────────────────────────────────────── */

export default function ClientRoutinePage() {
  const {
    state,
    dispatch,
    parsedExercises,
    trainingDays,
    dayExercises,
    dayLabel,
    isSessionCompleted,
    weekCount,
    getPreviousLog,
    formatPrevious,
    startTracking,
    updateSet,
    handleSaveSession,
  } = useClientRoutine();

  const {
    loading,
    error,
    routine,
    activeWeek,
    activeDay,
    isTracking,
    sessionInputs,
    clientNotes,
    rpeGlobal,
    saving,
    inProgressSession,
  } = state;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  /* ── No routine ── */
  if (!routine) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Mi Rutina</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
            <svg className="h-7 w-7 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white">Sin rutina asignada</p>
          <p className="max-w-xs text-center text-xs text-[#8B8BA3]">
            Tu entrenador aún no te ha asignado una rutina
          </p>
        </div>
      </div>
    );
  }

  /* ── TRACKING MODE ── */
  if (isTracking && activeDay) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch({ type: "STOP_TRACKING" })}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{dayLabel}</h1>
            <p className="text-xs text-[#5A5A72]">
              Sem {activeWeek} · {getDateForDay(routine.sent_at, activeWeek, activeDay)}
            </p>
          </div>
        </div>

        {/* Exercise tracking cards */}
        {dayExercises.map((ex, exIdx) => {
          const sets = sessionInputs[ex.name] || [];
          const prevSets = getPreviousLog(ex.name);
          const scheme = ex.scheme || `${ex.sets}x${ex.reps_min}-${ex.reps_max}`;
          const notes = ex.coach_notes || ex.trainer_notes || ex.technique_notes || "";
          const progressionRule = ex.progression_rule || "";

          const currentData = sets
            .filter((s) => s.reps_done)
            .map((s) => ({
              weight: Number(s.weight_kg) || 0,
              reps: Number(s.reps_done) || 0,
            }));
          const prevData = prevSets.map((s) => ({
            weight: s.weight_kg,
            reps: s.reps_done,
          }));
          const progress =
            currentData.length > 0
              ? calculateProgressLabel(currentData, prevData)
              : "";

          return (
            <div
              key={`${ex.exercise_id}-${exIdx}`}
              className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden"
            >
              {/* Exercise header */}
              <div className="border-b border-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                      {exIdx + 1}
                    </span>
                    <p className="text-sm font-semibold uppercase text-white">
                      {ex.name}
                    </p>
                  </div>
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-[#8B8BA3]">
                    {scheme}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {progressionRule && (
                    <span className="text-[10px] text-[#FF9100]">{progressionRule}</span>
                  )}
                  {notes && (
                    <span className="text-[10px] text-[#7C3AED]">{notes}</span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-3">
                  {formatPrevious(ex.name) && (
                    <span className="text-[10px] text-[#5A5A72]">
                      ANTERIOR: {formatPrevious(ex.name)}
                    </span>
                  )}
                  {progress && (
                    <span className={`text-[10px] font-bold ${getProgressColor(progress)}`}>
                      {progress}
                    </span>
                  )}
                </div>
              </div>

              {/* Sets table */}
              <div className="px-4 py-3">
                <div className="mb-2 grid grid-cols-[2.5rem_1fr_1fr] gap-2">
                  <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">Serie</span>
                  <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">C (kg)</span>
                  <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">R (reps)</span>
                </div>

                {sets.map((set, setIdx) => {
                  const prevSet = prevSets[setIdx];
                  const isRP = set.type === "rest_pause";
                  return (
                    <div
                      key={setIdx}
                      className={`mb-1.5 grid grid-cols-[2.5rem_1fr_1fr] gap-2 ${isRP ? "opacity-90" : ""}`}
                    >
                      <div
                        className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold ${
                          isRP
                            ? "bg-[#FF9100]/10 text-[#FF9100]"
                            : "bg-white/[0.04] text-[#8B8BA3]"
                        }`}
                      >
                        {isRP ? "RP" : setIdx + 1}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          value={set.weight_kg}
                          onChange={(e) => updateSet(ex.name, setIdx, "weight_kg", e.target.value)}
                          placeholder={prevSet ? String(prevSet.weight_kg) : "0"}
                          className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-center text-sm text-white placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/50"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps_done}
                          onChange={(e) => updateSet(ex.name, setIdx, "reps_done", e.target.value)}
                          placeholder={
                            prevSet
                              ? String(prevSet.reps_done)
                              : `${ex.reps_min}-${ex.reps_max}`
                          }
                          className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-center text-sm text-white placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/50"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Client notes */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Notas / sensaciones..."
                    value={clientNotes[ex.name] || ""}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_CLIENT_NOTE",
                        exerciseName: ex.name,
                        note: e.target.value,
                      })
                    }
                    className="h-8 w-full rounded-lg border border-white/[0.06] bg-transparent px-3 text-xs text-[#8B8BA3] placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/30"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* RPE */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[#5A5A72]">RPE Global</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-sm font-bold text-[#00E5FF]">
              {rpeGlobal}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={rpeGlobal}
            onChange={(e) => dispatch({ type: "SET_RPE", value: Number(e.target.value) })}
            className="w-full accent-[#00E5FF]"
          />
          <div className="mt-1 flex justify-between text-[9px] text-[#5A5A72]">
            <span>Fácil</span>
            <span>Máximo</span>
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSaveSession}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
              Guardando...
            </>
          ) : (
            "Guardar sesión"
          )}
        </button>
      </div>
    );
  }

  /* ── ROUTINE OVERVIEW ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Rutina</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">{routine.title}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-[#5A5A72]">
          <span className="rounded-md bg-[#00E5FF]/10 px-2 py-0.5 font-medium text-[#00E5FF]">
            {routine.goal === "fuerza" ? "Fuerza" : "Hipertrofia"}
          </span>
          <span>
            {routine.duration_months} mes
            {(routine.duration_months || 1) > 1 ? "es" : ""}
          </span>
        </div>
      </div>

      {/* Week selector */}
      {weekCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: Math.min(weekCount, 12) }, (_, i) => i + 1).map(
            (week) => (
              <button
                key={week}
                type="button"
                onClick={() => dispatch({ type: "SET_ACTIVE_WEEK", week })}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  activeWeek === week
                    ? "bg-[#00E5FF] text-[#0A0A0F]"
                    : "bg-white/[0.04] text-[#8B8BA3] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                Sem {week}
              </button>
            )
          )}
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-2">
        {trainingDays.map((day) => {
          const dateStr = getDateForDay(routine.sent_at, activeWeek, day);
          const label =
            parsedExercises.find((e) => e.day_of_week === day)?.day_label ||
            DAY_LABELS[day];

          return (
            <button
              key={day}
              type="button"
              onClick={() => dispatch({ type: "SET_ACTIVE_DAY", day })}
              className={`flex flex-col items-center rounded-xl px-4 py-2 transition-all ${
                activeDay === day
                  ? "bg-[#00E5FF]/10 ring-1 ring-[#00E5FF]/30"
                  : "bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <span
                className={`text-xs font-bold ${
                  activeDay === day ? "text-[#00E5FF]" : "text-[#8B8BA3]"
                }`}
              >
                {DAY_SHORT[day] || day.slice(0, 1).toUpperCase()}
              </span>
              {dateStr && (
                <span className="mt-0.5 text-[9px] text-[#5A5A72]">{dateStr}</span>
              )}
              {label && (
                <span
                  className={`mt-0.5 text-[8px] font-medium uppercase tracking-wider ${
                    activeDay === day ? "text-[#00E5FF]/60" : "text-[#5A5A72]"
                  }`}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Exercise list */}
      {dayExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl py-12">
          <p className="text-sm text-[#8B8BA3]">Día de descanso</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dayExercises.map((ex, idx) => (
              <ExerciseCard
                key={`${ex.exercise_id}-${idx}`}
                ex={ex}
                idx={idx}
                activeWeek={activeWeek}
                formatPrevious={formatPrevious}
              />
            ))}
          </div>

          {/* Resume in-progress session */}
          {inProgressSession && (
            <a
              href={`/app/client/routine/active?routine_id=${inProgressSession.routine_id}&day=${inProgressSession.day_label}&week=${inProgressSession.week_number}&session_id=${inProgressSession.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#FF9100] bg-[#FF9100]/10 py-3.5 text-sm font-bold text-[#FF9100] transition-all hover:bg-[#FF9100]/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Completar rutina en curso
            </a>
          )}

          {/* Training mode buttons */}
          {isSessionCompleted ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#00C853]/20 bg-[#00C853]/10 py-3.5 text-sm font-semibold text-[#00C853]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Sesión completada hoy
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={startTracking}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.04]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Registrar sesión
              </button>
              <a
                href={`/app/client/routine/active?routine_id=${routine.id}&day=${activeDay}&week=${activeWeek}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Entrenar en activo
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

