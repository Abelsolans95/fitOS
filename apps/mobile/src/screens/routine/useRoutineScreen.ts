import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { updateWidget } from "../../lib/widget-sync";
import { DAY_KEYS, DAY_LABELS } from "./constants";
import type {
  RoutineRaw, ExerciseData, DayData, PreviousLog, PreviousSet,
  SetEntry, SavedLogEntry, InProgressSession, ScreenMode,
} from "./types";
import { calculateStressIndex } from "@fitos/shared";

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
  // exerciseRpe removed — RPE is now per-set, not per-exercise
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

  // Load data
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: r } = await supabase
        .from("user_routines")
        .select("id, title, goal, trainer_id, duration_months, exercises, days, total_weeks, current_week, training_days, sent_at")
        .eq("client_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (r) {
        setRoutine(r as RoutineRaw);
        const { data: doneSessions } = await supabase
          .from("workout_sessions")
          .select("day_label, week_number")
          .eq("client_id", user.id)
          .eq("routine_id", (r as RoutineRaw).id)
          .eq("status", "completed");

        if (doneSessions) {
          const keys = new Set(doneSessions.map((s: { day_label: string; week_number: number }) => `${s.day_label}::${s.week_number}`));
          setCompletedSessions(keys);
        }
      }

      const { data: pendingSession } = await supabase
        .from("workout_sessions")
        .select("id, routine_id, day_label, week_number, created_at")
        .eq("client_id", user.id)
        .eq("status", "in_progress")
        .eq("mode", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingSession) setInProgressSession(pendingSession as InProgressSession);

      const { data: logs } = await supabase
        .from("weight_log")
        .select("exercise_name, session_date, sets_data")
        .eq("client_id", user.id)
        .order("session_date", { ascending: false })
        .limit(200);

      if (logs) setPreviousLogs(logs as PreviousLog[]);
      setLoading(false);
    };
    load();
  }, [user]);

  // Elapsed timer
  useEffect(() => {
    if (mode === "active" || mode === "rest" || mode === "registration" || mode === "sfr") {
      if (!elapsedRef.current && sessionStart > 0) {
        elapsedRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      }
    }
    if (mode === "overview" || mode === "summary") {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    }
    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [mode, sessionStart]);

  // Rest timer
  useEffect(() => {
    if (mode === "rest" && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setMode("active");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode]);

  // Parse exercises
  const allExercises = useMemo((): ExerciseData[] => {
    if (!routine) return [];
    if (routine.exercises && Array.isArray(routine.exercises) && routine.exercises.length > 0) {
      return routine.exercises;
    }
    if (routine.days && Array.isArray(routine.days)) {
      return routine.days.flatMap((d: DayData) =>
        (d.exercises || []).map((ex) => ({
          ...ex,
          day_of_week: ex.day_of_week || d.day,
          day_label: ex.day_label || d.label,
        }))
      );
    }
    return [];
  }, [routine]);

  const dayExercises = useMemo(() => {
    return allExercises
      .filter((ex) => {
        if (ex.day_of_week !== selectedDay) return false;
        if (ex.week_of_month && ex.week_of_month !== activeWeek) return false;
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [allExercises, selectedDay, activeWeek]);

  const trainingDays = useMemo(() => {
    const days = [...new Set(allExercises.map((ex) => ex.day_of_week))];
    return DAY_KEYS.filter((d) => days.includes(d));
  }, [allExercises]);

  const weekCount = routine ? Math.max(1, routine.total_weeks || (routine.duration_months || 1) * 4) : 1;

  const getDayLabel = useCallback((day: string): string => {
    const ex = allExercises.find((e) => e.day_of_week === day);
    return ex?.day_label || DAY_LABELS[day] || day;
  }, [allExercises]);

  const isSessionCompleted = useMemo(() => {
    const label = getDayLabel(selectedDay);
    return completedSessions.has(`${label}::${activeWeek}`);
  }, [completedSessions, getDayLabel, selectedDay, activeWeek]);

  const getPreviousLog = useCallback(
    (name: string): PreviousSet[] => {
      const log = previousLogs.find((l) => l.exercise_name === name);
      return (log?.sets_data as PreviousSet[]) || [];
    },
    [previousLogs]
  );

  const formatPrevious = useCallback(
    (name: string): string => {
      const prev = getPreviousLog(name);
      if (prev.length === 0) return "";
      const mainSets = prev.filter((s) => s.type !== "rest_pause");
      const first = mainSets[0] || prev[0];
      return `${first?.weight_kg ?? 0}×${first?.reps_done ?? 0}`;
    },
    [getPreviousLog]
  );

  const initSets = useCallback((exercises: ExerciseData[]) => {
    const initial: Record<number, SetEntry[]> = {};
    exercises.forEach((ex, idx) => {
      // Check weekly_config sets_detail first (works for both equal and different modes)
      const wkDetail = ex.weekly_config?.[activeWeek]?.sets_detail;
      if (wkDetail && wkDetail.length > 0) {
        initial[idx] = wkDetail.map((sc) => {
          const st = sc.set_type || "normal";
          return {
            weight_kg: "", reps_done: "", rir: "", rpe: "", completed: false,
            type: (st === "rest_pause" ? "rest_pause" : st === "drop_set" ? "drop_set" : "main") as SetEntry["type"],
          };
        });
      } else if (ex.mode === "different" && ex.sets_config && ex.sets_config.length > 0) {
        initial[idx] = ex.sets_config.map((sc) => {
          const st = sc.set_type || "normal";
          return {
            weight_kg: "", reps_done: "", rir: "", rpe: "", completed: false,
            type: (st === "rest_pause" ? "rest_pause" : st === "drop_set" ? "drop_set" : "main") as SetEntry["type"],
          };
        });
      } else {
        const mainCount = ex.sets || 3;
        const rpCount = ex.rest_pause_sets || 0;
        const total = mainCount + rpCount;
        initial[idx] = Array.from({ length: total }, (_, i) => ({
          weight_kg: "", reps_done: "", rir: "", rpe: "", completed: false,
          type: i < mainCount ? "main" as const : "rest_pause" as const,
        }));
      }
    });
    setAllSets(initial);
  }, [activeWeek]);

  const saveCalendarAndRpe = useCallback(async (totalVolume: number) => {
    if (!user || !routine) return;
    const today = new Date().toISOString().split("T")[0];
    const { data: existingCal } = await supabase
      .from("user_calendar").select("id")
      .eq("user_id", user.id).eq("date", today).eq("activity_type", "workout").maybeSingle();

    let calId: string | null = null;
    if (existingCal) {
      await supabase.from("user_calendar").update({ completed: true, rpe: rpeGlobal }).eq("id", existingCal.id);
      calId = existingCal.id;
    } else {
      const { data: newCal } = await supabase.from("user_calendar").insert({
        user_id: user.id, date: today, activity_type: "workout",
        activity_details: { nombre: routine.title || "Entrenamiento", dia: selectedDay, day_label: getDayLabel(selectedDay) },
        completed: true, rpe: rpeGlobal,
      }).select("id").single();
      calId = newCal?.id || null;
    }
    if (calId) {
      await supabase.from("rpe_history").insert({
        client_id: user.id, calendar_id: calId, rpe_global: rpeGlobal, total_volume_kg: totalVolume,
      });
    }
  }, [user, routine, rpeGlobal, selectedDay, getDayLabel]);

  const resumeSession = useCallback(async () => {
    if (!inProgressSession || !user) return;
    const { data: sessionLogs } = await supabase
      .from("weight_log").select("exercise_name, sets_data, client_notes")
      .eq("session_id", inProgressSession.id);

    const savedLogs = (sessionLogs ?? []) as SavedLogEntry[];
    const alreadySaved = new Set<number>();
    const initial: Record<number, SetEntry[]> = {};
    const restoredNotes: Record<number, string> = {};

    dayExercises.forEach((ex, idx) => {
      const wkDetail = ex.weekly_config?.[activeWeek]?.sets_detail;
      const mainCount = ex.sets || 3;
      const rpCount = ex.rest_pause_sets || 0;
      const total = wkDetail?.length ?? (mainCount + rpCount);
      const savedLog = savedLogs.find((l) => l.exercise_name === ex.name);

      const getSetType = (i: number): "main" | "rest_pause" | "drop_set" => {
        if (wkDetail?.[i]) {
          const st = wkDetail[i].set_type || "normal";
          return st === "rest_pause" ? "rest_pause" : st === "drop_set" ? "drop_set" : "main";
        }
        return i < mainCount ? "main" : "rest_pause";
      };

      if (savedLog && savedLog.sets_data) {
        initial[idx] = savedLog.sets_data.map((s: PreviousSet & { rir?: number; rpe?: number; completed?: boolean }, i: number) => ({
          weight_kg: String(s.weight_kg), reps_done: String(s.reps_done),
          rir: String(s.rir ?? ""), rpe: String(s.rpe ?? ""), completed: s.completed !== false,
          type: getSetType(i),
        }));
        const allSetsDone = initial[idx].every((s) => s.completed);
        if (allSetsDone) alreadySaved.add(idx);
        while (initial[idx].length < total) {
          const i = initial[idx].length;
          initial[idx].push({ weight_kg: "", reps_done: "", rir: "", rpe: "", completed: false, type: getSetType(i) });
        }
        if (savedLog.client_notes) restoredNotes[idx] = savedLog.client_notes;
      } else {
        initial[idx] = Array.from({ length: total }, (_, i) => ({
          weight_kg: "", reps_done: "", rir: "", rpe: "", completed: false,
          type: getSetType(i),
        }));
      }
    });

    setAllSets(initial);
    setSavedExercises(alreadySaved);
    setExerciseNotes(restoredNotes);
    setSessionId(inProgressSession.id);
    setSessionStart(new Date(inProgressSession.created_at).getTime());
    setElapsed(Math.floor((Date.now() - new Date(inProgressSession.created_at).getTime()) / 1000));

    const firstIncomplete = dayExercises.findIndex((_, idx) => {
      const sets = initial[idx] || [];
      return sets.some((s) => !s.completed);
    });
    setCurrentExIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
    setMode("active");
  }, [inProgressSession, user, dayExercises, previousLogs]);

  // calculateStressIndex imported from @fitos/shared

  const savePartialProgress = useCallback(async (exIdx: number, updatedSets: SetEntry[]) => {
    if (!user || !sessionId) return;
    const ex = dayExercises[exIdx];
    if (!ex) return;

    const today = new Date().toISOString().split("T")[0];
    const mainCount = ex.sets || 3;
    const setsData = updatedSets.map((s, i) => ({
      set_number: i + 1, weight_kg: Number(s.weight_kg) || 0,
      reps_done: Number(s.reps_done) || 0, rir: Number(s.rir) || 0,
      rpe: Number(s.rpe) || 0,
      type: i < mainCount ? "main" : "rest_pause", completed: s.completed,
    }));
    const totalVol = setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);
    const notes = exerciseNotes[exIdx]?.trim() || null;
    const rpeVals = setsData.filter((s) => s.completed && s.rpe > 0).map((s) => s.rpe);
    const rpeVal = rpeVals.length > 0 ? Math.round((rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length) * 10) / 10 : null;
    const stimulusVal = exerciseStimulus[exIdx] ?? null;
    const fatigueVal = exerciseFatigue[exIdx] ?? null;
    const stressIndex = calculateStressIndex(setsData);

    const { data: existing } = await supabase.from("weight_log").select("id")
      .eq("session_id", sessionId).eq("exercise_name", ex.name).maybeSingle();

    if (existing) {
      await supabase.from("weight_log")
        .update({ sets_data: setsData, total_volume_kg: totalVol, client_notes: notes, exercise_rpe: rpeVal, stress_index: stressIndex, stimulus_rating: stimulusVal, fatigue_rating: fatigueVal })
        .eq("id", existing.id);
    } else {
      await supabase.from("weight_log").insert({
        client_id: user.id, trainer_id: routine?.trainer_id,
        exercise_id: ex.exercise_id, exercise_name: ex.name,
        session_date: today, session_id: sessionId,
        sets_data: setsData, total_volume_kg: totalVol, client_notes: notes, exercise_rpe: rpeVal,
        stress_index: stressIndex, stimulus_rating: stimulusVal, fatigue_rating: fatigueVal,
      });
    }
    if (updatedSets.every((s) => s.completed)) {
      setSavedExercises((prev) => new Set(prev).add(exIdx));
    }
  }, [user, sessionId, dayExercises, exerciseNotes, exerciseStimulus, exerciseFatigue, routine]);

  const saveExerciseLog = useCallback(async (exIdx: number) => {
    if (!user || !sessionId) return;
    const ex = dayExercises[exIdx];
    if (!ex || savedExercises.has(exIdx)) return;
    const sets = allSets[exIdx] || [];
    await savePartialProgress(exIdx, sets);
  }, [user, sessionId, dayExercises, allSets, savedExercises, savePartialProgress]);

  const goNextExercise = useCallback(async () => {
    const sets = allSets[currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !savedExercises.has(currentExIdx)) await saveExerciseLog(currentExIdx);
    if (currentExIdx < dayExercises.length - 1) {
      setCurrentExIdx((prev) => prev + 1);
      setMode("active");
    }
  }, [currentExIdx, dayExercises, allSets, savedExercises, saveExerciseLog]);

  const goPrevExercise = useCallback(() => {
    if (currentExIdx > 0) {
      setCurrentExIdx((prev) => prev - 1);
      setMode("active");
    }
  }, [currentExIdx]);

  const finishRoutine = useCallback(async () => {
    const sets = allSets[currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !savedExercises.has(currentExIdx)) await saveExerciseLog(currentExIdx);
    setMode("rpe");
  }, [currentExIdx, allSets, savedExercises, saveExerciseLog]);

  const startSession = useCallback(async (sessionMode: "registration" | "active") => {
    if (!user || !routine) return;
    const { data: session, error } = await supabase.from("workout_sessions").insert({
      client_id: user.id, routine_id: routine.id, trainer_id: routine.trainer_id,
      session_date: new Date().toISOString().split("T")[0],
      day_label: getDayLabel(selectedDay), week_number: activeWeek,
      mode: sessionMode, status: "in_progress",
    }).select("id").single();

    if (error || !session) {
      Alert.alert("Error", `No se pudo crear la sesión: ${error?.message || "sin respuesta"}`);
      return;
    }

    setSessionId(session.id);
    setSessionStart(Date.now());
    setElapsed(0);
    setCurrentExIdx(0);
    setClientNotes({});
    initSets(dayExercises);
    setMode(sessionMode);
  }, [user, routine, selectedDay, activeWeek, dayExercises, initSets, getDayLabel]);

  const completeSet = useCallback((setIdx: number) => {
    const sets = allSets[currentExIdx] || [];
    const set = sets[setIdx];
    if (!set || set.completed) return;
    if (!set.reps_done || Number(set.reps_done) === 0) {
      Alert.alert("", "Introduce las repeticiones");
      return;
    }
    const updatedSets = [...sets];
    updatedSets[setIdx] = { ...updatedSets[setIdx], completed: true };
    setAllSets((prev) => { const u = { ...prev }; u[currentExIdx] = updatedSets; return u; });
    savePartialProgress(currentExIdx, updatedSets);
    const allDone = updatedSets.every((s) => s.completed);
    if (allDone) {
      setMode("sfr");
    } else {
      const ex = dayExercises[currentExIdx];
      setRestTotal(ex?.rest_s || 90);
      setRestTime(ex?.rest_s || 90);
      setMode("rest");
    }
  }, [allSets, currentExIdx, dayExercises, savePartialProgress]);

  const saveAndNext = useCallback(async () => {
    if (!user || !sessionId) return;
    const ex = dayExercises[currentExIdx];
    if (!ex) return;
    const sets = allSets[currentExIdx] || [];
    const today = new Date().toISOString().split("T")[0];
    const setsData = sets.map((s, i) => ({
      set_number: i + 1, weight_kg: Number(s.weight_kg) || 0,
      reps_done: Number(s.reps_done) || 0, type: s.type,
    }));
    const totalVol = setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);
    const notes = exerciseNotes[currentExIdx]?.trim() || null;
    await supabase.from("weight_log").insert({
      client_id: user.id, trainer_id: routine?.trainer_id,
      exercise_id: ex.exercise_id, exercise_name: ex.name,
      session_date: today, session_id: sessionId,
      sets_data: setsData, total_volume_kg: totalVol, client_notes: notes,
    });
    setSavedExercises((prev) => new Set(prev).add(currentExIdx));
    if (currentExIdx < dayExercises.length - 1) {
      setCurrentExIdx((prev) => prev + 1);
      setMode("active");
    } else {
      setMode("rpe");
    }
  }, [user, sessionId, dayExercises, currentExIdx, allSets, routine, exerciseNotes]);

  const saveRegistration = useCallback(async () => {
    if (!user || !sessionId) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const inserts = dayExercises.map((ex, idx) => {
      const sets = allSets[idx] || [];
      const setsData = sets.map((s, i) => ({
        set_number: i + 1, weight_kg: Number(s.weight_kg) || 0,
        reps_done: Number(s.reps_done) || 0, type: s.type,
      }));
      return {
        client_id: user.id, trainer_id: routine?.trainer_id,
        exercise_id: ex.exercise_id, exercise_name: ex.name,
        session_date: today, session_id: sessionId,
        sets_data: setsData, total_volume_kg: setsData.reduce((s, d) => s + d.weight_kg * d.reps_done, 0),
      };
    });

    const { error } = await supabase.from("weight_log").insert(inserts);
    if (error) { Alert.alert("Error", "No se pudo guardar la sesión"); setSaving(false); return; }

    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    let totalVol = 0; let totalSetsCount = 0;
    for (const sets of Object.values(allSets)) {
      for (const s of sets) { totalVol += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0); totalSetsCount++; }
    }

    await supabase.from("workout_sessions").update({
      status: "completed", completed_at: new Date().toISOString(),
      duration_seconds: duration, total_volume_kg: totalVol,
      total_sets: totalSetsCount, total_exercises: dayExercises.length, rpe_session: rpeGlobal,
    }).eq("id", sessionId);

    await saveCalendarAndRpe(totalVol);
    setSaving(false);
    Alert.alert("Sesión guardada", "Tu entrenamiento ha sido registrado");
    setMode("overview");

    const { data: newLogs } = await supabase.from("weight_log")
      .select("exercise_name, session_date, sets_data")
      .eq("client_id", user.id).order("session_date", { ascending: false }).limit(200);
    if (newLogs) setPreviousLogs(newLogs as PreviousLog[]);
    updateWidget(user.id).catch(() => {});
  }, [user, sessionId, dayExercises, allSets, sessionStart, rpeGlobal, routine, saveCalendarAndRpe]);

  const finishSession = useCallback(async () => {
    if (!sessionId || !user) return;
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    let totalVol = 0; let totalSetsCount = 0;
    for (const sets of Object.values(allSets)) {
      for (const s of sets) {
        totalVol += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        if (s.completed) totalSetsCount++;
      }
    }

    await supabase.from("workout_sessions").update({
      status: "completed", completed_at: new Date().toISOString(),
      duration_seconds: duration, total_volume_kg: totalVol,
      total_sets: totalSetsCount, total_exercises: dayExercises.length, rpe_session: rpeGlobal,
    }).eq("id", sessionId);

    await saveCalendarAndRpe(totalVol);
    setInProgressSession(null);
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }

    const { data: newLogs } = await supabase.from("weight_log")
      .select("exercise_name, session_date, sets_data")
      .eq("client_id", user.id).order("session_date", { ascending: false }).limit(200);
    if (newLogs) setPreviousLogs(newLogs as PreviousLog[]);
    updateWidget(user.id).catch(() => {});
    setMode("summary");
  }, [sessionId, user, sessionStart, allSets, dayExercises, rpeGlobal, saveCalendarAndRpe]);

  const summaryData = useMemo(() => {
    let totalVol = 0; let totalSetsCount = 0;
    const results: { name: string; progress: string; color: string }[] = [];
    // Import calculateProgress here to avoid circular deps — inline it
    dayExercises.forEach((ex, idx) => {
      const sets = allSets[idx] || [];
      const prev = getPreviousLog(ex.name);
      for (const s of sets) {
        totalVol += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        if (s.completed || Number(s.reps_done) > 0) totalSetsCount++;
      }
      const cur = sets.filter((s) => s.completed || Number(s.reps_done) > 0)
        .map((s) => ({ weight: Number(s.weight_kg) || 0, reps: Number(s.reps_done) || 0 }));
      const prv = prev.map((s) => ({ weight: s.weight_kg, reps: s.reps_done }));
      // Simple progress calculation inline
      let label = "—"; let color = "#5A5A72";
      if (prv.length === 0) { label = "PRIMERA SESIÓN"; color = "#00E5FF"; }
      else if (cur.length > 0) {
        const wUp = cur.some((c, i) => prv[i] && c.weight > prv[i].weight);
        const wDown = cur.some((c, i) => prv[i] && c.weight < prv[i].weight);
        const rUp = cur.some((c, i) => prv[i] && c.reps > prv[i].reps);
        const rDown = cur.some((c, i) => prv[i] && c.reps < prv[i].reps);
        if (wUp && !wDown) { label = "PROGRESIÓN"; color = "#00C853"; }
        else if (rUp && !rDown && !wUp && !wDown) { label = "REPS ↑"; color = "#00C853"; }
        else if (wUp && rDown) { label = "CARGA ↑ REPS ↓"; color = "#FF9100"; }
        else if (!wUp && !wDown && !rUp && !rDown) { label = "MANTENIDO"; color = "#8B8BA3"; }
        else if (wDown || rDown) { label = "REGRESIÓN"; color = "#FF1744"; }
        else { label = "PROGRESIÓN"; color = "#00C853"; }
      }
      results.push({ name: ex.name, progress: label, color });
    });
    return { totalVol, totalSetsCount, results };
  }, [dayExercises, allSets, getPreviousLog]);

  const currentSetIdx = useMemo(() => {
    const sets = allSets[currentExIdx] || [];
    return sets.findIndex((s) => !s.completed);
  }, [allSets, currentExIdx]);

  const allCurrentDone = currentSetIdx === -1 && (allSets[currentExIdx]?.length || 0) > 0;
  const currentEx = dayExercises[currentExIdx] || null;

  const confirmSfr = useCallback(async () => {
    const sets = allSets[currentExIdx] || [];
    // Always re-save — stimulus/fatigue were set AFTER the initial save
    await savePartialProgress(currentExIdx, sets);
    setMode("active");
  }, [currentExIdx, allSets, savePartialProgress]);

  const skipRest = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRestTime(0);
    setMode("active");
  }, []);

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
