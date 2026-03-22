"use client";

import { useState, useEffect, useMemo } from "react";
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
  duration_months: number;
  goal: string;
  exercises?: ExerciseData[];
  days?: DayData[];
  is_active: boolean;
  sent_at: string | null;
  created_at: string;
}

interface SetInput {
  weight_kg: string;
  reps_done: string;
  type: "main" | "rest_pause";
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

/* ────────────────────────────────────────────
   Constants & Helpers
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

const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const DAY_SHORT: Record<string, string> = {
  lunes: "L",
  martes: "M",
  miercoles: "X",
  jueves: "J",
  viernes: "V",
  sabado: "S",
  domingo: "D",
};

function getDateForDay(startDate: string | null, weekNum: number, dayKey: string): string {
  if (!startDate) return "";
  const dayMap: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    domingo: 0,
  };
  const start = new Date(startDate);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);
  const targetDow = dayMap[dayKey];
  const currentDow = weekStart.getDay();
  let diff = targetDow - currentDow;
  if (diff < 0) diff += 7;
  const date = new Date(weekStart);
  date.setDate(date.getDate() + diff);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function calculateProgress(
  current: { weight: number; reps: number }[],
  previous: { weight: number; reps: number }[]
): string {
  if (previous.length === 0) return "PRIMERA SESIÓN";

  const currentMainSets = current.filter((_, i) => i < previous.length);
  if (currentMainSets.length === 0) return "";

  let weightUp = false;
  let weightDown = false;
  let repsUp = false;
  let repsDown = false;
  let weightSame = true;
  let repsSame = true;

  for (let i = 0; i < Math.min(currentMainSets.length, previous.length); i++) {
    const cw = currentMainSets[i].weight;
    const pw = previous[i].weight;
    const cr = currentMainSets[i].reps;
    const pr = previous[i].reps;

    if (cw > pw) { weightUp = true; weightSame = false; }
    if (cw < pw) { weightDown = true; weightSame = false; }
    if (cr > pr) { repsUp = true; repsSame = false; }
    if (cr < pr) { repsDown = true; repsSame = false; }
  }

  if (weightUp && !weightDown && (repsSame || repsUp))
    return "PROGRESIÓN CARGA" + (repsSame ? " REPES IGUALADAS" : " Y REPES");
  if (repsUp && !repsDown && weightSame)
    return "PROGRESIÓN REPES";
  if (weightUp && repsDown)
    return "PROGRESIÓN CARGA REGRESIÓN REPES";
  if (weightDown && repsUp)
    return "CARGA IGUALADA PROGRESIÓN REPES";
  if (weightSame && repsSame) return "MANTENIDO";
  if (weightDown || repsDown) return "REGRESIÓN";

  return "PROGRESIÓN";
}

function getProgressColor(progress: string): string {
  if (progress.includes("PROGRESIÓN") && !progress.includes("REGRESIÓN"))
    return "text-[#00C853]";
  if (progress.includes("REGRESIÓN")) return "text-[#FF9100]";
  if (progress === "MANTENIDO") return "text-[#8B8BA3]";
  if (progress === "PRIMERA SESIÓN") return "text-[#00E5FF]";
  return "text-[#8B8BA3]";
}

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */

export default function ClientRoutinePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routine, setRoutine] = useState<RoutineRaw | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [previousLogs, setPreviousLogs] = useState<PreviousLog[]>([]);

  // UI state
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Tracking state
  const [sessionInputs, setSessionInputs] = useState<Record<string, SetInput[]>>({});
  const [clientNotes, setClientNotes] = useState<Record<string, string>>({});
  const [rpeGlobal, setRpeGlobal] = useState(7);
  const [saving, setSaving] = useState(false);
  const [inProgressSession, setInProgressSession] = useState<{ id: string; routine_id: string; day_label: string; week_number: number } | null>(null);
  // Set of "day_label::week_number" keys for completed sessions in this routine
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesión.");
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Check for in_progress session
        const { data: pendingSession } = await supabase
          .from("workout_sessions")
          .select("id, routine_id, day_label, week_number")
          .eq("client_id", user.id)
          .eq("status", "in_progress")
          .eq("mode", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingSession) {
          setInProgressSession(pendingSession as { id: string; routine_id: string; day_label: string; week_number: number });
        }

        // Load active routine (try client_id first, then user_id for compat)
        let routineData = null;
        const { data: r1, error: e1 } = await supabase
          .from("user_routines")
          .select("*")
          .eq("client_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!e1 && r1) {
          routineData = r1;
        } else {
          const { data: r2 } = await supabase
            .from("user_routines")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (r2) routineData = r2;
        }

        if (routineData) {
          setRoutine(routineData as RoutineRaw);

          // Load completed sessions for this routine (to block re-doing same day+week)
          const { data: doneSessions } = await supabase
            .from("workout_sessions")
            .select("day_label, week_number")
            .eq("client_id", user.id)
            .eq("routine_id", routineData.id)
            .eq("status", "completed");

          if (doneSessions) {
            const keys = new Set(doneSessions.map((s: any) => `${s.day_label}::${s.week_number}`));
            setCompletedSessions(keys);
          }

          // Load previous weight logs for comparison
          const { data: logs } = await supabase
            .from("weight_log")
            .select("exercise_name, session_date, sets_data")
            .eq("client_id", user.id)
            .order("session_date", { ascending: false })
            .limit(200);

          if (logs) {
            setPreviousLogs(logs as PreviousLog[]);
          }
        }
      } catch {
        setError("Error inesperado.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Parse exercises from routine (handle both formats)
  const parsedExercises = useMemo((): ExerciseData[] => {
    if (!routine) return [];

    // Format 1: flat exercises array with day_of_week
    if (routine.exercises && Array.isArray(routine.exercises) && routine.exercises.length > 0) {
      return routine.exercises;
    }

    // Format 2: days array with nested exercises
    if (routine.days && Array.isArray(routine.days)) {
      return routine.days.flatMap((day: DayData) =>
        (day.exercises || []).map((ex: ExerciseData) => ({
          ...ex,
          day_of_week: ex.day_of_week || day.day,
          day_label: ex.day_label || day.label,
        }))
      );
    }

    return [];
  }, [routine]);

  // Get unique training days
  const trainingDays = useMemo(() => {
    const days = [...new Set(parsedExercises.map((ex) => ex.day_of_week))];
    return days.sort(
      (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
    );
  }, [parsedExercises]);

  // Set initial active day
  useEffect(() => {
    if (trainingDays.length > 0 && !activeDay) {
      setActiveDay(trainingDays[0]);
    }
  }, [trainingDays, activeDay]);

  // Get exercises for current day
  const dayExercises = useMemo(() => {
    if (!activeDay) return [];
    return parsedExercises
      .filter((ex) => ex.day_of_week === activeDay)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [parsedExercises, activeDay]);

  // Get day label
  const dayLabel = useMemo(() => {
    if (!activeDay) return "";
    const ex = parsedExercises.find((e) => e.day_of_week === activeDay);
    return ex?.day_label || DAY_LABELS[activeDay] || activeDay;
  }, [parsedExercises, activeDay]);

  // Check if this specific day+week session is already completed
  const isSessionCompleted = useMemo(() => {
    if (!dayLabel || !activeWeek) return false;
    return completedSessions.has(`${dayLabel}::${activeWeek}`);
  }, [completedSessions, dayLabel, activeWeek]);

  // Get previous log for an exercise
  const getPreviousLog = (exerciseName: string): PreviousSet[] => {
    const log = previousLogs.find(
      (l) => l.exercise_name === exerciseName
    );
    if (!log || !log.sets_data) return [];
    return (log.sets_data as PreviousSet[]) || [];
  };

  // Format previous as "C×R" string
  const formatPrevious = (exerciseName: string): string => {
    const prev = getPreviousLog(exerciseName);
    if (prev.length === 0) return "";
    const mainSets = prev.filter((s) => s.type !== "rest_pause");
    const firstWeight = mainSets[0]?.weight_kg ?? 0;
    const firstReps = mainSets[0]?.reps_done ?? 0;
    return `${firstWeight}x${firstReps}`;
  };

  // Start tracking session
  const startTracking = () => {
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

    setSessionInputs(inputs);
    setClientNotes({});
    setIsTracking(true);
  };

  const updateSet = (
    exerciseName: string,
    setIndex: number,
    field: "weight_kg" | "reps_done",
    value: string
  ) => {
    setSessionInputs((prev) => {
      const updated = { ...prev };
      const sets = [...(updated[exerciseName] || [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      updated[exerciseName] = sets;
      return updated;
    });
  };

  const handleSaveSession = async () => {
    if (!userId || !activeDay) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      // Create workout_session first
      const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          client_id: userId,
          routine_id: routine?.id,
          trainer_id: routine ? (routine as any).trainer_id : null,
          session_date: today,
          day_label: dayLabel,
          week_number: activeWeek,
          mode: "registration",
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      const currentSessionId = session?.id || null;

      const weightLogInserts = dayExercises.map((ex) => {
        const sets = sessionInputs[ex.name] || [];
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
          client_id: userId,
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
        setSaving(false);
        return;
      }

      // Update session aggregates
      if (currentSessionId) {
        const totalVol = weightLogInserts.reduce((s, w) => s + w.total_volume_kg, 0);
        const totalSets = weightLogInserts.reduce((s, w) => s + (w.sets_data?.length || 0), 0);
        await supabase.from("workout_sessions").update({
          total_volume_kg: totalVol,
          total_sets: totalSets,
          total_exercises: dayExercises.length,
          rpe_session: rpeGlobal,
        }).eq("id", currentSessionId);
      }

      // Calendar entry
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
            nombre: routine?.title || "Entrenamiento",
            dia: activeDay,
            day_label: dayLabel,
          },
          completed: true,
          rpe: rpeGlobal,
        });
      }

      // RPE history
      const totalVol = weightLogInserts.reduce(
        (sum, w) => sum + w.total_volume_kg,
        0
      );
      const { data: calEntry } = await supabase
        .from("user_calendar")
        .select("id")
        .eq("user_id", userId)
        .eq("date", today)
        .eq("activity_type", "workout")
        .single();

      if (calEntry) {
        await supabase.from("rpe_history").insert({
          client_id: userId,
          calendar_id: calEntry.id,
          rpe_global: rpeGlobal,
          total_volume_kg: totalVol,
        });
      }

      toast.success("Sesión guardada correctamente");
      setIsTracking(false);

      // Reload previous logs
      const { data: newLogs } = await supabase
        .from("weight_log")
        .select("exercise_name, session_date, sets_data")
        .eq("client_id", userId)
        .order("session_date", { ascending: false })
        .limit(200);
      if (newLogs) setPreviousLogs(newLogs as PreviousLog[]);
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  // Week count
  const weekCount = routine ? Math.max(1, (routine.duration_months || 1) * 4) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Mi Rutina</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#12121A] py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
            <svg className="h-7 w-7 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white">Sin rutina asignada</p>
          <p className="max-w-xs text-center text-xs text-[#8B8BA3]">
            Tu entrenador aún no te ha asignado una rutina
          </p>
        </div>
      </div>
    );
  }

  /* ── TRACKING MODE ── */
  if (isTracking && activeDay) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsTracking(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">
              {dayLabel}
            </h1>
            <p className="text-xs text-[#5A5A72]">
              Sem {activeWeek} · {getDateForDay(routine.sent_at, activeWeek, activeDay)}
            </p>
          </div>
        </div>

        {/* Exercise tracking cards */}
        {dayExercises.map((ex, exIdx) => {
          const sets = sessionInputs[ex.name] || [];
          const prevSets = getPreviousLog(ex.name);
          const scheme = ex.scheme || `${ex.sets}x${ex.reps_min}-${ex.reps_max}`;
          const notes = ex.coach_notes || ex.trainer_notes || ex.technique_notes || "";
          const progressionRule = ex.progression_rule || "";

          // Calculate progress for this exercise
          const currentData = sets
            .filter((s) => s.reps_done)
            .map((s) => ({
              weight: Number(s.weight_kg) || 0,
              reps: Number(s.reps_done) || 0,
            }));
          const prevData = prevSets.map((s) => ({
            weight: s.weight_kg,
            reps: s.reps_done,
          }));
          const progress =
            currentData.length > 0
              ? calculateProgress(currentData, prevData)
              : "";

          return (
            <div
              key={`${ex.exercise_id}-${exIdx}`}
              className="rounded-2xl border border-white/[0.06] bg-[#12121A] overflow-hidden"
            >
              {/* Exercise header */}
              <div className="border-b border-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                      {exIdx + 1}
                    </span>
                    <p className="text-sm font-semibold uppercase text-white">
                      {ex.name}
                    </p>
                  </div>
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-[#8B8BA3]">
                    {scheme}
                  </span>
                </div>

                {/* Ref info row */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {progressionRule && (
                    <span className="text-[10px] text-[#FF9100]">
                      {progressionRule}
                    </span>
                  )}
                  {notes && (
                    <span className="text-[10px] text-[#7C3AED]">
                      {notes}
                    </span>
                  )}
                </div>

                {/* Previous & Progress */}
                <div className="mt-2 flex items-center gap-3">
                  {formatPrevious(ex.name) && (
                    <span className="text-[10px] text-[#5A5A72]">
                      ANTERIOR: {formatPrevious(ex.name)}
                    </span>
                  )}
                  {progress && (
                    <span
                      className={`text-[10px] font-bold ${getProgressColor(
                        progress
                      )}`}
                    >
                      {progress}
                    </span>
                  )}
                </div>
              </div>

              {/* Sets table */}
              <div className="px-4 py-3">
                {/* Table header */}
                <div className="mb-2 grid grid-cols-[2.5rem_1fr_1fr] gap-2">
                  <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">
                    Serie
                  </span>
                  <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">
                    C (kg)
                  </span>
                  <span className="text-center text-[10px] font-medium uppercase tracking-wider text-[#5A5A72]">
                    R (reps)
                  </span>
                </div>

                {/* Set rows */}
                {sets.map((set, setIdx) => {
                  const prevSet = prevSets[setIdx];
                  const isRP = set.type === "rest_pause";

                  return (
                    <div
                      key={setIdx}
                      className={`mb-1.5 grid grid-cols-[2.5rem_1fr_1fr] gap-2 ${
                        isRP ? "opacity-90" : ""
                      }`}
                    >
                      {/* Set number */}
                      <div
                        className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold ${
                          isRP
                            ? "bg-[#FF9100]/10 text-[#FF9100]"
                            : "bg-white/[0.04] text-[#8B8BA3]"
                        }`}
                      >
                        {isRP ? "RP" : setIdx + 1}
                      </div>

                      {/* Weight input with ghost */}
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          value={set.weight_kg}
                          onChange={(e) =>
                            updateSet(ex.name, setIdx, "weight_kg", e.target.value)
                          }
                          placeholder={
                            prevSet ? String(prevSet.weight_kg) : "0"
                          }
                          className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-center text-sm text-white placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/50"
                        />
                      </div>

                      {/* Reps input with ghost */}
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps_done}
                          onChange={(e) =>
                            updateSet(ex.name, setIdx, "reps_done", e.target.value)
                          }
                          placeholder={
                            prevSet
                              ? String(prevSet.reps_done)
                              : `${ex.reps_min}-${ex.reps_max}`
                          }
                          className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-center text-sm text-white placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/50"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Client notes */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Notas / sensaciones..."
                    value={clientNotes[ex.name] || ""}
                    onChange={(e) =>
                      setClientNotes((prev) => ({
                        ...prev,
                        [ex.name]: e.target.value,
                      }))
                    }
                    className="h-8 w-full rounded-lg border border-white/[0.06] bg-transparent px-3 text-xs text-[#8B8BA3] placeholder:text-[#5A5A72]/50 outline-none transition-colors focus:border-[#00E5FF]/30"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* RPE */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[#5A5A72]">
              RPE Global
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-sm font-bold text-[#00E5FF]">
              {rpeGlobal}
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
          <div className="mt-1 flex justify-between text-[9px] text-[#5A5A72]">
            <span>Fácil</span>
            <span>Máximo</span>
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSaveSession}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
              Guardando...
            </>
          ) : (
            "Guardar sesión"
          )}
        </button>
      </div>
    );
  }

  /* ── ROUTINE OVERVIEW ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Rutina</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">{routine.title}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-[#5A5A72]">
          <span className="rounded-md bg-[#00E5FF]/10 px-2 py-0.5 font-medium text-[#00E5FF]">
            {routine.goal === "fuerza" ? "Fuerza" : "Hipertrofia"}
          </span>
          <span>{routine.duration_months} mes{(routine.duration_months || 1) > 1 ? "es" : ""}</span>
        </div>
      </div>

      {/* Week selector */}
      {weekCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: Math.min(weekCount, 12) }, (_, i) => i + 1).map(
            (week) => (
              <button
                key={week}
                type="button"
                onClick={() => setActiveWeek(week)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  activeWeek === week
                    ? "bg-[#00E5FF] text-[#0A0A0F]"
                    : "bg-white/[0.04] text-[#8B8BA3] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                Sem {week}
              </button>
            )
          )}
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-2">
        {trainingDays.map((day) => {
          const dateStr = getDateForDay(routine.sent_at, activeWeek, day);
          const label =
            parsedExercises.find((e) => e.day_of_week === day)?.day_label ||
            DAY_LABELS[day];

          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`flex flex-col items-center rounded-xl px-4 py-2 transition-all ${
                activeDay === day
                  ? "bg-[#00E5FF]/10 ring-1 ring-[#00E5FF]/30"
                  : "bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <span
                className={`text-xs font-bold ${
                  activeDay === day ? "text-[#00E5FF]" : "text-[#8B8BA3]"
                }`}
              >
                {DAY_SHORT[day] || day.slice(0, 1).toUpperCase()}
              </span>
              {dateStr && (
                <span className="mt-0.5 text-[9px] text-[#5A5A72]">
                  {dateStr}
                </span>
              )}
              {label && (
                <span
                  className={`mt-0.5 text-[8px] font-medium uppercase tracking-wider ${
                    activeDay === day ? "text-[#00E5FF]/60" : "text-[#5A5A72]"
                  }`}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Exercise list */}
      {dayExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12121A] py-12">
          <p className="text-sm text-[#8B8BA3]">Día de descanso</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dayExercises.map((ex, idx) => {
              const scheme =
                ex.scheme || `${ex.sets}x${ex.reps_min}-${ex.reps_max}`;
              const prevStr = formatPrevious(ex.name);
              const notes =
                ex.coach_notes || ex.trainer_notes || ex.technique_notes || "";
              const progressionRule = ex.progression_rule || "";

              return (
                <div
                  key={`${ex.exercise_id}-${idx}`}
                  className="rounded-xl border border-white/[0.06] bg-[#12121A] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#00E5FF]/10 text-[9px] font-bold text-[#00E5FF]">
                        {idx + 1}
                      </span>
                      <p className="truncate text-xs font-semibold text-white">
                        {ex.name}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-[#8B8BA3]">
                      {scheme}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#5A5A72]">
                    <span>RIR {ex.rir}</span>
                    {(ex.target_weight || ex.weight_kg) ? (
                      <span>{ex.target_weight || ex.weight_kg}kg</span>
                    ) : null}
                    <span>{ex.rest_s}s</span>
                    {prevStr && (
                      <span className="text-[#8B8BA3]">
                        Ant: {prevStr}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {(notes || progressionRule) && (
                    <div className="mt-1 space-y-0.5">
                      {progressionRule && (
                        <p className="truncate text-[9px] text-[#FF9100]">
                          {progressionRule}
                        </p>
                      )}
                      {notes && (
                        <p className="truncate text-[9px] text-[#7C3AED]">
                          {notes}
                        </p>
                      )}
                    </div>
                  )}

                  {ex.video_url && (
                    <a
                      href={ex.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium text-[#00E5FF] transition-colors hover:text-[#00E5FF]/80"
                    >
                      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Vídeo
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resume in-progress session */}
          {inProgressSession && (
            <a
              href={`/app/client/routine/active?routine_id=${inProgressSession.routine_id}&day=${inProgressSession.day_label}&week=${inProgressSession.week_number}&session_id=${inProgressSession.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#FF9100] bg-[#FF9100]/10 py-3.5 text-sm font-bold text-[#FF9100] transition-all hover:bg-[#FF9100]/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Completar rutina en curso
            </a>
          )}

          {/* Training mode buttons */}
          {isSessionCompleted ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#00C853]/20 bg-[#00C853]/10 py-3.5 text-sm font-semibold text-[#00C853]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Sesión completada hoy
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={startTracking}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12121A] py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.04]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Registrar sesión
              </button>
              <a
                href={`/app/client/routine/active?routine_id=${routine.id}&day=${activeDay}&week=${activeWeek}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Entrenar en activo
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
