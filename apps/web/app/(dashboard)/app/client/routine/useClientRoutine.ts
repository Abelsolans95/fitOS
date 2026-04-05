"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { QUERY_LIMITS } from "@/lib/constants";
import { toast } from "sonner";
import type { PreviousLog } from "./active/types";

import {
  clientRoutineReducer,
  initialState,
} from "./client-routine-reducer";
import type { RoutineRaw, InProgressSession } from "./client-routine-reducer";

import {
  DAY_LABELS,
  DAY_SHORT,
  parseExercisesFromRoutine,
  extractTrainingDays,
  getExercisesForDay,
  resolveDayLabel,
  resolveWeekCount,
  getPreviousLogSets,
  formatPreviousLog,
  buildSessionInputs,
  buildWeightLogInserts,
} from "./client-routine-helpers";

/* Re-exports for consumers that import from this file */
export { DAY_LABELS, DAY_SHORT };
export type { ClientRoutineAction, ClientRoutineState, RoutineRaw, SetInput } from "./client-routine-reducer";

/* ────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────── */

export function useClientRoutine() {
  const [state, dispatch] = useReducer(clientRoutineReducer, initialState);

  /* ── Initial data load ── */
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          dispatch({ type: "SET_ERROR", error: "No se pudo obtener la sesión." });
          return;
        }

        // Parallel batch 1: in_progress session + active routine (independent)
        const [pendingRes, routineRes] = await Promise.all([
          supabase
            .from("workout_sessions")
            .select("id, routine_id, day_label, week_number")
            .eq("client_id", user.id)
            .eq("status", "in_progress")
            .eq("mode", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("user_routines")
            .select("id,title,goal,duration_months,total_weeks,exercises,is_active,sent_at,created_at,trainer_id")
            .eq("client_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (pendingRes.error) {
          console.error("[ClientRoutine] Error al buscar sesión pendiente:", pendingRes.error);
        }

        let routineData = null;
        if (routineRes.error) {
          console.error("[ClientRoutine] Error al buscar rutina:", routineRes.error);
        } else if (routineRes.data) {
          routineData = routineRes.data;
        }

        // Only show in-progress session if it belongs to the current active routine
        const inProgressSession =
          pendingRes.data && routineData && pendingRes.data.routine_id === routineData.id
            ? (pendingRes.data as InProgressSession)
            : null;

        let previousLogs: PreviousLog[] = [];
        let completedSessions = new Set<string>();

        if (routineData) {
          // Parallel batch 2: completed sessions + weight logs (independent)
          const [doneRes, logsRes] = await Promise.all([
            supabase
              .from("workout_sessions")
              .select("day_label, week_number")
              .eq("client_id", user.id)
              .eq("routine_id", routineData.id)
              .eq("status", "completed"),
            supabase
              .from("weight_log")
              .select("exercise_name, session_date, sets_data")
              .eq("client_id", user.id)
              .order("session_date", { ascending: false })
              .limit(QUERY_LIMITS.WEIGHT_LOG),
          ]);

          if (doneRes.error) {
            console.error("[ClientRoutine] Error al cargar sesiones completadas:", doneRes.error);
          }
          if (doneRes.data) {
            completedSessions = new Set(
              doneRes.data.map(
                (s: { day_label: string; week_number: number }) =>
                  `${s.day_label}::${s.week_number}`
              )
            );
          }

          if (logsRes.error) {
            console.error("[ClientRoutine] Error al cargar historial de pesos:", logsRes.error);
          }
          if (logsRes.data) {
            previousLogs = logsRes.data as PreviousLog[];
          }
        }

        dispatch({
          type: "LOAD_SUCCESS",
          userId: user.id,
          routine: routineData ? (routineData as RoutineRaw) : null,
          previousLogs,
          completedSessions,
          inProgressSession,
        });
      } catch {
        dispatch({ type: "SET_ERROR", error: "Error inesperado." });
      }
    };
    load();
  }, []);

  /* ── Derived data (pure helpers) ── */
  const parsedExercises = useMemo(
    () => parseExercisesFromRoutine(state.routine),
    [state.routine]
  );

  const trainingDays = useMemo(
    () => extractTrainingDays(parsedExercises),
    [parsedExercises]
  );

  const dayExercises = useMemo(
    () => getExercisesForDay(parsedExercises, state.activeDay),
    [parsedExercises, state.activeDay]
  );

  const dayLabel = useMemo(
    () => resolveDayLabel(parsedExercises, state.activeDay),
    [parsedExercises, state.activeDay]
  );

  const isSessionCompleted = useMemo(() => {
    if (!dayLabel || !state.activeWeek) return false;
    return state.completedSessions.has(`${dayLabel}::${state.activeWeek}`);
  }, [state.completedSessions, dayLabel, state.activeWeek]);

  const weekCount = resolveWeekCount(state.routine);

  /* ── Set initial active day ── */
  useEffect(() => {
    if (trainingDays.length > 0 && !state.activeDay) {
      dispatch({ type: "SET_ACTIVE_DAY", day: trainingDays[0] });
    }
  }, [trainingDays, state.activeDay]);

  /* ── Previous log helpers ── */
  const getPreviousLog = useCallback(
    (exerciseName: string) => getPreviousLogSets(state.previousLogs, exerciseName),
    [state.previousLogs]
  );

  const formatPrevious = useCallback(
    (exerciseName: string) => formatPreviousLog(state.previousLogs, exerciseName),
    [state.previousLogs]
  );

  /* ── Start tracking ── */
  const startTracking = useCallback(() => {
    const sessionInputs = buildSessionInputs(dayExercises, state.previousLogs);
    dispatch({ type: "START_TRACKING", sessionInputs });
  }, [dayExercises, state.previousLogs]);

  /* ── Update set value ── */
  const updateSet = useCallback(
    (
      exerciseName: string,
      setIndex: number,
      field: "weight_kg" | "reps_done",
      value: string
    ) => {
      dispatch({ type: "UPDATE_SET", exerciseName, setIndex, field, value });
    },
    []
  );

  /* ── Save session ── */
  const handleSaveSession = useCallback(async () => {
    if (!state.userId || !state.activeDay) return;
    dispatch({ type: "SET_SAVING", saving: true });

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      // Create workout_session first
      const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          client_id: state.userId,
          routine_id: state.routine?.id,
          trainer_id: state.routine?.trainer_id ?? null,
          session_date: today,
          day_label: dayLabel,
          week_number: state.activeWeek,
          mode: "registration",
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sessionError) {
        console.error("[ClientRoutine] Error al crear sesión:", sessionError);
        toast.error("Error al crear la sesión de entrenamiento");
        dispatch({ type: "SET_SAVING", saving: false });
        return;
      }

      const currentSessionId = session?.id ?? null;

      const weightLogInserts = buildWeightLogInserts({
        dayExercises,
        sessionInputs: state.sessionInputs,
        exerciseRpe: state.exerciseRpe,
        userId: state.userId,
        sessionDate: today,
        sessionId: currentSessionId,
      });

      const { error: weightError } = await supabase
        .from("weight_log")
        .insert(weightLogInserts);

      if (weightError) {
        toast.error("Error al guardar la sesión");
        dispatch({ type: "SET_SAVING", saving: false });
        return;
      }

      // Update session aggregates
      if (currentSessionId) {
        const totalVol = weightLogInserts.reduce((s, w) => s + w.total_volume_kg, 0);
        const totalSets = weightLogInserts.reduce((s, w) => s + (w.sets_data?.length ?? 0), 0);
        const { error: updateErr } = await supabase
          .from("workout_sessions")
          .update({
            total_volume_kg: totalVol,
            total_sets: totalSets,
            total_exercises: dayExercises.length,
            rpe_session: state.rpeGlobal,
          })
          .eq("id", currentSessionId);
        if (updateErr) {
          console.error("[ClientRoutine] Error al actualizar agregados de sesión:", updateErr);
        }
      }

      // Calendar entry
      await saveCalendarEntry(supabase, {
        userId: state.userId!,
        today,
        rpeGlobal: state.rpeGlobal,
        routine: state.routine,
        activeDay: state.activeDay!,
        dayLabel,
      });

      // RPE history
      await saveRpeHistory(supabase, {
        userId: state.userId!,
        today,
        rpeGlobal: state.rpeGlobal,
        totalVolume: weightLogInserts.reduce((s, w) => s + w.total_volume_kg, 0),
      });

      toast.success("Sesión guardada correctamente");

      // Reload previous logs
      const { data: newLogs, error: reloadErr } = await supabase
        .from("weight_log")
        .select("exercise_name, session_date, sets_data")
        .eq("client_id", state.userId)
        .order("session_date", { ascending: false })
        .limit(QUERY_LIMITS.WEIGHT_LOG);
      if (reloadErr) {
        console.error("[ClientRoutine] Error al recargar historial:", reloadErr);
      }

      dispatch({
        type: "SESSION_SAVED",
        previousLogs: newLogs ? (newLogs as PreviousLog[]) : state.previousLogs,
      });
    } catch {
      toast.error("Error inesperado");
      dispatch({ type: "SET_SAVING", saving: false });
    }
  }, [
    state.userId,
    state.activeDay,
    state.routine,
    state.activeWeek,
    state.sessionInputs,
    state.exerciseRpe,
    state.rpeGlobal,
    state.previousLogs,
    dayLabel,
    dayExercises,
  ]);

  return {
    state,
    dispatch,
    // Derived data
    parsedExercises,
    trainingDays,
    dayExercises,
    dayLabel,
    isSessionCompleted,
    weekCount,
    // Helpers
    getPreviousLog,
    formatPrevious,
    // Actions
    startTracking,
    updateSet,
    handleSaveSession,
  };
}

/* ────────────────────────────────────────────
   Private async helpers (calendar + RPE)
   ──────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient>;

async function saveCalendarEntry(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    today: string;
    rpeGlobal: number;
    routine: RoutineRaw | null;
    activeDay: string;
    dayLabel: string;
  }
) {
  const { data: existingCal } = await supabase
    .from("user_calendar")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("date", opts.today)
    .eq("activity_type", "workout")
    .maybeSingle();

  if (existingCal) {
    const { error: calUpErr } = await supabase
      .from("user_calendar")
      .update({ completed: true, rpe: opts.rpeGlobal })
      .eq("id", existingCal.id);
    if (calUpErr) {
      console.error("[ClientRoutine] Error al actualizar calendario:", calUpErr);
    }
  } else {
    const { error: calInsErr } = await supabase
      .from("user_calendar")
      .insert({
        user_id: opts.userId,
        date: opts.today,
        activity_type: "workout",
        activity_details: {
          nombre: opts.routine?.title ?? "Entrenamiento",
          dia: opts.activeDay,
          day_label: opts.dayLabel,
        },
        completed: true,
        rpe: opts.rpeGlobal,
      });
    if (calInsErr) {
      console.error("[ClientRoutine] Error al crear entrada de calendario:", calInsErr);
    }
  }
}

async function saveRpeHistory(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    today: string;
    rpeGlobal: number;
    totalVolume: number;
  }
) {
  const { data: calEntry } = await supabase
    .from("user_calendar")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("date", opts.today)
    .eq("activity_type", "workout")
    .single();

  if (calEntry) {
    const { error: rpeErr } = await supabase.from("rpe_history").insert({
      client_id: opts.userId,
      calendar_id: calEntry.id,
      rpe_global: opts.rpeGlobal,
      total_volume_kg: opts.totalVolume,
    });
    if (rpeErr) {
      console.error("[ClientRoutine] Error al guardar historial RPE:", rpeErr);
    }
  }
}
