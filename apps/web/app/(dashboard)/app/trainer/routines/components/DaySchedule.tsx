"use client";

import { type Dispatch } from "react";
import {
  type TrainingDay,
  DAYS_OF_WEEK,
} from "../types";
import { type RoutinesAction } from "../useRoutinesPage";
import { ExerciseRow } from "./ExerciseRow";

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
    <div className="rounded-[18px] border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
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
