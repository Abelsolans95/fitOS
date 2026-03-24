"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { ExerciseData, PreviousLog, SavedLogEntry } from "./types";
import { useActiveTraining } from "./useActiveTraining";
import { RestTimer } from "./components/RestTimer";
import { RPESelector } from "./components/RPESelector";
import { SummaryView } from "./components/SummaryView";
import { ExerciseCard } from "./components/ExerciseCard";

function ActiveTrainingPage() {
  const searchParams = useSearchParams();
  const routineId = searchParams.get("routine_id");
  const day = searchParams.get("day") || "lunes";
  const week = parseInt(searchParams.get("week") || "1");
  const resumeSessionId = searchParams.get("session_id");

  const [userId, setUserId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [previousLogs, setPreviousLogs] = useState<PreviousLog[]>([]);
  const [routineTitle, setRoutineTitle] = useState("");
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [finishError, setFinishError] = useState(false);

  const t = useActiveTraining({ exercises, previousLogs, userId, routineId, trainerId, routineTitle, day, week });
  const { state } = t;

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("No autenticado"); return; }
      setUserId(user.id);

      let query = supabase.from("user_routines").select("id, title, trainer_id, exercises")
        .eq("client_id", user.id).eq("is_active", true);
      if (routineId) query = query.eq("id", routineId);

      const { data: routine, error: rErr } = await query
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (rErr || !routine) {
        toast.error(rErr ? `Error al cargar la rutina: ${rErr.message}` : "No se encontró una rutina activa");
        return;
      }
      setRoutineTitle(routine.title);
      setTrainerId(routine.trainer_id);

      let allEx: ExerciseData[] = [];
      if (routine.exercises && Array.isArray(routine.exercises) && routine.exercises.length > 0)
        allEx = (routine.exercises as ExerciseData[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (allEx.length === 0) { toast.error("La rutina no tiene ejercicios"); return; }

      const nd = day.toLowerCase();
      let dayEx = allEx.filter((ex) => ex.day_of_week?.toLowerCase() === nd);
      if (dayEx.length === 0) {
        const fd = allEx[0]?.day_of_week;
        if (fd) dayEx = allEx.filter((ex) => ex.day_of_week === fd);
      }
      if (dayEx.length === 0) { toast.error("No hay ejercicios para este día"); return; }
      setExercises(dayEx);

      const { data: logs, error: logsError } = await supabase.from("weight_log")
        .select("exercise_name, session_date, sets_data")
        .eq("client_id", user.id).order("session_date", { ascending: false }).limit(200);
      if (logsError) {
        console.error("[RoutineActive] Error cargando logs anteriores:", logsError);
        // No bloqueante — continuamos sin datos anteriores
      }
      const pl = (logs ?? []) as PreviousLog[];
      setPreviousLogs(pl);

      if (resumeSessionId) {
        const { data: es, error: esError } = await supabase.from("workout_sessions")
          .select("id, created_at, status")
          .eq("id", resumeSessionId).eq("client_id", user.id).eq("status", "in_progress").maybeSingle();
        if (esError) {
          console.error("[RoutineActive] Error cargando sesión a resumir:", esError);
          // Tratar como si no hubiera sesión a resumir
        }
        if (es) {
          const { data: sl, error: slError } = await supabase.from("weight_log")
            .select("exercise_name, sets_data, client_notes").eq("session_id", es.id);
          if (slError) {
            console.error("[RoutineActive] Error cargando sets guardados:", slError);
            // No bloqueante
          }
          t.resumeFromSession({
            sessionId: es.id, sessionCreatedAt: es.created_at,
            sessionLogs: (sl ?? []) as SavedLogEntry[], exercises: dayEx, previousLogs: pl,
          });
          return;
        }
      }
      t.initializeSets(dayEx, pl);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId, day, resumeSessionId]);

  const handleFinalize = useCallback(async () => {
    setFinishError(false);
    const ok = await t.finalizeSession();
    if (!ok) setFinishError(true);
  }, [t.finalizeSession]);

  if (state.phase === "loading") return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        <p className="text-sm text-[#8B8BA3]">Cargando entrenamiento...</p>
      </div>
    </div>
  );

  if (state.phase === "ready") {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Entrenamiento activo</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{routineTitle}</h1>
          <p className="mt-2 text-sm text-[#8B8BA3]">{exercises.length} ejercicios · Semana {week}</p>
        </div>
        <div className="w-full max-w-md space-y-2">
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#0E0E18]/60 backdrop-blur-xl/60 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-xs font-bold text-[#00E5FF]">{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-white">{ex.name}</span>
              <span className="text-xs text-[#5A5A72]">{ex.sets}x{ex.reps_min}{ex.reps_max !== ex.reps_min ? `-${ex.reps_max}` : ""}</span>
            </div>
          ))}
        </div>
        <button onClick={t.startSession} className="group relative mt-4 flex items-center gap-3 rounded-2xl bg-[#00E5FF] px-10 py-4 text-base font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.3)]">
          <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          Comenzar
        </button>
      </div>
    );
  }

  if (state.phase === "rest") {
    return (
      <RestTimer
        restTime={state.restTime} restTotal={state.restTotal} elapsed={state.elapsed}
        exerciseName={t.currentEx?.name || ""}
        notes={state.exerciseNotes[state.currentExIdx] || ""}
        onNotesChange={(n) => t.dispatch({ type: "SET_NOTES", exIdx: state.currentExIdx, notes: n })}
        onSkipRest={t.skipRest}
        nextExerciseName={state.currentExIdx < t.totalExercises - 1 ? exercises[state.currentExIdx + 1]?.name : undefined}
      />
    );
  }

  if (state.phase === "rpe") {
    return (
      <>
        <RPESelector
          rpeGlobal={state.rpeGlobal}
          onRpeChange={(v) => t.dispatch({ type: "SET_RPE", value: v })}
          onFinish={handleFinalize}
        />
        {finishError && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-[#FF1744]/90 px-6 py-3 text-sm text-white shadow-lg">
            Error al guardar.{" "}
            <button onClick={handleFinalize} className="ml-2 font-bold underline">Reintentar</button>
          </div>
        )}
      </>
    );
  }

  if (state.phase === "summary") return (
    <SummaryView summaryData={t.summaryData} elapsed={state.elapsed} rpeGlobal={state.rpeGlobal} routineTitle={routineTitle} />
  );

  if (!t.currentEx) return null;
  return (
    <ExerciseCard
      exercise={t.currentEx} exerciseIndex={state.currentExIdx} totalExercises={t.totalExercises}
      sets={state.allSets[state.currentExIdx] || []}
      previousSets={t.getPreviousForExercise(t.currentEx.name)}
      currentSetIdx={t.currentSetIdx} allCurrentSetsDone={t.allCurrentSetsDone}
      isLastExercise={t.isLastExercise}
      isSaved={state.savedExercises.includes(state.currentExIdx)}
      elapsed={state.elapsed}
      onCompleteSet={t.completeSet}
      onSetValueChange={(si, f, v) => t.dispatch({ type: "UPDATE_SET_VALUE", exIdx: state.currentExIdx, setIdx: si, field: f, value: v })}
      onNext={t.goNextExercise} onPrev={t.goPrevExercise} onFinishRoutine={t.finishRoutine}
    />
  );
}

// Suspense wrapper (regla 41 — useSearchParams requiere Suspense)
export default function ActiveRoutinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      }
    >
      <ActiveTrainingPage />
    </Suspense>
  );
}
