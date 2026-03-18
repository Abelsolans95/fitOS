"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface ClientOption {
  client_id: string;
  full_name: string | null;
  email: string | null;
}

interface ExerciseItem {
  id: string;
  name: string;
  muscle_group: string | null;
  category: string | null;
}

interface RoutineExercise {
  exercise_id: string;
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  weight_kg: number | "";
  rest_s: number;
}

interface DayColumn {
  label: string;
  key: string;
  exercises: RoutineExercise[];
}

interface RoutineRow {
  id: string;
  title: string;
  goal: string | null;
  duration_months: number | null;
  is_active: boolean;
  sent_at: string | null;
  created_at: string;
  client_name: string | null;
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const DAYS_OF_WEEK: { label: string; key: string }[] = [
  { label: "Lunes", key: "lunes" },
  { label: "Martes", key: "martes" },
  { label: "Miercoles", key: "miercoles" },
  { label: "Jueves", key: "jueves" },
  { label: "Viernes", key: "viernes" },
  { label: "Sabado", key: "sabado" },
  { label: "Domingo", key: "domingo" },
];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildEmptyDays(): DayColumn[] {
  return DAYS_OF_WEEK.map((d) => ({
    label: d.label,
    key: d.key,
    exercises: [],
  }));
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full bg-[#00C853]/10 px-2.5 py-0.5 text-xs font-medium text-[#00C853]">
      Activa
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-[#8B8BA3]/10 px-2.5 py-0.5 text-xs font-medium text-[#8B8BA3]">
      Inactiva
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#12121A] py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] text-[#8B8BA3]">
        {icon}
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-[#8B8BA3]">{description}</p>
    </div>
  );
}

/* ────────────────────────────────────────────
   Exercise Search Modal
   ──────────────────────────────────────────── */

function ExerciseSearchModal({
  exercises,
  onSelect,
  onClose,
}: {
  exercises: ExerciseItem[];
  onSelect: (exercise: ExerciseItem) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return exercises.slice(0, 30);
    const q = query.toLowerCase();
    return exercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.muscle_group?.toLowerCase().includes(q) ?? false) ||
          (e.category?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 30);
  }, [exercises, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#12121A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-semibold text-white">Anadir ejercicio</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8BA3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o grupo muscular..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] pl-10 pr-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-3 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <p className="text-sm text-[#8B8BA3]">No se encontraron ejercicios</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    onSelect(exercise);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{exercise.name}</p>
                    <p className="text-xs text-[#8B8BA3]">
                      {[exercise.muscle_group, exercise.category].filter(Boolean).join(" · ") || "Sin categoria"}
                    </p>
                  </div>
                  <svg className="ml-2 h-4 w-4 shrink-0 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Routine Creator
   ──────────────────────────────────────────── */

function RoutineCreator({
  clients,
  exercises,
  trainerId,
  onCreated,
  onCancel,
}: {
  clients: ClientOption[];
  exercises: ExerciseItem[];
  trainerId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState<"fuerza" | "hipertrofia">("hipertrofia");
  const [durationMonths, setDurationMonths] = useState<number | "">(3);
  const [days, setDays] = useState<DayColumn[]>(buildEmptyDays());
  const [saving, setSaving] = useState(false);

  // Exercise search modal state
  const [searchModalDayIndex, setSearchModalDayIndex] = useState<number | null>(null);

  const addExercise = (dayIndex: number, exercise: ExerciseItem) => {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const newExercise: RoutineExercise = {
          exercise_id: exercise.id,
          name: exercise.name,
          sets: 4,
          reps_min: goal === "fuerza" ? 3 : 8,
          reps_max: goal === "fuerza" ? 6 : 12,
          rir: goal === "fuerza" ? 2 : 1,
          weight_kg: "",
          rest_s: goal === "fuerza" ? 180 : 90,
        };
        return { ...d, exercises: [...d.exercises, newExercise] };
      })
    );
  };

  const updateExerciseField = (
    dayIndex: number,
    exerciseIndex: number,
    field: keyof RoutineExercise,
    value: number | string
  ) => {
    setDays((prev) =>
      prev.map((d, di) => {
        if (di !== dayIndex) return d;
        return {
          ...d,
          exercises: d.exercises.map((e, ei) => {
            if (ei !== exerciseIndex) return e;
            return { ...e, [field]: value };
          }),
        };
      })
    );
  };

  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    setDays((prev) =>
      prev.map((d, di) => {
        if (di !== dayIndex) return d;
        return { ...d, exercises: d.exercises.filter((_, ei) => ei !== exerciseIndex) };
      })
    );
  };

  const handleSend = async () => {
    if (!selectedClientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!title.trim()) {
      toast.error("Ingresa un titulo para la rutina");
      return;
    }

    const hasExercises = days.some((d) => d.exercises.length > 0);
    if (!hasExercises) {
      toast.error("Anade al menos un ejercicio a la rutina");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const routineData = {
        trainer_id: trainerId,
        user_id: selectedClientId,
        name: title,
        title,
        description: `Rutina de ${goal} - ${durationMonths || 3} meses`,
        goal,
        duration_months: Number(durationMonths) || 3,
        days: days.map((d) => ({
          day: d.key,
          label: d.label,
          exercises: d.exercises.map((e) => ({
            exercise_id: e.exercise_id,
            name: e.name,
            sets: e.sets,
            reps_min: e.reps_min,
            reps_max: e.reps_max,
            rir: e.rir,
            weight_kg: e.weight_kg === "" ? null : e.weight_kg,
            rest_s: e.rest_s,
          })),
        })),
        is_active: true,
        sent_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("user_routines").insert(routineData);

      if (error) {
        toast.error("Error al guardar la rutina");
        console.error(error);
        setSaving(false);
        return;
      }

      toast.success("Rutina enviada al cliente correctamente");
      onCreated();
    } catch {
      toast.error("Error inesperado al guardar la rutina");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-[#8B8BA3] transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a rutinas
      </button>

      <h2 className="text-xl font-bold text-white">Nueva Rutina</h2>

      {/* Config card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-4">
        {/* Client */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
            Cliente
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]/50"
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map((c) => (
              <option key={c.client_id} value={c.client_id}>
                {c.full_name ?? c.email ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
            Titulo
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Rutina Push/Pull/Legs - Hipertrofia"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
          />
        </div>

        {/* Goal */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
            Objetivo
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["fuerza", "hipertrofia"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`flex flex-col items-center justify-center rounded-xl border px-4 py-4 transition-all ${
                  goal === g
                    ? "border-[#7C3AED]/50 bg-[#7C3AED]/10"
                    : "border-white/[0.08] bg-[#0A0A0F] hover:border-white/[0.15]"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    goal === g ? "text-[#7C3AED]" : "text-[#8B8BA3]"
                  }`}
                >
                  {g === "fuerza" ? "Fuerza" : "Hipertrofia"}
                </span>
                <span className="mt-1 text-xs text-[#8B8BA3]">
                  {g === "fuerza" ? "3-6 reps, descanso largo" : "8-12 reps, descanso moderado"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
            Duracion (meses)
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value ? Number(e.target.value) : "")}
            placeholder="3"
            className="h-10 w-full max-w-[200px] rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
          />
        </div>
      </div>

      {/* Day columns */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Planificacion semanal</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map((day, dayIndex) => (
            <div
              key={day.key}
              className="rounded-2xl border border-white/[0.06] bg-[#12121A] overflow-hidden"
            >
              {/* Day header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <h4 className="text-sm font-semibold text-white">{day.label}</h4>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7C3AED]/10 px-1.5 text-xs font-bold text-[#7C3AED]">
                  {day.exercises.length}
                </span>
              </div>

              {/* Exercises */}
              <div className="px-4 py-3 space-y-3">
                {day.exercises.length === 0 && (
                  <p className="py-4 text-center text-xs text-[#8B8BA3]">Sin ejercicios</p>
                )}

                {day.exercises.map((exercise, exIndex) => (
                  <div
                    key={exIndex}
                    className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-3.5 space-y-3"
                  >
                    {/* Exercise name & remove */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#E8E8ED] leading-tight">
                        {exercise.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeExercise(dayIndex, exIndex)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Config fields */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Sets */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                          Series
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExerciseField(dayIndex, exIndex, "sets", Number(e.target.value) || 1)
                          }
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-xs text-white outline-none focus:border-[#00E5FF]/50"
                        />
                      </div>

                      {/* Reps Min */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                          Rep min
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={exercise.reps_min}
                          onChange={(e) =>
                            updateExerciseField(dayIndex, exIndex, "reps_min", Number(e.target.value) || 1)
                          }
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-xs text-white outline-none focus:border-[#00E5FF]/50"
                        />
                      </div>

                      {/* Reps Max */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                          Rep max
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={exercise.reps_max}
                          onChange={(e) =>
                            updateExerciseField(dayIndex, exIndex, "reps_max", Number(e.target.value) || 1)
                          }
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-xs text-white outline-none focus:border-[#00E5FF]/50"
                        />
                      </div>

                      {/* RIR */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                          RIR
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={exercise.rir}
                          onChange={(e) =>
                            updateExerciseField(dayIndex, exIndex, "rir", Number(e.target.value) || 0)
                          }
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-xs text-white outline-none focus:border-[#00E5FF]/50"
                        />
                      </div>

                      {/* Weight */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={exercise.weight_kg}
                          onChange={(e) =>
                            updateExerciseField(
                              dayIndex,
                              exIndex,
                              "weight_kg",
                              e.target.value ? Number(e.target.value) : ""
                            )
                          }
                          placeholder="—"
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-xs text-white placeholder:text-[#8B8BA3] outline-none focus:border-[#00E5FF]/50"
                        />
                      </div>

                      {/* Rest */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                          Desc. (s)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={exercise.rest_s}
                          onChange={(e) =>
                            updateExerciseField(dayIndex, exIndex, "rest_s", Number(e.target.value) || 0)
                          }
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-xs text-white outline-none focus:border-[#00E5FF]/50"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add exercise button */}
                <button
                  type="button"
                  onClick={() => setSearchModalDayIndex(dayIndex)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-xs font-medium text-[#8B8BA3] transition-all hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 hover:text-[#7C3AED]"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Anadir ejercicio
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSend}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#7C3AED]/90 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Enviar al cliente
            </>
          )}
        </button>
      </div>

      {/* Exercise search modal */}
      {searchModalDayIndex !== null && (
        <ExerciseSearchModal
          exercises={exercises}
          onSelect={(exercise) => addExercise(searchModalDayIndex, exercise)}
          onClose={() => setSearchModalDayIndex(null)}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */

export default function TrainerRoutinesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState("");

  // Data
  const [routines, setRoutines] = useState<RoutineRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [showCreator, setShowCreator] = useState(false);

  const loadData = useCallback(async () => {
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

      setTrainerId(user.id);

      const [routinesRes, tcRes, exercisesRes] = await Promise.all([
        supabase
          .from("user_routines")
          .select("id, title, name, goal, duration_months, is_active, sent_at, created_at, user_id")
          .eq("trainer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("trainer_clients")
          .select("client_id")
          .eq("trainer_id", user.id)
          .eq("status", "active"),
        supabase
          .from("exercises")
          .select("id, name, muscle_group, category")
          .order("name"),
      ]);

      // Fetch profiles separately
      const clientIds = (tcRes.data ?? []).map((r) => r.client_id);
      const routineUserIds = (routinesRes.data ?? []).map((r) => r.user_id).filter(Boolean);
      const allUserIds = [...new Set([...clientIds, ...routineUserIds])];

      const { data: profileRows } = allUserIds.length > 0
        ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", allUserIds)
        : { data: [] };

      const profileMap = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

      // Normalize routines
      const normalizedRoutines: RoutineRow[] = (routinesRes.data ?? []).map((row) => ({
        id: row.id as string,
        title: (row.title as string) || (row.name as string) || "Sin titulo",
        goal: row.goal as string | null,
        duration_months: row.duration_months as number | null,
        is_active: row.is_active as boolean,
        sent_at: row.sent_at as string | null,
        created_at: row.created_at as string,
        client_name: profileMap.get(row.user_id as string)?.full_name ?? null,
      }));

      // Normalize clients
      const normalizedClients: ClientOption[] = clientIds.map((client_id) => {
        const p = profileMap.get(client_id);
        return {
          client_id,
          full_name: p?.full_name ?? null,
          email: p?.email ?? null,
        };
      });

      setRoutines(normalizedRoutines);
      setClients(normalizedClients);
      setExercises((exercisesRes.data as ExerciseItem[]) ?? []);
    } catch {
      setError("Error inesperado al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoutineCreated = () => {
    setShowCreator(false);
    setLoading(true);
    loadData();
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
      </div>
    );
  }

  if (showCreator) {
    return (
      <RoutineCreator
        clients={clients}
        exercises={exercises}
        trainerId={trainerId}
        onCreated={handleRoutineCreated}
        onCancel={() => setShowCreator(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Rutinas</h1>
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#7C3AED]/10 px-2 text-xs font-bold text-[#7C3AED]">
            {routines.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowCreator(true)}
          className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#7C3AED]/90 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva rutina
        </button>
      </div>

      {/* Routines list */}
      {routines.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0L22 16.5l-9.75 5.25L2.25 16.5l4.179-2.25" />
            </svg>
          }
          title="Aun no tienes rutinas creadas"
          description="Crea tu primera rutina de entrenamiento para tus clientes"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#12121A]">
          {/* Table header */}
          <div className="hidden border-b border-white/[0.06] px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
            <div className="col-span-3 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Titulo
            </div>
            <div className="col-span-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Cliente
            </div>
            <div className="col-span-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Objetivo
            </div>
            <div className="col-span-1 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Meses
            </div>
            <div className="col-span-1 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Estado
            </div>
            <div className="col-span-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Enviado
            </div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="border-b border-white/[0.04] px-6 py-4 last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
            >
              <div className="col-span-3">
                <p className="text-sm font-medium text-white truncate">{routine.title}</p>
              </div>
              <div className="col-span-2 mt-1 sm:mt-0">
                <p className="text-sm text-[#E8E8ED] truncate">
                  {routine.client_name ?? "Sin cliente"}
                </p>
              </div>
              <div className="col-span-2 mt-1 sm:mt-0">
                <p className="text-sm text-[#8B8BA3]">
                  {routine.goal === "fuerza"
                    ? "Fuerza"
                    : routine.goal === "hipertrofia"
                    ? "Hipertrofia"
                    : routine.goal ?? "—"}
                </p>
              </div>
              <div className="col-span-1 mt-1 sm:mt-0">
                <p className="text-sm text-[#E8E8ED]">{routine.duration_months ?? "—"}</p>
              </div>
              <div className="col-span-1 mt-1 sm:mt-0">
                <ActiveBadge active={routine.is_active} />
              </div>
              <div className="col-span-2 mt-1 sm:mt-0">
                <p className="text-sm text-[#8B8BA3]">
                  {routine.sent_at ? formatDate(routine.sent_at) : "No enviada"}
                </p>
              </div>
              <div className="col-span-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
