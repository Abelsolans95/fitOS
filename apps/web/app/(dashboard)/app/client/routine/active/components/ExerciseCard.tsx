import type { ExerciseData, SetEntry, PreviousSet } from "../types";
import { formatTime } from "../types";

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
  onCompleteSet: (setIdx: number) => void;
  onSetValueChange: (
    setIdx: number,
    field: "weight_kg" | "reps_done",
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
  onCompleteSet,
  onSetValueChange,
  onNext,
  onPrev,
  onFinishRoutine,
}: ExerciseCardProps) {
  const scheme =
    exercise.scheme ||
    `${exercise.sets}x${exercise.reps_min}${exercise.reps_max !== exercise.reps_min ? `-${exercise.reps_max}` : ""}`;
  const notes =
    exercise.coach_notes ||
    exercise.trainer_notes ||
    exercise.technique_notes ||
    "";

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
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
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
            {exercise.rir > 0 && (
              <span className="text-[10px] text-[#8B8BA3]">
                RIR {exercise.rir}
              </span>
            )}
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
        <div className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 px-1">
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Serie
          </span>
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Peso (kg)
          </span>
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Reps
          </span>
          <span />
        </div>

        {sets.map((set, setIdx) => {
          const prevSet = previousSets[setIdx];
          const isCurrent = setIdx === currentSetIdx;
          const isRP = setIdx >= (exercise.sets || 3);

          return (
            <div
              key={setIdx}
              className={`grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 rounded-xl px-1 py-1 transition-all ${
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
                      : "bg-white/[0.04] text-[#8B8BA3]"
                }`}
              >
                {set.completed ? "✓" : isRP ? "RP" : setIdx + 1}
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
                placeholder={prevSet ? String(prevSet.weight_kg) : "0"}
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
                  prevSet
                    ? String(prevSet.reps_done)
                    : `${exercise.reps_min || 0}`
                }
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-center text-base font-semibold tabular-nums text-white placeholder:text-[#5A5A72]/40 outline-none transition-colors focus:border-[#00E5FF]/50 disabled:opacity-40"
              />

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
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed"
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
      {exercise.video_url && (
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
