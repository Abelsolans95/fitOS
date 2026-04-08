/**
 * WatermelonDB Model — WeightLog (offline-first).
 *
 * Weight log entries are created locally per set/exercise during training.
 * The sets_data is stored as stringified JSON matching the Supabase schema.
 * Pushed to server when connectivity returns.
 */

import type { Model as WatermelonModel } from "@nozbe/watermelondb";

// ─── Interface for type safety ──────────────────────────────────────────────

export interface WeightLogRecord {
  id: string;
  serverID: string | null;
  sessionLocalID: string;
  sessionServerID: string | null;
  clientID: string;
  exerciseID: string;
  exerciseName: string;
  setsDataJSON: string;
  exerciseRPE: number | null;
  clientNotes: string | null;
  stressIndex: number | null;
  stimulusRating: number | null;
  fatigueRating: number | null;
  needsPush: boolean;
  syncedAt: number | null;
}

// ─── Parsed helpers ─────────────────────────────────────────────────────────

export interface SetData {
  weight?: number;
  reps?: number;
  completed?: boolean;
  rpe?: number;
  set_type?: string;
  [key: string]: unknown;
}

export function parseSetsData(json: string): SetData[] {
  try {
    return JSON.parse(json) ?? [];
  } catch {
    return [];
  }
}

// ─── Model class ────────────────────────────────────────────────────────────

let _WeightLogModel: typeof WatermelonModel | null = null;

export async function getWeightLogModel(): Promise<typeof WatermelonModel | null> {
  if (_WeightLogModel) return _WeightLogModel;

  try {
    const WatermelonDB = await import("@nozbe/watermelondb");
    const { field, text } = await import("@nozbe/watermelondb/decorators");

    class WeightLog extends WatermelonDB.Model {
      static table = "weight_log";

      // @ts-expect-error — decorators applied at runtime
      @text("server_id") serverID!: string | null;
      // @ts-expect-error
      @text("session_local_id") sessionLocalID!: string;
      // @ts-expect-error
      @text("session_server_id") sessionServerID!: string | null;
      // @ts-expect-error
      @text("client_id") clientID!: string;
      // @ts-expect-error
      @text("exercise_id") exerciseID!: string;
      // @ts-expect-error
      @text("exercise_name") exerciseName!: string;
      // @ts-expect-error
      @text("sets_data_json") setsDataJSON!: string;
      // @ts-expect-error
      @field("exercise_rpe") exerciseRPE!: number | null;
      // @ts-expect-error
      @text("client_notes") clientNotes!: string | null;
      // @ts-expect-error
      @field("stress_index") stressIndex!: number | null;
      // @ts-expect-error
      @field("stimulus_rating") stimulusRating!: number | null;
      // @ts-expect-error
      @field("fatigue_rating") fatigueRating!: number | null;
      // @ts-expect-error
      @field("needs_push") needsPush!: boolean;
      // @ts-expect-error
      @field("synced_at") syncedAt!: number | null;

      get setsData(): SetData[] {
        return parseSetsData(this.setsDataJSON);
      }
    }

    _WeightLogModel = WeightLog as unknown as typeof WatermelonModel;
    return _WeightLogModel;
  } catch {
    console.warn("[Offline] WatermelonDB WeightLog model not available");
    return null;
  }
}
