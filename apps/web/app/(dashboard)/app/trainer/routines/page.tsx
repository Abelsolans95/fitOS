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

interface SetConfig {
  reps_min: number;
  reps_max: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
}

interface RoutineExercise {
  exercise_id: string;
  name: string;
  scheme: string; // auto-generated
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_pause_sets: number;
  rir: number;
  target_weight: number | null;
  rest_s: number;
  progression_rule: string;
  coach_notes: string;
  order: number;
  mode: "equal" | "different";
  sets_config: SetConfig[];
}

interface TrainingDay {
  key: string;
  label: string;
  dayLabel: string;
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

const DAYS_OF_WEEK = [
  { label: "Lunes", key: "lunes", short: "L" },
  { label: "Martes", key: "martes", short: "M" },
  { label: "Miércoles", key: "miercoles", short: "X" },
  { label: "Jueves", key: "jueves", short: "J" },
  { label: "Viernes", key: "viernes", short: "V" },
  { label: "Sábado", key: "sabado", short: "S" },
  { label: "Domingo", key: "domingo", short: "D" },
];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function buildScheme(ex: RoutineExercise): string {
  if (ex.mode === "different" && ex.sets_config.length > 0) {
    const allReps = ex.sets_config.flatMap((s) => [s.reps_min, s.reps_max]);
    const minReps = Math.min(...allReps);
    const maxReps = Math.max(...allReps);
    return `${ex.sets_config.length}x${minReps}-${maxReps}`;
  }
  if (ex.reps_min === ex.reps_max) return `${ex.sets}x${ex.reps_min}`;
  return `${ex.sets}x${ex.reps_min}-${ex.reps_max}`;
}

function makeDefaultSetConfig(ex: RoutineExercise): SetConfig {
  return {
    reps_min: ex.reps_min,
    reps_max: ex.reps_max,
    rir: ex.rir,
    target_weight: ex.target_weight,
    rest_s: ex.rest_s,
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getWeekDates(
  startDate: Date,
  weekNumber: number,
  selectedDays: string[]
): { day: string; date: string }[] {
  const dayMap: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    domingo: 0,
  };

  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

  return selectedDays.map((dayKey) => {
    const targetDow = dayMap[dayKey];
    const currentDow = weekStart.getDay();
    let diff = targetDow - currentDow;
    if (diff < 0) diff += 7;
    const date = new Date(weekStart);
    date.setDate(date.getDate() + diff);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return { day: dayKey, date: `${dd}/${mm}` };
  });
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00C853]/20 bg-[#00C853]/10 px-2.5 py-1 text-[10px] font-bold text-[#00C853]">
      Activa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-[#5A5A72]">
      Inactiva
    </span>
  );
}

/* ── Exercise Search Modal ── */

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
      <div className="mx-4 w-full max-w-md rounded-[18px] border border-white/[0.06] bg-[#12121A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-[13px] font-semibold text-white">Añadir ejercicio</h3>
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
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] pl-10 pr-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto px-3 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <p className="text-[13px] text-[#8B8BA3]">No se encontraron ejercicios</p>
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
                    <p className="truncate text-[13px] font-medium text-white">{exercise.name}</p>
                    <p className="text-[11px] text-[#8B8BA3]">
                      {[exercise.muscle_group, exercise.category].filter(Boolean).join(" · ") || "Sin categoría"}
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
   Routine Creator — Multi-step
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
  const [step, setStep] = useState(1);

  // Step 1: Basic info
  const [selectedClientId, setSelectedClientId] = useState("");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState<"fuerza" | "hipertrofia">("hipertrofia");
  const [mesocycleWeeks, setMesocycleWeeks] = useState(4);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    // Next Monday
    const day = d.getDay();
    const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  });

  // Step 2: Day selection
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayLabels, setDayLabels] = useState<Record<string, string>>({});

  // Step 3: Exercises per day
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [searchModalDayKey, setSearchModalDayKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview week dates
  const weekDates = useMemo(() => {
    if (selectedDays.length === 0) return [];
    return getWeekDates(new Date(startDate), 1, selectedDays);
  }, [startDate, selectedDays]);

  // Initialize training days when moving to step 3
  const initTrainingDays = () => {
    setTrainingDays(
      selectedDays.map((key) => {
        const dayInfo = DAYS_OF_WEEK.find((d) => d.key === key);
        return {
          key,
          label: dayInfo?.label ?? key,
          dayLabel: dayLabels[key] || "",
          exercises: [],
        };
      })
    );
  };

  const toggleDay = (key: string) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const addExercise = (dayKey: string, exercise: ExerciseItem) => {
    setTrainingDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const isFuerza = goal === "fuerza";
        const newEx: RoutineExercise = {
          exercise_id: exercise.id,
          name: exercise.name,
          scheme: isFuerza ? "4x3-6" : "3x8-12",
          sets: isFuerza ? 4 : 3,
          reps_min: isFuerza ? 3 : 8,
          reps_max: isFuerza ? 6 : 12,
          rest_pause_sets: 0,
          rir: isFuerza ? 2 : 1,
          target_weight: null,
          rest_s: isFuerza ? 180 : 90,
          progression_rule: "",
          coach_notes: "",
          order: d.exercises.length,
          mode: "equal",
          sets_config: [],
        };
        return { ...d, exercises: [...d.exercises, newEx] };
      })
    );
  };

  const updateExercise = (
    dayKey: string,
    exIndex: number,
    updates: Partial<RoutineExercise>
  ) => {
    setTrainingDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        return {
          ...d,
          exercises: d.exercises.map((e, i) => {
            if (i !== exIndex) return e;
            const updated = { ...e, ...updates };

            // When switching to "different" mode, initialize sets_config
            if (updates.mode === "different" && e.mode !== "different") {
              const count = updated.sets || 3;
              updated.sets = count;
              updated.sets_config = Array.from({ length: count }, () =>
                makeDefaultSetConfig(updated)
              );
            }

            // When switching back to "equal", clear sets_config
            if (updates.mode === "equal") {
              updated.sets_config = [];
            }

            // When sets count changes in "different" mode, resize sets_config
            if (
              updates.sets !== undefined &&
              updated.mode === "different"
            ) {
              const newCount = updates.sets;
              const current = updated.sets_config;
              if (newCount > current.length) {
                const fill = Array.from({ length: newCount - current.length }, () =>
                  makeDefaultSetConfig(updated)
                );
                updated.sets_config = [...current, ...fill];
              } else {
                updated.sets_config = current.slice(0, newCount);
              }
            }

            return updated;
          }),
        };
      })
    );
  };

  const updateSetConfig = (
    dayKey: string,
    exIndex: number,
    setIndex: number,
    updates: Partial<SetConfig>
  ) => {
    setTrainingDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        return {
          ...d,
          exercises: d.exercises.map((e, i) => {
            if (i !== exIndex) return e;
            const newConfig = e.sets_config.map((sc, si) =>
              si === setIndex ? { ...sc, ...updates } : sc
            );
            return { ...e, sets_config: newConfig };
          }),
        };
      })
    );
  };

  const removeExercise = (dayKey: string, exIndex: number) => {
    setTrainingDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        return {
          ...d,
          exercises: d.exercises
            .filter((_, i) => i !== exIndex)
            .map((e, i) => ({ ...e, order: i })),
        };
      })
    );
  };

  const moveExercise = (dayKey: string, exIndex: number, direction: -1 | 1) => {
    setTrainingDays((prev) =>
      prev.map((d) => {
        if (d.key !== dayKey) return d;
        const newIndex = exIndex + direction;
        if (newIndex < 0 || newIndex >= d.exercises.length) return d;
        const exercises = [...d.exercises];
        [exercises[exIndex], exercises[newIndex]] = [exercises[newIndex], exercises[exIndex]];
        return { ...d, exercises: exercises.map((e, i) => ({ ...e, order: i })) };
      })
    );
  };

  const handleSave = async () => {
    if (!selectedClientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!title.trim()) {
      toast.error("Escribe un título para la rutina");
      return;
    }
    const hasExercises = trainingDays.some((d) => d.exercises.length > 0);
    if (!hasExercises) {
      toast.error("Añade al menos un ejercicio");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Build flat exercises array with day_of_week
      const flatExercises = trainingDays.flatMap((day) =>
        day.exercises.map((ex) => {
          const scheme = buildScheme(ex);
          const sets = ex.mode === "different" ? ex.sets_config.length : ex.sets;
          // For top-level fields, use first set's values in "different" mode for client compat
          const firstSet = ex.mode === "different" && ex.sets_config[0];
          return {
            exercise_id: ex.exercise_id,
            name: ex.name,
            day_of_week: day.key,
            day_label: day.dayLabel || day.label,
            scheme,
            sets,
            reps_min: firstSet ? firstSet.reps_min : ex.reps_min,
            reps_max: firstSet ? firstSet.reps_max : ex.reps_max,
            rest_pause_sets: ex.rest_pause_sets,
            rir: firstSet ? firstSet.rir : ex.rir,
            target_weight: firstSet ? firstSet.target_weight : ex.target_weight,
            weight_kg: (firstSet ? firstSet.target_weight : ex.target_weight) ?? 0,
            rest_s: firstSet ? firstSet.rest_s : ex.rest_s,
            progression_rule: ex.progression_rule,
            coach_notes: ex.coach_notes,
            order: ex.order,
            week_of_month: 1,
            sets_config: ex.mode === "different" ? ex.sets_config : undefined,
          };
        })
      );

      const routineData = {
        trainer_id: trainerId,
        client_id: selectedClientId,
        title,
        goal,
        duration_months: Math.max(1, Math.ceil(mesocycleWeeks / 4)),
        exercises: flatExercises,
        equipment_detected: [] as string[],
        source: "trainer" as const,
        is_active: true,
        sent_at: new Date(startDate).toISOString(),
      };

      // Deactivate previous routines for this client
      await supabase
        .from("user_routines")
        .update({ is_active: false })
        .eq("client_id", selectedClientId)
        .eq("is_active", true);

      const { error } = await supabase.from("user_routines").insert(routineData);

      if (error) {
        console.error("Error inserting routine:", JSON.stringify(error, null, 2));
        toast.error(`Error: ${error.message || error.details || "Error al guardar la rutina"}`);
        setSaving(false);
        return;
      }

      toast.success("Rutina enviada al cliente");
      onCreated();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const totalSets = (dayKey: string) => {
    const day = trainingDays.find((d) => d.key === dayKey);
    if (!day) return 0;
    return day.exercises.reduce(
      (sum, ex) => sum + ex.sets + ex.rest_pause_sets,
      0
    );
  };

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-[13px] text-[#8B8BA3] transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a rutinas
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === s
                  ? "bg-[#00E5FF] text-[#0A0A0F]"
                  : step > s
                  ? "bg-[#00E5FF]/20 text-[#00E5FF]"
                  : "bg-white/[0.06] text-[#5A5A72]"
              }`}
            >
              {step > s ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`h-px w-12 ${
                  step > s ? "bg-[#00E5FF]/40" : "bg-white/[0.06]"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-[13px] text-[#8B8BA3]">
          {step === 1
            ? "Configuración"
            : step === 2
            ? "Días de entrenamiento"
            : "Ejercicios"}
        </span>
      </div>

      {/* ── STEP 1: Basic Info ── */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Configurar mesociclo</h2>

          <div className="rounded-[18px] border border-white/[0.06] bg-[#12121A] p-6 space-y-5">
            {/* Client */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
                Cliente
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
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
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
                Título del bloque
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Mesociclo Hipertrofia — Pierna/Torso"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
              />
            </div>

            {/* Goal */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
                Objetivo
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["fuerza", "hipertrofia"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      goal === g
                        ? "border-[#00E5FF]/40 bg-[#00E5FF]/5"
                        : "border-white/[0.08] bg-[#0A0A0F] hover:border-white/[0.15]"
                    }`}
                  >
                    <span
                      className={`text-[13px] font-semibold ${
                        goal === g ? "text-[#00E5FF]" : "text-[#8B8BA3]"
                      }`}
                    >
                      {g === "fuerza" ? "Fuerza" : "Hipertrofia"}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#5A5A72]">
                      {g === "fuerza" ? "3-6 reps · descanso largo" : "8-12 reps · descanso moderado"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration & Start */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
                  Semanas del bloque
                </label>
                <select
                  value={mesocycleWeeks}
                  onChange={(e) => setMesocycleWeeks(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      {w} semana{w > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedClientId || !title.trim()}
              className="flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-40"
            >
              Siguiente
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Day Selection ── */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Días de entrenamiento</h2>
          <p className="text-[13px] text-[#8B8BA3]">
            Selecciona los días y asigna un nombre a cada sesión (ej: PIERNA, TORSO, FULL BODY).
          </p>

          {/* Week preview with dates */}
          {weekDates.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
                Semana 1 — Vista previa
              </p>
              <div className="flex flex-wrap gap-2">
                {weekDates.map((wd) => {
                  const dayInfo = DAYS_OF_WEEK.find((d) => d.key === wd.day);
                  return (
                    <div
                      key={wd.day}
                      className="flex items-center gap-2 rounded-lg bg-[#00E5FF]/5 px-3 py-1.5"
                    >
                      <span className="text-[11px] font-bold text-[#00E5FF]">
                        {dayInfo?.short}
                      </span>
                      <span className="text-[11px] text-[#8B8BA3]">{wd.date}</span>
                      {dayLabels[wd.day] && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00E5FF]/60">
                          {dayLabels[wd.day]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.key);
              return (
                <div
                  key={day.key}
                  className={`rounded-[18px] border p-4 transition-all ${
                    isSelected
                      ? "border-[#00E5FF]/30 bg-[#00E5FF]/5"
                      : "border-white/[0.06] bg-[#12121A]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold transition-all ${
                          isSelected
                            ? "bg-[#00E5FF] text-[#0A0A0F]"
                            : "bg-white/[0.06] text-[#5A5A72]"
                        }`}
                      >
                        {day.short}
                      </div>
                      <span
                        className={`text-[13px] font-medium ${
                          isSelected ? "text-white" : "text-[#8B8BA3]"
                        }`}
                      >
                        {day.label}
                      </span>
                    </button>
                  </div>

                  {isSelected && (
                    <input
                      type="text"
                      placeholder="Nombre de sesión (ej: PIERNA)"
                      value={dayLabels[day.key] || ""}
                      onChange={(e) =>
                        setDayLabels((prev) => ({
                          ...prev,
                          [day.key]: e.target.value.toUpperCase(),
                        }))
                      }
                      className="mt-3 h-9 w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00E5FF] placeholder:text-[#5A5A72] placeholder:normal-case placeholder:tracking-normal outline-none transition-colors focus:border-[#00E5FF]/40"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-white/[0.1] text-[#8B8BA3] rounded-xl px-5 py-2.5 text-[13px] font-medium hover:border-white/[0.18] hover:bg-white/[0.04] hover:text-white transition-all"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => {
                initTrainingDays();
                setStep(3);
              }}
              disabled={selectedDays.length === 0}
              className="flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-40"
            >
              Siguiente
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Exercises per Day ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Ejercicios por día</h2>
            <span className="text-[11px] text-[#5A5A72]">
              {mesocycleWeeks} sem · {selectedDays.length} días/sem
            </span>
          </div>

          {trainingDays.map((day) => {
            const dayInfo = DAYS_OF_WEEK.find((d) => d.key === day.key);
            const dateStr = weekDates.find((wd) => wd.day === day.key)?.date;

            return (
              <div
                key={day.key}
                className="rounded-[18px] border border-white/[0.06] bg-[#12121A] overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00E5FF]/10">
                      <span className="text-[11px] font-bold text-[#00E5FF]">
                        {dayInfo?.short}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">
                          {day.dayLabel || day.label}
                        </span>
                        {dateStr && (
                          <span className="text-[11px] text-[#5A5A72]">{dateStr}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#5A5A72]">
                        {day.exercises.length} ejercicios · {totalSets(day.key)} series totales
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exercises table */}
                <div className="px-4 py-3 space-y-3">
                  {day.exercises.length === 0 && (
                    <p className="py-6 text-center text-[11px] text-[#5A5A72]">
                      Sin ejercicios — añade el primero
                    </p>
                  )}

                  {day.exercises.map((exercise, exIndex) => (
                    <div
                      key={`${exercise.exercise_id}-${exIndex}`}
                      className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4 space-y-3"
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                            {exIndex + 1}
                          </span>
                          <p className="text-[13px] font-medium text-white">{exercise.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveExercise(day.key, exIndex, -1)}
                            disabled={exIndex === 0}
                            className="flex h-6 w-6 items-center justify-center rounded text-[#5A5A72] transition-colors hover:text-white disabled:opacity-30"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveExercise(day.key, exIndex, 1)}
                            disabled={exIndex === day.exercises.length - 1}
                            className="flex h-6 w-6 items-center justify-center rounded text-[#5A5A72] transition-colors hover:text-white disabled:opacity-30"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExercise(day.key, exIndex)}
                            className="flex h-6 w-6 items-center justify-center rounded text-[#5A5A72] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Mode toggle */}
                      <div className="flex overflow-hidden rounded-lg border border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => updateExercise(day.key, exIndex, { mode: "equal" })}
                          className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors ${
                            exercise.mode === "equal"
                              ? "bg-[#00E5FF] text-[#0A0A0F]"
                              : "text-[#5A5A72] hover:text-white"
                          }`}
                        >
                          Todas las series igual
                        </button>
                        <button
                          type="button"
                          onClick={() => updateExercise(day.key, exIndex, { mode: "different" })}
                          className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors ${
                            exercise.mode === "different"
                              ? "bg-[#00E5FF] text-[#0A0A0F]"
                              : "text-[#5A5A72] hover:text-white"
                          }`}
                        >
                          Series diferentes
                        </button>
                      </div>

                      {/* Esquema auto-generado */}
                      {(exercise.mode === "equal" || exercise.sets_config.length > 0) && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Esquema:</span>
                          <span className="text-[11px] font-bold text-[#00E5FF]">{buildScheme(exercise)}</span>
                        </div>
                      )}

                      {/* EQUAL MODE — single config for all sets */}
                      {exercise.mode === "equal" && (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {/* Series */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Series</label>
                            <input
                              type="number" min={1} max={20}
                              value={exercise.sets}
                              onChange={(e) => updateExercise(day.key, exIndex, { sets: Number(e.target.value) || 1 })}
                              className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                            />
                          </div>
                          {/* Reps min */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps mín</label>
                            <input
                              type="number" min={1}
                              value={exercise.reps_min}
                              onChange={(e) => updateExercise(day.key, exIndex, { reps_min: Number(e.target.value) || 1 })}
                              className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                            />
                          </div>
                          {/* Reps max */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps máx</label>
                            <input
                              type="number" min={1}
                              value={exercise.reps_max}
                              onChange={(e) => updateExercise(day.key, exIndex, { reps_max: Number(e.target.value) || 1 })}
                              className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                            />
                          </div>
                          {/* RIR */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">RIR</label>
                            <input
                              type="number" min={0} max={5}
                              value={exercise.rir}
                              onChange={(e) => updateExercise(day.key, exIndex, { rir: Number(e.target.value) || 0 })}
                              className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                            />
                          </div>
                          {/* Weight */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Carga (kg)</label>
                            <input
                              type="number" min={0} step={0.5}
                              value={exercise.target_weight ?? ""}
                              onChange={(e) => updateExercise(day.key, exIndex, { target_weight: e.target.value ? Number(e.target.value) : null })}
                              placeholder="—"
                              className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
                            />
                          </div>
                          {/* Rest */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Desc. (s)</label>
                            <input
                              type="number" min={0} step={15}
                              value={exercise.rest_s}
                              onChange={(e) => updateExercise(day.key, exIndex, { rest_s: Number(e.target.value) || 0 })}
                              className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                            />
                          </div>
                        </div>
                      )}

                      {/* DIFFERENT MODE — sets count + per-set config */}
                      {exercise.mode === "different" && (
                        <div className="space-y-2">
                          {/* Sets count input */}
                          <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72] whitespace-nowrap">
                              Número de series
                            </label>
                            <input
                              type="number" min={1} max={20}
                              value={exercise.sets}
                              onChange={(e) => updateExercise(day.key, exIndex, { sets: Math.max(1, Number(e.target.value) || 1) })}
                              className="h-7 w-16 rounded-lg border border-white/[0.08] bg-[#12121A] px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                            />
                          </div>

                          {/* Per-set rows */}
                          {exercise.sets_config.length > 0 && (
                            <div className="space-y-1.5">
                              {/* Header */}
                              <div className="grid grid-cols-6 gap-1.5 px-1">
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Serie</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps mín</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Reps máx</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">RIR</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Carga (kg)</span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Desc. (s)</span>
                              </div>
                              {exercise.sets_config.map((sc, setIdx) => (
                                <div key={setIdx} className="grid grid-cols-6 gap-1.5 rounded-lg bg-white/[0.02] px-1 py-1.5">
                                  <div className="flex items-center">
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
                                      {setIdx + 1}
                                    </span>
                                  </div>
                                  <input
                                    type="number" min={1}
                                    value={sc.reps_min}
                                    onChange={(e) => updateSetConfig(day.key, exIndex, setIdx, { reps_min: Number(e.target.value) || 1 })}
                                    className="h-7 w-full rounded border border-white/[0.06] bg-[#12121A] px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                                  />
                                  <input
                                    type="number" min={1}
                                    value={sc.reps_max}
                                    onChange={(e) => updateSetConfig(day.key, exIndex, setIdx, { reps_max: Number(e.target.value) || 1 })}
                                    className="h-7 w-full rounded border border-white/[0.06] bg-[#12121A] px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                                  />
                                  <input
                                    type="number" min={0} max={5}
                                    value={sc.rir}
                                    onChange={(e) => updateSetConfig(day.key, exIndex, setIdx, { rir: Number(e.target.value) || 0 })}
                                    className="h-7 w-full rounded border border-white/[0.06] bg-[#12121A] px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                                  />
                                  <input
                                    type="number" min={0} step={0.5}
                                    value={sc.target_weight ?? ""}
                                    onChange={(e) => updateSetConfig(day.key, exIndex, setIdx, { target_weight: e.target.value ? Number(e.target.value) : null })}
                                    placeholder="—"
                                    className="h-7 w-full rounded border border-white/[0.06] bg-[#12121A] px-1 text-center text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
                                  />
                                  <input
                                    type="number" min={0} step={15}
                                    value={sc.rest_s}
                                    onChange={(e) => updateSetConfig(day.key, exIndex, setIdx, { rest_s: Number(e.target.value) || 0 })}
                                    className="h-7 w-full rounded border border-white/[0.06] bg-[#12121A] px-1 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progression Rule */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                          Cómo progresar
                        </label>
                        <input
                          type="text"
                          value={exercise.progression_rule}
                          onChange={(e) =>
                            updateExercise(day.key, exIndex, {
                              progression_rule: e.target.value,
                            })
                          }
                          placeholder="Ej: Al llegar a 12 en la 1ª, añadir mínima carga posible"
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-3 text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
                        />
                      </div>

                      {/* Coach Notes */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                          Notas coach
                        </label>
                        <input
                          type="text"
                          value={exercise.coach_notes}
                          onChange={(e) =>
                            updateExercise(day.key, exIndex, {
                              coach_notes: e.target.value,
                            })
                          }
                          placeholder="Instrucciones técnicas para el cliente"
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12121A] px-3 text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add exercise button */}
                  <button
                    type="button"
                    onClick={() => setSearchModalDayKey(day.key)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-[11px] font-medium text-[#8B8BA3] transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5 hover:text-[#00E5FF]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Añadir ejercicio
                  </button>
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="border border-white/[0.1] text-[#8B8BA3] rounded-xl px-5 py-2.5 text-[13px] font-medium hover:border-white/[0.18] hover:bg-white/[0.04] hover:text-white transition-all"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
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
        </div>
      )}

      {/* Exercise search modal */}
      {searchModalDayKey !== null && (
        <ExerciseSearchModal
          exercises={exercises}
          onSelect={(exercise) => addExercise(searchModalDayKey, exercise)}
          onClose={() => setSearchModalDayKey(null)}
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
        setError("No se pudo obtener la sesión del usuario.");
        setLoading(false);
        return;
      }

      setTrainerId(user.id);

      const [routinesRes, tcRes, exercisesRes] = await Promise.all([
        supabase
          .from("user_routines")
          .select("id, title, goal, duration_months, is_active, sent_at, created_at, client_id")
          .eq("trainer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("trainer_clients")
          .select("client_id")
          .eq("trainer_id", user.id)
          .eq("status", "active"),
        supabase
          .from("trainer_exercise_library")
          .select("id, name, muscle_group:muscle_groups, category")
          .or(`is_global.eq.true,trainer_id.eq.${user.id}`)
          .order("name"),
      ]);

      // Fetch profiles separately (no FK between trainer_clients and profiles)
      const clientIds = (tcRes.data ?? []).map((r) => r.client_id);
      const routineClientIds = (routinesRes.data ?? [])
        .map((r) => r.client_id)
        .filter(Boolean);
      const allUserIds = [...new Set([...clientIds, ...routineClientIds])];

      const { data: profileRows } =
        allUserIds.length > 0
          ? await supabase
              .from("profiles")
              .select("user_id, full_name, email")
              .in("user_id", allUserIds)
          : { data: [] };

      const profileMap = new Map(
        (profileRows ?? []).map((p) => [p.user_id, p])
      );

      const normalizedRoutines: RoutineRow[] = (routinesRes.data ?? []).map(
        (row) => ({
          id: row.id as string,
          title: (row.title as string) || "Sin título",
          goal: row.goal as string | null,
          duration_months: row.duration_months as number | null,
          is_active: row.is_active as boolean,
          sent_at: row.sent_at as string | null,
          created_at: row.created_at as string,
          client_name:
            profileMap.get(row.client_id as string)?.full_name ?? null,
        })
      );

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
      // Normalize exercise items — muscle_groups is TEXT[] in DB
      setExercises(
        (exercisesRes.data ?? []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          name: e.name as string,
          muscle_group: Array.isArray(e.muscle_group)
            ? (e.muscle_group as string[]).join(", ")
            : (e.muscle_group as string) ?? null,
          category: (e.category as string) ?? null,
        }))
      );
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
        <div className="rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/05 px-4 py-3">
          <p className="text-[13px] text-[#FF1744]">{error}</p>
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
    <>
      <style>{`
        @keyframes pg-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .pg-in { animation: pg-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .pg-1 { animation-delay: 0.04s; }
        .pg-2 { animation-delay: 0.14s; }
        .pg-3 { animation-delay: 0.24s; }
        .pg-4 { animation-delay: 0.34s; }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="pg-in pg-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">
              Entrenamiento
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">Rutinas</h1>
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#00E5FF]/10 px-2 text-[11px] font-bold text-[#00E5FF]">
                {routines.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
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
            Nuevo mesociclo
          </button>
        </div>

        {/* Routines list */}
        <div className="pg-in pg-2">
          {routines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
                <svg
                  className="h-6 w-6"
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
              <p className="text-[14px] font-semibold text-white">
                Aún no tienes rutinas creadas
              </p>
              <p className="text-[12px] text-[#5A5A72] text-center max-w-[200px]">
                Crea tu primer mesociclo de entrenamiento
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#12121A]">
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #00E5FF, transparent)" }} />
              <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#00E5FF] opacity-[0.04] blur-[40px]" />

              {/* Table header */}
              <div className="hidden border-b border-white/[0.06] px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                <div className="col-span-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Título
                </div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Cliente
                </div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Objetivo
                </div>
                <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Meses
                </div>
                <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Estado
                </div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Enviado
                </div>
                <div className="col-span-1" />
              </div>

              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="border-b border-white/[0.04] px-6 py-4 last:border-b-0 hover:bg-white/[0.025] transition-colors sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  <div className="col-span-3">
                    <p className="truncate text-[13px] font-medium text-white">
                      {routine.title}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <p className="truncate text-[13px] text-[#8B8BA3]">
                      {routine.client_name ?? "Sin cliente"}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <p className="text-[13px] text-[#8B8BA3]">
                      {routine.goal === "fuerza"
                        ? "Fuerza"
                        : routine.goal === "hipertrofia"
                        ? "Hipertrofia"
                        : routine.goal ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-1 mt-1 sm:mt-0">
                    <p className="text-[13px] text-[#8B8BA3]">
                      {routine.duration_months ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-1 mt-1 sm:mt-0">
                    <ActiveBadge active={routine.is_active} />
                  </div>
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <p className="text-[13px] text-[#5A5A72]">
                      {routine.sent_at ? formatDate(routine.sent_at) : "No enviada"}
                    </p>
                  </div>
                  <div className="col-span-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
