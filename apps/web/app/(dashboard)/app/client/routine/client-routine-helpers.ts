/* ────────────────────────────────────────────
   Client Routine — Pure helpers & constants
   Extracted from useClientRoutine.ts
   ──────────────────────────────────────────── */

import type { ExerciseData, DayData, PreviousSet, PreviousLog } from "./active/types";
import type { RoutineRaw, SetInput } from "./client-routine-reducer";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

export const DAY_ORDER = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export const DAY_SHORT: Record<string, string> = {
  lunes: "L",
  martes: "M",
  miercoles: "X",
  jueves: "J",
  viernes: "V",
  sabado: "S",
  domingo: "D",
};

/* ────────────────────────────────────────────
   Exercise parsing — flatten routine structure
   ──────────────────────────────────────────── */

export function parseExercisesFromRoutine(routine: RoutineRaw | null): ExerciseData[] {
  if (!routine) return [];

  if (
    routine.exercises &&
    Array.isArray(routine.exercises) &&
    routine.exercises.length > 0
  ) {
    return routine.exercises;
  }

  if (routine.days && Array.isArray(routine.days)) {
    return routine.days.flatMap((day: DayData) =>
      (day.exercises ?? []).map((ex: ExerciseData) => ({
        ...ex,
        day_of_week: ex.day_of_week ?? day.day,
        day_label: ex.day_label ?? day.label,
      }))
    );
  }

  return [];
}

/* ────────────────────────────────────────────
   Training days — sorted unique day_of_week
   ──────────────────────────────────────────── */

export function extractTrainingDays(exercises: ExerciseData[]): string[] {
  const days = [...new Set(exercises.map((ex) => ex.day_of_week))];
  return days.sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );
}

/* ────────────────────────────────────────────
   Exercises for a specific day
   ──────────────────────────────────────────── */

export function getExercisesForDay(
  exercises: ExerciseData[],
  day: string | null
): ExerciseData[] {
  if (!day) return [];
  return exercises
    .filter((ex) => ex.day_of_week === day)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/* ────────────────────────────────────────────
   Day label resolution
   ──────────────────────────────────────────── */

export function resolveDayLabel(
  exercises: ExerciseData[],
  activeDay: string | null
): string {
  if (!activeDay) return "";
  const ex = exercises.find((e) => e.day_of_week === activeDay);
  return ex?.day_label ?? DAY_LABELS[activeDay] ?? activeDay;
}

/* ────────────────────────────────────────────
   Week count resolution
   ──────────────────────────────────────────── */

export function resolveWeekCount(routine: RoutineRaw | null): number {
  if (!routine) return 0;
  return routine.total_weeks ?? Math.max(1, (routine.duration_months ?? 1) * 4);
}

/* ────────────────────────────────────────────
   Previous log helpers
   ──────────────────────────────────────────── */

export function getPreviousLogSets(
  previousLogs: PreviousLog[],
  exerciseName: string
): PreviousSet[] {
  const log = previousLogs.find((l) => l.exercise_name === exerciseName);
  if (!log?.sets_data) return [];
  return (log.sets_data as PreviousSet[]) ?? [];
}

export function formatPreviousLog(
  previousLogs: PreviousLog[],
  exerciseName: string
): string {
  const prev = getPreviousLogSets(previousLogs, exerciseName);
  if (prev.length === 0) return "";
  const mainSets = prev.filter((s) => s.type !== "rest_pause");
  const firstWeight = mainSets[0]?.weight_kg ?? 0;
  const firstReps = mainSets[0]?.reps_done ?? 0;
  return `${firstWeight}x${firstReps}`;
}

/* ────────────────────────────────────────────
   Build initial session inputs for tracking
   ──────────────────────────────────────────── */

export function buildSessionInputs(
  dayExercises: ExerciseData[],
  previousLogs: PreviousLog[]
): Record<string, SetInput[]> {
  const inputs: Record<string, SetInput[]> = {};

  dayExercises.forEach((ex) => {
    const mainSets = ex.sets ?? 3;
    const rpSets = ex.rest_pause_sets ?? 0;
    const prevLog = getPreviousLogSets(previousLogs, ex.name);
    const weight = ex.target_weight ?? ex.weight_kg ?? 0;

    const sets: SetInput[] = [];
    for (let i = 0; i < mainSets; i++) {
      sets.push({
        weight_kg: prevLog[i]?.weight_kg
          ? String(prevLog[i].weight_kg)
          : weight
            ? String(weight)
            : "",
        reps_done: "",
        type: "main",
      });
    }
    for (let i = 0; i < rpSets; i++) {
      const rpIdx = mainSets + i;
      sets.push({
        weight_kg: prevLog[rpIdx]?.weight_kg
          ? String(prevLog[rpIdx].weight_kg)
          : weight
            ? String(weight)
            : "",
        reps_done: "",
        type: "rest_pause",
      });
    }

    inputs[ex.name] = sets;
  });

  return inputs;
}

/* ────────────────────────────────────────────
   Build weight_log insert rows from session
   ──────────────────────────────────────────── */

export interface WeightLogInsert {
  client_id: string | null;
  exercise_id: string | undefined;
  exercise_name: string;
  session_date: string;
  session_id: string | null;
  sets_data: { set_number: number; weight_kg: number; reps_done: number; type: string }[];
  total_volume_kg: number;
  exercise_rpe: number | null;
}

export function buildWeightLogInserts(opts: {
  dayExercises: ExerciseData[];
  sessionInputs: Record<string, SetInput[]>;
  exerciseRpe: Record<string, string>;
  userId: string | null;
  sessionDate: string;
  sessionId: string | null;
}): WeightLogInsert[] {
  return opts.dayExercises.map((ex) => {
    const sets = opts.sessionInputs[ex.name] ?? [];
    const setsData = sets.map((s, i) => ({
      set_number: i + 1,
      weight_kg: Number(s.weight_kg) || 0,
      reps_done: Number(s.reps_done) || 0,
      type: s.type,
    }));

    const totalVolume = setsData.reduce(
      (sum, s) => sum + s.weight_kg * s.reps_done,
      0
    );

    const rpeVal = opts.exerciseRpe[ex.name]
      ? Number(opts.exerciseRpe[ex.name])
      : null;

    return {
      client_id: opts.userId,
      exercise_id: ex.exercise_id,
      exercise_name: ex.name,
      session_date: opts.sessionDate,
      session_id: opts.sessionId,
      sets_data: setsData,
      total_volume_kg: totalVolume,
      exercise_rpe: rpeVal,
    };
  });
}
