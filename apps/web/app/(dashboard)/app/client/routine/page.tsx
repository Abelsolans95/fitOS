"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface ExerciseData {
  exercise_id: string;
  name: string;
  video_url?: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  rir_progression_weekly?: number[];
  weight_kg: number;
  rest_s: number;
  day_of_week: string;
  week_of_month: number;
  trainer_notes?: string;
  technique_notes?: string;
}

interface Routine {
  id: string;
  title: string;
  duration_months: number;
  goal: string;
  exercises: ExerciseData[];
  is_active: boolean;
  created_at: string;
}

interface SetLog {
  weight_kg: string;
  reps_done: string;
}

interface SessionLog {
  [exerciseName: string]: SetLog[];
}

const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sabado",
  domingo: "Domingo",
};

const DAY_ORDER = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export default function RoutinePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // UI state
  const [activeWeek, setActiveWeek] = useState(1);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loggingDay, setLoggingDay] = useState<string | null>(null);

  // Session logging state
  const [sessionLog, setSessionLog] = useState<SessionLog>({});
  const [rpeGlobal, setRpeGlobal] = useState(5);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesion del usuario.");
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error: queryError } = await supabase
          .from("user_routines")
          .select("*")
          .eq("client_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (queryError) {
          setError("Error al cargar la rutina.");
          setLoading(false);
          return;
        }

        if (data) {
          setRoutine(data as Routine);
        }
      } catch {
        setError("Error inesperado al cargar la rutina.");
      } finally {
        setLoading(false);
      }
    };

    loadRoutine();
  }, []);

  const getWeekCount = () => {
    if (!routine) return 0;
    return routine.duration_months * 4;
  };

  const getExercisesForDayAndWeek = (day: string, week: number) => {
    if (!routine) return [];
    return (routine.exercises as ExerciseData[]).filter(
      (ex) => ex.day_of_week === day && ex.week_of_month === week
    );
  };

  const getDaysWithExercises = (week: number) => {
    if (!routine) return [];
    const days = new Set(
      (routine.exercises as ExerciseData[])
        .filter((ex) => ex.week_of_month === week)
        .map((ex) => ex.day_of_week)
    );
    return DAY_ORDER.filter((d) => days.has(d));
  };

  const startLogging = (day: string) => {
    const exercises = getExercisesForDayAndWeek(day, activeWeek);
    const initial: SessionLog = {};
    for (const ex of exercises) {
      initial[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight_kg: String(ex.weight_kg || ""),
        reps_done: "",
      }));
    }
    setSessionLog(initial);
    setLoggingDay(day);
    setSessionSaved(false);
  };

  const updateSetLog = (
    exerciseName: string,
    setIndex: number,
    field: "weight_kg" | "reps_done",
    value: string
  ) => {
    setSessionLog((prev) => {
      const updated = { ...prev };
      const sets = [...(updated[exerciseName] || [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      updated[exerciseName] = sets;
      return updated;
    });
  };

  const handleSaveSession = async () => {
    if (!userId || !loggingDay) return;
    setSavingSession(true);

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const exercises = getExercisesForDayAndWeek(loggingDay, activeWeek);

      // Insert weight_log entries for each exercise
      const weightLogInserts = exercises.map((ex) => {
        const sets = sessionLog[ex.name] || [];
        const setsData = sets.map((s, i) => ({
          set_number: i + 1,
          weight_kg: Number(s.weight_kg) || 0,
          reps_done: Number(s.reps_done) || 0,
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
          sets_data: setsData,
          total_volume_kg: totalVolume,
        };
      });

      const { error: weightError } = await supabase
        .from("weight_log")
        .insert(weightLogInserts);

      if (weightError) {
        setError("Error al guardar la sesion.");
        setSavingSession(false);
        return;
      }

      // Create/update calendar entry
      const { data: existingCalendar } = await supabase
        .from("user_calendar")
        .select("id")
        .eq("user_id", userId)
        .eq("date", today)
        .eq("activity_type", "workout")
        .maybeSingle();

      if (existingCalendar) {
        await supabase
          .from("user_calendar")
          .update({ completed: true, rpe: rpeGlobal })
          .eq("id", existingCalendar.id);
      } else {
        await supabase.from("user_calendar").insert({
          user_id: userId,
          date: today,
          activity_type: "workout",
          activity_details: {
            nombre: routine?.title || "Entrenamiento",
            dia: loggingDay,
          },
          completed: true,
          rpe: rpeGlobal,
        });
      }

      // Insert RPE history
      const calendarId =
        existingCalendar?.id || crypto.randomUUID();
      if (!existingCalendar) {
        // We already inserted above; grab the new id
        const { data: newCal } = await supabase
          .from("user_calendar")
          .select("id")
          .eq("user_id", userId)
          .eq("date", today)
          .eq("activity_type", "workout")
          .single();

        if (newCal) {
          await supabase.from("rpe_history").insert({
            client_id: userId,
            calendar_id: newCal.id,
            rpe_global: rpeGlobal,
            total_volume_kg: weightLogInserts.reduce(
              (sum, w) => sum + w.total_volume_kg,
              0
            ),
          });
        }
      } else {
        await supabase.from("rpe_history").insert({
          client_id: userId,
          calendar_id: calendarId,
          rpe_global: rpeGlobal,
          total_volume_kg: weightLogInserts.reduce(
            (sum, w) => sum + w.total_volume_kg,
            0
          ),
        });
      }

      setSessionSaved(true);
      setLoggingDay(null);
    } catch {
      setError("Error inesperado al guardar la sesion.");
    } finally {
      setSavingSession(false);
    }
  };

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
        <button
          type="button"
          onClick={() => setError(null)}
          className="text-sm text-[#00E5FF] hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Mi Rutina</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#12121A] py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
            <svg
              className="h-7 w-7 text-[#8B8BA3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-white">Sin rutina asignada</p>
          <p className="max-w-xs text-center text-xs text-[#8B8BA3]">
            Tu entrenador aun no te ha asignado una rutina
          </p>
        </div>
      </div>
    );
  }

  // Session logging modal
  if (loggingDay) {
    const dayExercises = getExercisesForDayAndWeek(loggingDay, activeWeek);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLoggingDay(null)}
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
          <div>
            <h1 className="text-xl font-bold text-white">Registrar sesion</h1>
            <p className="text-sm text-[#8B8BA3]">
              {DAY_LABELS[loggingDay] || loggingDay} - Semana {activeWeek}
            </p>
          </div>
        </div>

        {dayExercises.map((ex) => (
          <div
            key={ex.exercise_id + ex.name}
            className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4"
          >
            <p className="mb-3 text-sm font-semibold text-white">{ex.name}</p>

            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-center">
                <span className="text-[10px] font-medium uppercase text-[#8B8BA3]">
                  #
                </span>
                <span className="text-[10px] font-medium uppercase text-[#8B8BA3]">
                  Peso (kg)
                </span>
                <span className="text-[10px] font-medium uppercase text-[#8B8BA3]">
                  Reps
                </span>
              </div>

              {(sessionLog[ex.name] || []).map((set, setIdx) => (
                <div
                  key={setIdx}
                  className="grid grid-cols-[2rem_1fr_1fr] gap-2"
                >
                  <div className="flex h-9 items-center justify-center rounded-lg bg-[#0A0A0F] text-xs font-medium text-[#8B8BA3]">
                    {setIdx + 1}
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={String(ex.weight_kg || 0)}
                    value={set.weight_kg}
                    onChange={(e) =>
                      updateSetLog(
                        ex.name,
                        setIdx,
                        "weight_kg",
                        e.target.value
                      )
                    }
                    className="h-9 rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-center text-sm text-white outline-none transition-colors focus:border-[#00E5FF]/50"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={`${ex.reps_min}-${ex.reps_max}`}
                    value={set.reps_done}
                    onChange={(e) =>
                      updateSetLog(
                        ex.name,
                        setIdx,
                        "reps_done",
                        e.target.value
                      )
                    }
                    className="h-9 rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-center text-sm text-white outline-none transition-colors focus:border-[#00E5FF]/50"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* RPE */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
          <p className="mb-3 text-sm font-semibold text-white">
            RPE Global (1-10)
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              value={rpeGlobal}
              onChange={(e) => setRpeGlobal(Number(e.target.value))}
              className="flex-1 accent-[#00E5FF]"
            />
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-sm font-bold text-[#00E5FF]">
              {rpeGlobal}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[#8B8BA3]">
            <span>Facil</span>
            <span>Maximo</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSession}
          disabled={savingSession}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
        >
          {savingSession ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
              Guardando...
            </>
          ) : (
            "Guardar sesion"
          )}
        </button>
      </div>
    );
  }

  const weekCount = getWeekCount();
  const daysWithExercises = getDaysWithExercises(
    activeWeek <= weekCount ? ((activeWeek - 1) % 4) + 1 : 1
  );
  const effectiveWeek = activeWeek <= weekCount ? ((activeWeek - 1) % 4) + 1 : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Rutina</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">{routine.title}</p>
      </div>

      {/* Session saved success */}
      {sessionSaved && (
        <div className="rounded-xl border border-[#00C853]/20 bg-[#00C853]/5 px-4 py-3">
          <p className="text-center text-sm text-[#00C853]">
            Sesion registrada correctamente
          </p>
        </div>
      )}

      {/* Week tabs */}
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
                    ? "bg-[#7C3AED] text-white"
                    : "bg-white/[0.04] text-[#8B8BA3] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                Sem {week}
              </button>
            )
          )}
        </div>
      )}

      {/* Days accordion */}
      <div className="space-y-3">
        {daysWithExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12121A] py-12">
            <p className="text-sm text-[#8B8BA3]">
              No hay ejercicios esta semana
            </p>
          </div>
        ) : (
          daysWithExercises.map((day) => {
            const exercises = getExercisesForDayAndWeek(day, effectiveWeek);
            const isExpanded = expandedDay === day;

            return (
              <div
                key={day}
                className="rounded-2xl border border-white/[0.06] bg-[#12121A] overflow-hidden"
              >
                {/* Day header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedDay(isExpanded ? null : day)
                  }
                  className="flex w-full items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/10">
                      <span className="text-xs font-bold text-[#7C3AED]">
                        {(DAY_LABELS[day] || day).slice(0, 2)}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">
                        {DAY_LABELS[day] || day}
                      </p>
                      <p className="text-xs text-[#8B8BA3]">
                        {exercises.length} ejercicio
                        {exercises.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-[#8B8BA3] transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {/* Exercises list */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] px-4 pb-4">
                    <div className="space-y-3 pt-3">
                      {exercises.map((ex, idx) => (
                        <div
                          key={ex.exercise_id + idx}
                          className="rounded-xl bg-[#0A0A0F] p-4"
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-white">
                              {ex.name}
                            </p>
                            {ex.video_url && (
                              <a
                                href={ex.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </a>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8B8BA3]">
                            <span>
                              {ex.sets} x {ex.reps_min}-{ex.reps_max} reps
                            </span>
                            <span>RIR {ex.rir}</span>
                            {ex.weight_kg > 0 && (
                              <span>{ex.weight_kg} kg</span>
                            )}
                            <span>{ex.rest_s}s descanso</span>
                          </div>

                          {ex.trainer_notes && (
                            <div className="mt-2 rounded-lg bg-[#7C3AED]/5 px-3 py-2">
                              <p className="text-[11px] text-[#7C3AED]">
                                {ex.trainer_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Log session button */}
                    <button
                      type="button"
                      onClick={() => startLogging(day)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 py-2.5 text-xs font-semibold text-[#00E5FF] transition-all hover:bg-[#00E5FF]/10"
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
                      Registrar sesion
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
