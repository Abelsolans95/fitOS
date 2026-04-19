import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { updateWidget } from "../../lib/widget-sync";
import { DAY_KEYS, DAY_LABELS } from "./constants";
import type {
  RoutineRaw, ExerciseData, DayData, PreviousLog, PreviousSet,
  SetEntry, InProgressSession, ScreenMode,
} from "./types";
import { calculateStressIndex } from "@kuvox/shared";
import {
  buildInitialSets,
  buildResumedSets,
  buildSetsDataPayload,
  buildRegistrationSetsData,
  computeAverageRpe,
  computeSessionTotals,
  computeSummaryData,
} from "./routine-helpers";
import {
  loadRoutineData,
  fetchPreviousLogs,
  fetchSessionLogs,
  createWorkoutSession,
  saveWeightLog,
  batchInsertWeightLogs,
  completeWorkoutSession,
  saveCalendarEntry,
  insertExerciseLog,
} from "./routine-db";

export function useRoutineScreen() {
  const { user } = useAuth();

  // Data state
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<RoutineRaw | null>(null);
  const [previousLogs, setPreviousLogs] = useState<PreviousLog[]>([]);

  // UI state
  const [mode, setMode] = useState<ScreenMode>("overview");
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return DAY_KEYS[d === 0 ? 6 : d - 1];
  });
  const [activeWeek, setActiveWeek] = useState(1);

  // Training state
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [allSets, setAllSets] = useState<Record<number, SetEntry[]>>({});
  const [clientNotes, setClientNotes] = useState<Record<string, string>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<number, string>>({});
  const [exerciseStimulus, setExerciseStimulus] = useState<Record<number, number>>({});
  const [exerciseFatigue, setExerciseFatigue] = useState<Record<number, number>>({});
  const [rpeGlobal, setRpeGlobal] = useState(7);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedExercises, setSavedExercises] = useState<Set<number>>(new Set());
  const [inProgressSession, setInProgressSession] = useState<InProgressSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set());

  // Timer state
  const [restTime, setRestTime] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session elapsed
  const [sessionStart, setSessionStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    loadRoutineData(user.id).then((data) => {
      if (data.routine) setRoutine(data.routine);
      setCompletedSessions(data.completedKeys);
      if (data.inProgressSession) setInProgressSession(data.inProgressSession);
      setPreviousLogs(data.previousLogs);
      setLoading(false);
    });
  }, [user]);

  // ─── Elapsed timer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (mode === "active" || mode === "rest" || mode === "registration" || mode === "sfr") {
      if (!elapsedRef.current && sessionStart > 0) {
        elapsedRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      }
    }
    if (mode === "overview" || mode === "summary") {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    }
    return () => {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    };
  }, [mode, sessionStart]);

  // ─── Rest timer ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mode === "rest" && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setMode("active");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [mode]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const allExercises = useMemo((): ExerciseData[] => {
    if (!routine) return [];
    if (routine.exercises && Array.isArray(routine.exercises) && routine.exercises.length > 0) {
      return routine.exercises;
    }
    if (routine.days && Array.isArray(routine.days)) {
      return routine.days.flatMap((d: DayData) =>
        (d.exercises ?? []).map((ex) => ({ ...ex, day_of_week: ex.day_of_week ?? d.day, day_label: ex.day_label ?? d.label }))
      );
    }
    return [];
  }, [routine]);

  const dayExercises = useMemo(() =>
    allExercises
      .filter((ex) => ex.day_of_week === selectedDay && (!ex.week_of_month || ex.week_of_month === activeWeek))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [allExercises, selectedDay, activeWeek]
  );

  const trainingDays = useMemo(() => {
    const days = [...new Set(allExercises.map((ex) => ex.day_of_week))];
    return DAY_KEYS.filter((d) => days.includes(d));
  }, [allExercises]);

  const weekCount = routine ? Math.max(1, routine.total_weeks ?? (routine.duration_months ?? 1) * 4) : 1;

  const getDayLabel = useCallback((day: string): string => {
    const ex = allExercises.find((e) => e.day_of_week === day);
    return ex?.day_label ?? DAY_LABELS[day] ?? day;
  }, [allExercises]);

  const isSessionCompleted = useMemo(() => {
    return completedSessions.has(`${getDayLabel(selectedDay)}::${activeWeek}`);
  }, [completedSessions, getDayLabel, selectedDay, activeWeek]);

  const getPreviousLog = useCallback((name: string): PreviousSet[] => {
    const log = previousLogs.find((l) => l.exercise_name === name);
    return (log?.sets_data as PreviousSet[]) ?? [];
  }, [previousLogs]);

  const formatPrevious = useCallback((name: string): string => {
    const prev = getPreviousLog(name);
    if (prev.length === 0) return "";
    const mainSets = prev.filter((s) => s.type !== "rest_pause");
    const first = mainSets[0] ?? prev[0];
    return `${first?.weight_kg ?? 0}×${first?.reps_done ?? 0}`;
  }, [getPreviousLog]);

  const currentSetIdx = useMemo(() => {
    const sets = allSets[currentExIdx] ?? [];
    return sets.findIndex((s) => !s.completed);
  }, [allSets, currentExIdx]);

  const allCurrentDone = currentSetIdx === -1 && (allSets[currentExIdx]?.length ?? 0) > 0;
  const currentEx = dayExercises[currentExIdx] ?? null;
  const summaryData = useMemo(() => computeSummaryData(dayExercises, allSets, getPreviousLog), [dayExercises, allSets, getPreviousLog]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const initSets = useCallback((exercises: ExerciseData[]) => {
    setAllSets(buildInitialSets(exercises, activeWeek));
  }, [activeWeek]);

  const savePartialProgress = useCallback(async (exIdx: number, updatedSets: SetEntry[]) => {
    if (!user || !sessionId) return;
    const ex = dayExercises[exIdx];
    if (!ex) return;

    const mainCount = ex.sets ?? 3;
    const { setsData, totalVolume } = buildSetsDataPayload(updatedSets, mainCount);

    const ok = await saveWeightLog({
      userId: user.id, trainerId: routine?.trainer_id,
      sessionId, exerciseId: ex.exercise_id, exerciseName: ex.name,
      setsData, totalVolume,
      notes: exerciseNotes[exIdx]?.trim() ?? null,
      rpe: computeAverageRpe(setsData),
      stressIndex: calculateStressIndex(setsData),
      stimulus: exerciseStimulus[exIdx] ?? null,
      fatigue: exerciseFatigue[exIdx] ?? null,
    });

    if (!ok) Alert.alert("Error", "No se pudo guardar el progreso del ejercicio");
    if (updatedSets.every((s) => s.completed)) {
      setSavedExercises((prev) => new Set(prev).add(exIdx));
    }
  }, [user, sessionId, dayExercises, exerciseNotes, exerciseStimulus, exerciseFatigue, routine]);

  const saveExerciseLog = useCallback(async (exIdx: number) => {
    if (!user || !sessionId) return;
    const ex = dayExercises[exIdx];
    if (!ex || savedExercises.has(exIdx)) return;
    await savePartialProgress(exIdx, allSets[exIdx] ?? []);
  }, [user, sessionId, dayExercises, allSets, savedExercises, savePartialProgress]);

  const startSession = useCallback(async (sessionMode: "registration" | "active") => {
    if (!user || !routine) return;
    const { sessionId: newId, error } = await createWorkoutSession({
      clientId: user.id, routineId: routine.id, trainerId: routine.trainer_id,
      dayLabel: getDayLabel(selectedDay), weekNumber: activeWeek, mode: sessionMode,
    });
    if (error || !newId) { Alert.alert("Error", error ?? "Error desconocido"); return; }

    setSessionId(newId);
    setSessionStart(Date.now());
    setElapsed(0);
    setCurrentExIdx(0);
    setClientNotes({});
    initSets(dayExercises);
    setMode(sessionMode);
  }, [user, routine, selectedDay, activeWeek, dayExercises, initSets, getDayLabel]);

  const resumeSession = useCallback(async () => {
    if (!inProgressSession || !user) return;
    const { logs, error } = await fetchSessionLogs(inProgressSession.id);
    if (error || !logs) { Alert.alert("Error", error ?? "Error cargando sesión"); return; }

    const result = buildResumedSets(dayExercises, logs, activeWeek);
    setAllSets(result.sets);
    setSavedExercises(result.savedIndices);
    setExerciseNotes(result.restoredNotes);
    setSessionId(inProgressSession.id);
    setSessionStart(new Date(inProgressSession.created_at).getTime());
    setElapsed(Math.floor((Date.now() - new Date(inProgressSession.created_at).getTime()) / 1000));
    setCurrentExIdx(result.firstIncompleteIdx);
    setMode("active");
  }, [inProgressSession, user, dayExercises, activeWeek]);

  const completeSet = useCallback((setIdx: number) => {
    const sets = allSets[currentExIdx] ?? [];
    const set = sets[setIdx];
    if (!set || set.completed) return;
    if (!set.reps_done || Number(set.reps_done) === 0) { Alert.alert("", "Introduce las repeticiones"); return; }

    const updatedSets = [...sets];
    updatedSets[setIdx] = { ...updatedSets[setIdx], completed: true };
    setAllSets((prev) => ({ ...prev, [currentExIdx]: updatedSets }));
    savePartialProgress(currentExIdx, updatedSets);

    if (updatedSets.every((s) => s.completed)) {
      setMode("sfr");
    } else {
      const ex = dayExercises[currentExIdx];
      setRestTotal(ex?.rest_s ?? 90);
      setRestTime(ex?.rest_s ?? 90);
      setMode("rest");
    }
  }, [allSets, currentExIdx, dayExercises, savePartialProgress]);

  const goNextExercise = useCallback(async () => {
    const sets = allSets[currentExIdx] ?? [];
    if (sets.length > 0 && sets.every((s) => s.completed) && !savedExercises.has(currentExIdx)) {
      await saveExerciseLog(currentExIdx);
    }
    if (currentExIdx < dayExercises.length - 1) { setCurrentExIdx((p) => p + 1); setMode("active"); }
  }, [currentExIdx, dayExercises, allSets, savedExercises, saveExerciseLog]);

  const goPrevExercise = useCallback(() => {
    if (currentExIdx > 0) { setCurrentExIdx((p) => p - 1); setMode("active"); }
  }, [currentExIdx]);

  const finishRoutine = useCallback(async () => {
    const sets = allSets[currentExIdx] ?? [];
    if (sets.length > 0 && sets.every((s) => s.completed) && !savedExercises.has(currentExIdx)) {
      await saveExerciseLog(currentExIdx);
    }
    setMode("rpe");
  }, [currentExIdx, allSets, savedExercises, saveExerciseLog]);

  const confirmSfr = useCallback(async () => {
    await savePartialProgress(currentExIdx, allSets[currentExIdx] ?? []);
    setMode("active");
  }, [currentExIdx, allSets, savePartialProgress]);

  const skipRest = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRestTime(0);
    setMode("active");
  }, []);

  const saveAndNext = useCallback(async () => {
    if (!user || !sessionId) return;
    const ex = dayExercises[currentExIdx];
    if (!ex) return;

    const { setsData, totalVolume } = buildRegistrationSetsData(allSets[currentExIdx] ?? []);
    const { success } = await insertExerciseLog({
      userId: user.id, trainerId: routine?.trainer_id,
      exerciseId: ex.exercise_id, exerciseName: ex.name,
      sessionId, setsData, totalVolume,
      notes: exerciseNotes[currentExIdx]?.trim() ?? null,
    });
    if (!success) { Alert.alert("Error", "No se pudo guardar el ejercicio"); return; }

    setSavedExercises((prev) => new Set(prev).add(currentExIdx));
    if (currentExIdx < dayExercises.length - 1) { setCurrentExIdx((p) => p + 1); setMode("active"); }
    else setMode("rpe");
  }, [user, sessionId, dayExercises, currentExIdx, allSets, routine, exerciseNotes]);

  const doFinalize = useCallback(async (countOnlyCompleted: boolean) => {
    if (!sessionId || !user || !routine) return;
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    const { totalVolume, totalSetsCount } = computeSessionTotals(allSets, countOnlyCompleted);

    await completeWorkoutSession({
      sessionId, durationSeconds: duration, totalVolume, totalSets: totalSetsCount,
      totalExercises: dayExercises.length, rpeSession: rpeGlobal,
    });
    await saveCalendarEntry({
      userId: user.id, routineTitle: routine.title ?? "Entrenamiento",
      selectedDay, dayLabel: getDayLabel(selectedDay), rpeGlobal, totalVolume,
    });
    return totalVolume;
  }, [sessionId, user, routine, sessionStart, allSets, dayExercises, rpeGlobal, selectedDay, getDayLabel]);

  const saveRegistration = useCallback(async () => {
    if (!user || !sessionId) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    const inserts = dayExercises.map((ex, idx) => {
      const { setsData, totalVolume } = buildRegistrationSetsData(allSets[idx] ?? []);
      return {
        client_id: user.id, trainer_id: routine?.trainer_id,
        exercise_id: ex.exercise_id, exercise_name: ex.name,
        session_date: today, session_id: sessionId,
        sets_data: setsData, total_volume_kg: totalVolume,
      };
    });

    const { success } = await batchInsertWeightLogs(inserts);
    if (!success) { Alert.alert("Error", "No se pudo guardar la sesión"); setSaving(false); return; }

    await doFinalize(false);
    setSaving(false);
    Alert.alert("Sesión guardada", "Tu entrenamiento ha sido registrado");
    setMode("overview");

    setPreviousLogs(await fetchPreviousLogs(user.id));
    updateWidget(user.id).catch(() => {});
  }, [user, sessionId, dayExercises, allSets, routine, doFinalize]);

  const finishSession = useCallback(async () => {
    if (!sessionId || !user) return;
    await doFinalize(true);
    setInProgressSession(null);
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }

    setPreviousLogs(await fetchPreviousLogs(user.id));
    updateWidget(user.id).catch(() => {});
    setMode("summary");
  }, [sessionId, user, doFinalize]);

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    loading, routine, mode, setMode,
    selectedDay, setSelectedDay, activeWeek, setActiveWeek,
    currentExIdx, allSets, setAllSets,
    clientNotes, setClientNotes, exerciseNotes, setExerciseNotes,
    exerciseStimulus, setExerciseStimulus,
    exerciseFatigue, setExerciseFatigue,
    rpeGlobal, setRpeGlobal,
    sessionId, saving, savedExercises,
    inProgressSession, isSessionCompleted,
    restTime, restTotal, timerRef, elapsed,
    dayExercises, trainingDays, weekCount,
    currentEx, currentSetIdx, allCurrentDone, summaryData,
    getDayLabel, getPreviousLog, formatPrevious,
    startSession, resumeSession, completeSet, saveAndNext,
    saveRegistration, goNextExercise, goPrevExercise, finishRoutine, finishSession,
    confirmSfr, skipRest,
  };
}
