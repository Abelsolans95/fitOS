"use client";

import { useReducer, useCallback, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type {
  ExerciseData,
  PreviousLog,
  PreviousSet,
  SetEntry,
  SavedLogEntry,
  Phase,
  SummaryData,
  SummaryExerciseResult,
} from "./types";
import { calculateProgress } from "./types";

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface TrainingState {
  phase: Phase;
  currentExIdx: number;
  allSets: Record<number, SetEntry[]>;
  savedExercises: number[];
  exerciseNotes: Record<number, string>;
  rpeGlobal: number;
  restTime: number;
  restTotal: number;
  elapsed: number;
  sessionStart: number;
  sessionId: string | null;
}

const initialState: TrainingState = {
  phase: "loading",
  currentExIdx: 0,
  allSets: {},
  savedExercises: [],
  exerciseNotes: {},
  rpeGlobal: 7,
  restTime: 0,
  restTotal: 0,
  elapsed: 0,
  sessionStart: 0,
  sessionId: null,
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type TrainingAction =
  | { type: "INIT_SETS"; sets: Record<number, SetEntry[]> }
  | {
      type: "RESUME";
      currentExIdx: number;
      sets: Record<number, SetEntry[]>;
      savedExercises: number[];
      notes: Record<number, string>;
      sessionId: string;
      sessionStart: number;
      elapsed: number;
    }
  | { type: "START_TRAINING"; sessionId: string; sessionStart: number }
  | { type: "NEXT_EXERCISE" }
  | { type: "PREV_EXERCISE" }
  | {
      type: "COMPLETE_SET";
      exIdx: number;
      setIdx: number;
      restSeconds: number;
    }
  | { type: "MARK_SAVED"; exIdx: number }
  | { type: "SET_NOTES"; exIdx: number; notes: string }
  | { type: "SET_RPE"; value: number }
  | {
      type: "UPDATE_SET_VALUE";
      exIdx: number;
      setIdx: number;
      field: "weight_kg" | "reps_done";
      value: string;
    }
  | { type: "SKIP_REST" }
  | { type: "TICK_REST" }
  | { type: "TICK_ELAPSED" }
  | { type: "SET_PHASE"; phase: Phase }
  | { type: "RESET" };

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

function trainingReducer(
  state: TrainingState,
  action: TrainingAction
): TrainingState {
  switch (action.type) {
    case "INIT_SETS":
      return { ...state, allSets: action.sets, phase: "ready" };

    case "RESUME":
      return {
        ...state,
        currentExIdx: action.currentExIdx,
        allSets: action.sets,
        savedExercises: action.savedExercises,
        exerciseNotes: action.notes,
        sessionId: action.sessionId,
        sessionStart: action.sessionStart,
        elapsed: action.elapsed,
        phase: "training",
      };

    case "START_TRAINING":
      return {
        ...state,
        phase: "training",
        sessionId: action.sessionId,
        sessionStart: action.sessionStart,
      };

    case "NEXT_EXERCISE":
      return {
        ...state,
        currentExIdx: state.currentExIdx + 1,
        phase: "training",
      };

    case "PREV_EXERCISE":
      return {
        ...state,
        currentExIdx: Math.max(0, state.currentExIdx - 1),
        phase: "training",
      };

    case "COMPLETE_SET": {
      const sets = [...(state.allSets[action.exIdx] || [])];
      if (!sets[action.setIdx] || sets[action.setIdx].completed) return state;
      sets[action.setIdx] = { ...sets[action.setIdx], completed: true };
      const allDone = sets.every((s) => s.completed);
      return {
        ...state,
        allSets: { ...state.allSets, [action.exIdx]: sets },
        phase: allDone ? "training" : "rest",
        restTime: allDone ? state.restTime : action.restSeconds,
        restTotal: allDone ? state.restTotal : action.restSeconds,
      };
    }

    case "MARK_SAVED": {
      if (state.savedExercises.includes(action.exIdx)) return state;
      return {
        ...state,
        savedExercises: [...state.savedExercises, action.exIdx],
      };
    }

    case "SET_NOTES":
      return {
        ...state,
        exerciseNotes: {
          ...state.exerciseNotes,
          [action.exIdx]: action.notes,
        },
      };

    case "SET_RPE":
      return { ...state, rpeGlobal: action.value };

    case "UPDATE_SET_VALUE": {
      const sets = [...(state.allSets[action.exIdx] || [])];
      sets[action.setIdx] = {
        ...sets[action.setIdx],
        [action.field]: action.value,
      };
      return {
        ...state,
        allSets: { ...state.allSets, [action.exIdx]: sets },
      };
    }

    case "SKIP_REST":
      return { ...state, phase: "training", restTime: 0 };

    case "TICK_REST": {
      const next = state.restTime - 1;
      if (next <= 0) return { ...state, restTime: 0, phase: "training" };
      return { ...state, restTime: next };
    }

    case "TICK_ELAPSED":
      return { ...state, elapsed: state.elapsed + 1 };

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/* ────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────── */

interface UseActiveTrainingParams {
  exercises: ExerciseData[];
  previousLogs: PreviousLog[];
  userId: string | null;
  routineId: string | null;
  trainerId: string | null;
  routineTitle: string;
  day: string;
  week: number;
}

export function useActiveTraining(params: UseActiveTrainingParams) {
  const {
    exercises,
    previousLogs,
    userId,
    routineId,
    trainerId,
    routineTitle,
    day,
    week,
  } = params;

  const [state, dispatch] = useReducer(trainingReducer, initialState);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalExercises = exercises.length;

  /* ── Rest timer ── */
  useEffect(() => {
    if (state.phase !== "rest") return;
    restTimerRef.current = setInterval(() => {
      dispatch({ type: "TICK_REST" });
    }, 1000);
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    };
  }, [state.phase]);

  /* ── Session elapsed timer ── */
  useEffect(() => {
    if (state.phase !== "training" && state.phase !== "rest") return;
    elapsedTimerRef.current = setInterval(() => {
      dispatch({ type: "TICK_ELAPSED" });
    }, 1000);
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [state.phase]);

  /* ── Computed values ── */

  const currentEx = exercises[state.currentExIdx] || null;

  const getPreviousForExercise = useCallback(
    (name: string): PreviousSet[] => {
      const log = previousLogs.find((l) => l.exercise_name === name);
      return (log?.sets_data as PreviousSet[]) || [];
    },
    [previousLogs]
  );

  const currentSetIdx = useMemo(() => {
    const sets = state.allSets[state.currentExIdx] || [];
    return sets.findIndex((s) => !s.completed);
  }, [state.allSets, state.currentExIdx]);

  const allCurrentSetsDone =
    currentSetIdx === -1 &&
    (state.allSets[state.currentExIdx]?.length || 0) > 0;
  const isLastExercise = state.currentExIdx >= totalExercises - 1;

  const summaryData = useMemo((): SummaryData => {
    let totalVolume = 0;
    let totalSetsCount = 0;
    const exerciseResults: SummaryExerciseResult[] = [];

    exercises.forEach((ex, idx) => {
      const sets = state.allSets[idx] || [];
      const prev = getPreviousForExercise(ex.name);

      for (const s of sets) {
        totalVolume +=
          (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        if (s.completed) totalSetsCount++;
      }

      const currentData = sets
        .filter((s) => s.completed)
        .map((s) => ({
          weight: Number(s.weight_kg) || 0,
          reps: Number(s.reps_done) || 0,
        }));
      const prevData = prev.map((s) => ({
        weight: s.weight_kg,
        reps: s.reps_done,
      }));

      exerciseResults.push({
        name: ex.name,
        sets,
        previous: prev,
        progress: calculateProgress(currentData, prevData),
        notes: state.exerciseNotes[idx]?.trim() || null,
      });
    });

    return { totalVolume, totalSetsCount, exerciseResults };
  }, [exercises, state.allSets, getPreviousForExercise, state.exerciseNotes]);

  /* ── DB: Save partial progress (with 1 retry) ── */

  const savePartialProgress = useCallback(
    async (exIdx: number, setsOverride?: SetEntry[]) => {
      if (!userId || !state.sessionId) return;
      const ex = exercises[exIdx];
      if (!ex) return;

      const sets = setsOverride || state.allSets[exIdx] || [];
      const today = new Date().toISOString().split("T")[0];
      const setsData = sets.map((s, i) => ({
        set_number: i + 1,
        weight_kg: Number(s.weight_kg) || 0,
        reps_done: Number(s.reps_done) || 0,
        type: i < (ex.sets || 3) ? "main" : "rest_pause",
        completed: s.completed,
      }));
      const totalVolume = setsData.reduce(
        (sum, s) => sum + s.weight_kg * s.reps_done,
        0
      );
      const notes = state.exerciseNotes[exIdx]?.trim() || null;

      const supabase = createClient();

      const doSave = async () => {
        const { error } = await supabase.from("weight_log").upsert(
          {
            client_id: userId,
            trainer_id: trainerId,
            exercise_id: ex.exercise_id,
            exercise_name: ex.name,
            session_date: today,
            session_id: state.sessionId,
            sets_data: setsData,
            total_volume_kg: totalVolume,
            client_notes: notes,
          },
          { onConflict: "session_id,exercise_name" }
        );
        if (error) throw error;
      };

      try {
        await doSave();
      } catch {
        toast.error("Error guardando progreso, reintentando...");
        try {
          await doSave();
        } catch {
          toast.error("No se pudo guardar el progreso");
        }
      }

      if (sets.every((s) => s.completed)) {
        dispatch({ type: "MARK_SAVED", exIdx });
      }
    },
    [userId, state.sessionId, exercises, state.allSets, state.exerciseNotes, trainerId]
  );

  /* ── DB: Start session ── */

  const startSession = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    const { data: session, error } = await supabase
      .from("workout_sessions")
      .insert({
        client_id: userId,
        routine_id: routineId,
        trainer_id: trainerId,
        session_date: new Date().toISOString().split("T")[0],
        day_label: currentEx?.day_label || day,
        week_number: week,
        mode: "active",
        status: "in_progress",
      })
      .select("id")
      .single();

    if (error || !session) {
      toast.error("Error creando sesión");
      return;
    }

    dispatch({
      type: "START_TRAINING",
      sessionId: session.id,
      sessionStart: Date.now(),
    });
  }, [userId, routineId, trainerId, day, week, currentEx]);

  /* ── Complete set ── */

  const completeSet = useCallback(
    async (setIdx: number) => {
      if (!currentEx || !userId || !state.sessionId) return;

      const sets = state.allSets[state.currentExIdx] || [];
      const set = sets[setIdx];
      if (!set || set.completed) return;

      if ((Number(set.reps_done) || 0) === 0) {
        toast.error("Introduce las repeticiones");
        return;
      }

      dispatch({
        type: "COMPLETE_SET",
        exIdx: state.currentExIdx,
        setIdx,
        restSeconds: currentEx.rest_s || 90,
      });

      // Compute updated sets for the DB write (dispatch is async/batched)
      const updatedSets = [...sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], completed: true };
      await savePartialProgress(state.currentExIdx, updatedSets);
    },
    [
      currentEx,
      userId,
      state.sessionId,
      state.allSets,
      state.currentExIdx,
      savePartialProgress,
    ]
  );

  /* ── Save exercise log (final save) ── */

  const saveExerciseLog = useCallback(
    async (exIdx: number) => {
      if (!userId || !state.sessionId) return;
      if (state.savedExercises.includes(exIdx)) return;
      const sets = state.allSets[exIdx] || [];
      await savePartialProgress(exIdx, sets);
    },
    [userId, state.sessionId, state.allSets, state.savedExercises, savePartialProgress]
  );

  /* ── Navigate next ── */

  const goNextExercise = useCallback(async () => {
    const sets = state.allSets[state.currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !state.savedExercises.includes(state.currentExIdx)) {
      await saveExerciseLog(state.currentExIdx);
    }
    if (state.currentExIdx < totalExercises - 1) {
      dispatch({ type: "NEXT_EXERCISE" });
    }
  }, [
    state.currentExIdx,
    state.allSets,
    state.savedExercises,
    totalExercises,
    saveExerciseLog,
  ]);

  /* ── Navigate prev ── */

  const goPrevExercise = useCallback(() => {
    if (state.currentExIdx > 0) {
      dispatch({ type: "PREV_EXERCISE" });
    }
  }, [state.currentExIdx]);

  /* ── Skip rest ── */

  const skipRest = useCallback(() => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    dispatch({ type: "SKIP_REST" });
  }, []);

  /* ── Finish routine → RPE ── */

  const finishRoutine = useCallback(async () => {
    const sets = state.allSets[state.currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !state.savedExercises.includes(state.currentExIdx)) {
      await saveExerciseLog(state.currentExIdx);
    }
    dispatch({ type: "SET_PHASE", phase: "rpe" });
  }, [state.currentExIdx, state.allSets, state.savedExercises, saveExerciseLog]);

  /* ── DB: Finalize session ── */

  const finalizeSession = useCallback(async (): Promise<boolean> => {
    if (!state.sessionId || !userId) return false;

    const supabase = createClient();
    const duration = Math.floor((Date.now() - state.sessionStart) / 1000);

    let totalVolume = 0;
    let totalSetsCount = 0;
    for (const sets of Object.values(state.allSets)) {
      for (const s of sets) {
        totalVolume +=
          (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        if (s.completed) totalSetsCount++;
      }
    }

    const { error: sessionError } = await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        total_volume_kg: totalVolume,
        total_sets: totalSetsCount,
        total_exercises: totalExercises,
        rpe_session: state.rpeGlobal,
      })
      .eq("id", state.sessionId);

    if (sessionError) {
      toast.error("Error finalizando sesión");
      return false;
    }

    // Calendar entry (fire-and-forget)
    const today = new Date().toISOString().split("T")[0];
    const { data: existingCal } = await supabase
      .from("user_calendar")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .eq("activity_type", "workout")
      .maybeSingle();

    if (existingCal) {
      await supabase
        .from("user_calendar")
        .update({ completed: true, rpe: state.rpeGlobal })
        .eq("id", existingCal.id);
    } else {
      await supabase.from("user_calendar").insert({
        user_id: userId,
        date: today,
        activity_type: "workout",
        activity_details: {
          nombre: routineTitle,
          dia: day,
          mode: "active",
        },
        completed: true,
        rpe: state.rpeGlobal,
      });
    }

    toast.success("Sesión completada");
    dispatch({ type: "SET_PHASE", phase: "summary" });
    return true;
  }, [
    state.sessionId,
    userId,
    state.sessionStart,
    state.allSets,
    totalExercises,
    state.rpeGlobal,
    routineTitle,
    day,
  ]);

  /* ── Initialize sets (normal start) ── */

  const initializeSets = useCallback(
    (exs: ExerciseData[], logs: PreviousLog[]) => {
      const initial: Record<number, SetEntry[]> = {};
      exs.forEach((ex, idx) => {
        const totalSetsCount = (ex.sets || 3) + (ex.rest_pause_sets || 0);
        const prevLog = logs.find((l) => l.exercise_name === ex.name);
        initial[idx] = Array.from({ length: totalSetsCount }, (_, i) => {
          const prevSet = prevLog?.sets_data?.[i];
          return {
            weight_kg: prevSet
              ? String(prevSet.weight_kg)
              : ex.target_weight || ex.weight_kg
                ? String(ex.target_weight || ex.weight_kg)
                : "",
            reps_done: "",
            completed: false,
          };
        });
      });
      dispatch({ type: "INIT_SETS", sets: initial });
    },
    []
  );

  /* ── Resume from in-progress session ── */

  const resumeFromSession = useCallback(
    (data: {
      sessionId: string;
      sessionCreatedAt: string;
      sessionLogs: SavedLogEntry[];
      exercises: ExerciseData[];
      previousLogs: PreviousLog[];
    }) => {
      const {
        sessionId: sid,
        sessionCreatedAt,
        sessionLogs,
        exercises: exs,
        previousLogs: logs,
      } = data;
      const initial: Record<number, SetEntry[]> = {};
      const restoredNotes: Record<number, string> = {};
      const alreadySaved: number[] = [];

      exs.forEach((ex, idx) => {
        const totalSetsCount = (ex.sets || 3) + (ex.rest_pause_sets || 0);
        const savedLog = sessionLogs.find(
          (l) => l.exercise_name === ex.name
        );
        const prevLog = logs.find((l) => l.exercise_name === ex.name);

        if (savedLog && savedLog.sets_data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initial[idx] = savedLog.sets_data.map((s: any) => ({
            weight_kg: String(s.weight_kg),
            reps_done: String(s.reps_done),
            completed: s.completed !== false,
          }));
          const allSetsDone = initial[idx].every((s) => s.completed);
          if (allSetsDone) alreadySaved.push(idx);
          // Pad if exercise has more sets than saved
          while (initial[idx].length < totalSetsCount) {
            const i = initial[idx].length;
            const prevSet = prevLog?.sets_data?.[i];
            initial[idx].push({
              weight_kg: prevSet
                ? String(prevSet.weight_kg)
                : ex.target_weight || ex.weight_kg
                  ? String(ex.target_weight || ex.weight_kg)
                  : "",
              reps_done: "",
              completed: false,
            });
          }
          if (savedLog.client_notes) {
            restoredNotes[idx] = savedLog.client_notes;
          }
        } else {
          initial[idx] = Array.from({ length: totalSetsCount }, (_, i) => {
            const prevSet = prevLog?.sets_data?.[i];
            return {
              weight_kg: prevSet
                ? String(prevSet.weight_kg)
                : ex.target_weight || ex.weight_kg
                  ? String(ex.target_weight || ex.weight_kg)
                  : "",
              reps_done: "",
              completed: false,
            };
          });
        }
      });

      // Jump to first exercise with incomplete sets
      const firstIncomplete = exs.findIndex((_, idx) => {
        const sets = initial[idx] || [];
        return sets.some((s) => !s.completed);
      });

      const startTime = new Date(sessionCreatedAt).getTime();

      dispatch({
        type: "RESUME",
        currentExIdx: firstIncomplete >= 0 ? firstIncomplete : 0,
        sets: initial,
        savedExercises: alreadySaved,
        notes: restoredNotes,
        sessionId: sid,
        sessionStart: startTime,
        elapsed: Math.floor((Date.now() - startTime) / 1000),
      });
    },
    []
  );

  return {
    state,
    dispatch,
    // Computed
    currentEx,
    currentSetIdx,
    allCurrentSetsDone,
    isLastExercise,
    totalExercises,
    summaryData,
    getPreviousForExercise,
    // Actions
    startSession,
    completeSet,
    savePartialProgress,
    saveExerciseLog,
    goNextExercise,
    goPrevExercise,
    skipRest,
    finishRoutine,
    finalizeSession,
    initializeSets,
    resumeFromSession,
  };
}
