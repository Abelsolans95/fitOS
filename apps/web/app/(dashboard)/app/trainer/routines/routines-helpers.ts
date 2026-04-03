/* ────────────────────────────────────────────
   Routines — Pure helpers for data serialization
   ──────────────────────────────────────────── */

import {
  type RoutineExercise,
  type TrainingDay,
  type TemplateExercise,
  buildScheme,
} from "./types";

/* ────────────────────────────────────────────
   Flatten exercises for DB save (user_routines)
   ──────────────────────────────────────────── */

export interface FlatExercise {
  exercise_id: string;
  name: string;
  day_of_week: string;
  day_label: string;
  scheme: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_pause_sets: number;
  rir: number;
  target_weight: number | null;
  weight_kg: number;
  rest_s: number;
  progression_rule: string;
  coach_notes: string;
  order: number;
  week_of_month: number;
  mode: "equal" | "different";
  sets_config?: RoutineExercise["sets_config"];
  weekly_config?: RoutineExercise["weekly_config"];
  target_rpe: number | null;
}

/** Flatten training-day exercises into the shape expected by `user_routines.exercises` */
export function flattenExercisesForSave(trainingDays: TrainingDay[]): FlatExercise[] {
  return trainingDays.flatMap((day) =>
    day.exercises.map((ex) => {
      const scheme = buildScheme(ex);
      const sets = ex.mode === "different" ? ex.sets_config.length : ex.sets;
      const firstSet = ex.mode === "different" && ex.sets_config[0];
      return {
        exercise_id: ex.exercise_id,
        name: ex.name,
        day_of_week: day.key,
        day_label: day.dayLabel || day.label,
        scheme,
        sets,
        reps_min: firstSet ? firstSet.reps_min : ex.reps_min,
        reps_max: firstSet ? firstSet.reps_max : ex.reps_max,
        rest_pause_sets:
          ex.mode === "different"
            ? ex.sets_config.filter((s) => s.set_type && s.set_type !== "normal").length
            : ex.rest_pause_sets,
        rir: firstSet ? firstSet.rir : ex.rir,
        target_weight: firstSet ? firstSet.target_weight : ex.target_weight,
        weight_kg: (firstSet ? firstSet.target_weight : ex.target_weight) ?? 0,
        rest_s: firstSet ? firstSet.rest_s : ex.rest_s,
        progression_rule: ex.progression_rule,
        coach_notes: ex.coach_notes,
        order: ex.order,
        week_of_month: 1,
        mode: ex.mode,
        sets_config: ex.mode === "different" ? ex.sets_config : undefined,
        weekly_config:
          ex.weekly_config && Object.keys(ex.weekly_config).length > 0
            ? ex.weekly_config
            : undefined,
        target_rpe: ex.target_rpe ?? null,
      };
    })
  );
}

/* ────────────────────────────────────────────
   Build template exercises (strip weight & RIR)
   ──────────────────────────────────────────── */

/** Build template exercises from training days, stripping weight & RIR data */
export function buildTemplateExercises(trainingDays: TrainingDay[]): TemplateExercise[] {
  return trainingDays.flatMap((day) =>
    day.exercises.map((ex) => ({
      exercise_id: ex.exercise_id,
      name: ex.name,
      day_of_week: day.key,
      day_label: day.dayLabel || day.label,
      sets: ex.mode === "different" ? ex.sets_config.length : ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
      rest_pause_sets: ex.rest_pause_sets,
      rest_s: ex.rest_s,
      progression_rule: ex.progression_rule,
      coach_notes: ex.coach_notes,
      order: ex.order,
      mode: ex.mode,
      sets_config:
        ex.mode === "different"
          ? ex.sets_config.map(({ reps_min, reps_max, rest_s, target_rpe, set_type }) => ({
              reps_min,
              reps_max,
              rest_s,
              ...(target_rpe != null ? { target_rpe } : {}),
              ...(set_type && set_type !== "normal" ? { set_type } : {}),
            }))
          : undefined,
      weekly_config:
        ex.weekly_config && Object.keys(ex.weekly_config).length > 0
          ? Object.fromEntries(
              Object.entries(ex.weekly_config).map(([wk, wc]) => [
                Number(wk),
                {
                  sets: wc.sets,
                  reps_min: wc.reps_min,
                  reps_max: wc.reps_max,
                  rest_s: wc.rest_s,
                  target_rpe: wc.target_rpe,
                  coach_notes: wc.coach_notes,
                  sets_detail: wc.sets_detail
                    ? wc.sets_detail.map(({ reps_min, reps_max, rest_s, target_rpe, set_type }) => ({
                        reps_min,
                        reps_max,
                        rest_s,
                        ...(target_rpe != null ? { target_rpe } : {}),
                        ...(set_type && set_type !== "normal" ? { set_type } : {}),
                      }))
                    : undefined,
                },
              ])
            )
          : undefined,
    }))
  );
}
