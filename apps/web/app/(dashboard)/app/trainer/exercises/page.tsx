"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = "fuerza" | "hipertrofia" | "cardio" | "movilidad" | "core";
type Difficulty = "principiante" | "intermedio" | "avanzado";

interface Exercise {
  id: string;
  trainer_id: string | null;
  name: string;
  description: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
  category: Category;
  difficulty: Difficulty;
  video_url: string | null;
  is_global: boolean;
  created_at: string;
}

interface ExerciseFormData {
  name: string;
  description: string;
  primary_muscles: string;
  secondary_muscles: string;
  equipment: string;
  category: Category;
  difficulty: Difficulty;
  video_url: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: Category | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "fuerza", label: "Fuerza" },
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "cardio", label: "Cardio" },
  { value: "movilidad", label: "Movilidad" },
  { value: "core", label: "Core" },
];

const DIFFICULTIES: { value: Difficulty | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  fuerza: { bg: "bg-[#00E5FF]/10", text: "text-[#00E5FF]" },
  hipertrofia: { bg: "bg-[#7C3AED]/10", text: "text-[#7C3AED]" },
  cardio: { bg: "bg-[#FF1744]/10", text: "text-[#FF1744]" },
  movilidad: { bg: "bg-[#00C853]/10", text: "text-[#00C853]" },
  core: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]" },
};

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string }> = {
  principiante: { bg: "bg-[#00C853]/10", text: "text-[#00C853]" },
  intermedio: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]" },
  avanzado: { bg: "bg-[#FF1744]/10", text: "text-[#FF1744]" },
};

const EMPTY_FORM: ExerciseFormData = {
  name: "",
  description: "",
  primary_muscles: "",
  secondary_muscles: "",
  equipment: "",
  category: "fuerza",
  difficulty: "principiante",
  video_url: "",
};

// ---------------------------------------------------------------------------
// Helper: parse comma-separated string to trimmed array
// ---------------------------------------------------------------------------

function csvToArray(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
      />
    </svg>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const color = CATEGORY_COLORS[category];
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}
    >
      {label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const color = DIFFICULTY_COLORS[difficulty];
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}
    >
      {label}
    </span>
  );
}

function OwnershipBadge({ isGlobal }: { isGlobal: boolean }) {
  return isGlobal ? (
    <span className="inline-flex items-center rounded-full bg-[#8B8BA3]/10 px-2.5 py-0.5 text-xs font-medium text-[#8B8BA3]">
      Global
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED]">
      Propio
    </span>
  );
}

function PillFilter<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
              active
                ? "bg-[#00E5FF]/15 text-[#00E5FF] ring-1 ring-[#00E5FF]/30"
                : "bg-white/[0.04] text-[#8B8BA3] hover:bg-white/[0.08] hover:text-[#E8E8ED]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exercise Card
// ---------------------------------------------------------------------------

function ExerciseCard({
  exercise,
  isOwn,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 transition-all duration-200 hover:border-white/[0.1]">
      {/* Video thumbnail placeholder */}
      {exercise.video_url ? (
        <div className="mb-3 flex h-36 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] transition-colors group-hover:bg-white/[0.12]">
            <PlayIcon className="h-6 w-6 text-[#8B8BA3] ml-0.5" />
          </div>
        </div>
      ) : null}

      {/* Header: name + actions */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
          {exercise.name}
        </h3>
        {isOwn && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
              title="Editar ejercicio"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
              title="Eliminar ejercicio"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {exercise.description && (
        <p className="mt-1.5 text-xs text-[#8B8BA3] line-clamp-2 leading-relaxed">
          {exercise.description}
        </p>
      )}

      {/* Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={exercise.category} />
        <DifficultyBadge difficulty={exercise.difficulty} />
        <OwnershipBadge isGlobal={exercise.is_global} />
      </div>

      {/* Muscle groups */}
      {(exercise.primary_muscles?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {(exercise.primary_muscles ?? []).map((m) => (
            <span
              key={m}
              className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#E8E8ED]"
            >
              {m}
            </span>
          ))}
          {(exercise.secondary_muscles ?? []).map((m) => (
            <span
              key={m}
              className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#8B8BA3]"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Equipment */}
      {exercise.equipment?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {exercise.equipment.map((e) => (
            <span
              key={e}
              className="rounded-md border border-white/[0.06] px-2 py-0.5 text-[10px] text-[#8B8BA3]"
            >
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exercise Form Modal
// ---------------------------------------------------------------------------

function ExerciseModal({
  isOpen,
  title,
  form,
  saving,
  onChange,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  form: ExerciseFormData;
  saving: boolean;
  onChange: (patch: Partial<ExerciseFormData>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#12121A] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
              Nombre <span className="text-[#FF1744]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Ej: Press de banca"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
              Descripcion
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe el ejercicio, tecnica, consejos..."
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50 resize-none"
            />
          </div>

          {/* Category + Difficulty row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  onChange({ category: e.target.value as Category })
                }
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]/50 appearance-none cursor-pointer"
              >
                <option value="fuerza">Fuerza</option>
                <option value="hipertrofia">Hipertrofia</option>
                <option value="cardio">Cardio</option>
                <option value="movilidad">Movilidad</option>
                <option value="core">Core</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
                Dificultad
              </label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  onChange({ difficulty: e.target.value as Difficulty })
                }
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]/50 appearance-none cursor-pointer"
              >
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          {/* Primary muscles */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
              Musculos principales
            </label>
            <input
              type="text"
              value={form.primary_muscles}
              onChange={(e) => onChange({ primary_muscles: e.target.value })}
              placeholder="Ej: Pectoral mayor, Deltoides anterior"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
            <p className="mt-1 text-[11px] text-[#8B8BA3]">
              Separados por comas
            </p>
            {csvToArray(form.primary_muscles).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {csvToArray(form.primary_muscles).map((m) => (
                  <span
                    key={m}
                    className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#E8E8ED]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Secondary muscles */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
              Musculos secundarios
            </label>
            <input
              type="text"
              value={form.secondary_muscles}
              onChange={(e) => onChange({ secondary_muscles: e.target.value })}
              placeholder="Ej: Triceps, Serrato anterior"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
            <p className="mt-1 text-[11px] text-[#8B8BA3]">
              Separados por comas
            </p>
          </div>

          {/* Equipment */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
              Equipamiento
            </label>
            <input
              type="text"
              value={form.equipment}
              onChange={(e) => onChange({ equipment: e.target.value })}
              placeholder="Ej: Barra, Banco plano, Discos"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
            <p className="mt-1 text-[11px] text-[#8B8BA3]">
              Separados por comas
            </p>
          </div>

          {/* Video URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E8ED]">
              URL de video
            </label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => onChange({ video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
            <p className="mt-1 text-[11px] text-[#8B8BA3]">
              YouTube o Vimeo (opcional)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !form.name.trim()}
            className="rounded-xl bg-[#00E5FF] px-5 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                Guardando...
              </span>
            ) : (
              "Guardar ejercicio"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  isOpen,
  exerciseName,
  deleting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  exerciseName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#12121A] p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF1744]/10">
            <TrashIcon className="h-6 w-6 text-[#FF1744]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Eliminar ejercicio
            </h3>
            <p className="mt-1.5 text-sm text-[#8B8BA3]">
              Estas seguro de eliminar{" "}
              <span className="font-medium text-white">{exerciseName}</span>?
              Esta accion no se puede deshacer.
            </p>
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-[#E8E8ED] transition-colors hover:bg-white/[0.04] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 rounded-xl bg-[#FF1744] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#FF1744]/90 disabled:opacity-50"
            >
              {deleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Eliminando...
                </span>
              ) : (
                "Eliminar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TrainerExercisesPage() {
  // Auth
  const [userId, setUserId] = useState<string | null>(null);

  // Data
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "todos">(
    "todos"
  );
  const [difficultyFilter, setDifficultyFilter] = useState<
    Difficulty | "todos"
  >("todos");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Load exercises
  // ---------------------------------------------------------------------------

  const loadExercises = useCallback(async () => {
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
        .from("trainer_exercise_library")
        .select("*")
        .or(`is_global.eq.true,trainer_id.eq.${user.id}`)
        .order("name", { ascending: true });

      if (queryError) {
        setError("Error al cargar los ejercicios.");
        setLoading(false);
        return;
      }

      setExercises((data ?? []) as Exercise[]);
    } catch {
      setError("Error inesperado al cargar los ejercicios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // ---------------------------------------------------------------------------
  // Filtered exercises
  // ---------------------------------------------------------------------------

  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ex) => ex.name.toLowerCase().includes(q));
    }

    // Category filter
    if (categoryFilter !== "todos") {
      result = result.filter((ex) => ex.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== "todos") {
      result = result.filter((ex) => ex.difficulty === difficultyFilter);
    }

    return result;
  }, [exercises, search, categoryFilter, difficultyFilter]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = useCallback(() => {
    setEditingExercise(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((exercise: Exercise) => {
    setEditingExercise(exercise);
    setForm({
      name: exercise.name,
      description: exercise.description ?? "",
      primary_muscles: exercise.primary_muscles.join(", "),
      secondary_muscles: exercise.secondary_muscles.join(", "),
      equipment: exercise.equipment.join(", "),
      category: exercise.category,
      difficulty: exercise.difficulty,
      video_url: exercise.video_url ?? "",
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingExercise(null);
    setForm(EMPTY_FORM);
  }, []);

  const updateForm = useCallback((patch: Partial<ExerciseFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !userId) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        primary_muscles: csvToArray(form.primary_muscles),
        secondary_muscles: csvToArray(form.secondary_muscles),
        equipment: csvToArray(form.equipment),
        category: form.category,
        difficulty: form.difficulty,
        video_url: form.video_url.trim() || null,
        trainer_id: userId,
        is_global: false,
      };

      if (editingExercise) {
        // Update
        const { error: updateError } = await supabase
          .from("trainer_exercise_library")
          .update(payload)
          .eq("id", editingExercise.id)
          .eq("trainer_id", userId);

        if (updateError) {
          setError("Error al actualizar el ejercicio.");
          setSaving(false);
          return;
        }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from("trainer_exercise_library")
          .insert(payload);

        if (insertError) {
          setError("Error al crear el ejercicio.");
          setSaving(false);
          return;
        }
      }

      closeModal();
      setLoading(true);
      setError(null);
      await loadExercises();
    } catch {
      setError("Error inesperado al guardar el ejercicio.");
    } finally {
      setSaving(false);
    }
  }, [form, userId, editingExercise, closeModal, loadExercises]);

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;

    setDeleting(true);
    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("trainer_exercise_library")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("trainer_id", userId);

      if (deleteError) {
        setError("Error al eliminar el ejercicio.");
        setDeleting(false);
        return;
      }

      setDeleteTarget(null);
      setLoading(true);
      setError(null);
      await loadExercises();
    } catch {
      setError("Error inesperado al eliminar el ejercicio.");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, userId, loadExercises]);

  // ---------------------------------------------------------------------------
  // Render: Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Error (fatal)
  // ---------------------------------------------------------------------------

  if (error && exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            loadExercises();
          }}
          className="rounded-xl px-4 py-2 text-sm font-medium text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Page
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Inline error toast */}
      {error && exercises.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-3">
          <p className="text-sm text-[#FF1744]">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-lg p-1 text-[#FF1744] transition-colors hover:bg-[#FF1744]/10"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">
            Biblioteca de Ejercicios
          </h1>
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#00E5FF]/10 px-2 text-xs font-bold text-[#00E5FF]">
            {filteredExercises.length}
          </span>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
        >
          <PlusIcon className="h-4 w-4" />
          Anadir ejercicio
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8BA3]" />
        <input
          type="text"
          placeholder="Buscar ejercicio por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#12121A] pl-10 pr-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
            Categoria
          </p>
          <PillFilter
            options={CATEGORIES}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
            Dificultad
          </p>
          <PillFilter
            options={DIFFICULTIES}
            value={difficultyFilter}
            onChange={setDifficultyFilter}
          />
        </div>
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
              <DumbbellIcon className="h-7 w-7 text-[#8B8BA3]" />
            </div>
            <p className="text-sm font-medium text-white">
              {search.trim() ||
              categoryFilter !== "todos" ||
              difficultyFilter !== "todos"
                ? "No se encontraron ejercicios"
                : "Aun no hay ejercicios"}
            </p>
            <p className="text-xs text-[#8B8BA3]">
              {search.trim() ||
              categoryFilter !== "todos" ||
              difficultyFilter !== "todos"
                ? "Prueba ajustar los filtros de busqueda"
                : "Crea tu primer ejercicio para empezar a construir tu biblioteca"}
            </p>
            {!search.trim() &&
              categoryFilter === "todos" &&
              difficultyFilter === "todos" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90"
                >
                  <PlusIcon className="h-4 w-4" />
                  Anadir ejercicio
                </button>
              )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isOwn={exercise.trainer_id === userId}
              onEdit={() => openEditModal(exercise)}
              onDelete={() => setDeleteTarget(exercise)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ExerciseModal
        isOpen={modalOpen}
        title={editingExercise ? "Editar ejercicio" : "Nuevo ejercicio"}
        form={form}
        saving={saving}
        onChange={updateForm}
        onSave={handleSave}
        onClose={closeModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        exerciseName={deleteTarget?.name ?? ""}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
