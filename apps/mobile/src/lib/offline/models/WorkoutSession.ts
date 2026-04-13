/**
 * WatermelonDB Model — WorkoutSession (offline-first).
 *
 * Sessions can be created offline during training. When connectivity
 * returns, they are pushed to Supabase via sync.ts.
 * `needs_push = true` means the record has not been synced yet.
 */

import type { Model as WatermelonModel } from "@nozbe/watermelondb";

// ─── Interface for type safety ──────────────────────────────────────────────

export interface WorkoutSessionRecord {
  id: string;
  serverID: string | null;
  clientID: string;
  routineServerID: string;
  dayLabel: string;
  weekNumber: number;
  status: "in_progress" | "completed";
  mode: "registration" | "active";
  startedAt: string;
  completedAt: string | null;
  needsPush: boolean;
  syncedAt: number | null;
}

// ─── Model class ────────────────────────────────────────────────────────────

let _WorkoutSessionModel: typeof WatermelonModel | null = null;

export async function getWorkoutSessionModel(): Promise<typeof WatermelonModel | null> {
  if (_WorkoutSessionModel) return _WorkoutSessionModel;

  try {
    const WatermelonDB = await import("@nozbe/watermelondb");
    const { field, text } = await import("@nozbe/watermelondb/decorators");

    class WorkoutSession extends WatermelonDB.Model {
      static table = "workout_sessions";

      // @ts-expect-error — decorators applied at runtime
      @text("server_id") serverID!: string | null;
      // @ts-expect-error
      @text("client_id") clientID!: string;
      // @ts-expect-error
      @text("routine_server_id") routineServerID!: string;
      // @ts-expect-error
      @text("day_label") dayLabel!: string;
      // @ts-expect-error
      @field("week_number") weekNumber!: number;
      // @ts-expect-error
      @text("status") status!: string;
      // @ts-expect-error
      @text("mode") mode!: string;
      // @ts-expect-error
      @text("started_at") startedAt!: string;
      // @ts-expect-error
      @text("completed_at") completedAt!: string | null;
      // @ts-expect-error
      @field("needs_push") needsPush!: boolean;
      // @ts-expect-error
      @field("synced_at") syncedAt!: number | null;
    }

    _WorkoutSessionModel = WorkoutSession as unknown as typeof WatermelonModel;
    return _WorkoutSessionModel;
  } catch {
    console.warn("[Offline] WatermelonDB WorkoutSession model not available");
    return null;
  }
}
