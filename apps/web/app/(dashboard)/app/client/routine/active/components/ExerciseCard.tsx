import type { ExerciseData, SetEntry, SetConfig, PreviousSet } from "../types";
import { formatTime } from "../types";
import { isAllowedVideoUrl } from "@/lib/url-validation";

interface ExerciseCardProps {
  exercise: ExerciseData;
  exerciseIndex: number;
  totalExercises: number;
  sets: SetEntry[];
  previousSets: PreviousSet[];
  currentSetIdx: number;
  allCurrentSetsDone: boolean;
  isLastExercise: boolean;
  isSaved: boolean;
  elapsed: number;
  week: number;
  onCompleteSet: (setIdx: number) => void;
  onSetValueChange: (
    setIdx: number,
    field: "weight_kg" | "reps_done" | "rir" | "rpe",
    value: string
  ) => void;
  onNext: () => void;
  onPrev: () => void;
  onFinishRoutine: () => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  totalExercises,
  sets,
  previousSets,
  currentSetIdx,
  allCurrentSetsDone,
  isLastExercise,
  isSaved,
  elapsed,
  week,
  onCompleteSet,
  onSetValueChange,
  onNext,
  onPrev,
  onFinishRoutine,
}: ExerciseCardProps) {
  const scheme =
    exercise.scheme ||
    `${exercise.sets}x${exercise.reps_min}${exercise.reps_max !== exercise.reps_min ? `-${exercise.reps_max}` : ""}`;

  // Resolve week-aware trainer config per set
  const wk = exercise.weekly_config?.[week];
  const weekNotes = wk?.coach_notes || "";
  const baseNotes =
    exercise.coach_notes ||
    exercise.trainer_notes ||
    exercise.technique_notes ||
    "";
  const notes = weekNotes || baseNotes;

  const getTrainerConfig = (setIdx: number): SetConfig => {
    // Use sets_detail if available — works for both "different" mode and equal mode with derivatives
    const detail = wk?.sets_detail ?? (exercise.mode === "different" ? exercise.sets_config : undefined) ?? [];
    if (detail.length > 0 && detail[setIdx]) return detail[setIdx];
    return {
      reps_min: wk?.reps_min ?? exercise.reps_min,
      reps_max: wk?.reps_max ?? exercise.reps_max,
      rir: wk?.rir ?? exercise.rir,
      target_weight: wk?.target_weight ?? exercise.target_weight ?? null,
      rest_s: wk?.rest_s ?? exercise.rest_s,
    };
  };

  // Determine which optional columns to show
  const showRir = (exercise.rir ?? 0) > 0 ||
    (exercise.sets_config ?? []).some((sc) => (sc.rir ?? 0) > 0) ||
    Object.values(exercise.weekly_config ?? {}).some((wc) => (wc.rir ?? 0) > 0);
  const showRpe = (exercise.target_rpe != null && exercise.target_rpe > 0) ||
    (exercise.sets_config ?? []).some((sc) => (sc.target_rpe ?? 0) > 0) ||
    Object.values(exercise.weekly_config ?? {}).some((wc) =>
      (wc.target_rpe ?? 0) > 0 || (wc.sets_detail ?? []).some((sd) => ((sd.target_rpe ?? 0) > 0))
    );

  // Dynamic grid template
  const gridCols = `grid-cols-[3rem_1fr_1fr${showRir ? "_3.5rem" : ""}${showRpe ? "_3.5rem" : ""}_3rem]`.replace(/_/g, "_");
  // Build actual tailwind-compatible class
  const colCount = 3 + (showRir ? 1 : 0) + (showRpe ? 1 : 0) + 1; // serie + peso + reps + [rir] + [rpe] + check
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `3rem 1fr 1fr${showRir ? " 3.5rem" : ""}${showRpe ? " 3.5rem" : ""} 3rem`,
    gap: "0.5rem",
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-4">
      {/* Top bar: progress + elapsed */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#00E5FF]">
            {exerciseIndex + 1}/{totalExercises}
          </span>
          <span className="text-xs tabular-nums text-[#5A5A72]">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-[#00E5FF] transition-all duration-500"
          style={{
            width: `${((exerciseIndex + (allCurrentSetsDone ? 1 : 0)) / totalExercises) * 100}%`,
          }}
        />
      </div>

      {/* Exercise header */}
      <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Ejercicio {exerciseIndex + 1}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              {exercise.name}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-lg bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF]">
              {scheme}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {exercise.rest_s && (
            <span className="text-xs text-[#FF9100]">
              {exercise.rest_s}s descanso
            </span>
          )}
          {exercise.progression_rule && (
            <span className="text-xs text-[#7C3AED]">
              {exercise.progression_rule}
            </span>
          )}
        </div>

        {notes && (
          <p className="mt-2 rounded-lg bg-[#7C3AED]/[0.06] px-3 py-2 text-xs text-[#7C3AED]">
            {notes}
          </p>
        )}

        {isSaved && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#00C853]/10 px-3 py-2">
            <svg
              className="h-4 w-4 text-[#00C853]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            <span className="text-xs font-medium text-[#00C853]">
              Ejercicio guardado
            </span>
          </div>
        )}
      </div>

      {/* ANTERIOR row */}
      {previousSets.length > 0 && (
        <div className="rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-2.5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Anterior
          </p>
          <div className="flex gap-3">
            {previousSets.map((ps, i) => (
              <span
                key={i}
                className="text-xs tabular-nums text-[#5A5A72]"
              >
                {ps.weight_kg}×{ps.reps_done}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sets */}
      <div className="space-y-2">
        {/* Header */}
        <div style={gridStyle} className="px-1">
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Serie
          </span>
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Peso (kg)
          </span>
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Reps
          </span>
          {showRir && (
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              RIR
            </span>
          )}
          {showRpe && (
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF9100]">
              RPE
            </span>
          )}
          <span />
        </div>

        {sets.map((set, setIdx) => {
          const prevSet = previousSets[setIdx];
          const isCurrent = setIdx === currentSetIdx;
          const cfg = getTrainerConfig(setIdx);
          const cfgType = cfg.set_type || "normal";
          const isRP = cfgType === "rest_pause";
          const isDS = cfgType === "drop_set";
          const isDeriv = isRP || isDS;
          // Count normal sets up to this index for display numbering
          let normalNum = 0;
          if (!isDeriv) {
            for (let k = 0; k <= setIdx; k++) {
              const t = getTrainerConfig(k).set_type || "normal";
              if (t === "normal") normalNum++;
            }
          }

          return (
            <div
              key={setIdx}
              style={gridStyle}
              className={`rounded-xl px-1 py-1 transition-all ${isDeriv ? "ml-4 border-l-2" : ""} ${isRP ? "border-[#FF9100]/40" : ""} ${isDS ? "border-[#7C3AED]/40" : ""} ${
                set.completed
                  ? "opacity-50"
                  : isCurrent
                    ? "bg-[#00E5FF]/[0.03] ring-1 ring-[#00E5FF]/10"
                    : ""
              }`}
            >
              {/* Set number */}
              <div
                className={`flex h-11 items-center justify-center rounded-lg text-sm font-bold ${
                  set.completed
                    ? "bg-[#00C853]/10 text-[#00C853]"
                    : isRP
                      ? "bg-[#FF9100]/10 text-[#FF9100]"
                      : isDS
                        ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                        : "bg-white/[0.04] text-[#8B8BA3]"
                }`}
              >
                {set.completed ? "✓" : isRP ? "RP" : isDS ? "DS" : normalNum}
              </div>

              {/* Weight */}
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={set.weight_kg}
                onChange={(e) =>
                  onSetValueChange(setIdx, "weight_kg", e.target.value)
                }
                disabled={set.completed}
                placeholder={
                  prevSet ? String(prevSet.weight_kg)
                    : cfg.target_weight ? String(cfg.target_weight)
                    : "0"
                }
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-center text-base font-semibold tabular-nums text-white placeholder:text-[#5A5A72]/40 outline-none transition-colors focus:border-[#00E5FF]/50 disabled:opacity-40"
              />

              {/* Reps */}
              <input
                type="number"
                inputMode="numeric"
                value={set.reps_done}
                onChange={(e) =>
                  onSetValueChange(setIdx, "reps_done", e.target.value)
                }
                disabled={set.completed}
                placeholder={
                  prevSet ? String(prevSet.reps_done)
                    : cfg.reps_min === cfg.reps_max
                      ? String(cfg.reps_min)
                      : `${cfg.reps_min}-${cfg.reps_max}`
                }
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-center text-base font-semibold tabular-nums text-white placeholder:text-[#5A5A72]/40 outline-none transition-colors focus:border-[#00E5FF]/50 disabled:opacity-40"
              />

              {/* RIR (conditional) */}
              {showRir && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10}
                  value={set.rir}
                  onChange={(e) =>
                    onSetValueChange(setIdx, "rir", e.target.value)
                  }
                  disabled={set.completed}
                  placeholder={String(cfg.rir)}
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-1 text-center text-base font-semibold tabular-nums text-white placeholder:text-[#5A5A72]/40 outline-none transition-colors focus:border-[#00E5FF]/50 disabled:opacity-40"
                />
              )}

              {/* RPE (conditional) */}
              {showRpe && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10}
                  value={set.rpe}
                  onChange={(e) =>
                    onSetValueChange(setIdx, "rpe", e.target.value)
                  }
                  disabled={set.completed}
                  placeholder={String(cfg.target_rpe ?? exercise.target_rpe ?? "")}
                  className="h-11 w-full rounded-lg border border-[#FF9100]/20 bg-[#FF9100]/[0.04] px-1 text-center text-base font-semibold tabular-nums text-[#FF9100] placeholder:text-[#FF9100]/30 outline-none transition-colors focus:border-[#FF9100]/50 disabled:opacity-40"
                />
              )}

              {/* Complete set button */}
              <button
                onClick={() => onCompleteSet(setIdx)}
                disabled={set.completed || setIdx !== currentSetIdx}
                className={`flex h-11 items-center justify-center rounded-lg transition-all ${
                  set.completed
                    ? "bg-[#00C853]/10 text-[#00C853]"
                    : isCurrent
                      ? "bg-[#00E5FF] text-[#0A0A0F] hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                      : "bg-white/[0.04] text-[#5A5A72]"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {/* Previous exercise */}
        <button
          onClick={onPrev}
          disabled={exerciseIndex === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Anterior
        </button>

        {/* Next exercise or Finish */}
        {isLastExercise && allCurrentSetsDone ? (
          <button
            onClick={onFinishRoutine}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#00C853] py-3.5 text-sm font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_30px_rgba(0,200,83,0.3)]"
          >
            Finalizar rutina
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={exerciseIndex >= totalExercises - 1}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Video link */}
      {exercise.video_url && isAllowedVideoUrl(exercise.video_url) && (
        <a
          href={exercise.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs font-medium text-[#00E5FF] transition-colors hover:text-[#00E5FF]/70"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Ver vídeo del ejercicio
        </a>
      )}
    </div>
  );
}
