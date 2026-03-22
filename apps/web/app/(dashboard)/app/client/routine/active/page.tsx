"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

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
}

interface DayData {
  day: string;
  label?: string;
  exercises: ExerciseData[];
}

interface RoutineRaw {
  id: string;
  title: string;
  trainer_id: string;
  exercises?: ExerciseData[];
  days?: DayData[];
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
}

interface SavedLogEntry {
  exercise_name: string;
  sets_data: { set_number: number; weight_kg: number; reps_done: number; type: string }[];
  client_notes: string | null;
}

type Phase = "loading" | "ready" | "training" | "rest" | "rpe" | "summary";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function calculateProgress(
  current: { weight: number; reps: number }[],
  previous: { weight: number; reps: number }[]
): { label: string; color: string } {
  if (previous.length === 0)
    return { label: "PRIMERA SESIÓN", color: "#00E5FF" };

  let wUp = false,
    wDown = false,
    rUp = false,
    rDown = false;
  for (let i = 0; i < Math.min(current.length, previous.length); i++) {
    if (current[i].weight > previous[i].weight) wUp = true;
    if (current[i].weight < previous[i].weight) wDown = true;
    if (current[i].reps > previous[i].reps) rUp = true;
    if (current[i].reps < previous[i].reps) rDown = true;
  }

  if (wUp && !wDown && !rDown)
    return { label: "PROGRESIÓN CARGA", color: "#00C853" };
  if (rUp && !rDown && !wUp && !wDown)
    return { label: "PROGRESIÓN REPS", color: "#00C853" };
  if (wUp && rDown)
    return { label: "CARGA ↑ REPS ↓", color: "#FF9100" };
  if (!wUp && !wDown && !rUp && !rDown)
    return { label: "MANTENIDO", color: "#8B8BA3" };
  if (wDown || rDown) return { label: "REGRESIÓN", color: "#FF1744" };
  return { label: "PROGRESIÓN", color: "#00C853" };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

function ActiveTrainingPage() {
  const searchParams = useSearchParams();
  const routineId = searchParams.get("routine_id");
  const day = searchParams.get("day") || "lunes";
  const week = parseInt(searchParams.get("week") || "1");
  const resumeSessionId = searchParams.get("session_id");

  // Core state
  const [phase, setPhase] = useState<Phase>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [routineTitle, setRoutineTitle] = useState("");
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [previousLogs, setPreviousLogs] = useState<PreviousLog[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Training state
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [allSets, setAllSets] = useState<Record<number, SetEntry[]>>({});
  const [rpeGlobal, setRpeGlobal] = useState(7);
  const [exerciseNotes, setExerciseNotes] = useState<Record<number, string>>({});
  // Track which exercises have been saved to weight_log already
  const [savedExercises, setSavedExercises] = useState<Set<number>>(new Set());

  // Timer state
  const [restTime, setRestTime] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session timer
  const [sessionStart, setSessionStart] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Current exercise shorthand
  const currentEx = exercises[currentExIdx] || null;
  const totalExercises = exercises.length;

  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No autenticado");
        return;
      }
      setUserId(user.id);

      // Load routine
      let query = supabase
        .from("user_routines")
        .select("id, title, trainer_id, exercises")
        .eq("client_id", user.id)
        .eq("is_active", true);

      if (routineId) {
        query = query.eq("id", routineId);
      }

      const { data: routine, error: rErr } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rErr || !routine) {
        toast.error(
          rErr
            ? `Error al cargar la rutina: ${rErr.message}`
            : "No se encontró una rutina activa"
        );
        return;
      }

      setRoutineTitle(routine.title);
      setTrainerId(routine.trainer_id);

      // Parse all exercises from routine
      let allExercises: ExerciseData[] = [];

      if (
        routine.exercises &&
        Array.isArray(routine.exercises) &&
        routine.exercises.length > 0
      ) {
        allExercises = (routine.exercises as ExerciseData[]).sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
      }

      if (allExercises.length === 0) {
        toast.error("La rutina no tiene ejercicios");
        return;
      }

      // Filter by selected day (normalize to lowercase for comparison)
      const normalizedDay = day.toLowerCase();
      let dayExercises = allExercises.filter(
        (ex) => ex.day_of_week?.toLowerCase() === normalizedDay
      );

      // Fallback: if no match for this day, use the first available day
      if (dayExercises.length === 0) {
        const firstDay = allExercises[0]?.day_of_week;
        if (firstDay) {
          dayExercises = allExercises.filter(
            (ex) => ex.day_of_week === firstDay
          );
        }
      }

      if (dayExercises.length === 0) {
        toast.error("No hay ejercicios para este día");
        return;
      }

      setExercises(dayExercises);

      // Load previous logs (for ghost/placeholder values)
      const { data: logs } = await supabase
        .from("weight_log")
        .select("exercise_name, session_date, sets_data")
        .eq("client_id", user.id)
        .order("session_date", { ascending: false })
        .limit(200);

      if (logs) setPreviousLogs(logs as PreviousLog[]);

      // Check for resuming an in_progress session
      if (resumeSessionId) {
        const { data: existingSession } = await supabase
          .from("workout_sessions")
          .select("id, created_at, status")
          .eq("id", resumeSessionId)
          .eq("client_id", user.id)
          .eq("status", "in_progress")
          .maybeSingle();

        if (existingSession) {
          // Load existing weight_log entries for this session
          const { data: sessionLogs } = await supabase
            .from("weight_log")
            .select("exercise_name, sets_data, client_notes")
            .eq("session_id", existingSession.id);

          const savedLogs = (sessionLogs ?? []) as SavedLogEntry[];
          const savedNames = new Set(savedLogs.map((l) => l.exercise_name));
          const alreadySaved = new Set<number>();

          // Initialize sets: restore saved data + init remaining
          const initial: Record<number, SetEntry[]> = {};
          const restoredNotes: Record<number, string> = {};

          dayExercises.forEach((ex, idx) => {
            const totalSetsCount = (ex.sets || 3) + (ex.rest_pause_sets || 0);
            const savedLog = savedLogs.find((l) => l.exercise_name === ex.name);
            const prevLog = (logs as PreviousLog[] | null)?.find(
              (l) => l.exercise_name === ex.name
            );

            if (savedLog && savedLog.sets_data) {
              // Restore from saved session — respect per-set completed flag
              initial[idx] = savedLog.sets_data.map((s: any) => ({
                weight_kg: String(s.weight_kg),
                reps_done: String(s.reps_done),
                completed: s.completed !== false, // backwards compat: old entries without flag are considered done
              }));
              // Mark as fully saved only if ALL sets are completed
              const allSetsDone = initial[idx].every((s) => s.completed);
              if (allSetsDone) alreadySaved.add(idx);
              // Pad if exercise has more sets than saved
              while (initial[idx].length < totalSetsCount) {
                const i = initial[idx].length;
                const prevSet = prevLog?.sets_data?.[i];
                initial[idx].push({
                  weight_kg: prevSet ? String(prevSet.weight_kg) : ex.target_weight || ex.weight_kg ? String(ex.target_weight || ex.weight_kg) : "",
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

          setAllSets(initial);
          setSavedExercises(alreadySaved);
          setExerciseNotes(restoredNotes);
          setSessionId(existingSession.id);
          setSessionStart(new Date(existingSession.created_at).getTime());
          setElapsed(Math.floor((Date.now() - new Date(existingSession.created_at).getTime()) / 1000));

          // Jump to first exercise with incomplete sets
          const firstIncomplete = dayExercises.findIndex((_, idx) => {
            const sets = initial[idx] || [];
            return sets.some((s) => !s.completed);
          });
          setCurrentExIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
          setPhase("training");
          return;
        }
      }

      // Normal init (no resume)
      const initial: Record<number, SetEntry[]> = {};
      dayExercises.forEach((ex, idx) => {
        const totalSetsCount = (ex.sets || 3) + (ex.rest_pause_sets || 0);
        const prevLog = (logs as PreviousLog[] | null)?.find(
          (l) => l.exercise_name === ex.name
        );

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
      setAllSets(initial);
      setPhase("ready");
    };
    load();
  }, [routineId, day, resumeSessionId]);

  // ── Session elapsed timer ──
  useEffect(() => {
    if (phase === "training" || phase === "rest") {
      if (!elapsedRef.current) {
        elapsedRef.current = setInterval(() => {
          setElapsed((prev) => prev + 1);
        }, 1000);
      }
    }
    return () => {
      if (
        phase !== "training" &&
        phase !== "rest" &&
        elapsedRef.current
      ) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [phase]);

  // ── Rest timer ──
  useEffect(() => {
    if (phase === "rest" && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setPhase("training");
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
  }, [phase]);

  // ── Start session ──
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

    setSessionId(session.id);
    setSessionStart(Date.now());
    setPhase("training");
  }, [userId, routineId, trainerId, day, week, currentEx]);

  // ── Get previous log for exercise ──
  const getPreviousForExercise = useCallback(
    (name: string): PreviousSet[] => {
      const log = previousLogs.find((l) => l.exercise_name === name);
      return (log?.sets_data as PreviousSet[]) || [];
    },
    [previousLogs]
  );

  // ── Upsert partial progress to weight_log ──
  const savePartialProgress = useCallback(
    async (exIdx: number, updatedSets: SetEntry[]) => {
      if (!userId || !sessionId) return;
      const ex = exercises[exIdx];
      if (!ex) return;

      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const setsData = updatedSets.map((s, i) => ({
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
          .update({ sets_data: setsData, total_volume_kg: totalVolume, client_notes: notes })
          .eq("id", existing.id);
      } else {
        await supabase.from("weight_log").insert({
          client_id: userId,
          trainer_id: trainerId,
          exercise_id: ex.exercise_id,
          exercise_name: ex.name,
          session_date: today,
          session_id: sessionId,
          sets_data: setsData,
          total_volume_kg: totalVolume,
          client_notes: notes,
        });
      }

      // If all sets done, mark as saved
      if (updatedSets.every((s) => s.completed)) {
        setSavedExercises((prev) => new Set(prev).add(exIdx));
      }
    },
    [userId, sessionId, exercises, exerciseNotes, trainerId]
  );

  // ── Complete a set ──
  const completeSet = useCallback(
    async (setIdx: number) => {
      if (!currentEx || !userId || !sessionId) return;

      const sets = allSets[currentExIdx] || [];
      const set = sets[setIdx];
      if (!set || set.completed) return;

      const reps = Number(set.reps_done) || 0;

      if (reps === 0) {
        toast.error("Introduce las repeticiones");
        return;
      }

      // Mark completed
      const updatedSets = [...sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], completed: true };

      setAllSets((prev) => {
        const updated = { ...prev };
        updated[currentExIdx] = updatedSets;
        return updated;
      });

      // Save partial progress to DB immediately
      savePartialProgress(currentExIdx, updatedSets);

      // Check if all sets done for this exercise
      const allDone = updatedSets.every((s) => s.completed);

      if (!allDone) {
        // Start rest timer
        setRestTotal(currentEx.rest_s || 90);
        setRestTime(currentEx.rest_s || 90);
        setPhase("rest");
      }
    },
    [currentEx, currentExIdx, allSets, userId, sessionId, savePartialProgress]
  );

  // ── Skip rest ──
  const skipRest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRestTime(0);
    setPhase("training");
  }, []);

  // ── Save current exercise to weight_log (final save, uses upsert) ──
  const saveExerciseLog = useCallback(async (exIdx: number) => {
    if (!userId || !sessionId) return;
    const ex = exercises[exIdx];
    if (!ex) return;
    if (savedExercises.has(exIdx)) return; // already saved

    const sets = allSets[exIdx] || [];
    await savePartialProgress(exIdx, sets);
  }, [userId, sessionId, exercises, allSets, savedExercises, savePartialProgress]);

  // ── Navigate to next exercise ──
  const goNextExercise = useCallback(async () => {
    // Save current exercise if all sets done and not saved yet
    const sets = allSets[currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !savedExercises.has(currentExIdx)) {
      await saveExerciseLog(currentExIdx);
    }

    if (currentExIdx < totalExercises - 1) {
      setCurrentExIdx((prev) => prev + 1);
      setPhase("training");
    }
  }, [currentExIdx, totalExercises, allSets, savedExercises, saveExerciseLog]);

  // ── Navigate to previous exercise ──
  const goPrevExercise = useCallback(() => {
    if (currentExIdx > 0) {
      setCurrentExIdx((prev) => prev - 1);
      setPhase("training");
    }
  }, [currentExIdx]);

  // ── Finish routine → go to RPE ──
  const finishRoutine = useCallback(async () => {
    // Save last exercise if needed
    const sets = allSets[currentExIdx] || [];
    const allDone = sets.length > 0 && sets.every((s) => s.completed);
    if (allDone && !savedExercises.has(currentExIdx)) {
      await saveExerciseLog(currentExIdx);
    }
    setPhase("rpe");
  }, [currentExIdx, allSets, savedExercises, saveExerciseLog]);

  // ── Finish session ──
  const finishSession = useCallback(async () => {
    if (!sessionId || !userId) return;

    const supabase = createClient();
    const duration = Math.floor((Date.now() - sessionStart) / 1000);

    // Aggregate stats
    let totalVolume = 0;
    let totalSetsCount = 0;
    for (const sets of Object.values(allSets)) {
      for (const s of sets) {
        totalVolume += (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        if (s.completed) totalSetsCount++;
      }
    }

    await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        total_volume_kg: totalVolume,
        total_sets: totalSetsCount,
        total_exercises: totalExercises,
        rpe_session: rpeGlobal,
      })
      .eq("id", sessionId);

    // Calendar entry
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
        .update({ completed: true, rpe: rpeGlobal })
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
        rpe: rpeGlobal,
      });
    }

    toast.success("Sesión completada");
    setPhase("summary");
  }, [sessionId, userId, sessionStart, allSets, totalExercises, rpeGlobal, routineTitle, day]);

  // ── Summary data ──
  const summaryData = useMemo(() => {
    let totalVolume = 0;
    let totalSetsCount = 0;
    const exerciseResults: {
      name: string;
      sets: SetEntry[];
      previous: PreviousSet[];
      progress: { label: string; color: string };
      notes: string | null;
    }[] = [];

    exercises.forEach((ex, idx) => {
      const sets = allSets[idx] || [];
      const prev = getPreviousForExercise(ex.name);

      for (const s of sets) {
        const vol = (Number(s.weight_kg) || 0) * (Number(s.reps_done) || 0);
        totalVolume += vol;
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
        notes: exerciseNotes[idx]?.trim() || null,
      });
    });

    return { totalVolume, totalSetsCount, exerciseResults };
  }, [exercises, allSets, getPreviousForExercise, exerciseNotes]);

  // ── Current set index (first incomplete) ──
  const currentSetIdx = useMemo(() => {
    const sets = allSets[currentExIdx] || [];
    return sets.findIndex((s) => !s.completed);
  }, [allSets, currentExIdx]);

  const allCurrentSetsDone = currentSetIdx === -1 && (allSets[currentExIdx]?.length || 0) > 0;
  const isLastExercise = currentExIdx >= totalExercises - 1;

  // ── Render: Loading ──
  if (phase === "loading") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          <p className="text-sm text-[#8B8BA3]">Cargando entrenamiento...</p>
        </div>
      </div>
    );
  }

  // ── Render: Ready ──
  if (phase === "ready") {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Entrenamiento activo
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            {routineTitle}
          </h1>
          <p className="mt-2 text-sm text-[#8B8BA3]">
            {exercises.length} ejercicios · Semana {week}
          </p>
        </div>

        {/* Exercise preview list */}
        <div className="w-full max-w-md space-y-2">
          {exercises.map((ex, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#12121A]/60 px-4 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-xs font-bold text-[#00E5FF]">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-white">
                {ex.name}
              </span>
              <span className="text-xs text-[#5A5A72]">
                {ex.sets}x{ex.reps_min}
                {ex.reps_max !== ex.reps_min ? `-${ex.reps_max}` : ""}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={startSession}
          className="group relative mt-4 flex items-center gap-3 rounded-2xl bg-[#00E5FF] px-10 py-4 text-base font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.3)]"
        >
          <svg
            className="h-5 w-5 transition-transform group-hover:scale-110"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          Comenzar
        </button>
      </div>
    );
  }

  // ── Render: Rest Timer ──
  if (phase === "rest") {
    const progress = restTotal > 0 ? restTime / restTotal : 0;
    const circumference = 2 * Math.PI * 120;
    const strokeOffset = circumference * (1 - progress);

    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4">
        {/* Session elapsed */}
        <div className="absolute right-6 top-6 text-xs text-[#5A5A72]">
          {formatTime(elapsed)}
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
          Descanso
        </p>

        {/* Radial timer */}
        <div className="relative flex items-center justify-center">
          <svg width="280" height="280" className="rotate-[-90deg]">
            {/* Track */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="6"
            />
            {/* Progress arc */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: "drop-shadow(0 0 12px rgba(0,229,255,0.4))",
              }}
            />
          </svg>

          {/* Center time */}
          <div className="absolute flex flex-col items-center">
            <span
              className="text-6xl font-black tabular-nums tracking-tight text-white"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatTime(restTime)}
            </span>
            <span className="mt-1 text-xs text-[#5A5A72]">
              {currentEx?.name}
            </span>
          </div>
        </div>

        {/* Notes input */}
        <div className="w-full max-w-xs">
          <textarea
            value={exerciseNotes[currentExIdx] || ""}
            onChange={(e) =>
              setExerciseNotes((prev) => ({
                ...prev,
                [currentExIdx]: e.target.value,
              }))
            }
            placeholder="Notas sobre este ejercicio... (opcional)"
            rows={2}
            className="w-full rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 text-sm text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/30 resize-none"
          />
        </div>

        {/* Skip */}
        <button
          onClick={skipRest}
          className="rounded-xl border border-white/[0.06] bg-[#12121A] px-8 py-3 text-sm font-semibold text-[#8B8BA3] transition-colors hover:border-[#00E5FF]/20 hover:text-white"
        >
          Saltar descanso
        </button>

        {/* Next exercise preview */}
        {currentExIdx < totalExercises - 1 && (
          <div className="mt-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Siguiente
            </p>
            <p className="mt-1 text-sm text-[#8B8BA3]">
              {exercises[currentExIdx + 1]?.name}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Render: RPE ──
  if (phase === "rpe") {
    const rpeLabels: Record<number, string> = {
      1: "Muy fácil",
      2: "Fácil",
      3: "Ligero",
      4: "Moderado-",
      5: "Moderado",
      6: "Moderado+",
      7: "Difícil",
      8: "Muy difícil",
      9: "Casi máximo",
      10: "Máximo",
    };

    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
            Esfuerzo percibido
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            ¿Cómo fue la sesión?
          </h2>
        </div>

        {/* RPE selector */}
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-2">
            <span
              className="text-7xl font-black tabular-nums"
              style={{
                color:
                  rpeGlobal <= 4
                    ? "#00C853"
                    : rpeGlobal <= 7
                      ? "#FF9100"
                      : "#FF1744",
              }}
            >
              {rpeGlobal}
            </span>
            <span className="text-sm text-[#8B8BA3]">
              {rpeLabels[rpeGlobal]}
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            value={rpeGlobal}
            onChange={(e) => setRpeGlobal(Number(e.target.value))}
            className="w-full accent-[#00E5FF]"
          />
          <div className="mt-2 flex justify-between text-[10px] text-[#5A5A72]">
            <span>Fácil</span>
            <span>Máximo</span>
          </div>
        </div>

        <button
          onClick={finishSession}
          className="rounded-2xl bg-[#00E5FF] px-10 py-4 text-base font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.3)]"
        >
          Finalizar sesión
        </button>
      </div>
    );
  }

  // ── Render: Summary ──
  if (phase === "summary") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
        {/* Hero stats */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00C853]">
            Rutina finalizada
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            {routineTitle}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
            <p className="text-3xl font-black tracking-tight text-[#00E5FF]">
              {formatTime(elapsed)}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Duración
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
            <p className="text-3xl font-black tracking-tight text-[#7C3AED]">
              {Math.round(summaryData.totalVolume).toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Vol (kg)
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
            <p className="text-3xl font-black tracking-tight text-[#FF9100]">
              {summaryData.totalSetsCount}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Series
            </p>
          </div>
        </div>

        {/* Per-exercise results with detail */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Resultados por ejercicio
          </p>
          {summaryData.exerciseResults.map((result, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.04] bg-[#12121A] px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-[10px] font-bold text-[#8B8BA3]">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {result.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: result.progress.color }}
                >
                  {result.progress.label}
                </span>
              </div>
              {/* Sets detail */}
              <div className="mt-2 flex flex-wrap gap-2">
                {result.sets
                  .filter((s) => s.completed)
                  .map((s, j) => (
                    <span
                      key={j}
                      className="rounded-md bg-white/[0.04] px-2 py-1 text-xs text-[#8B8BA3]"
                    >
                      <span className="font-semibold text-white">{s.weight_kg}</span>kg ×{" "}
                      <span className="font-semibold text-white">{s.reps_done}</span>
                    </span>
                  ))}
              </div>
              {result.notes && (
                <p className="mt-2 rounded-md bg-[#7C3AED]/5 px-3 py-2 text-xs text-[#7C3AED]">
                  {result.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* RPE */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            RPE Global
          </p>
          <p
            className="mt-1 text-4xl font-black"
            style={{
              color:
                rpeGlobal <= 4
                  ? "#00C853"
                  : rpeGlobal <= 7
                    ? "#FF9100"
                    : "#FF1744",
            }}
          >
            {rpeGlobal}
          </p>
        </div>

        {/* Back */}
        <button
          onClick={() => window.history.back()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
        >
          Volver a mi rutina
        </button>
      </div>
    );
  }

  // ── Render: Training (main view) ──
  const sets = allSets[currentExIdx] || [];
  const prevSets = currentEx ? getPreviousForExercise(currentEx.name) : [];
  const scheme = currentEx
    ? currentEx.scheme ||
      `${currentEx.sets}x${currentEx.reps_min}${currentEx.reps_max !== currentEx.reps_min ? `-${currentEx.reps_max}` : ""}`
    : "";
  const notes =
    currentEx?.coach_notes ||
    currentEx?.trainer_notes ||
    currentEx?.technique_notes ||
    "";

  const exerciseIsSaved = savedExercises.has(currentExIdx);

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-4">
      {/* Top bar: progress + elapsed */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#00E5FF]">
            {currentExIdx + 1}/{totalExercises}
          </span>
          <span className="text-xs tabular-nums text-[#5A5A72]">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-[#00E5FF] transition-all duration-500"
          style={{
            width: `${((currentExIdx + (allCurrentSetsDone ? 1 : 0)) / totalExercises) * 100}%`,
          }}
        />
      </div>

      {/* Exercise header */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Ejercicio {currentExIdx + 1}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              {currentEx?.name}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-lg bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF]">
              {scheme}
            </span>
            {currentEx && currentEx.rir > 0 && (
              <span className="text-[10px] text-[#8B8BA3]">
                RIR {currentEx.rir}
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {currentEx?.rest_s && (
            <span className="text-xs text-[#FF9100]">
              {currentEx.rest_s}s descanso
            </span>
          )}
          {currentEx?.progression_rule && (
            <span className="text-xs text-[#7C3AED]">
              {currentEx.progression_rule}
            </span>
          )}
        </div>

        {notes && (
          <p className="mt-2 rounded-lg bg-[#7C3AED]/[0.06] px-3 py-2 text-xs text-[#7C3AED]">
            {notes}
          </p>
        )}

        {exerciseIsSaved && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#00C853]/10 px-3 py-2">
            <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-xs font-medium text-[#00C853]">Ejercicio guardado</span>
          </div>
        )}
      </div>

      {/* ANTERIOR row */}
      {prevSets.length > 0 && (
        <div className="rounded-xl border border-white/[0.03] bg-white/[0.01] px-4 py-2.5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Anterior
          </p>
          <div className="flex gap-3">
            {prevSets.map((ps, i) => (
              <span key={i} className="text-xs tabular-nums text-[#5A5A72]">
                {ps.weight_kg}×{ps.reps_done}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sets */}
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 px-1">
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Serie
          </span>
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Peso (kg)
          </span>
          <span className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Reps
          </span>
          <span />
        </div>

        {sets.map((set, setIdx) => {
          const prevSet = prevSets[setIdx];
          const isCurrent = setIdx === currentSetIdx;
          const isRP = setIdx >= (currentEx?.sets || 3);

          return (
            <div
              key={setIdx}
              className={`grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 rounded-xl px-1 py-1 transition-all ${
                set.completed
                  ? "opacity-50"
                  : isCurrent
                    ? "bg-[#00E5FF]/[0.03] ring-1 ring-[#00E5FF]/10"
                    : ""
              }`}
            >
              {/* Set number */}
              <div
                className={`flex h-11 items-center justify-center rounded-lg text-sm font-bold ${
                  set.completed
                    ? "bg-[#00C853]/10 text-[#00C853]"
                    : isRP
                      ? "bg-[#FF9100]/10 text-[#FF9100]"
                      : "bg-white/[0.04] text-[#8B8BA3]"
                }`}
              >
                {set.completed ? "✓" : isRP ? "RP" : setIdx + 1}
              </div>

              {/* Weight */}
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={set.weight_kg}
                onChange={(e) => {
                  const val = e.target.value;
                  setAllSets((prev) => {
                    const updated = { ...prev };
                    const exSets = [...(updated[currentExIdx] || [])];
                    exSets[setIdx] = { ...exSets[setIdx], weight_kg: val };
                    updated[currentExIdx] = exSets;
                    return updated;
                  });
                }}
                disabled={set.completed}
                placeholder={prevSet ? String(prevSet.weight_kg) : "0"}
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-center text-base font-semibold tabular-nums text-white placeholder:text-[#5A5A72]/40 outline-none transition-colors focus:border-[#00E5FF]/50 disabled:opacity-40"
              />

              {/* Reps */}
              <input
                type="number"
                inputMode="numeric"
                value={set.reps_done}
                onChange={(e) => {
                  const val = e.target.value;
                  setAllSets((prev) => {
                    const updated = { ...prev };
                    const exSets = [...(updated[currentExIdx] || [])];
                    exSets[setIdx] = { ...exSets[setIdx], reps_done: val };
                    updated[currentExIdx] = exSets;
                    return updated;
                  });
                }}
                disabled={set.completed}
                placeholder={
                  prevSet
                    ? String(prevSet.reps_done)
                    : `${currentEx?.reps_min || 0}`
                }
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-center text-base font-semibold tabular-nums text-white placeholder:text-[#5A5A72]/40 outline-none transition-colors focus:border-[#00E5FF]/50 disabled:opacity-40"
              />

              {/* Complete set button */}
              <button
                onClick={() => completeSet(setIdx)}
                disabled={set.completed || setIdx !== currentSetIdx}
                className={`flex h-11 items-center justify-center rounded-lg transition-all ${
                  set.completed
                    ? "bg-[#00C853]/10 text-[#00C853]"
                    : isCurrent
                      ? "bg-[#00E5FF] text-[#0A0A0F] hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                      : "bg-white/[0.04] text-[#5A5A72]"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {/* Previous exercise */}
        <button
          onClick={goPrevExercise}
          disabled={currentExIdx === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12121A] py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Anterior
        </button>

        {/* Next exercise or Finish */}
        {isLastExercise && allCurrentSetsDone ? (
          <button
            onClick={finishRoutine}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#00C853] py-3.5 text-sm font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_30px_rgba(0,200,83,0.3)]"
          >
            Finalizar rutina
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={goNextExercise}
            disabled={currentExIdx >= totalExercises - 1}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Video link */}
      {currentEx?.video_url && (
        <a
          href={currentEx.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs font-medium text-[#00E5FF] transition-colors hover:text-[#00E5FF]/70"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Ver vídeo del ejercicio
        </a>
      )}
    </div>
  );
}

export default function ActiveRoutinePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" /></div>}>
      <ActiveTrainingPage />
    </Suspense>
  );
}
