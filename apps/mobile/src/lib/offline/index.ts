/**
 * Barrel export for offline infrastructure.
 *
 * All exports use dynamic imports internally — safe to import
 * in any environment (Expo Go, web, native builds).
 */

// Database
export { getDatabase, isDatabaseAvailable, resetDatabase } from "./database";

// Sync
export {
  syncWithSupabase,
  pushLocalChanges,
  countPendingChanges,
  getLastSyncAt,
  getCachedPendingCount,
} from "./sync";
export type { SyncResult } from "./sync";

// Schema
export { SCHEMA_VERSION, TABLE_DEFINITIONS } from "./schema";
export type { TableColumn, TableDef } from "./schema";

// Models
export {
  getRoutineModel,
  parseExercises,
  parseTrainingDays,
  parseWeeklyConfig,
  getWorkoutSessionModel,
  getWeightLogModel,
  parseSetsData,
} from "./models";
export type { RoutineRecord, WorkoutSessionRecord, WeightLogRecord, SetData } from "./models";
