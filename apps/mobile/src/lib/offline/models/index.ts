/**
 * Barrel export for WatermelonDB models.
 *
 * All model getters use dynamic imports so this file is safe to import
 * even when WatermelonDB native modules are absent (Expo Go, web).
 */

export { getRoutineModel, parseExercises, parseTrainingDays, parseWeeklyConfig } from "./Routine";
export type { RoutineRecord } from "./Routine";

export { getWorkoutSessionModel } from "./WorkoutSession";
export type { WorkoutSessionRecord } from "./WorkoutSession";

export { getWeightLogModel, parseSetsData } from "./WeightLog";
export type { WeightLogRecord, SetData } from "./WeightLog";
