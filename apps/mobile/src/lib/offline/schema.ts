/**
 * WatermelonDB Schema — Offline tables for FitOS mobile client.
 *
 * Only the fields needed for offline training are included.
 * Mirrors a subset of Supabase tables: user_routines, workout_sessions,
 * weight_log, meal_plans, and a profiles cache.
 *
 * Schema version MUST be bumped on every migration.
 */

// Dynamic import guard — schema definition is plain data so it can
// be imported safely even if WatermelonDB native module is absent.
// The actual `appSchema` / `tableSchema` helpers are tiny JS functions
// with no native dependency, but we still guard in case the package
// itself fails to resolve (e.g. missing optional peer deps).

export const SCHEMA_VERSION = 1;

export interface TableColumn {
  name: string;
  type: "string" | "number" | "boolean";
  isOptional?: boolean;
  isIndexed?: boolean;
}

export interface TableDef {
  name: string;
  columns: TableColumn[];
}

/**
 * Raw table definitions — used by the dynamic schema builder in database.ts.
 * Keeping them as plain objects avoids importing WatermelonDB at module level.
 */
export const TABLE_DEFINITIONS: TableDef[] = [
  // ── Routines (read-only offline cache) ──────────────────────────────────────
  {
    name: "routines",
    columns: [
      { name: "server_id", type: "string", isIndexed: true },
      { name: "client_id", type: "string", isIndexed: true },
      { name: "trainer_id", type: "string" },
      { name: "title", type: "string" },
      { name: "exercises_json", type: "string" }, // JSONB stringified
      { name: "total_weeks", type: "number" },
      { name: "current_week", type: "number" },
      { name: "training_days_json", type: "string" }, // TEXT[] stringified
      { name: "weekly_config_json", type: "string" }, // JSONB stringified
      { name: "is_active", type: "boolean" },
      { name: "synced_at", type: "number" }, // timestamp ms
      { name: "server_updated_at", type: "string", isOptional: true },
    ],
  },

  // ── Workout Sessions (created offline, pushed on reconnect) ─────────────────
  {
    name: "workout_sessions",
    columns: [
      { name: "server_id", type: "string", isOptional: true, isIndexed: true },
      { name: "client_id", type: "string", isIndexed: true },
      { name: "routine_server_id", type: "string" },
      { name: "day_label", type: "string" },
      { name: "week_number", type: "number" },
      { name: "status", type: "string" }, // "in_progress" | "completed"
      { name: "mode", type: "string" }, // "registration" | "active"
      { name: "started_at", type: "string" },
      { name: "completed_at", type: "string", isOptional: true },
      { name: "needs_push", type: "boolean" }, // true = not yet synced to server
      { name: "synced_at", type: "number", isOptional: true },
    ],
  },

  // ── Weight Log entries (created offline per set, pushed on reconnect) ───────
  {
    name: "weight_log",
    columns: [
      { name: "server_id", type: "string", isOptional: true, isIndexed: true },
      { name: "session_local_id", type: "string", isIndexed: true }, // local WatermelonDB id
      { name: "session_server_id", type: "string", isOptional: true },
      { name: "client_id", type: "string", isIndexed: true },
      { name: "exercise_id", type: "string" },
      { name: "exercise_name", type: "string" },
      { name: "sets_data_json", type: "string" }, // JSONB stringified
      { name: "exercise_rpe", type: "number", isOptional: true },
      { name: "client_notes", type: "string", isOptional: true },
      { name: "stress_index", type: "number", isOptional: true },
      { name: "stimulus_rating", type: "number", isOptional: true },
      { name: "fatigue_rating", type: "number", isOptional: true },
      { name: "needs_push", type: "boolean" },
      { name: "synced_at", type: "number", isOptional: true },
    ],
  },

  // ── Meal Plans (read-only offline cache) ────────────────────────────────────
  {
    name: "meal_plans",
    columns: [
      { name: "server_id", type: "string", isIndexed: true },
      { name: "client_id", type: "string", isIndexed: true },
      { name: "title", type: "string" },
      { name: "days_json", type: "string" }, // JSONB stringified
      { name: "target_kcal", type: "number" },
      { name: "period", type: "string" },
      { name: "synced_at", type: "number" },
      { name: "server_updated_at", type: "string", isOptional: true },
    ],
  },

  // ── Profiles cache (minimal subset for offline display) ─────────────────────
  {
    name: "profiles_cache",
    columns: [
      { name: "server_id", type: "string", isIndexed: true }, // user_id
      { name: "full_name", type: "string", isOptional: true },
      { name: "goal", type: "string", isOptional: true },
      { name: "height", type: "number", isOptional: true },
      { name: "weight", type: "number", isOptional: true },
      { name: "gender", type: "string", isOptional: true },
      { name: "synced_at", type: "number" },
    ],
  },

  // ── Sync metadata (tracks last successful sync per table) ───────────────────
  {
    name: "sync_metadata",
    columns: [
      { name: "table_name", type: "string", isIndexed: true },
      { name: "last_pulled_at", type: "number" }, // timestamp ms
      { name: "last_pushed_at", type: "number", isOptional: true },
    ],
  },
];
