/**
 * WatermelonDB Database initialization — Offline storage for Kuvox.
 *
 * Uses dynamic imports to avoid crashes in Expo Go or environments
 * where the native SQLite adapter is not available (requires prebuild).
 *
 * Pattern: same as health-sync.ts — graceful degradation via try/catch
 * around dynamic import().
 */

import { TABLE_DEFINITIONS, SCHEMA_VERSION } from "./schema";
import type { TableColumn } from "./schema";

// ─── Types ──────────────────────────────────────────────────────────────────

type WatermelonDatabase = import("@nozbe/watermelondb").Database;

interface DatabaseState {
  db: WatermelonDatabase | null;
  available: boolean;
  error: string | null;
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let _state: DatabaseState | null = null;
let _initPromise: Promise<DatabaseState> | null = null;

/**
 * Get (or initialize) the WatermelonDB database instance.
 *
 * Returns { db, available, error }:
 * - available=true, db set  → WatermelonDB is ready
 * - available=false, db=null → native module missing (Expo Go, web)
 *
 * Safe to call multiple times — singleton pattern.
 */
export async function getDatabase(): Promise<DatabaseState> {
  if (_state) return _state;

  // Avoid multiple parallel initializations
  if (_initPromise) return _initPromise;

  _initPromise = initDatabase();
  _state = await _initPromise;
  _initPromise = null;
  return _state;
}

/**
 * Check if offline DB is available without initializing.
 * Returns false if getDatabase() hasn't been called yet.
 */
export function isDatabaseAvailable(): boolean {
  return _state?.available ?? false;
}

// ─── Initialization ─────────────────────────────────────────────────────────

async function initDatabase(): Promise<DatabaseState> {
  try {
    // Dynamic imports — will throw if native modules are absent
    const WatermelonDB = await import("@nozbe/watermelondb");
    const { appSchema, tableSchema } = await import(
      "@nozbe/watermelondb/Schema"
    );

    // Import SQLite adapter dynamically
    const SQLiteAdapterModule = await import(
      "@nozbe/watermelondb/adapters/sqlite"
    );
    const SQLiteAdapter =
      SQLiteAdapterModule.default ?? (SQLiteAdapterModule as any).SQLiteAdapter;

    // Import model classes
    const { getRoutineModel } = await import("./models/Routine");
    const { getWorkoutSessionModel } = await import("./models/WorkoutSession");
    const { getWeightLogModel } = await import("./models/WeightLog");

    const [RoutineModel, WorkoutSessionModel, WeightLogModel] =
      await Promise.all([
        getRoutineModel(),
        getWorkoutSessionModel(),
        getWeightLogModel(),
      ]);

    if (!RoutineModel || !WorkoutSessionModel || !WeightLogModel) {
      return { db: null, available: false, error: "Models could not be loaded" };
    }

    // Build schema from our plain definitions
    const schema = appSchema({
      version: SCHEMA_VERSION,
      tables: TABLE_DEFINITIONS.map((tableDef) =>
        tableSchema({
          name: tableDef.name,
          columns: tableDef.columns.map((col: TableColumn) => ({
            name: col.name,
            type: col.type,
            isOptional: col.isOptional ?? false,
            isIndexed: col.isIndexed ?? false,
          })),
        })
      ),
    });

    // Create adapter
    const adapter = new SQLiteAdapter({
      schema,
      dbName: "fitos_offline",
      jsi: false, // JSI can be unstable — use bridge mode
    });

    // Create database
    const database = new WatermelonDB.Database({
      adapter,
      modelClasses: [RoutineModel, WorkoutSessionModel, WeightLogModel],
    });

    console.log("[Offline] WatermelonDB initialized successfully");
    return { db: database, available: true, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown initialization error";
    console.warn("[Offline] WatermelonDB not available:", message);
    return { db: null, available: false, error: message };
  }
}

/**
 * Reset the database (for testing/debugging). Clears all local data.
 */
export async function resetDatabase(): Promise<boolean> {
  try {
    const { db, available } = await getDatabase();
    if (!available || !db) return false;

    await db.write(async () => {
      await db.unsafeResetDatabase();
    });
    console.log("[Offline] Database reset successfully");
    return true;
  } catch (err) {
    console.error("[Offline] Error resetting database:", err);
    return false;
  }
}
