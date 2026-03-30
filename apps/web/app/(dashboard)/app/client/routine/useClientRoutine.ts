"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { ExerciseData, DayData, PreviousSet, PreviousLog } from "./active/types";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

export interface RoutineRaw {
  id: string;
  title: string;
  duration_months: number;
  total_weeks?: number;
  goal: string;
  exercises?: ExerciseData[];
  days?: DayData[];
  is_active: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface SetInput {
  weight_kg: string;
  reps_done: string;
  type: "main" | "rest_pause";
}

interface InProgressSession {
  id: string;
  routine_id: string;
  day_label: string;
  week_number: number;
}

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface ClientRoutineState {
  loading: boolean;
  error: string | null;
  routine: RoutineRaw | null;
  userId: string | null;
  previousLogs: PreviousLog[];
  activeWeek: number;
  activeDay: string | null;
  isTracking: boolean;
  sessionInputs: Record<string, SetInput[]>;
  clientNotes: Record<string, string>;
  rpeGlobal: number;
  saving: boolean;
  inProgressSession: InProgressSession | null;
  completedSessions: Set<string>;
}

const initialState: ClientRoutineState = {
  loading: true,
  error: null,
  routine: null,
  userId: null,
  previousLogs: [],
  activeWeek: 1,
  activeDay: null,
  isTracking: false,
  sessionInputs: {},
  clientNotes: {},
  rpeGlobal: 7,
  saving: false,
  inProgressSession: null,
  completedSessions: new Set(),
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type ClientRoutineAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | {
      type: "LOAD_SUCCESS";
      userId: string;
      routine: RoutineRaw | null;
      previousLogs: PreviousLog[];
      completedSessions: Set<string>;
      inProgressSession: InProgressSession | null;
    }
  | { type: "SET_ACTIVE_WEEK"; week: number }
  | { type: "SET_ACTIVE_DAY"; day: string }
  | { type: "START_TRACKING"; sessionInputs: Record<string, SetInput[]> }
  | { type: "STOP_TRACKING" }
  | {
      type: "UPDATE_SET";
      exerciseName: string;
      setIndex: number;
      field: "weight_kg" | "reps_done";
      value: string;
    }
  | { type: "SET_CLIENT_NOTE"; exerciseName: string; note: string }
  | { type: "SET_RPE"; value: number }
  | { type: "SET_SAVING"; saving: boolean }
  | { type: "SESSION_SAVED"; previousLogs: PreviousLog[] }
  | { type: "SET_PREVIOUS_LOGS"; previousLogs: PreviousLog[] };

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

function clientRoutineReducer(
  state: ClientRoutineState,
  action: ClientRoutineAction
): ClientRoutineState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };

    case "LOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        userId: action.userId,
        routine: action.routine,
        previousLogs: action.previousLogs,
        completedSessions: action.completedSessions,
        inProgressSession: action.inProgressSession,
      };

    case "SET_ACTIVE_WEEK":
      return { ...state, activeWeek: action.week };

    case "SET_ACTIVE_DAY":
      return { ...state, activeDay: action.day };

    case "START_TRACKING":
      return {
        ...state,
        isTracking: true,
        sessionInputs: action.sessionInputs,
        clientNotes: {},
      };

    case "STOP_TRACKING":
      return { ...state, isTracking: false };

    case "UPDATE_SET": {
      const updated = { ...state.sessionInputs };
      const sets = [...(updated[action.exerciseName] || [])];
      sets[action.setIndex] = {
        ...sets[action.setIndex],
        [action.field]: action.value,
      };
      updated[action.exerciseName] = sets;
      return { ...state, sessionInputs: updated };
    }

    case "SET_CLIENT_NOTE":
      return {
        ...state,
        clientNotes: {
          ...state.clientNotes,
          [action.exerciseName]: action.note,
        },
      };

    case "SET_RPE":
      return { ...state, rpeGlobal: action.value };

    case "SET_SAVING":
      return { ...state, saving: action.saving };

    case "SESSION_SAVED":
      return {
        ...state,
        isTracking: false,
        saving: false,
        previousLogs: action.previousLogs,
      };

    case "SET_PREVIOUS_LOGS":
      return { ...state, previousLogs: action.previousLogs };

    default:
      return state;
  }
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const DAY_ORDER = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export const DAY_SHORT: Record<string, string> = {
  lunes: "L",
  martes: "M",
  miercoles: "X",
  jueves: "J",
  viernes: "V",
  sabado: "S",
  domingo: "D",
};

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
            .select("*")
            .eq("client_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (pendingRes.error) {
          console.error(
            "[ClientRoutine] Error al buscar sesión pendiente:",
            pendingRes.error
          );
        }

        const inProgressSession = pendingRes.data
          ? (pendingRes.data as InProgressSession)
          : null;

        // Load active routine (try client_id first, then user_id for compat)
        let routineData = null;
        if (!routineRes.error && routineRes.data) {
          routineData = routineRes.data;
        } else {
          const { data: r2, error: e2 } = await supabase
            .from("user_routines")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (e2) {
            console.error(
              "[ClientRoutine] Error al buscar rutina (user_id):",
              e2
            );
          }
          if (r2) routineData = r2;
        }

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
              .limit(200),
          ]);

          if (doneRes.error) {
            console.error(
              "[ClientRoutine] Error al cargar sesiones completadas:",
              doneRes.error
            );
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
            console.error(
              "[ClientRoutine] Error al cargar historial de pesos:",
              logsRes.error
            );
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

  /* ── Parsed exercises ── */
  const parsedExercises = useMemo((): ExerciseData[] => {
    if (!state.routine) return [];

    if (
      state.routine.exercises &&
      Array.isArray(state.routine.exercises) &&
      state.routine.exercises.length > 0
    ) {
      return state.routine.exercises;
    }

    if (state.routine.days && Array.isArray(state.routine.days)) {
      return state.routine.days.flatMap((day: DayData) =>
        (day.exercises || []).map((ex: ExerciseData) => ({
          ...ex,
          day_of_week: ex.day_of_week || day.day,
          day_label: ex.day_label || day.label,
        }))
      );
    }

    return [];
  }, [state.routine]);

  /* ── Training days ── */
  const trainingDays = useMemo(() => {
    const days = [...new Set(parsedExercises.map((ex) => ex.day_of_week))];
    return days.sort(
      (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
    );
  }, [parsedExercises]);

  /* ── Set initial active day ── */
  useEffect(() => {
    if (trainingDays.length > 0 && !state.activeDay) {
      dispatch({ type: "SET_ACTIVE_DAY", day: trainingDays[0] });
    }
  }, [trainingDays, state.activeDay]);

  /* ── Exercises for current day ── */
  const dayExercises = useMemo(() => {
    if (!state.activeDay) return [];
    return parsedExercises
      .filter((ex) => ex.day_of_week === state.activeDay)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [parsedExercises, state.activeDay]);

  /* ── Day label ── */
  const dayLabel = useMemo(() => {
    if (!state.activeDay) return "";
    const ex = parsedExercises.find(
      (e) => e.day_of_week === state.activeDay
    );
    return ex?.day_label || DAY_LABELS[state.activeDay] || state.activeDay;
  }, [parsedExercises, state.activeDay]);

  /* ── Session completed check ── */
  const isSessionCompleted = useMemo(() => {
    if (!dayLabel || !state.activeWeek) return false;
    return state.completedSessions.has(`${dayLabel}::${state.activeWeek}`);
  }, [state.completedSessions, dayLabel, state.activeWeek]);

  /* ── Week count ── */
  const weekCount = state.routine
    ? (state.routine.total_weeks ??
        Math.max(1, (state.routine.duration_months || 1) * 4))
    : 0;

  /* ── Previous log helpers ── */
  const getPreviousLog = useCallback(
    (exerciseName: string): PreviousSet[] => {
      const log = state.previousLogs.find(
        (l) => l.exercise_name === exerciseName
      );
      if (!log || !log.sets_data) return [];
      return (log.sets_data as PreviousSet[]) || [];
    },
    [state.previousLogs]
  );

  const formatPrevious = useCallback(
    (exerciseName: string): string => {
      const prev = getPreviousLog(exerciseName);
      if (prev.length === 0) return "";
      const mainSets = prev.filter((s) => s.type !== "rest_pause");
      const firstWeight = mainSets[0]?.weight_kg ?? 0;
      const firstReps = mainSets[0]?.reps_done ?? 0;
      return `${firstWeight}x${firstReps}`;
    },
    [getPreviousLog]
  );

  /* ── Start tracking ── */
  const startTracking = useCallback(() => {
    const inputs: Record<string, SetInput[]> = {};

    dayExercises.forEach((ex) => {
      const mainSets = ex.sets || 3;
      const rpSets = ex.rest_pause_sets || 0;
      const prevLog = getPreviousLog(ex.name);
      const weight = ex.target_weight ?? ex.weight_kg ?? 0;

      const sets: SetInput[] = [];
      for (let i = 0; i < mainSets; i++) {
        sets.push({
          weight_kg: prevLog[i]?.weight_kg
            ? String(prevLog[i].weight_kg)
            : weight
              ? String(weight)
              : "",
          reps_done: "",
          type: "main",
        });
      }
      for (let i = 0; i < rpSets; i++) {
        const rpIdx = mainSets + i;
        sets.push({
          weight_kg: prevLog[rpIdx]?.weight_kg
            ? String(prevLog[rpIdx].weight_kg)
            : weight
              ? String(weight)
              : "",
          reps_done: "",
          type: "rest_pause",
        });
      }

      inputs[ex.name] = sets;
    });

    dispatch({ type: "START_TRACKING", sessionInputs: inputs });
  }, [dayExercises, getPreviousLog]);

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
          trainer_id: state.routine
            ? (state.routine as any).trainer_id
            : null,
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
        console.error(
          "[ClientRoutine] Error al crear sesión:",
          sessionError
        );
        toast.error("Error al crear la sesión de entrenamiento");
        dispatch({ type: "SET_SAVING", saving: false });
        return;
      }

      const currentSessionId = session?.id || null;

      const weightLogInserts = dayExercises.map((ex) => {
        const sets = state.sessionInputs[ex.name] || [];
        const setsData = sets.map((s, i) => ({
          set_number: i + 1,
          weight_kg: Number(s.weight_kg) || 0,
          reps_done: Number(s.reps_done) || 0,
          type: s.type,
        }));

        const totalVolume = setsData.reduce(
          (sum, s) => sum + s.weight_kg * s.reps_done,
          0
        );

        return {
          client_id: state.userId,
          exercise_id: ex.exercise_id,
          exercise_name: ex.name,
          session_date: today,
          session_id: currentSessionId,
          sets_data: setsData,
          total_volume_kg: totalVolume,
        };
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
        const totalVol = weightLogInserts.reduce(
          (s, w) => s + w.total_volume_kg,
          0
        );
        const totalSets = weightLogInserts.reduce(
          (s, w) => s + (w.sets_data?.length || 0),
          0
        );
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
          console.error(
            "[ClientRoutine] Error al actualizar agregados de sesión:",
            updateErr
          );
        }
      }

      // Calendar entry
      const { data: existingCal } = await supabase
        .from("user_calendar")
        .select("id")
        .eq("user_id", state.userId)
        .eq("date", today)
        .eq("activity_type", "workout")
        .maybeSingle();

      if (existingCal) {
        const { error: calUpErr } = await supabase
          .from("user_calendar")
          .update({ completed: true, rpe: state.rpeGlobal })
          .eq("id", existingCal.id);
        if (calUpErr) {
          console.error(
            "[ClientRoutine] Error al actualizar calendario:",
            calUpErr
          );
        }
      } else {
        const { error: calInsErr } = await supabase
          .from("user_calendar")
          .insert({
            user_id: state.userId,
            date: today,
            activity_type: "workout",
            activity_details: {
              nombre: state.routine?.title || "Entrenamiento",
              dia: state.activeDay,
              day_label: dayLabel,
            },
            completed: true,
            rpe: state.rpeGlobal,
          });
        if (calInsErr) {
          console.error(
            "[ClientRoutine] Error al crear entrada de calendario:",
            calInsErr
          );
        }
      }

      // RPE history
      const totalVol = weightLogInserts.reduce(
        (sum, w) => sum + w.total_volume_kg,
        0
      );
      const { data: calEntry } = await supabase
        .from("user_calendar")
        .select("id")
        .eq("user_id", state.userId)
        .eq("date", today)
        .eq("activity_type", "workout")
        .single();

      if (calEntry) {
        const { error: rpeErr } = await supabase.from("rpe_history").insert({
          client_id: state.userId,
          calendar_id: calEntry.id,
          rpe_global: state.rpeGlobal,
          total_volume_kg: totalVol,
        });
        if (rpeErr) {
          console.error(
            "[ClientRoutine] Error al guardar historial RPE:",
            rpeErr
          );
        }
      }

      toast.success("Sesión guardada correctamente");

      // Reload previous logs
      const { data: newLogs, error: reloadErr } = await supabase
        .from("weight_log")
        .select("exercise_name, session_date, sets_data")
        .eq("client_id", state.userId)
        .order("session_date", { ascending: false })
        .limit(200);
      if (reloadErr) {
        console.error(
          "[ClientRoutine] Error al recargar historial:",
          reloadErr
        );
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
