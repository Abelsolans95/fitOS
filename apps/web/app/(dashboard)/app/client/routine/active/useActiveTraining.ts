"use client";

import { useReducer, useCallback, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { ExerciseData, PreviousLog, SetEntry, SavedLogEntry } from "./types";
import { calculateStressIndex } from "@kuvox/shared";

/* ── Reducer (extracted) ── */
export { trainingReducer, initialState } from "./active-training-reducer";
export type { TrainingState, TrainingAction } from "./active-training-reducer";
import { trainingReducer, initialState } from "./active-training-reducer";

/* ── Helpers (extracted) ── */
import {
  initializeSetsFromExercises,
  resumeSetsFromSession,
  buildSetsData,
  computeAverageRpe,
  computeSessionTotals,
  buildSummaryData,
  findPreviousSets,
} from "./active-training-helpers";

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
    if (state.phase !== "training" && state.phase !== "rest" && state.phase !== "sfr") return;
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
    (name: string) => findPreviousSets(previousLogs, name),
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

  const summaryData = useMemo(
    () => buildSummaryData(exercises, state.allSets, state.exerciseNotes, getPreviousForExercise),
    [exercises, state.allSets, state.exerciseNotes, getPreviousForExercise]
  );

  /* ── DB: Save partial progress (with 1 retry) ── */

  const savePartialProgress = useCallback(
    async (exIdx: number, setsOverride?: SetEntry[]) => {
      if (!userId || !state.sessionId) return;
      const ex = exercises[exIdx];
      if (!ex) return;

      const sets = setsOverride ?? state.allSets[exIdx] ?? [];
      const today = new Date().toISOString().split("T")[0];
      const { setsData, totalVolume } = buildSetsData(sets, ex.sets || 3);
      const notes = state.exerciseNotes[exIdx]?.trim() || null;
      const exerciseRpeVal = computeAverageRpe(setsData);
      const stimulusVal = state.exerciseStimulus[exIdx] ?? null;
      const fatigueVal = state.exerciseFatigue[exIdx] ?? null;
      const stressIndex = calculateStressIndex(setsData);

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
            exercise_rpe: exerciseRpeVal,
            stress_index: stressIndex,
            stimulus_rating: stimulusVal,
            fatigue_rating: fatigueVal,
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
    [userId, state.sessionId, exercises, state.allSets, state.exerciseNotes, state.exerciseRpe, state.exerciseStimulus, state.exerciseFatigue, trainerId]
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
        day_label: currentEx?.day_label ?? day,
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
    [currentEx, userId, state.sessionId, state.allSets, state.currentExIdx, savePartialProgress]
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

  /* ── Confirm SFR ratings and save exercise ── */

  const confirmSfr = useCallback(async () => {
    const exIdx = state.currentExIdx;
    const sets = state.allSets[exIdx] || [];
    // Always re-save — stimulus/fatigue were set AFTER the initial save
    await savePartialProgress(exIdx, sets);
    dispatch({ type: "SET_PHASE", phase: "training" });
  }, [state.currentExIdx, state.allSets, savePartialProgress]);

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
  }, [state.currentExIdx, state.allSets, state.savedExercises, totalExercises, saveExerciseLog]);

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
    const { totalVolume, totalSetsCount } = computeSessionTotals(state.allSets);

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
  }, [state.sessionId, userId, state.sessionStart, state.allSets, totalExercises, state.rpeGlobal, routineTitle, day]);

  /* ── Initialize sets (normal start) ── */

  const initializeSets = useCallback(
    (exs: ExerciseData[]) => {
      const sets = initializeSetsFromExercises(exs, week);
      dispatch({ type: "INIT_SETS", sets });
    },
    [week]
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
      const { sessionId: sid, sessionCreatedAt, sessionLogs, exercises: exs } = data;
      const result = resumeSetsFromSession(exs, sessionLogs, week);
      const startTime = new Date(sessionCreatedAt).getTime();

      dispatch({
        type: "RESUME",
        currentExIdx: result.firstIncompleteIdx,
        sets: result.sets,
        savedExercises: result.savedExercises,
        notes: result.notes,
        sessionId: sid,
        sessionStart: startTime,
        elapsed: Math.floor((Date.now() - startTime) / 1000),
      });
    },
    [week]
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
    confirmSfr,
    goNextExercise,
    goPrevExercise,
    skipRest,
    finishRoutine,
    finalizeSession,
    initializeSets,
    resumeFromSession,
  };
}
