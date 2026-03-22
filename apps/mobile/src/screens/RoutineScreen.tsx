import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from "react-native";
import Svg, { Path, Circle as SvgCircle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows } from "../theme";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface ExerciseData {
  exercise_id: string;
  name: string;
  day_of_week: string;
  day_label?: string;
  scheme?: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_pause_sets?: number;
  rir: number;
  weight_kg?: number;
  target_weight?: number | null;
  rest_s: number;
  progression_rule?: string;
  coach_notes?: string;
  trainer_notes?: string;
  technique_notes?: string;
  video_url?: string;
  order?: number;
  week_of_month?: number;
}

interface DayData {
  day: string;
  label?: string;
  exercises: ExerciseData[];
}

interface RoutineRaw {
  id: string;
  title: string;
  goal: string;
  trainer_id: string;
  duration_months: number;
  exercises?: ExerciseData[];
  days?: DayData[];
  total_weeks?: number;
  current_week?: number;
  training_days?: string[];
  sent_at?: string | null;
}

interface PreviousSet {
  weight_kg: number;
  reps_done: number;
  type?: string;
}

interface PreviousLog {
  exercise_name: string;
  session_date: string;
  sets_data: PreviousSet[];
}

interface SetEntry {
  weight_kg: string;
  reps_done: string;
  completed: boolean;
  type: "main" | "rest_pause";
}

interface SavedLogEntry {
  exercise_name: string;
  sets_data: { set_number: number; weight_kg: number; reps_done: number; type: string }[];
  client_notes: string | null;
}

interface InProgressSession {
  id: string;
  routine_id: string;
  day_label: string;
  week_number: number;
  created_at: string;
}

type ScreenMode = "overview" | "registration" | "active" | "rest" | "rpe" | "summary";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const DAY_KEYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DAY_SHORT: Record<string, string> = {
  lunes: "L", martes: "M", "miércoles": "X", jueves: "J",
  viernes: "V", "sábado": "S", domingo: "D",
};
const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", "miércoles": "Miércoles", jueves: "Jueves",
  viernes: "Viernes", "sábado": "Sábado", domingo: "Domingo",
};
const SCREEN_WIDTH = Dimensions.get("window").width;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function calculateProgress(
  current: { weight: number; reps: number }[],
  previous: { weight: number; reps: number }[]
): { label: string; color: string } {
  if (previous.length === 0) return { label: "PRIMERA SESIÓN", color: colors.cyan };
  if (current.length === 0) return { label: "", color: colors.dimmed };

  let weightUp = false, weightDown = false;
  let repsUp = false, repsDown = false;
  let weightSame = true, repsSame = true;

  for (let i = 0; i < Math.min(current.length, previous.length); i++) {
    if (current[i].weight > previous[i].weight) { weightUp = true; weightSame = false; }
    if (current[i].weight < previous[i].weight) { weightDown = true; weightSame = false; }
    if (current[i].reps > previous[i].reps) { repsUp = true; repsSame = false; }
    if (current[i].reps < previous[i].reps) { repsDown = true; repsSame = false; }
  }

  if (weightUp && !weightDown && (repsSame || repsUp))
    return { label: "PROGRESIÓN", color: colors.green };
  if (repsUp && !repsDown && weightSame)
    return { label: "REPS ↑", color: colors.green };
  if (weightUp && repsDown)
    return { label: "CARGA ↑ REPS ↓", color: colors.orange };
  if (weightSame && repsSame)
    return { label: "MANTENIDO", color: colors.muted };
  if (weightDown || repsDown)
    return { label: "REGRESIÓN", color: colors.red };

  return { label: "PROGRESIÓN", color: colors.green };
}

/* ────────────────────────────────────────────
   SVG Icon Components
   ──────────────────────────────────────────── */

function ChevronLeftIcon({ size = 20, color = colors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15.75 19.5L8.25 12l7.5-7.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = colors.bg }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 14, color = colors.green }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 12.75l6 6 9-13.5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 16, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4.5v15m7.5-7.5h-15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlayIcon({ size = 16, color = colors.bg }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" fill={color} />
    </Svg>
  );
}

function BoltIcon({ size = 32, color = colors.dimmed }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3.75 13.5L14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function VideoIcon({ size = 12, color = colors.cyan }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5v14l11-7z" fill={color} />
    </Svg>
  );
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export default function RoutineScreen() {
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
  const [rpeGlobal, setRpeGlobal] = useState(7);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedExercises, setSavedExercises] = useState<Set<number>>(new Set());
  const [inProgressSession, setInProgressSession] = useState<InProgressSession | null>(null);
  // Set of "day_label::week_number" keys for completed sessions
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set());

  // Timer state
  const [restTime, setRestTime] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session elapsed
  const [sessionStart, setSessionStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: r } = await supabase
        .from("user_routines")
        .select("*")
        .eq("client_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (r) {
        setRoutine(r as RoutineRaw);

        // Load completed sessions for this routine
        const { data: doneSessions } = await supabase
          .from("workout_sessions")
          .select("day_label, week_number")
          .eq("client_id", user.id)
          .eq("routine_id", (r as RoutineRaw).id)
          .eq("status", "completed");

        if (doneSessions) {
          const keys = new Set(doneSessions.map((s: any) => `${s.day_label}::${s.week_number}`));
          setCompletedSessions(keys);
        }
      }

      // Check for in_progress active session
      const { data: pendingSession } = await supabase
        .from("workout_sessions")
        .select("id, routine_id, day_label, week_number, created_at")
        .eq("client_id", user.id)
        .eq("status", "in_progress")
        .eq("mode", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingSession) {
        setInProgressSession(pendingSession as InProgressSession);
      }

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

  // ── Elapsed timer ──
  useEffect(() => {
    if (mode === "active" || mode === "rest" || mode === "registration") {
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

  // ── Rest timer ──
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

  // ── Parse exercises ──
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

  // ── Day label helper ──
  const getDayLabel = useCallback((day: string): string => {
    const ex = allExercises.find((e) => e.day_of_week === day);
    return ex?.day_label || DAY_LABELS[day] || day;
  }, [allExercises]);

  // Check if this specific day+week session is already completed
  const isSessionCompleted = useMemo(() => {
    const label = getDayLabel(selectedDay);
    return completedSessions.has(`${label}::${activeWeek}`);
  }, [completedSessions, getDayLabel, selectedDay, activeWeek]);

  // ── Helpers ──
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

  const getScheme = (ex: ExerciseData) =>
    ex.scheme || `${ex.sets}×${ex.reps_min}${ex.reps_max !== ex.reps_min ? `-${ex.reps_max}` : ""}`;

  // ── Initialize sets for training ──
  const initSets = useCallback(
    (exercises: ExerciseData[]) => {
      const initial: Record<number, SetEntry[]> = {};
      exercises.forEach((ex, idx) => {
        const mainCount = ex.sets || 3;
        const rpCount = ex.rest_pause_sets || 0;
        const prev = getPreviousLog(ex.name);
        const total = mainCount + rpCount;

        initial[idx] = Array.from({ length: total }, (_, i) => ({
          weight_kg: prev[i]
            ? String(prev[i].weight_kg)
            : (ex.target_weight || ex.weight_kg)
              ? String(ex.target_weight || ex.weight_kg)
              : "",
          reps_done: "",
          completed: false,
          type: i < mainCount ? "main" as const : "rest_pause" as const,
        }));
      });
      setAllSets(initial);
    },
    [getPreviousLog]
  );

  // ── Save calendar + RPE history ──
  const saveCalendarAndRpe = useCallback(async (totalVolume: number) => {
    if (!user || !routine) return;
    const today = new Date().toISOString().split("T")[0];

    const { data: existingCal } = await supabase
      .from("user_calendar")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("activity_type", "workout")
      .maybeSingle();

    let calId: string | null = null;

    if (existingCal) {
      await supabase
        .from("user_calendar")
        .update({ completed: true, rpe: rpeGlobal })
        .eq("id", existingCal.id);
      calId = existingCal.id;
    } else {
      const { data: newCal } = await supabase
        .from("user_calendar")
        .insert({
          user_id: user.id,
          date: today,
          activity_type: "workout",
          activity_details: {
            nombre: routine.title || "Entrenamiento",
            dia: selectedDay,
            day_label: getDayLabel(selectedDay),
          },
          completed: true,
          rpe: rpeGlobal,
        })
        .select("id")
        .single();
      calId = newCal?.id || null;
    }

    if (calId) {
      await supabase.from("rpe_history").insert({
        client_id: user.id,
        calendar_id: calId,
        rpe_global: rpeGlobal,
        total_volume_kg: totalVolume,
      });
    }
  }, [user, routine, rpeGlobal, selectedDay, getDayLabel]);

  // ── Resume in-progress session ──
  const resumeSession = useCallback(async () => {
    if (!inProgressSession || !user) return;

    // Load weight_log entries for this session
    const { data: sessionLogs } = await supabase
      .from("weight_log")
      .select("exercise_name, sets_data, client_notes")
      .eq("session_id", inProgressSession.id);

    const savedLogs = (sessionLogs ?? []) as SavedLogEntry[];
    const savedNames = new Set(savedLogs.map((l) => l.exercise_name));
    const alreadySaved = new Set<number>();

    const initial: Record<number, SetEntry[]> = {};
    const restoredNotes: Record<number, string> = {};

    dayExercises.forEach((ex, idx) => {
      const mainCount = ex.sets || 3;
      const rpCount = ex.rest_pause_sets || 0;
      const total = mainCount + rpCount;
      const savedLog = savedLogs.find((l) => l.exercise_name === ex.name);
      const prevLog = previousLogs.find((l) => l.exercise_name === ex.name);

      if (savedLog && savedLog.sets_data) {
        // Restore from saved session — respect per-set completed flag
        initial[idx] = savedLog.sets_data.map((s: any, i: number) => ({
          weight_kg: String(s.weight_kg),
          reps_done: String(s.reps_done),
          completed: s.completed !== false, // backwards compat: old entries without flag are done
          type: i < mainCount ? "main" as const : "rest_pause" as const,
        }));
        // Mark as fully saved only if ALL sets are completed
        const allSetsDone = initial[idx].every((s) => s.completed);
        if (allSetsDone) alreadySaved.add(idx);
        while (initial[idx].length < total) {
          const i = initial[idx].length;
          const prevSet = prevLog?.sets_data?.[i];
          initial[idx].push({
            weight_kg: prevSet ? String(prevSet.weight_kg) : (ex.target_weight || ex.weight_kg) ? String(ex.target_weight || ex.weight_kg) : "",
            reps_done: "",
            completed: false,
            type: i < mainCount ? "main" as const : "rest_pause" as const,
          });
        }
        if (savedLog.client_notes) restoredNotes[idx] = savedLog.client_notes;
      } else {
        initial[idx] = Array.from({ length: total }, (_, i) => {
          const prevSet = prevLog?.sets_data?.[i];
          return {
            weight_kg: prevSet ? String(prevSet.weight_kg) : (ex.target_weight || ex.weight_kg) ? String(ex.target_weight || ex.weight_kg) : "",
            reps_done: "",
            completed: false,
            type: i < mainCount ? "main" as const : "rest_pause" as const,
          };
        });
      }
    });

    setAllSets(initial);
    setSavedExercises(alreadySaved);
    setExerciseNotes(restoredNotes);
    setSessionId(inProgressSession.id);
    setSessionStart(new Date(inProgressSession.created_at).getTime());
    setElapsed(Math.floor((Date.now() - new Date(inProgressSession.created_at).getTime()) / 1000));

    // Jump to first exercise with incomplete sets
    const firstIncomplete = dayExercises.findIndex((_, idx) => {
      const sets = initial[idx] || [];
      return sets.some((s) => !s.completed);
    });
    setCurrentExIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
    setMode("active");
  }, [inProgressSession, user, dayExercises, previousLogs]);

  // ── Upsert partial progress to weight_log ──
  const savePartialProgress = useCallback(
    async (exIdx: number, updatedSets: SetEntry[]) => {
      if (!user || !sessionId) return;
      const ex = dayExercises[exIdx];
      if (!ex) return;

      const today = new Date().toISOString().split("T")[0];
      const mainCount = ex.sets || 3;
      const setsData = updatedSets.map((s, i) => ({
        set_number: i + 1,
        weight_kg: Number(s.weight_kg) || 0,
        reps_done: Number(s.reps_done) || 0,
        type: i < mainCount ? "main" : "rest_pause",
        completed: s.completed,
      }));
      const totalVol = setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);
      const notes = exerciseNotes[exIdx]?.trim() || null;

      // Check if entry already exists for this session + exercise
      const { data: existing } = await supabase
        .from("weight_log")
        .select("id")
        .eq("session_id", sessionId)
        .eq("exercise_name", ex.name)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("weight_log")
          .update({ sets_data: setsData, total_volume_kg: totalVol, client_notes: notes })
          .eq("id", existing.id);
      } else {
        await supabase.from("weight_log").insert({
          client_id: user.id,
          trainer_id: routine?.trainer_id,
          exercise_id: ex.exercise_id,
          exercise_name: ex.name,
          session_date: today,
          session_id: sessionId,
          sets_data: setsData,
          total_volume_kg: totalVol,
          client_notes: notes,
        });
      }

      // If all sets done, mark as saved
      if (updatedSets.every((s) => s.completed)) {
        setSavedExercises((prev) => new Set(prev).add(exIdx));
      }
    },
    [user, sessionId, dayExercises, exerciseNotes, routine]
  );

  // ── Save single exercise to weight_log (final save, uses upsert) ──
  const saveExerciseLog = useCallback(async (exIdx: number) => {
    if (!user || !sessionId) return;
    const ex = dayExercises[exIdx];
    if (!ex || savedExercises.has(exIdx)) return;

    const sets = allSets[exIdx] || [];
    await savePartialProgress(exIdx, sets);
  }, [user, sessionId, dayExercises, allSets, savedExercises, savePartialProgress]);

  // ── Navigate next exercise ──
  const goNextExercise = useCallback(async () => {
    const sets = allSets[currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !savedExercises.has(currentExIdx)) {
      await saveExerciseLog(currentExIdx);
    }
    if (currentExIdx < dayExercises.length - 1) {
      setCurrentExIdx((prev) => prev + 1);
      setMode("active");
    }
  }, [currentExIdx, dayExercises, allSets, savedExercises, saveExerciseLog]);

  // ── Navigate previous exercise ──
  const goPrevExercise = useCallback(() => {
    if (currentExIdx > 0) {
      setCurrentExIdx((prev) => prev - 1);
      setMode("active");
    }
  }, [currentExIdx]);

  // ── Finish routine → RPE ──
  const finishRoutine = useCallback(async () => {
    const sets = allSets[currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !savedExercises.has(currentExIdx)) {
      await saveExerciseLog(currentExIdx);
    }
    setMode("rpe");
  }, [currentExIdx, allSets, savedExercises, saveExerciseLog]);

  // ── Start session ──
  const startSession = useCallback(
    async (sessionMode: "registration" | "active") => {
      if (!user || !routine) return;

      const { data: session, error } = await supabase
        .from("workout_sessions")
        .insert({
          client_id: user.id,
          routine_id: routine.id,
          trainer_id: routine.trainer_id,
          session_date: new Date().toISOString().split("T")[0],
          day_label: getDayLabel(selectedDay),
          week_number: activeWeek,
          mode: sessionMode,
          status: "in_progress",
        })
        .select("id")
        .single();

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
    },
    [user, routine, selectedDay, activeWeek, dayExercises, initSets, getDayLabel]
  );

  // ── Complete set (active mode) ──
  const completeSet = useCallback(
    (setIdx: number) => {
      const sets = allSets[currentExIdx] || [];
      const set = sets[setIdx];
      if (!set || set.completed) return;

      if (!set.reps_done || Number(set.reps_done) === 0) {
        Alert.alert("", "Introduce las repeticiones");
        return;
      }

      const updatedSets = [...sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], completed: true };

      setAllSets((prev) => {
        const updated = { ...prev };
        updated[currentExIdx] = updatedSets;
        return updated;
      });

      // Save partial progress to DB immediately
      savePartialProgress(currentExIdx, updatedSets);

      const allDone = updatedSets.every((s) => s.completed);

      if (!allDone) {
        const ex = dayExercises[currentExIdx];
        setRestTotal(ex?.rest_s || 90);
        setRestTime(ex?.rest_s || 90);
        setMode("rest");
      }
    },
    [allSets, currentExIdx, dayExercises, savePartialProgress]
  );

  // ── Save exercise & advance ──
  const saveAndNext = useCallback(async () => {
    if (!user || !sessionId) return;
    const ex = dayExercises[currentExIdx];
    if (!ex) return;

    const sets = allSets[currentExIdx] || [];
    const today = new Date().toISOString().split("T")[0];
    const setsData = sets.map((s, i) => ({
      set_number: i + 1,
      weight_kg: Number(s.weight_kg) || 0,
      reps_done: Number(s.reps_done) || 0,
      type: s.type,
    }));
    const totalVol = setsData.reduce((sum, s) => sum + s.weight_kg * s.reps_done, 0);

    const notes = exerciseNotes[currentExIdx]?.trim() || null;
    await supabase.from("weight_log").insert({
      client_id: user.id,
      trainer_id: routine?.trainer_id,
      exercise_id: ex.exercise_id,
      exercise_name: ex.name,
      session_date: today,
      session_id: sessionId,
      sets_data: setsData,
      total_volume_kg: totalVol,
      client_notes: notes,
    });

    setSavedExercises((prev) => new Set(prev).add(currentExIdx));

    if (currentExIdx < dayExercises.length - 1) {
      setCurrentExIdx((prev) => prev + 1);
      setMode("active");
    } else {
      setMode("rpe");
    }
  }, [user, sessionId, dayExercises, currentExIdx, allSets, routine, exerciseNotes]);

  // ── Save registration session ──
  const saveRegistration = useCallback(async () => {
    if (!user || !sessionId) return;
    setSaving(true);

    const today = new Date().toISOString().split("T")[0];
    const inserts = dayExercises.map((ex, idx) => {
      const sets = allSets[idx] || [];
      const setsData = sets.map((s, i) => ({
        set_number: i + 1,
        weight_kg: Number(s.weight_kg) || 0,
        reps_done: Number(s.reps_done) || 0,
        type: s.type,
      }));
      return {
        client_id: user.id,
        trainer_id: routine?.trainer_id,
        exercise_id: ex.exercise_id,
        exercise_name: ex.name,
        session_date: today,
        session_id: sessionId,
        sets_data: setsData,
        total_volume_kg: setsData.reduce((s, d) => s + d.weight_kg * d.reps_done, 0),
      };
    });

    const { error } = await supabase.from("weight_log").insert(inserts);
    if (error) {
      Alert.alert("Error", "No se pudo guardar la sesión");
      setSaving(false);
      return;
    }

    // Finalize session
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    let totalVol = 0;
    let totalSetsCount = 0;
    for (const sets of Object.values(allSets)) {
      for (const s of sets) {
        totalVol += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        totalSetsCount++;
      }
    }

    await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        total_volume_kg: totalVol,
        total_sets: totalSetsCount,
        total_exercises: dayExercises.length,
        rpe_session: rpeGlobal,
      })
      .eq("id", sessionId);

    // Save calendar + RPE history (web parity)
    await saveCalendarAndRpe(totalVol);

    setSaving(false);
    Alert.alert("Sesión guardada", "Tu entrenamiento ha sido registrado");
    setMode("overview");

    // Reload logs
    const { data: newLogs } = await supabase
      .from("weight_log")
      .select("exercise_name, session_date, sets_data")
      .eq("client_id", user.id)
      .order("session_date", { ascending: false })
      .limit(200);
    if (newLogs) setPreviousLogs(newLogs as PreviousLog[]);
  }, [user, sessionId, dayExercises, allSets, sessionStart, rpeGlobal, routine, saveCalendarAndRpe]);

  // ── Finish active session ──
  const finishSession = useCallback(async () => {
    if (!sessionId || !user) return;

    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    let totalVol = 0;
    let totalSetsCount = 0;
    for (const sets of Object.values(allSets)) {
      for (const s of sets) {
        totalVol += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        if (s.completed) totalSetsCount++;
      }
    }

    await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        total_volume_kg: totalVol,
        total_sets: totalSetsCount,
        total_exercises: dayExercises.length,
        rpe_session: rpeGlobal,
      })
      .eq("id", sessionId);

    // Save calendar + RPE history (web parity)
    await saveCalendarAndRpe(totalVol);

    setInProgressSession(null);

    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }

    // Reload logs
    const { data: newLogs } = await supabase
      .from("weight_log")
      .select("exercise_name, session_date, sets_data")
      .eq("client_id", user.id)
      .order("session_date", { ascending: false })
      .limit(200);
    if (newLogs) setPreviousLogs(newLogs as PreviousLog[]);

    setMode("summary");
  }, [sessionId, user, sessionStart, allSets, dayExercises, rpeGlobal, saveCalendarAndRpe]);

  // ── Summary data ──
  const summaryData = useMemo(() => {
    let totalVol = 0;
    let totalSetsCount = 0;
    const results: { name: string; progress: string; color: string }[] = [];

    dayExercises.forEach((ex, idx) => {
      const sets = allSets[idx] || [];
      const prev = getPreviousLog(ex.name);

      for (const s of sets) {
        totalVol += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        if (s.completed || Number(s.reps_done) > 0) totalSetsCount++;
      }

      const cur = sets
        .filter((s) => s.completed || Number(s.reps_done) > 0)
        .map((s) => ({ weight: Number(s.weight_kg) || 0, reps: Number(s.reps_done) || 0 }));
      const prv = prev.map((s) => ({ weight: s.weight_kg, reps: s.reps_done }));

      const { label, color } = calculateProgress(cur, prv);
      results.push({ name: ex.name, progress: label || "—", color: color || colors.dimmed });
    });

    return { totalVol, totalSetsCount, results };
  }, [dayExercises, allSets, getPreviousLog]);

  // ── Current active set index ──
  const currentSetIdx = useMemo(() => {
    const sets = allSets[currentExIdx] || [];
    return sets.findIndex((s) => !s.completed);
  }, [allSets, currentExIdx]);

  const allCurrentDone = currentSetIdx === -1 && (allSets[currentExIdx]?.length || 0) > 0;
  const currentEx = dayExercises[currentExIdx] || null;

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={st.center}>
        <View style={st.emptyIcon}>
          <BoltIcon />
        </View>
        <Text style={st.emptyTitle}>Sin rutina asignada</Text>
        <Text style={st.emptySub}>Tu entrenador aún no te ha asignado una rutina</Text>
      </View>
    );
  }

  // ── REST TIMER ──
  if (mode === "rest") {
    const progress = restTotal > 0 ? restTime / restTotal : 0;
    const circ = 2 * Math.PI * 100;
    const offset = circ * (1 - progress);

    return (
      <View style={st.timerContainer}>
        <Text style={st.timerLabel}>DESCANSO</Text>

        <View style={st.timerRing}>
          <Svg width={240} height={240} style={{ transform: [{ rotate: "-90deg" }] }}>
            <SvgCircle cx={120} cy={120} r={100} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
            <SvgCircle
              cx={120} cy={120} r={100} fill="none"
              stroke={colors.cyan} strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${circ}`}
              strokeDashoffset={offset}
            />
          </Svg>
          <View style={st.timerCenter}>
            <Text style={st.timerValue}>{formatTime(restTime)}</Text>
            <Text style={st.timerExName}>{currentEx?.name}</Text>
          </View>
        </View>

        {/* Notes input */}
        <TextInput
          style={st.restNotesInput}
          placeholder="Notas sobre este ejercicio... (opcional)"
          placeholderTextColor="rgba(90,90,114,0.4)"
          value={exerciseNotes[currentExIdx] || ""}
          onChangeText={(val) => setExerciseNotes((prev) => ({ ...prev, [currentExIdx]: val }))}
          multiline
        />

        <TouchableOpacity
          style={st.skipBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            setRestTime(0);
            setMode("active");
          }}
        >
          <Text style={st.skipText}>Saltar descanso</Text>
        </TouchableOpacity>

        {currentExIdx < dayExercises.length - 1 && (
          <View style={st.nextPreview}>
            <Text style={st.nextLabel}>SIGUIENTE</Text>
            <Text style={st.nextName}>{dayExercises[currentExIdx + 1]?.name}</Text>
          </View>
        )}
      </View>
    );
  }

  // ── RPE ──
  if (mode === "rpe") {
    const rpeColor = rpeGlobal <= 4 ? colors.green : rpeGlobal <= 7 ? colors.orange : colors.red;
    return (
      <View style={st.rpeContainer}>
        <Text style={st.rpeLabel}>ESFUERZO PERCIBIDO</Text>
        <Text style={st.rpeQuestion}>¿Cómo fue la sesión?</Text>

        <Text style={[st.rpeValue, { color: rpeColor }]}>{rpeGlobal}</Text>

        <View style={st.rpeSliderRow}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
            const c = val <= 4 ? colors.green : val <= 7 ? colors.orange : colors.red;
            return (
              <TouchableOpacity
                key={val}
                onPress={() => setRpeGlobal(val)}
                style={[
                  st.rpeDot,
                  val === rpeGlobal && { backgroundColor: c, borderColor: c },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[st.rpeDotText, val === rpeGlobal && { color: colors.bg }]}>{val}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={st.rpeHints}>
          <Text style={st.rpeHintText}>Fácil</Text>
          <Text style={st.rpeHintText}>Máximo</Text>
        </View>

        <TouchableOpacity style={st.primaryBtn} activeOpacity={0.8} onPress={finishSession}>
          <Text style={st.primaryBtnText}>Finalizar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── SUMMARY ──
  if (mode === "summary") {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <View style={st.summaryHeader}>
          <View style={st.summaryBadgeWrap}>
            <CheckIcon size={16} color={colors.green} />
            <Text style={st.summaryBadge}>SESIÓN COMPLETADA</Text>
          </View>
          <Text style={st.summaryTitle}>{routine.title}</Text>
          <Text style={st.summaryDay}>{getDayLabel(selectedDay)} · Sem {activeWeek}</Text>
        </View>

        <View style={st.statsRow}>
          <View style={st.statCard}>
            <Text style={[st.statValue, { color: colors.cyan }]}>{formatTime(elapsed)}</Text>
            <Text style={st.statLabel}>DURACIÓN</Text>
          </View>
          <View style={st.statCard}>
            <Text style={[st.statValue, { color: colors.violet }]}>{Math.round(summaryData.totalVol).toLocaleString()}</Text>
            <Text style={st.statLabel}>VOL (KG)</Text>
          </View>
          <View style={st.statCard}>
            <Text style={[st.statValue, { color: colors.orange }]}>{summaryData.totalSetsCount}</Text>
            <Text style={st.statLabel}>SERIES</Text>
          </View>
        </View>

        <Text style={st.sectionLabel}>RESULTADOS POR EJERCICIO</Text>
        {summaryData.results.map((r, i) => (
          <View key={i} style={st.resultRow}>
            <View style={st.resultLeft}>
              <View style={st.resultIdx}><Text style={st.resultIdxText}>{i + 1}</Text></View>
              <Text style={st.resultName} numberOfLines={1}>{r.name}</Text>
            </View>
            <View style={[st.resultBadge, { backgroundColor: r.color + "15" }]}>
              <Text style={[st.resultProgress, { color: r.color }]}>{r.progress}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[st.primaryBtn, { marginTop: spacing.xxl }]}
          activeOpacity={0.8}
          onPress={() => setMode("overview")}
        >
          <Text style={st.primaryBtnText}>Volver a mi rutina</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── ACTIVE TRAINING ──
  if (mode === "active") {
    if (!currentEx) {
      // Edge case: no exercises found for current index, fallback to overview
      return (
        <View style={st.center}>
          <Text style={st.emptyTitle}>Sin ejercicios</Text>
          <Text style={st.emptySub}>No hay ejercicios para este día</Text>
          <TouchableOpacity style={[st.primaryBtn, { marginTop: spacing.xl }]} onPress={() => setMode("overview")}>
            <Text style={st.primaryBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const sets = allSets[currentExIdx] || [];
    const prevSets = getPreviousLog(currentEx.name);
    const notes = currentEx.coach_notes || currentEx.trainer_notes || currentEx.technique_notes || "";
    const progressionRule = currentEx.progression_rule || "";

    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        {/* Top bar */}
        <View style={st.activeTopBar}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Abandonar sesión",
                "¿Seguro que quieres salir? Se perderá el progreso no guardado.",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Salir", style: "destructive", onPress: () => setMode("overview") },
                ]
              );
            }}
            activeOpacity={0.7}
            style={st.backBtn}
          >
            <ChevronLeftIcon />
          </TouchableOpacity>
          <Text style={st.activeCounter}>
            {currentExIdx + 1}
            <Text style={{ color: colors.dimmed }}>/{dayExercises.length}</Text>
          </Text>
          <View style={st.elapsedBadge}>
            <Text style={st.elapsedText}>{formatTime(elapsed)}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={st.progressBar}>
          <LinearGradient
            colors={[colors.cyan, colors.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[st.progressFill, { width: `${((currentExIdx + (allCurrentDone ? 1 : 0)) / dayExercises.length) * 100}%` as any }]}
          />
        </View>

        {/* Exercise header */}
        <View style={st.activeExCard}>
          <Text style={st.activeExLabel}>EJERCICIO {currentExIdx + 1}</Text>
          <Text style={st.activeExName}>{currentEx.name}</Text>
          <View style={st.activeExMeta}>
            <View style={st.schemeBadge}><Text style={st.schemeText}>{getScheme(currentEx)}</Text></View>
            {currentEx.rir > 0 && (
              <View style={st.metaTag}><Text style={st.metaTagText}>RIR {currentEx.rir}</Text></View>
            )}
            <View style={[st.metaTag, { borderColor: colors.orangeDim }]}>
              <Text style={[st.metaTagText, { color: colors.orange }]}>{currentEx.rest_s}s desc.</Text>
            </View>
          </View>
          {progressionRule ? (
            <View style={st.progressionRow}>
              <Text style={st.progressionText}>{progressionRule}</Text>
            </View>
          ) : null}
          {notes ? (
            <View style={st.notesRow}>
              <Text style={st.notesText}>{notes}</Text>
            </View>
          ) : null}
        </View>

        {/* ANTERIOR */}
        {prevSets.length > 0 && (
          <View style={st.anteriorRow}>
            <Text style={st.anteriorLabel}>ANTERIOR</Text>
            <View style={st.anteriorValues}>
              {prevSets.map((ps, i) => (
                <View key={i} style={st.anteriorChip}>
                  <Text style={st.anteriorValue}>{ps.weight_kg}×{ps.reps_done}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Set inputs */}
        <View style={st.setHeader}>
          <Text style={[st.setHeaderText, { width: 40 }]}>Serie</Text>
          <Text style={[st.setHeaderText, { flex: 1 }]}>Peso (kg)</Text>
          <Text style={[st.setHeaderText, { flex: 1 }]}>Reps</Text>
          <View style={{ width: 44 }} />
        </View>

        {sets.map((set, setIdx) => {
          const isCurrent = setIdx === currentSetIdx;
          const prevSet = prevSets[setIdx];
          const isRP = set.type === "rest_pause";

          return (
            <View
              key={setIdx}
              style={[
                st.setRow,
                set.completed && st.setRowDone,
                isCurrent && st.setRowCurrent,
              ]}
            >
              <View style={[st.setNum, isRP && { backgroundColor: colors.orangeDim }]}>
                {set.completed ? (
                  <CheckIcon size={14} color={colors.green} />
                ) : (
                  <Text style={[st.setNumText, isRP && { color: colors.orange }]}>
                    {isRP ? "RP" : setIdx + 1}
                  </Text>
                )}
              </View>

              <TextInput
                style={[st.setInput, isCurrent && st.setInputActive]}
                keyboardType="decimal-pad"
                value={set.weight_kg}
                onChangeText={(val) => {
                  setAllSets((prev) => {
                    const u = { ...prev };
                    const exS = [...(u[currentExIdx] || [])];
                    exS[setIdx] = { ...exS[setIdx], weight_kg: val };
                    u[currentExIdx] = exS;
                    return u;
                  });
                }}
                editable={!set.completed}
                placeholder={prevSet ? String(prevSet.weight_kg) : "0"}
                placeholderTextColor="rgba(90,90,114,0.4)"
              />

              <TextInput
                style={[st.setInput, isCurrent && st.setInputActive]}
                keyboardType="number-pad"
                value={set.reps_done}
                onChangeText={(val) => {
                  setAllSets((prev) => {
                    const u = { ...prev };
                    const exS = [...(u[currentExIdx] || [])];
                    exS[setIdx] = { ...exS[setIdx], reps_done: val };
                    u[currentExIdx] = exS;
                    return u;
                  });
                }}
                editable={!set.completed}
                placeholder={prevSet ? String(prevSet.reps_done) : `${currentEx.reps_min}`}
                placeholderTextColor="rgba(90,90,114,0.4)"
              />

              <TouchableOpacity
                style={[
                  st.checkBtn,
                  set.completed && st.checkBtnDone,
                  isCurrent && st.checkBtnActive,
                ]}
                activeOpacity={0.7}
                onPress={() => completeSet(setIdx)}
                disabled={set.completed || setIdx !== currentSetIdx}
              >
                <CheckIcon
                  size={18}
                  color={set.completed ? colors.green : isCurrent ? colors.bg : colors.dimmed}
                />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Saved badge */}
        {savedExercises.has(currentExIdx) && (
          <View style={st.savedBadge}>
            <CheckIcon size={14} color={colors.green} />
            <Text style={st.savedBadgeText}>Ejercicio guardado</Text>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={st.navRow}>
          <TouchableOpacity
            style={[st.navBtn, currentExIdx === 0 && st.navBtnDisabled]}
            activeOpacity={0.7}
            onPress={goPrevExercise}
            disabled={currentExIdx === 0}
          >
            <ChevronLeftIcon size={16} color={currentExIdx === 0 ? colors.dimmed : colors.white} />
            <Text style={[st.navBtnText, currentExIdx === 0 && { color: colors.dimmed }]}>Anterior</Text>
          </TouchableOpacity>

          {currentExIdx >= dayExercises.length - 1 && allCurrentDone ? (
            <TouchableOpacity style={st.finishBtn} activeOpacity={0.8} onPress={finishRoutine}>
              <Text style={st.finishBtnText}>Finalizar rutina</Text>
              <CheckIcon size={14} color={colors.bg} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[st.nextBtn, currentExIdx >= dayExercises.length - 1 && st.navBtnDisabled]}
              activeOpacity={0.8}
              onPress={goNextExercise}
              disabled={currentExIdx >= dayExercises.length - 1}
            >
              <Text style={[st.nextBtnText, currentExIdx >= dayExercises.length - 1 && { color: colors.dimmed }]}>Siguiente</Text>
              <ChevronRightIcon size={14} color={currentExIdx >= dayExercises.length - 1 ? colors.dimmed : colors.bg} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // ── REGISTRATION MODE ──
  if (mode === "registration") {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <View style={st.activeTopBar}>
          <TouchableOpacity onPress={() => setMode("overview")} activeOpacity={0.7} style={st.backBtn}>
            <ChevronLeftIcon />
          </TouchableOpacity>
          <View style={st.regTitleWrap}>
            <Text style={st.regTitle}>Registrar sesión</Text>
            <Text style={st.regSubtitle}>{getDayLabel(selectedDay)} · Sem {activeWeek}</Text>
          </View>
          <View style={st.elapsedBadge}>
            <Text style={st.elapsedText}>{formatTime(elapsed)}</Text>
          </View>
        </View>

        {dayExercises.map((ex, exIdx) => {
          const sets = allSets[exIdx] || [];
          const prevSets = getPreviousLog(ex.name);
          const prevStr = formatPrevious(ex.name);
          const notes = ex.coach_notes || ex.trainer_notes || ex.technique_notes || "";
          const progressionRule = ex.progression_rule || "";

          // Real-time progress calculation (web parity)
          const currentData = sets
            .filter((s) => s.reps_done)
            .map((s) => ({ weight: Number(s.weight_kg) || 0, reps: Number(s.reps_done) || 0 }));
          const prevData = prevSets.map((s) => ({ weight: s.weight_kg, reps: s.reps_done }));
          const progress = currentData.length > 0 ? calculateProgress(currentData, prevData) : null;

          return (
            <View key={`${ex.exercise_id}-${exIdx}`} style={st.regExCard}>
              {/* Header */}
              <View style={st.regExHeader}>
                <View style={st.regExIdx}><Text style={st.regExIdxText}>{exIdx + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={st.regExName} numberOfLines={1}>{ex.name}</Text>
                  <View style={st.regExMetaRow}>
                    <Text style={st.regExScheme}>{getScheme(ex)}</Text>
                    {ex.rir > 0 && <Text style={st.regExMeta}>RIR {ex.rir}</Text>}
                    <Text style={[st.regExMeta, { color: colors.orange }]}>{ex.rest_s}s</Text>
                  </View>
                </View>
              </View>

              {/* Previous + progress */}
              <View style={st.regRefRow}>
                {prevStr ? <Text style={st.regAnterior}>ANTERIOR: {prevStr}</Text> : null}
                {progress && progress.label ? (
                  <View style={[st.progressBadge, { backgroundColor: progress.color + "15" }]}>
                    <Text style={[st.progressBadgeText, { color: progress.color }]}>{progress.label}</Text>
                  </View>
                ) : null}
              </View>

              {/* Progression rule + notes */}
              {progressionRule ? <Text style={st.progressionInline}>{progressionRule}</Text> : null}
              {notes ? <Text style={st.notesInline}>{notes}</Text> : null}

              {/* Mini header */}
              <View style={st.regSetHeader}>
                <Text style={[st.regSetHeaderText, { width: 32 }]}>S</Text>
                <Text style={[st.regSetHeaderText, { flex: 1 }]}>Peso (kg)</Text>
                <Text style={[st.regSetHeaderText, { flex: 1 }]}>Reps</Text>
              </View>

              {sets.map((set, setIdx) => {
                const prevSet = prevSets[setIdx];
                const isRP = set.type === "rest_pause";
                return (
                  <View key={setIdx} style={st.regSetRow}>
                    <View style={[st.regSetNum, isRP && { backgroundColor: colors.orangeDim }]}>
                      <Text style={[st.regSetNumText, isRP && { color: colors.orange }]}>
                        {isRP ? "RP" : setIdx + 1}
                      </Text>
                    </View>
                    <TextInput
                      style={st.regInput}
                      keyboardType="decimal-pad"
                      value={set.weight_kg}
                      onChangeText={(val) => {
                        setAllSets((prev) => {
                          const u = { ...prev };
                          const exS = [...(u[exIdx] || [])];
                          exS[setIdx] = { ...exS[setIdx], weight_kg: val };
                          u[exIdx] = exS;
                          return u;
                        });
                      }}
                      placeholder={prevSet ? String(prevSet.weight_kg) : "0"}
                      placeholderTextColor="rgba(90,90,114,0.4)"
                    />
                    <TextInput
                      style={st.regInput}
                      keyboardType="number-pad"
                      value={set.reps_done}
                      onChangeText={(val) => {
                        setAllSets((prev) => {
                          const u = { ...prev };
                          const exS = [...(u[exIdx] || [])];
                          exS[setIdx] = { ...exS[setIdx], reps_done: val };
                          u[exIdx] = exS;
                          return u;
                        });
                      }}
                      placeholder={prevSet ? String(prevSet.reps_done) : `${ex.reps_min}`}
                      placeholderTextColor="rgba(90,90,114,0.4)"
                    />
                  </View>
                );
              })}

              {/* Client notes (web parity) */}
              <TextInput
                style={st.clientNotesInput}
                placeholder="Notas / sensaciones..."
                placeholderTextColor="rgba(90,90,114,0.4)"
                value={clientNotes[ex.name] || ""}
                onChangeText={(val) => setClientNotes((prev) => ({ ...prev, [ex.name]: val }))}
              />
            </View>
          );
        })}

        {/* RPE */}
        <View style={st.regRpeCard}>
          <View style={st.regRpeHeader}>
            <Text style={st.sectionLabel}>RPE GLOBAL</Text>
            <Text style={[st.regRpeValue, {
              color: rpeGlobal <= 4 ? colors.green : rpeGlobal <= 7 ? colors.orange : colors.red,
            }]}>{rpeGlobal}</Text>
          </View>
          <View style={st.rpeSliderRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
              const c = val <= 4 ? colors.green : val <= 7 ? colors.orange : colors.red;
              return (
                <TouchableOpacity
                  key={val}
                  onPress={() => setRpeGlobal(val)}
                  style={[st.rpeDot, val === rpeGlobal && { backgroundColor: c, borderColor: c }]}
                  activeOpacity={0.7}
                >
                  <Text style={[st.rpeDotText, val === rpeGlobal && { color: colors.bg }]}>{val}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={st.rpeHints}>
            <Text style={st.rpeHintText}>Fácil</Text>
            <Text style={st.rpeHintText}>Máximo</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[st.primaryBtn, { marginTop: spacing.lg }]}
          activeOpacity={0.8}
          onPress={saveRegistration}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={st.primaryBtnText}>Guardar sesión</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ══════════════════════════════════════
  //  OVERVIEW MODE (default)
  // ══════════════════════════════════════
  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Header */}
      <Text style={st.pageLabel}>MI RUTINA</Text>
      <Text style={st.title}>{routine.title}</Text>
      <View style={st.headerMeta}>
        <View style={st.goalBadge}>
          <Text style={st.goalText}>{routine.goal === "fuerza" ? "FUERZA" : "HIPERTROFIA"}</Text>
        </View>
        <Text style={st.durationText}>
          {routine.duration_months} mes{(routine.duration_months || 1) > 1 ? "es" : ""}
        </Text>
      </View>

      {/* Week selector */}
      {weekCount > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.weekScroll} contentContainerStyle={st.weekScrollContent}>
          {Array.from({ length: Math.min(weekCount, 12) }, (_, i) => i + 1).map((w) => (
            <TouchableOpacity
              key={w}
              onPress={() => setActiveWeek(w)}
              style={[st.weekPill, activeWeek === w && st.weekPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[st.weekPillText, activeWeek === w && st.weekPillTextActive]}>
                Sem {w}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Day selector — enhanced with labels */}
      <View style={st.dayRow}>
        {DAY_KEYS.map((day) => {
          const isActive = selectedDay === day;
          const hasEx = trainingDays.includes(day);
          const label = hasEx ? getDayLabel(day) : "";

          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[st.dayPill, isActive && st.dayPillActive, !hasEx && st.dayPillEmpty]}
              activeOpacity={0.7}
            >
              <Text style={[st.dayPillText, isActive && st.dayPillTextActive, !hasEx && { color: colors.dimmed }]}>
                {DAY_SHORT[day]}
              </Text>
              {hasEx && <View style={[st.dayDot, isActive && st.dayDotActive]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day label + date */}
      {trainingDays.includes(selectedDay) && (
        <View style={st.dayLabelRow}>
          <Text style={st.dayLabelText}>{getDayLabel(selectedDay)}</Text>
          <Text style={st.dayLabelMeta}>Sem {activeWeek}</Text>
        </View>
      )}

      {/* Exercise list */}
      {dayExercises.length === 0 ? (
        <View style={st.restDayCard}>
          <Text style={st.restTitle}>Día de descanso</Text>
          <Text style={st.restSubtitle}>Recupera y vuelve más fuerte</Text>
        </View>
      ) : (
        <>
          {dayExercises.map((exercise, index) => {
            const prevStr = formatPrevious(exercise.name);
            const notes = exercise.coach_notes || exercise.trainer_notes || exercise.technique_notes || "";
            const progressionRule = exercise.progression_rule || "";

            return (
              <View key={exercise.exercise_id + index} style={st.exerciseCard}>
                <View style={st.exerciseTop}>
                  <View style={st.exerciseIndex}>
                    <Text style={st.exerciseIndexText}>{index + 1}</Text>
                  </View>
                  <View style={st.exerciseInfo}>
                    <Text style={st.exerciseName}>{exercise.name}</Text>
                    <View style={st.exerciseMetaRow}>
                      <View style={st.metaChip}>
                        <Text style={st.metaChipText}>{getScheme(exercise)}</Text>
                      </View>
                      {(exercise.target_weight || exercise.weight_kg) ? (
                        <View style={st.metaChip}>
                          <Text style={st.metaChipText}>{exercise.target_weight || exercise.weight_kg}kg</Text>
                        </View>
                      ) : null}
                      {exercise.rir > 0 && (
                        <View style={st.metaChip}>
                          <Text style={st.metaChipText}>RIR {exercise.rir}</Text>
                        </View>
                      )}
                      <View style={[st.metaChip, { borderColor: colors.orangeDim }]}>
                        <Text style={[st.metaChipText, { color: colors.orange }]}>{exercise.rest_s}s</Text>
                      </View>
                    </View>

                    {/* Anterior */}
                    {prevStr ? (
                      <Text style={st.anteriorInline}>Anterior: {prevStr}</Text>
                    ) : null}

                    {/* Progression rule (web parity) */}
                    {progressionRule ? (
                      <Text style={st.progressionInline}>{progressionRule}</Text>
                    ) : null}

                    {/* Notes (web parity) */}
                    {notes ? (
                      <Text style={st.notesInline}>{notes}</Text>
                    ) : null}

                    {/* Video URL (web parity) */}
                    {exercise.video_url ? (
                      <TouchableOpacity
                        style={st.videoLink}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL(exercise.video_url!)}
                      >
                        <VideoIcon />
                        <Text style={st.videoLinkText}>Ver vídeo</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Resume in-progress session */}
          {inProgressSession && (
            <TouchableOpacity
              style={st.resumeBtn}
              activeOpacity={0.8}
              onPress={resumeSession}
            >
              <LinearGradient
                colors={[colors.orange, "#E65100"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.resumeBtnGradient}
              >
                <PlayIcon color={colors.bg} />
                <Text style={st.resumeBtnText}>Completar rutina en curso</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Two action buttons — hidden if session already completed today */}
          {isSessionCompleted ? (
            <View style={st.isSessionCompletedBadge}>
              <CheckIcon size={16} color={colors.green} />
              <Text style={st.isSessionCompletedText}>Sesión completada hoy</Text>
            </View>
          ) : (
            <View style={st.actionRow}>
              <TouchableOpacity
                style={st.secondaryBtn}
                activeOpacity={0.7}
                onPress={() => startSession("registration")}
              >
                <PlusIcon />
                <Text style={st.secondaryBtnText}>Registrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={st.primaryBtnGlow}
                activeOpacity={0.8}
                onPress={() => startSession("active")}
              >
                <LinearGradient
                  colors={[colors.cyan, "#00B8D4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={st.primaryBtnGradient}
                >
                  <PlayIcon />
                  <Text style={st.primaryBtnText}>Entrenar en activo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

/* ────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────── */

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 120 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 40 },

  // Empty
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.white, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 260 },

  // Header
  pageLabel: { fontSize: 10, fontWeight: "700", color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.xs },
  title: { fontSize: 26, fontWeight: "900", color: colors.white, letterSpacing: -0.5 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xl },
  goalBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: colors.cyanDim, borderWidth: 1, borderColor: colors.cyanGlow,
  },
  goalText: { fontSize: 10, fontWeight: "700", color: colors.cyan, letterSpacing: 1.5 },
  durationText: { fontSize: 12, color: colors.dimmed },

  // Week selector
  weekScroll: { marginBottom: spacing.lg },
  weekScrollContent: { gap: spacing.sm },
  weekPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  weekPillActive: { backgroundColor: colors.cyan },
  weekPillText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  weekPillTextActive: { color: colors.bg },

  // Day selector
  dayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  dayPill: {
    width: 40, height: 48, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  dayPillActive: { backgroundColor: colors.cyanDim, borderColor: colors.cyanGlow },
  dayPillEmpty: { opacity: 0.4 },
  dayPillText: { fontSize: 13, fontWeight: "700", color: colors.muted },
  dayPillTextActive: { color: colors.cyan },
  dayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.dimmed, marginTop: 4 },
  dayDotActive: { backgroundColor: colors.cyan },

  // Day label row
  dayLabelRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.lg, paddingHorizontal: spacing.xs,
  },
  dayLabelText: { fontSize: 15, fontWeight: "700", color: colors.white },
  dayLabelMeta: { fontSize: 11, color: colors.dimmed },

  // Rest day
  restDayCard: {
    alignItems: "center", paddingVertical: 60, backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
  },
  restTitle: { fontSize: 18, fontWeight: "700", color: colors.muted },
  restSubtitle: { fontSize: 13, color: colors.dimmed, marginTop: 6 },

  // Exercise cards (overview)
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, ...shadows.subtle,
  },
  exerciseTop: { flexDirection: "row", gap: spacing.md },
  exerciseIndex: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.cyanDim,
    alignItems: "center", justifyContent: "center",
  },
  exerciseIndexText: { fontSize: 13, fontWeight: "800", color: colors.cyan },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "700", color: colors.white, marginBottom: 6 },
  exerciseMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceHover,
  },
  metaChipText: { fontSize: 11, fontWeight: "600", color: colors.muted },
  anteriorInline: { fontSize: 11, color: colors.dimmed, marginTop: 6 },
  progressionInline: { fontSize: 10, color: colors.orange, marginTop: 4 },
  notesInline: { fontSize: 10, color: colors.violet, marginTop: 2 },
  videoLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  videoLinkText: { fontSize: 10, fontWeight: "600", color: colors.cyan },

  // Action buttons
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  secondaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.white },
  primaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.cyan,
  },
  primaryBtnGlow: {
    flex: 1, borderRadius: radius.lg, ...shadows.glow(colors.cyan),
  },
  primaryBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: radius.lg,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "700", color: colors.bg },

  // ── Rest timer ──
  timerContainer: {
    flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl,
  },
  timerLabel: { fontSize: 11, fontWeight: "700", color: colors.dimmed, letterSpacing: 3, marginBottom: spacing.xxl },
  timerRing: { alignItems: "center", justifyContent: "center", width: 240, height: 240 },
  timerCenter: { position: "absolute", alignItems: "center" },
  timerValue: { fontSize: 52, fontWeight: "900", color: colors.white, letterSpacing: -1 },
  timerExName: { fontSize: 12, color: colors.dimmed, marginTop: 4 },
  skipBtn: {
    marginTop: spacing.xxl, paddingHorizontal: 32, paddingVertical: 12, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  skipText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  nextPreview: { alignItems: "center", marginTop: spacing.xxl },
  nextLabel: { fontSize: 9, fontWeight: "700", color: colors.dimmed, letterSpacing: 2 },
  nextName: { fontSize: 13, color: colors.muted, marginTop: 4 },

  // ── RPE ──
  rpeContainer: {
    flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl,
  },
  rpeLabel: { fontSize: 11, fontWeight: "700", color: colors.dimmed, letterSpacing: 3 },
  rpeQuestion: { fontSize: 24, fontWeight: "900", color: colors.white, letterSpacing: -0.5, marginTop: spacing.md, marginBottom: spacing.xxl },
  rpeValue: { fontSize: 72, fontWeight: "900", marginBottom: spacing.xxl },
  rpeSliderRow: { flexDirection: "row", gap: 6 },
  rpeDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  rpeDotText: { fontSize: 12, fontWeight: "700", color: colors.dimmed },
  rpeHints: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: spacing.xs, marginTop: spacing.sm },
  rpeHintText: { fontSize: 9, color: colors.dimmed },

  // ── Active training ──
  activeTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)",
  },
  activeCounter: { fontSize: 14, fontWeight: "800", color: colors.cyan },
  elapsedBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  elapsedText: { fontSize: 12, fontWeight: "600", color: colors.dimmed },
  progressBar: { height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.04)", marginBottom: spacing.xl, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },

  activeExCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md,
  },
  activeExLabel: { fontSize: 10, fontWeight: "700", color: colors.dimmed, letterSpacing: 2 },
  activeExName: { fontSize: 22, fontWeight: "900", color: colors.white, letterSpacing: -0.5, marginTop: 4 },
  activeExMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.sm },
  schemeBadge: { backgroundColor: colors.cyanDim, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  schemeText: { fontSize: 11, fontWeight: "700", color: colors.cyan },
  metaTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5,
    borderWidth: 1, borderColor: colors.border,
  },
  metaTagText: { fontSize: 11, fontWeight: "600", color: colors.muted },
  progressionRow: {
    marginTop: spacing.sm, backgroundColor: colors.orangeDim,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  progressionText: { fontSize: 10, color: colors.orange },
  notesRow: {
    marginTop: spacing.xs, backgroundColor: colors.violetDim,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  notesText: { fontSize: 10, color: colors.violet },

  // ANTERIOR
  anteriorRow: {
    backgroundColor: "rgba(255,255,255,0.01)", borderRadius: radius.sm, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginBottom: spacing.md,
  },
  anteriorLabel: { fontSize: 9, fontWeight: "700", color: colors.dimmed, letterSpacing: 2, marginBottom: 4 },
  anteriorValues: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  anteriorChip: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  anteriorValue: { fontSize: 12, fontWeight: "500", color: colors.dimmed },

  // Set inputs
  setHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm, paddingHorizontal: 2 },
  setHeaderText: { fontSize: 9, fontWeight: "700", color: colors.dimmed, letterSpacing: 1.5, textAlign: "center" },
  setRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, paddingHorizontal: 2,
    paddingVertical: 2, borderRadius: radius.sm,
  },
  setRowDone: { opacity: 0.4 },
  setRowCurrent: { backgroundColor: "rgba(0,229,255,0.03)" },
  setNum: {
    width: 40, height: 44, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },
  setNumText: { fontSize: 13, fontWeight: "700", color: colors.muted },
  setInput: {
    flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.bg, color: colors.white, fontSize: 16, fontWeight: "600",
    textAlign: "center", paddingHorizontal: 8,
  },
  setInputActive: { borderColor: "rgba(0,229,255,0.3)" },
  checkBtn: {
    width: 44, height: 44, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },
  checkBtnDone: { backgroundColor: colors.greenDim },
  checkBtnActive: { backgroundColor: colors.cyan },

  // ── Registration mode ──
  regTitleWrap: { alignItems: "center" },
  regTitle: { fontSize: 16, fontWeight: "700", color: colors.white },
  regSubtitle: { fontSize: 11, color: colors.dimmed, marginTop: 2 },
  regExCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md,
  },
  regExHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  regExIdx: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: colors.cyanDim,
    alignItems: "center", justifyContent: "center",
  },
  regExIdxText: { fontSize: 10, fontWeight: "800", color: colors.cyan },
  regExName: { fontSize: 14, fontWeight: "700", color: colors.white },
  regExMetaRow: { flexDirection: "row", gap: spacing.sm, marginTop: 2 },
  regExScheme: { fontSize: 10, fontWeight: "700", color: colors.dimmed },
  regExMeta: { fontSize: 10, color: colors.dimmed },
  regRefRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  regAnterior: { fontSize: 10, fontWeight: "600", color: colors.dimmed },
  progressBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  progressBadgeText: { fontSize: 9, fontWeight: "700" },
  regSetHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  regSetHeaderText: { fontSize: 8, fontWeight: "700", color: colors.dimmed, letterSpacing: 1, textAlign: "center" },
  regSetRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  regSetNum: {
    width: 32, height: 36, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },
  regSetNumText: { fontSize: 11, fontWeight: "700", color: colors.dimmed },
  regInput: {
    flex: 1, height: 36, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: colors.bg, color: colors.white, fontSize: 14, fontWeight: "600",
    textAlign: "center", paddingHorizontal: 6,
  },
  clientNotesInput: {
    height: 32, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "transparent", color: colors.muted, fontSize: 11,
    paddingHorizontal: spacing.sm, marginTop: spacing.sm,
  },
  regRpeCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginTop: spacing.md,
  },
  regRpeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  regRpeValue: { fontSize: 28, fontWeight: "900" },

  // ── Summary ──
  summaryHeader: { alignItems: "center", marginBottom: spacing.xxl },
  summaryBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryBadge: { fontSize: 10, fontWeight: "700", color: colors.green, letterSpacing: 2 },
  summaryTitle: { fontSize: 28, fontWeight: "900", color: colors.white, letterSpacing: -0.5, textAlign: "center", marginTop: spacing.sm },
  summaryDay: { fontSize: 12, color: colors.dimmed, marginTop: spacing.xs },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xxl },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 8, fontWeight: "700", color: colors.dimmed, letterSpacing: 1.5, marginTop: 4 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.sm },
  resultRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: 4,
  },
  resultLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  resultIdx: { width: 22, height: 22, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  resultIdxText: { fontSize: 9, fontWeight: "700", color: colors.dimmed },
  resultName: { fontSize: 13, fontWeight: "600", color: colors.white, flex: 1 },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  resultProgress: { fontSize: 9, fontWeight: "700" },

  // ── Rest notes input ──
  restNotesInput: {
    width: "100%", minHeight: 44, borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", backgroundColor: colors.surface,
    color: colors.muted, fontSize: 13, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, marginTop: spacing.xl, textAlignVertical: "top",
  },

  // ── Saved badge ──
  savedBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: spacing.sm, marginTop: spacing.sm,
  },
  savedBadgeText: { fontSize: 12, fontWeight: "600", color: colors.green },

  // ── Navigation row ──
  navRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: spacing.md, marginTop: spacing.lg,
  },
  navBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: "600", color: colors.white },
  nextBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.cyan,
  },
  nextBtnText: { fontSize: 14, fontWeight: "700", color: colors.bg },
  finishBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.green,
  },
  finishBtnText: { fontSize: 14, fontWeight: "700", color: colors.bg },

  // ── Resume button ──
  resumeBtn: {
    borderRadius: radius.lg, marginBottom: spacing.md,
    ...shadows.glow(colors.orange),
  },
  resumeBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: radius.lg,
  },
  resumeBtnText: { fontSize: 15, fontWeight: "700", color: colors.bg },

  // ── Completed today badge ──
  isSessionCompletedBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: radius.lg, marginTop: spacing.lg,
    backgroundColor: "rgba(0,200,83,0.1)", borderWidth: 1, borderColor: "rgba(0,200,83,0.2)",
  },
  isSessionCompletedText: { fontSize: 14, fontWeight: "600", color: colors.green },
});
