/**
 * WatermelonDB Model — Routine (offline cache of user_routines).
 *
 * Read-only locally — pulled from Supabase, never modified offline.
 * The exercises, training_days, and weekly_config are stored as
 * stringified JSON and parsed via getters.
 */

import type { Model as WatermelonModel } from "@nozbe/watermelondb";

// ─── Interface for type safety when native module is unavailable ─────────────

export interface RoutineRecord {
  id: string;
  serverID: string;
  clientID: string;
  trainerID: string;
  title: string;
  exercisesJSON: string;
  totalWeeks: number;
  currentWeek: number;
  trainingDaysJSON: string;
  weeklyConfigJSON: string;
  isActive: boolean;
  syncedAt: number;
  serverUpdatedAt: string | null;
}

// ─── Parsed helpers ─────────────────────────────────────────────────────────

export function parseExercises(json: string): unknown[] {
  try {
    return JSON.parse(json) ?? [];
  } catch {
    return [];
  }
}

export function parseTrainingDays(json: string): string[] {
  try {
    return JSON.parse(json) ?? [];
  } catch {
    return [];
  }
}

export function parseWeeklyConfig(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
}

// ─── Model class (created dynamically to avoid top-level import) ────────────

let _RoutineModel: typeof WatermelonModel | null = null;

/**
 * Get the Routine WatermelonDB Model class.
 * Returns null if WatermelonDB native module is not available.
 */
export async function getRoutineModel(): Promise<typeof WatermelonModel | null> {
  if (_RoutineModel) return _RoutineModel;

  try {
    const WatermelonDB = await import("@nozbe/watermelondb");
    const { field, text, readonly: readonlyDecorator } = await import(
      "@nozbe/watermelondb/decorators"
    );

    class Routine extends WatermelonDB.Model {
      static table = "routines";

      // @ts-expect-error — decorators applied at runtime
      @text("server_id") serverID!: string;
      // @ts-expect-error
      @text("client_id") clientID!: string;
      // @ts-expect-error
      @text("trainer_id") trainerID!: string;
      // @ts-expect-error
      @text("title") title!: string;
      // @ts-expect-error
      @text("exercises_json") exercisesJSON!: string;
      // @ts-expect-error
      @field("total_weeks") totalWeeks!: number;
      // @ts-expect-error
      @field("current_week") currentWeek!: number;
      // @ts-expect-error
      @text("training_days_json") trainingDaysJSON!: string;
      // @ts-expect-error
      @text("weekly_config_json") weeklyConfigJSON!: string;
      // @ts-expect-error
      @field("is_active") isActive!: boolean;
      // @ts-expect-error
      @field("synced_at") syncedAt!: number;
      // @ts-expect-error
      @text("server_updated_at") serverUpdatedAt!: string | null;

      get exercises(): unknown[] {
        return parseExercises(this.exercisesJSON);
      }

      get trainingDays(): string[] {
        return parseTrainingDays(this.trainingDaysJSON);
      }

      get weeklyConfig(): Record<string, unknown> {
        return parseWeeklyConfig(this.weeklyConfigJSON);
      }
    }

    _RoutineModel = Routine as unknown as typeof WatermelonModel;
    return _RoutineModel;
  } catch {
    console.warn("[Offline] WatermelonDB Routine model not available");
    return null;
  }
}
