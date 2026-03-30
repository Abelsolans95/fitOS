import { memo } from "react";
import type { Dispatch } from "react";
import { getDateForDay, calculateProgressLabel, getProgressColor } from "../active/utils";

// Types mirrored from useClientRoutine to avoid circular deps
interface SetInput { weight_kg: string; reps_done: string; type?: string; }
interface PrevSet { weight_kg: number; reps_done: number; }
interface Exercise {
  name: string; exercise_id: string; sets: number;
  reps_min: number; reps_max: number; scheme?: string;
  coach_notes?: string; trainer_notes?: string; technique_notes?: string;
  progression_rule?: string; target_rpe?: number;
  [key: string]: unknown;
}
interface Routine { sent_at: string; id: string; title: string; goal: string; duration_months: number; }
type Action = { type: string; [key: string]: unknown };

interface Props {
  activeWeek: number;
  activeDay: string;
  routine: Routine;
  dayLabel: string;
  dayExercises: Exercise[];
  sessionInputs: Record<string, SetInput[]>;
  clientNotes: Record<string, string>;
  exerciseRpe: Record<string, string>;
  rpeGlobal: number;
  saving: boolean;
  getPreviousLog: (name: string) => PrevSet[];
  formatPrevious: (name: string) => string;
  updateSet: (name: string, idx: number, field: "weight_kg" | "reps_done", val: string) => void;
  handleSaveSession: () => void;
  dispatch: Dispatch<Action>;
}

export const TrackingMode = memo(function TrackingMode({
  activeWeek, activeDay, routine, dayLabel, dayExercises,
  sessionInputs, clientNotes, exerciseRpe, rpeGlobal,
  saving, getPreviousLog, formatPrevious, updateSet, handleSaveSession, dispatch,
}: Props) {
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

      {/* Exercise cards */}
      {dayExercises.map((ex, exIdx) => {
        const sets = sessionInputs[ex.name] || [];
        const prevSets = getPreviousLog(ex.name);
        const scheme = ex.scheme || `${ex.sets}x${ex.reps_min}-${ex.reps_max}`;
        const notes = ex.coach_notes || ex.trainer_notes || ex.technique_notes || "";
        const progressionRule = ex.progression_rule || "";

        const currentData = sets.filter((s) => s.reps_done).map((s) => ({ weight: Number(s.weight_kg) || 0, reps: Number(s.reps_done) || 0 }));
        const prevData = prevSets.map((s) => ({ weight: s.weight_kg, reps: s.reps_done }));
        const progress = currentData.length > 0 ? calculateProgressLabel(currentData, prevData) : "";

        return (
          <div key={`${ex.exercise_id}-${exIdx}`} className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
            {/* Exercise header */}
            <div className="border-b border-white/[0.04] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">{exIdx + 1}</span>
                  <p className="text-sm font-semibold uppercase text-white">{ex.name}</p>
                </div>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-[#8B8BA3]">{scheme}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {progressionRule && <span className="text-[10px] text-[#FF9100]">{progressionRule}</span>}
                {notes && <span className="text-[10px] text-[#7C3AED]">{notes}</span>}
              </div>
              <div className="mt-2 flex items-center gap-3">
                {formatPrevious(ex.name) && <span className="text-[10px] text-[#5A5A72]">ANTERIOR: {formatPrevious(ex.name)}</span>}
                {progress && <span className={`text-[10px] font-bold ${getProgressColor(progress)}`}>{progress}</span>}
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
                  <div key={setIdx} className={`mb-1.5 grid grid-cols-[2.5rem_1fr_1fr] gap-2 ${isRP ? "opacity-90" : ""}`}>
                    <div className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold ${isRP ? "bg-[#FF9100]/10 text-[#FF9100]" : "bg-white/[0.04] text-[#8B8BA3]"}`}>
                      {isRP ? "RP" : setIdx + 1}
                    </div>
                    <input
                      type="number" inputMode="decimal" step="0.5"
                      value={set.weight_kg}
                      onChange={(e) => updateSet(ex.name, setIdx, "weight_kg", e.target.value)}
                      placeholder={prevSet ? String(prevSet.weight_kg) : "0"}
                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-center text-sm text-white placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/50"
                    />
                    <input
                      type="number" inputMode="numeric"
                      value={set.reps_done}
                      onChange={(e) => updateSet(ex.name, setIdx, "reps_done", e.target.value)}
                      placeholder={prevSet ? String(prevSet.reps_done) : `${ex.reps_min}-${ex.reps_max}`}
                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-center text-sm text-white placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/50"
                    />
                  </div>
                );
              })}

              {ex.target_rpe != null && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-[#FF9100]/20 bg-[#FF9100]/[0.04] px-3 py-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF9100]">RPE del ejercicio</p>
                    <p className="text-[10px] text-[#5A5A72]">Objetivo: {ex.target_rpe} · Escala 1-10</p>
                  </div>
                  <input
                    type="number" inputMode="numeric" min={1} max={10}
                    value={exerciseRpe[ex.name] || ""}
                    onChange={(e) => dispatch({ type: "SET_EXERCISE_RPE", exerciseName: ex.name, value: e.target.value })}
                    placeholder={String(ex.target_rpe)}
                    className="h-10 w-14 rounded-xl border border-[#FF9100]/30 bg-[#FF9100]/[0.08] px-1 text-center text-base font-black text-[#FF9100] placeholder:text-[#FF9100]/30 outline-none focus:border-[#FF9100]/60"
                  />
                </div>
              )}

              <div className="mt-3">
                <input
                  type="text" placeholder="Notas / sensaciones..."
                  value={clientNotes[ex.name] || ""}
                  onChange={(e) => dispatch({ type: "SET_CLIENT_NOTE", exerciseName: ex.name, note: e.target.value })}
                  className="h-8 w-full rounded-lg border border-white/[0.06] bg-transparent px-3 text-xs text-[#8B8BA3] placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/30"
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* RPE Global */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[#5A5A72]">RPE Global</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-sm font-bold text-[#00E5FF]">{rpeGlobal}</span>
        </div>
        <input
          type="range" min={1} max={10} value={rpeGlobal}
          onChange={(e) => dispatch({ type: "SET_RPE", value: Number(e.target.value) })}
          className="w-full accent-[#00E5FF]"
        />
        <div className="mt-1 flex justify-between text-[9px] text-[#5A5A72]">
          <span>Fácil</span><span>Máximo</span>
        </div>
      </div>

      {/* Save button */}
      <button
        type="button" onClick={handleSaveSession} disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
      >
        {saving ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />Guardando...</>
        ) : "Guardar sesión"}
      </button>
    </div>
  );
});
