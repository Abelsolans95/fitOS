/**
 * Supabase DB operations for routine screens.
 * Pure async functions — no React hooks, no state setters.
 * All follow Pattern C: destructure error, log, return result.
 */
import { supabase } from "../../lib/supabase";
import { QUERY_LIMITS } from "../../lib/constants";
import type { RoutineRaw, PreviousLog, InProgressSession, SavedLogEntry } from "./types";
import type { SetsDataRow } from "./routine-helpers";

const TAG = "[routine-db]";

// ─── Load routine + related data ─────────────────────────────────────────────

export interface LoadRoutineResult {
  routine: RoutineRaw | null;
  completedKeys: Set<string>;
  inProgressSession: InProgressSession | null;
  previousLogs: PreviousLog[];
}

export async function loadRoutineData(userId: string): Promise<LoadRoutineResult> {
  const result: LoadRoutineResult = {
    routine: null,
    completedKeys: new Set(),
    inProgressSession: null,
    previousLogs: [],
  };

  const { data: r, error: routineErr } = await supabase
    .from("user_routines")
    .select("id, title, goal, trainer_id, duration_months, exercises, days, total_weeks, current_week, training_days, sent_at")
    .eq("client_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (routineErr) {
    console.error(TAG, "Error loading routine:", routineErr); // No bloqueante
  }

  if (r) {
    result.routine = r as RoutineRaw;

    const { data: doneSessions, error: doneErr } = await supabase
      .from("workout_sessions")
      .select("day_label, week_number")
      .eq("client_id", userId)
      .eq("routine_id", result.routine.id)
      .eq("status", "completed");

    if (doneErr) {
      console.error(TAG, "Error loading completed sessions:", doneErr); // No bloqueante
    }
    if (doneSessions) {
      result.completedKeys = new Set(
        doneSessions.map((s: { day_label: string; week_number: number }) => `${s.day_label}::${s.week_number}`)
      );
    }
  }

  const { data: pendingSession, error: pendingErr } = await supabase
    .from("workout_sessions")
    .select("id, routine_id, day_label, week_number, created_at")
    .eq("client_id", userId)
    .eq("status", "in_progress")
    .eq("mode", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingErr) {
    console.error(TAG, "Error loading pending session:", pendingErr); // No bloqueante
  }
  if (pendingSession) {
    result.inProgressSession = pendingSession as InProgressSession;
  }

  const { data: logs, error: logsErr } = await supabase
    .from("weight_log")
    .select("exercise_name, session_date, sets_data")
    .eq("client_id", userId)
    .order("session_date", { ascending: false })
    .limit(QUERY_LIMITS.WEIGHT_LOG);

  if (logsErr) {
    console.error(TAG, "Error loading previous logs:", logsErr); // No bloqueante
  }
  if (logs) {
    result.previousLogs = logs as PreviousLog[];
  }

  return result;
}

// ─── Fetch previous logs (refresh) ──────────────────────────────────────────

export async function fetchPreviousLogs(userId: string): Promise<PreviousLog[]> {
  const { data, error } = await supabase
    .from("weight_log")
    .select("exercise_name, session_date, sets_data")
    .eq("client_id", userId)
    .order("session_date", { ascending: false })
    .limit(QUERY_LIMITS.WEIGHT_LOG);

  if (error) {
    console.error(TAG, "Error refreshing logs:", error); // No bloqueante
  }
  return (data as PreviousLog[]) ?? [];
}

// ─── Load session logs for resume ────────────────────────────────────────────

export async function fetchSessionLogs(sessionId: string): Promise<{ logs: SavedLogEntry[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("weight_log")
    .select("exercise_name, sets_data, client_notes")
    .eq("session_id", sessionId);

  if (error) {
    console.error(TAG, "Error loading session logs for resume:", error);
    return { logs: null, error: "No se pudieron cargar los datos de la sesión" };
  }
  return { logs: (data ?? []) as SavedLogEntry[], error: null };
}

// ─── Create workout session ──────────────────────────────────────────────────

export async function createWorkoutSession(params: {
  clientId: string;
  routineId: string;
  trainerId: string;
  dayLabel: string;
  weekNumber: number;
  mode: "registration" | "active";
}): Promise<{ sessionId: string | null; error: string | null }> {
  const { data: session, error } = await supabase.from("workout_sessions").insert({
    client_id: params.clientId,
    routine_id: params.routineId,
    trainer_id: params.trainerId,
    session_date: new Date().toISOString().split("T")[0],
    day_label: params.dayLabel,
    week_number: params.weekNumber,
    mode: params.mode,
    status: "in_progress",
  }).select("id").single();

  if (error || !session) {
    return { sessionId: null, error: `No se pudo crear la sesión: ${error?.message ?? "sin respuesta"}` };
  }
  return { sessionId: session.id, error: null };
}

// ─── Save partial progress (upsert weight_log) with 1 retry ─────────────────

export async function saveWeightLog(params: {
  userId: string;
  trainerId: string | undefined;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setsData: SetsDataRow[];
  totalVolume: number;
  notes: string | null;
  rpe: number | null;
  stressIndex: number;
  stimulus: number | null;
  fatigue: number | null;
}): Promise<boolean> {
  const payload = {
    sets_data: params.setsData,
    total_volume_kg: params.totalVolume,
    client_notes: params.notes,
    exercise_rpe: params.rpe,
    stress_index: params.stressIndex,
    stimulus_rating: params.stimulus,
    fatigue_rating: params.fatigue,
  };
  const today = new Date().toISOString().split("T")[0];

  const attempt = async (): Promise<boolean> => {
    const { data: existing, error: lookupErr } = await supabase
      .from("weight_log").select("id")
      .eq("session_id", params.sessionId).eq("exercise_name", params.exerciseName).maybeSingle();

    if (lookupErr) {
      console.error(TAG, "Error looking up weight_log:", lookupErr);
      return false;
    }

    if (existing) {
      const { error } = await supabase.from("weight_log").update(payload).eq("id", existing.id);
      if (error) { console.error(TAG, "Error updating weight_log:", error); return false; }
    } else {
      const { error } = await supabase.from("weight_log").insert({
        client_id: params.userId,
        trainer_id: params.trainerId,
        exercise_id: params.exerciseId,
        exercise_name: params.exerciseName,
        session_date: today,
        session_id: params.sessionId,
        ...payload,
      });
      if (error) { console.error(TAG, "Error inserting weight_log:", error); return false; }
    }
    return true;
  };

  let ok = await attempt();
  if (!ok) ok = await attempt(); // 1 retry
  return ok;
}

// ─── Batch insert weight_log (registration mode) ────────────────────────────

export async function batchInsertWeightLogs(
  inserts: Record<string, unknown>[]
): Promise<{ success: boolean }> {
  const { error } = await supabase.from("weight_log").insert(inserts);
  if (error) {
    console.error(TAG, "Error in batch insert weight_log:", error);
    return { success: false };
  }
  return { success: true };
}

// ─── Complete workout session ────────────────────────────────────────────────

export async function completeWorkoutSession(params: {
  sessionId: string;
  durationSeconds: number;
  totalVolume: number;
  totalSets: number;
  totalExercises: number;
  rpeSession: number;
}): Promise<void> {
  const { error } = await supabase.from("workout_sessions").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    duration_seconds: params.durationSeconds,
    total_volume_kg: params.totalVolume,
    total_sets: params.totalSets,
    total_exercises: params.totalExercises,
    rpe_session: params.rpeSession,
  }).eq("id", params.sessionId);

  if (error) {
    console.error(TAG, "Error completing workout session:", error);
  }
}

// ─── Save calendar entry + RPE history ───────────────────────────────────────

export async function saveCalendarEntry(params: {
  userId: string;
  routineTitle: string;
  selectedDay: string;
  dayLabel: string;
  rpeGlobal: number;
  totalVolume: number;
}): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const { data: existingCal, error: calErr } = await supabase
    .from("user_calendar").select("id")
    .eq("user_id", params.userId).eq("date", today).eq("activity_type", "workout").maybeSingle();

  if (calErr) {
    console.error(TAG, "Error checking calendar:", calErr); // No bloqueante
  }

  let calId: string | null = null;

  if (existingCal) {
    const { error } = await supabase
      .from("user_calendar").update({ completed: true, rpe: params.rpeGlobal }).eq("id", existingCal.id);
    if (error) console.error(TAG, "Error updating calendar:", error);
    calId = existingCal.id;
  } else {
    const { data: newCal, error } = await supabase.from("user_calendar").insert({
      user_id: params.userId,
      date: today,
      activity_type: "workout",
      activity_details: {
        nombre: params.routineTitle,
        dia: params.selectedDay,
        day_label: params.dayLabel,
      },
      completed: true,
      rpe: params.rpeGlobal,
    }).select("id").single();
    if (error) console.error(TAG, "Error inserting calendar:", error);
    calId = newCal?.id ?? null;
  }

  if (calId) {
    const { error } = await supabase.from("rpe_history").insert({
      client_id: params.userId,
      calendar_id: calId,
      rpe_global: params.rpeGlobal,
      total_volume_kg: params.totalVolume,
    });
    if (error) console.error(TAG, "Error inserting RPE history:", error);
  }
}

// ─── Insert single exercise log (saveAndNext for registration) ───────────────

export async function insertExerciseLog(params: {
  userId: string;
  trainerId: string | undefined;
  exerciseId: string;
  exerciseName: string;
  sessionId: string;
  setsData: { set_number: number; weight_kg: number; reps_done: number; type: string }[];
  totalVolume: number;
  notes: string | null;
}): Promise<{ success: boolean }> {
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("weight_log").insert({
    client_id: params.userId,
    trainer_id: params.trainerId,
    exercise_id: params.exerciseId,
    exercise_name: params.exerciseName,
    session_date: today,
    session_id: params.sessionId,
    sets_data: params.setsData,
    total_volume_kg: params.totalVolume,
    client_notes: params.notes,
  });
  if (error) {
    console.error(TAG, "Error in insertExerciseLog:", error);
    return { success: false };
  }
  return { success: true };
}
