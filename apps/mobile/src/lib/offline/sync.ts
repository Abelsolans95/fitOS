/**
 * Offline Sync — Pull from Supabase to local DB, push local changes back.
 *
 * Pull: routines, meal_plans, profiles → local WatermelonDB (read-only cache).
 * Push: workout_sessions, weight_log → Supabase (client data always wins).
 *
 * Conflict resolution:
 *   - Pull: server data replaces local cache (routines/plans are trainer-authored).
 *   - Push: client session/weight data always wins (user is source of truth).
 *   - Dedup: workout_sessions matched by day_label + week_number + routine to avoid duplicates.
 *
 * Uses dynamic imports for WatermelonDB — graceful no-op if unavailable.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";
import { getDatabase } from "./database";

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY_LAST_SYNC = "@fitos/offline_last_sync";
const STORAGE_KEY_PENDING_COUNT = "@fitos/offline_pending_count";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  pulled: number;
  pushed: number;
  errors: string[];
}

// ─── Main sync function ─────────────────────────────────────────────────────

/**
 * Full bidirectional sync:
 * 1. Push local changes to Supabase (workout_sessions, weight_log)
 * 2. Pull fresh data from Supabase (routines, meal_plans, profile)
 *
 * Safe to call multiple times — idempotent operations.
 */
export async function syncWithSupabase(userId: string): Promise<SyncResult> {
  const result: SyncResult = { success: false, pulled: 0, pushed: 0, errors: [] };

  const { db, available } = await getDatabase();
  if (!available || !db) {
    result.errors.push("Offline database not available");
    return result;
  }

  try {
    // Push first (so server has latest client data before we pull)
    const pushResult = await pushLocalChanges(userId);
    result.pushed = pushResult.pushed;
    result.errors.push(...pushResult.errors);

    // Then pull server data
    const pullResult = await pullFromSupabase(userId, db);
    result.pulled = pullResult.pulled;
    result.errors.push(...pullResult.errors);

    // Update last sync timestamp
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);

    // Update pending count
    const pending = await countPendingChanges(db);
    await AsyncStorage.setItem(STORAGE_KEY_PENDING_COUNT, String(pending));

    result.success = result.errors.length === 0;
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown sync error";
    console.error("[Offline Sync] Error:", msg);
    result.errors.push(msg);
    return result;
  }
}

// ─── Pull from Supabase ─────────────────────────────────────────────────────

async function pullFromSupabase(
  userId: string,
  db: import("@nozbe/watermelondb").Database
): Promise<{ pulled: number; errors: string[] }> {
  let pulled = 0;
  const errors: string[] = [];

  // Pull routines, meal plans, and profile in parallel
  const [routinesResult, mealPlansResult, profileResult] = await Promise.all([
    pullRoutines(userId, db).catch((err) => {
      errors.push(`Routines: ${err instanceof Error ? err.message : "error"}`);
      return 0;
    }),
    pullMealPlans(userId, db).catch((err) => {
      errors.push(`Meal plans: ${err instanceof Error ? err.message : "error"}`);
      return 0;
    }),
    pullProfile(userId, db).catch((err) => {
      errors.push(`Profile: ${err instanceof Error ? err.message : "error"}`);
      return 0;
    }),
  ]);

  pulled = routinesResult + mealPlansResult + profileResult;
  return { pulled, errors };
}

async function pullRoutines(
  userId: string,
  db: import("@nozbe/watermelondb").Database
): Promise<number> {
  const { data, error } = await supabase
    .from("user_routines")
    .select(
      "id, client_id, trainer_id, title, exercises, total_weeks, current_week, training_days, weekly_config, is_active, updated_at"
    )
    .eq("client_id", userId);

  if (error) {
    console.error("[Offline Sync] Error pulling routines:", error);
    return 0;
  }

  if (!data || data.length === 0) return 0;

  const routinesCollection = db.get("routines");
  const now = Date.now();

  await db.write(async () => {
    // Get existing local routines for this client
    const existing = await routinesCollection
      .query()
      .fetch();

    const existingByServerId = new Map<string, any>();
    for (const record of existing) {
      const serverId = (record as any).serverID ?? (record as any)._raw?.server_id;
      if (serverId) existingByServerId.set(serverId, record);
    }

    for (const routine of data) {
      const existingRecord = existingByServerId.get(routine.id);

      if (existingRecord) {
        // Update existing record
        await existingRecord.update((r: any) => {
          r.title = routine.title ?? "";
          r.exercisesJSON = JSON.stringify(routine.exercises ?? []);
          r.totalWeeks = routine.total_weeks ?? 1;
          r.currentWeek = routine.current_week ?? 1;
          r.trainingDaysJSON = JSON.stringify(routine.training_days ?? []);
          r.weeklyConfigJSON = JSON.stringify(routine.weekly_config ?? {});
          r.isActive = routine.is_active ?? false;
          r.syncedAt = now;
          r.serverUpdatedAt = routine.updated_at ?? null;
        });
      } else {
        // Create new local record
        await routinesCollection.create((r: any) => {
          r.serverID = routine.id;
          r.clientID = routine.client_id;
          r.trainerID = routine.trainer_id ?? "";
          r.title = routine.title ?? "";
          r.exercisesJSON = JSON.stringify(routine.exercises ?? []);
          r.totalWeeks = routine.total_weeks ?? 1;
          r.currentWeek = routine.current_week ?? 1;
          r.trainingDaysJSON = JSON.stringify(routine.training_days ?? []);
          r.weeklyConfigJSON = JSON.stringify(routine.weekly_config ?? {});
          r.isActive = routine.is_active ?? false;
          r.syncedAt = now;
          r.serverUpdatedAt = routine.updated_at ?? null;
        });
      }
    }

    // Remove local routines that no longer exist on server
    const serverIds = new Set(data.map((r) => r.id));
    for (const [serverId, record] of existingByServerId) {
      if (!serverIds.has(serverId)) {
        await record.markAsDeleted();
      }
    }
  });

  return data.length;
}

async function pullMealPlans(
  userId: string,
  db: import("@nozbe/watermelondb").Database
): Promise<number> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("id, client_id, title, days, target_kcal, period, updated_at")
    .eq("client_id", userId);

  if (error) {
    console.error("[Offline Sync] Error pulling meal plans:", error);
    return 0;
  }

  if (!data || data.length === 0) return 0;

  const mealPlansCollection = db.get("meal_plans");
  const now = Date.now();

  await db.write(async () => {
    const existing = await mealPlansCollection.query().fetch();
    const existingByServerId = new Map<string, any>();
    for (const record of existing) {
      const serverId = (record as any).serverID ?? (record as any)._raw?.server_id;
      if (serverId) existingByServerId.set(serverId, record);
    }

    for (const plan of data) {
      const existingRecord = existingByServerId.get(plan.id);

      if (existingRecord) {
        await existingRecord.update((r: any) => {
          r.title = plan.title ?? "";
          r.daysJSON = JSON.stringify(plan.days ?? {});
          r.targetKcal = plan.target_kcal ?? 0;
          r.period = plan.period ?? "weekly";
          r.syncedAt = now;
          r.serverUpdatedAt = plan.updated_at ?? null;
        });
      } else {
        await mealPlansCollection.create((r: any) => {
          r.serverID = plan.id;
          r.clientID = plan.client_id;
          r.title = plan.title ?? "";
          r.daysJSON = JSON.stringify(plan.days ?? {});
          r.targetKcal = plan.target_kcal ?? 0;
          r.period = plan.period ?? "weekly";
          r.syncedAt = now;
          r.serverUpdatedAt = plan.updated_at ?? null;
        });
      }
    }

    const serverIds = new Set(data.map((p) => p.id));
    for (const [serverId, record] of existingByServerId) {
      if (!serverIds.has(serverId)) {
        await record.markAsDeleted();
      }
    }
  });

  return data.length;
}

async function pullProfile(
  userId: string,
  db: import("@nozbe/watermelondb").Database
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, goal, height, weight, gender")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Offline Sync] Error pulling profile:", error);
    return 0;
  }

  if (!data) return 0;

  const profilesCollection = db.get("profiles_cache");
  const now = Date.now();

  await db.write(async () => {
    const existing = await profilesCollection.query().fetch();
    const existingRecord = existing.find(
      (r: any) => (r.serverID ?? r._raw?.server_id) === data.user_id
    );

    if (existingRecord) {
      await (existingRecord as any).update((r: any) => {
        r.fullName = data.full_name ?? "";
        r.goal = data.goal ?? "";
        r.height = data.height ?? 0;
        r.weight = data.weight ?? 0;
        r.gender = data.gender ?? "male";
        r.syncedAt = now;
      });
    } else {
      await profilesCollection.create((r: any) => {
        r.serverID = data.user_id;
        r.fullName = data.full_name ?? "";
        r.goal = data.goal ?? "";
        r.height = data.height ?? 0;
        r.weight = data.weight ?? 0;
        r.gender = data.gender ?? "male";
        r.syncedAt = now;
      });
    }
  });

  return 1;
}

// ─── Push local changes to Supabase ─────────────────────────────────────────

/**
 * Push workout_sessions and weight_log records that have needs_push=true.
 * Client data always wins — no merge conflict resolution needed.
 */
export async function pushLocalChanges(
  userId: string
): Promise<{ pushed: number; errors: string[] }> {
  let pushed = 0;
  const errors: string[] = [];

  const { db, available } = await getDatabase();
  if (!available || !db) {
    return { pushed, errors: ["Database not available"] };
  }

  try {
    // Push sessions first (weight_log depends on session server IDs)
    const sessionsPushed = await pushWorkoutSessions(userId, db);
    pushed += sessionsPushed;

    // Then push weight log entries
    const weightLogPushed = await pushWeightLogs(userId, db);
    pushed += weightLogPushed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Push error";
    console.error("[Offline Sync] Push error:", msg);
    errors.push(msg);
  }

  return { pushed, errors };
}

async function pushWorkoutSessions(
  userId: string,
  db: import("@nozbe/watermelondb").Database
): Promise<number> {
  const WatermelonQ = await importQ();
  if (!WatermelonQ) return 0;

  const sessionsCollection = db.get("workout_sessions");
  const pendingSessions = await sessionsCollection
    .query(WatermelonQ.where("needs_push", true))
    .fetch();

  if (pendingSessions.length === 0) return 0;

  let pushed = 0;

  for (const session of pendingSessions) {
    const raw = session as any;

    try {
      // Check if session already exists on server (dedup by day_label + week_number + routine)
      const { data: existing, error: checkError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("client_id", userId)
        .eq("routine_id", raw.routineServerID ?? raw._raw?.routine_server_id)
        .eq("day_label", raw.dayLabel ?? raw._raw?.day_label)
        .eq("week_number", raw.weekNumber ?? raw._raw?.week_number)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error("[Offline Sync] Error checking session:", checkError);
        continue;
      }

      let serverSessionId: string;

      if (existing) {
        // Update existing server session
        serverSessionId = existing.id;
        const { error: updateError } = await supabase
          .from("workout_sessions")
          .update({
            status: raw.status ?? raw._raw?.status,
            completed_at: raw.completedAt ?? raw._raw?.completed_at,
          })
          .eq("id", serverSessionId);

        if (updateError) {
          console.error("[Offline Sync] Error updating session:", updateError);
          continue;
        }
      } else {
        // Insert new session
        const { data: inserted, error: insertError } = await supabase
          .from("workout_sessions")
          .insert({
            client_id: userId,
            routine_id: raw.routineServerID ?? raw._raw?.routine_server_id,
            day_label: raw.dayLabel ?? raw._raw?.day_label,
            week_number: raw.weekNumber ?? raw._raw?.week_number,
            status: raw.status ?? raw._raw?.status,
            mode: raw.mode ?? raw._raw?.mode,
            started_at: raw.startedAt ?? raw._raw?.started_at,
            completed_at: raw.completedAt ?? raw._raw?.completed_at,
          })
          .select("id")
          .single();

        if (insertError || !inserted) {
          console.error("[Offline Sync] Error inserting session:", insertError);
          continue;
        }
        serverSessionId = inserted.id;
      }

      // Mark as synced
      await db.write(async () => {
        await session.update((s: any) => {
          s.serverID = serverSessionId;
          s.needsPush = false;
          s.syncedAt = Date.now();
        });
      });

      // Update weight_log entries that reference this local session
      await db.write(async () => {
        const weightLogCollection = db.get("weight_log");
        if (!WatermelonQ) return;
        const relatedLogs = await weightLogCollection
          .query(WatermelonQ.where("session_local_id", session.id))
          .fetch();

        for (const log of relatedLogs) {
          await log.update((l: any) => {
            l.sessionServerID = serverSessionId;
          });
        }
      });

      pushed++;
    } catch (err) {
      console.error("[Offline Sync] Error pushing session:", err);
    }
  }

  return pushed;
}

async function pushWeightLogs(
  userId: string,
  db: import("@nozbe/watermelondb").Database
): Promise<number> {
  const WatermelonQ = await importQ();
  if (!WatermelonQ) return 0;

  const weightLogCollection = db.get("weight_log");
  const pendingLogs = await weightLogCollection
    .query(WatermelonQ.where("needs_push", true))
    .fetch();

  if (pendingLogs.length === 0) return 0;

  let pushed = 0;

  for (const log of pendingLogs) {
    const raw = log as any;

    const sessionServerId = raw.sessionServerID ?? raw._raw?.session_server_id;
    if (!sessionServerId) {
      // Session hasn't been pushed yet — skip, will retry next sync
      continue;
    }

    try {
      let setsData: unknown[];
      try {
        setsData = JSON.parse(raw.setsDataJSON ?? raw._raw?.sets_data_json ?? "[]");
      } catch {
        setsData = [];
      }

      const payload = {
        session_id: sessionServerId,
        client_id: userId,
        exercise_id: raw.exerciseID ?? raw._raw?.exercise_id,
        exercise_name: raw.exerciseName ?? raw._raw?.exercise_name,
        sets_data: setsData,
        exercise_rpe: raw.exerciseRPE ?? raw._raw?.exercise_rpe ?? null,
        client_notes: raw.clientNotes ?? raw._raw?.client_notes ?? null,
        stress_index: raw.stressIndex ?? raw._raw?.stress_index ?? null,
        stimulus_rating: raw.stimulusRating ?? raw._raw?.stimulus_rating ?? null,
        fatigue_rating: raw.fatigueRating ?? raw._raw?.fatigue_rating ?? null,
      };

      const existingServerId = raw.serverID ?? raw._raw?.server_id;

      if (existingServerId) {
        // Update existing — client data always wins
        const { error } = await supabase
          .from("weight_log")
          .update(payload)
          .eq("id", existingServerId);

        if (error) {
          console.error("[Offline Sync] Error updating weight_log:", error);
          continue;
        }
      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from("weight_log")
          .insert(payload)
          .select("id")
          .single();

        if (error || !inserted) {
          console.error("[Offline Sync] Error inserting weight_log:", error);
          continue;
        }

        await db.write(async () => {
          await log.update((l: any) => {
            l.serverID = inserted.id;
          });
        });
      }

      // Mark as synced
      await db.write(async () => {
        await log.update((l: any) => {
          l.needsPush = false;
          l.syncedAt = Date.now();
        });
      });

      pushed++;
    } catch (err) {
      console.error("[Offline Sync] Error pushing weight_log:", err);
    }
  }

  return pushed;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Count records with needs_push=true across all writable tables.
 */
export async function countPendingChanges(
  db?: import("@nozbe/watermelondb").Database | null
): Promise<number> {
  if (!db) {
    const state = await getDatabase();
    if (!state.available || !state.db) return 0;
    db = state.db;
  }

  const WatermelonQ = await importQ();
  if (!WatermelonQ) return 0;

  try {
    const [sessions, logs] = await Promise.all([
      db.get("workout_sessions").query(WatermelonQ.where("needs_push", true)).fetchCount(),
      db.get("weight_log").query(WatermelonQ.where("needs_push", true)).fetchCount(),
    ]);
    return sessions + logs;
  } catch {
    return 0;
  }
}

/**
 * Get the timestamp of the last successful sync.
 */
export async function getLastSyncAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
  } catch {
    return null;
  }
}

/**
 * Get cached pending changes count (without querying DB).
 */
export async function getCachedPendingCount(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_PENDING_COUNT);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

// ─── Dynamic import for Q (query helpers) ───────────────────────────────────

async function importQ(): Promise<typeof import("@nozbe/watermelondb/QueryDescription") | null> {
  try {
    return await import("@nozbe/watermelondb/QueryDescription");
  } catch {
    console.warn("[Offline Sync] WatermelonDB Q not available");
    return null;
  }
}
