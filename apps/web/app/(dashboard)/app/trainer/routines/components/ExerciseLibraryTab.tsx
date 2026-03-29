"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

/* ─────────────────────────────────────────
   Types
   ───────────────────────────────────────── */

interface Exercise {
  id: string;
  trainer_id: string | null;
  name: string;
  description: string | null;
  muscle_groups: string[] | null;
  secondary_muscles: string[] | null;
  category: string | null;
  video_url: string | null;
  is_global: boolean;
  created_at: string;
  _is_hidden?: boolean;
}

interface ExerciseFormData {
  name: string;
  description: string;
  primary_muscles: string;
  secondary_muscles: string;
  category: string;
  video_url: string;
}

const EMPTY_FORM: ExerciseFormData = {
  name: "",
  description: "",
  primary_muscles: "",
  secondary_muscles: "",
  category: "",
  video_url: "",
};

const OWNERSHIP_FILTERS: { value: "todos" | "global" | "propio"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "global", label: "Global" },
  { value: "propio", label: "Propio" },
];

/* ─────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────── */

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <span className="inline-flex items-center rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#00E5FF] uppercase tracking-[0.15em]">
      {label}
    </span>
  );
}

function OwnershipBadge({ isGlobal }: { isGlobal: boolean }) {
  return isGlobal ? (
    <span className="inline-flex items-center rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#00E5FF] uppercase tracking-[0.15em]">
      Global
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#7C3AED] uppercase tracking-[0.15em]">
      Propio
    </span>
  );
}

function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4 transition-all duration-200 hover:border-white/[0.1]">
      {exercise.video_url ? (
        <div className="mb-3 flex h-36 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] transition-colors group-hover:bg-white/[0.12]">
            <svg className="h-6 w-6 text-[#8B8BA3] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2 tracking-[-0.01em]">
          {exercise.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
            title={exercise.is_global ? "Personalizar ejercicio" : "Editar ejercicio"}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
            title={exercise.is_global ? "Ocultar ejercicio" : "Eliminar ejercicio"}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {exercise.description && (
        <p className="mt-1.5 text-[12px] text-[#8B8BA3] line-clamp-2 leading-relaxed">
          {exercise.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={exercise.category} />
        <OwnershipBadge isGlobal={exercise.is_global} />
      </div>

      {((exercise.muscle_groups?.length ?? 0) > 0 || (exercise.secondary_muscles?.length ?? 0) > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(exercise.muscle_groups ?? []).map((m) => (
            <span key={m} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#E8E8ED]">
              {m}
            </span>
          ))}
          {(exercise.secondary_muscles ?? []).map((m) => (
            <span key={m} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#8B8BA3]">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseFormModal({
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[18px] border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">Ejercicio</p>
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white border border-white/[0.08]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Nombre <span className="text-[#FF1744]">*</span>
            </label>
            <input type="text" value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Ej: Press de banca" className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Descripción</label>
            <textarea value={form.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Describe el ejercicio, técnica, consejos..." rows={3} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors resize-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Categoría</label>
            <input type="text" value={form.category} onChange={(e) => onChange({ category: e.target.value })} placeholder="Ej: Pecho, Espalda, Pierna, Bíceps..." className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors" />
            <p className="mt-1 text-[11px] text-[#5A5A72]">Texto libre — usa lo que tenga sentido para ti</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Músculos principales</label>
            <input type="text" value={form.primary_muscles} onChange={(e) => onChange({ primary_muscles: e.target.value })} placeholder="Ej: Pectoral mayor, Deltoides anterior" className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors" />
            <p className="mt-1 text-[11px] text-[#5A5A72]">Separados por comas (opcional)</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Músculos secundarios</label>
            <input type="text" value={form.secondary_muscles} onChange={(e) => onChange({ secondary_muscles: e.target.value })} placeholder="Ej: Tríceps, Serrato anterior" className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors" />
            <p className="mt-1 text-[11px] text-[#5A5A72]">Separados por comas (opcional)</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">URL de video</label>
            <input type="url" value={form.video_url} onChange={(e) => onChange({ video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors" />
            <p className="mt-1 text-[11px] text-[#5A5A72]">YouTube o Vimeo (opcional)</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="border border-white/[0.1] text-[#8B8BA3] rounded-xl px-4 py-2 text-[13px] hover:border-white/[0.18] hover:text-white transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={onSave} disabled={saving || !form.name.trim()} className="bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-50">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                Guardando...
              </span>
            ) : "Guardar ejercicio"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  isOpen,
  exerciseName,
  isGlobal,
  deleting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  exerciseName: string;
  isGlobal: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-[18px] border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF1744]/10 ring-1 ring-[#FF1744]/20">
            <svg className="h-6 w-6 text-[#FF1744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-white">
              {isGlobal ? "Ocultar ejercicio" : "Eliminar ejercicio"}
            </h3>
            <p className="mt-1.5 text-[13px] text-[#8B8BA3]">
              {isGlobal ? (
                <>¿Ocultar <span className="font-semibold text-white">{exerciseName}</span>? Solo desaparecerá de tu vista.</>
              ) : (
                <>¿Eliminar <span className="font-semibold text-white">{exerciseName}</span>? Esta acción no se puede deshacer.</>
              )}
            </p>
          </div>
          <div className="flex w-full gap-3">
            <button type="button" onClick={onCancel} disabled={deleting} className="flex-1 border border-white/[0.1] text-[#8B8BA3] rounded-xl px-4 py-2 text-[13px] hover:border-white/[0.18] hover:text-white transition-all disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} disabled={deleting} className="flex-1 rounded-xl bg-[#FF1744] px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-[#FF1744]/90 hover:shadow-[0_0_20px_rgba(255,23,68,0.3)] disabled:opacity-50">
              {deleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Eliminando...
                </span>
              ) : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Tab Component
   ───────────────────────────────────────── */

export default function ExerciseLibraryTab() {
  const [userId, setUserId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<"todos" | "global" | "propio">("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadExercises = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("No se pudo obtener la sesión del usuario.");
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const [exResult, ovResult] = await Promise.all([
        supabase
          .from("trainer_exercise_library")
          .select("*")
          .or(`is_global.eq.true,trainer_id.eq.${user.id}`)
          .order("name", { ascending: true }),
        supabase
          .from("trainer_exercise_overrides")
          .select("exercise_id, hidden")
          .eq("trainer_id", user.id)
          .eq("hidden", true),
      ]);

      if (exResult.error) {
        console.error("[ExerciseLibraryTab] Error al cargar ejercicios:", exResult.error.message);
        setError("Error al cargar los ejercicios.");
        setLoading(false);
        return;
      }

      const hiddenIds = new Set((ovResult.data ?? []).map((ov: { exercise_id: string }) => ov.exercise_id));
      const merged = (exResult.data ?? []).map((ex: Exercise) => ({ ...ex, _is_hidden: hiddenIds.has(ex.id) }));
      setExercises(merged as Exercise[]);
    } catch {
      setError("Error inesperado al cargar los ejercicios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const filteredExercises = useMemo(() => {
    let result = exercises.filter((ex) => !ex._is_hidden);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ex) => ex.name.toLowerCase().includes(q));
    }
    if (ownershipFilter === "global") result = result.filter((ex) => ex.is_global);
    else if (ownershipFilter === "propio") result = result.filter((ex) => !ex.is_global);
    return result;
  }, [exercises, search, ownershipFilter]);

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
      primary_muscles: (exercise.muscle_groups ?? []).join(", "),
      secondary_muscles: (exercise.secondary_muscles ?? []).join(", "),
      category: exercise.category ?? "",
      video_url: exercise.video_url ?? "",
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingExercise(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !userId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        muscle_groups: form.primary_muscles.split(",").map((s) => s.trim()).filter(Boolean),
        secondary_muscles: form.secondary_muscles.split(",").map((s) => s.trim()).filter(Boolean),
        category: form.category.trim() || null,
        video_url: form.video_url.trim() || null,
      };

      if (editingExercise) {
        if (editingExercise.is_global) {
          const { error: cloneError } = await supabase.from("trainer_exercise_library").insert({ ...payload, trainer_id: userId, is_global: false });
          if (cloneError) {
            toast.error("Error al crear tu versión del ejercicio");
            console.error("[ExerciseLibraryTab] Error al clonar global:", cloneError.message);
            setSaving(false);
            return;
          }
          const { error: ovError } = await supabase.from("trainer_exercise_overrides").upsert({ trainer_id: userId, exercise_id: editingExercise.id, hidden: true }, { onConflict: "trainer_id,exercise_id" });
          if (ovError) {
            toast.error("Error al ocultar el ejercicio global");
            console.error("[ExerciseLibraryTab] Error al ocultar global:", ovError.message);
            setSaving(false);
            return;
          }
        } else {
          const { error: updateError } = await supabase.from("trainer_exercise_library").update(payload).eq("id", editingExercise.id).eq("trainer_id", userId);
          if (updateError) {
            toast.error("Error al actualizar el ejercicio");
            console.error("[ExerciseLibraryTab] Error al actualizar:", updateError.message);
            setSaving(false);
            return;
          }
        }
      } else {
        const { error: insertError } = await supabase.from("trainer_exercise_library").insert({ ...payload, trainer_id: userId, is_global: false });
        if (insertError) {
          toast.error("Error al crear el ejercicio");
          console.error("[ExerciseLibraryTab] Error al insertar:", insertError.message);
          setSaving(false);
          return;
        }
      }

      toast.success(editingExercise ? "Ejercicio actualizado" : "Ejercicio creado");
      closeModal();
      setLoading(true);
      setError(null);
      await loadExercises();
    } catch {
      toast.error("Error inesperado al guardar el ejercicio");
    } finally {
      setSaving(false);
    }
  }, [form, userId, editingExercise, closeModal, loadExercises]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      if (deleteTarget.is_global) {
        const { error: ovError } = await supabase.from("trainer_exercise_overrides").upsert({ trainer_id: userId, exercise_id: deleteTarget.id, hidden: true }, { onConflict: "trainer_id,exercise_id" });
        if (ovError) {
          toast.error("Error al ocultar el ejercicio");
          console.error("[ExerciseLibraryTab] Error al ocultar:", ovError.message);
          setDeleting(false);
          return;
        }
      } else {
        const { error: deleteError } = await supabase.from("trainer_exercise_library").delete().eq("id", deleteTarget.id).eq("trainer_id", userId);
        if (deleteError) {
          toast.error("Error al eliminar el ejercicio");
          console.error("[ExerciseLibraryTab] Error al eliminar:", deleteError.message);
          setDeleting(false);
          return;
        }
      }
      toast.success(deleteTarget.is_global ? "Ejercicio ocultado" : "Ejercicio eliminado");
      setDeleteTarget(null);
      setLoading(true);
      setError(null);
      await loadExercises();
    } catch {
      toast.error("Error inesperado al eliminar el ejercicio");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, userId, loadExercises]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-3">
          <p className="text-[13px] text-[#FF1744]">{error}</p>
          <button type="button" onClick={() => setError(null)} className="rounded-lg p-1 text-[#FF1744] transition-colors hover:bg-[#FF1744]/10">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search + pills — always on the same row */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative w-full max-w-xs shrink-0">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar ejercicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl pl-10 pr-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {OWNERSHIP_FILTERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOwnershipFilter(opt.value)}
                className={ownershipFilter === opt.value
                  ? "rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/25 text-[#00E5FF] text-[11px] font-bold px-3 py-1.5 transition-all whitespace-nowrap"
                  : "rounded-full border border-white/[0.08] text-[#8B8BA3] text-[11px] px-3 py-1.5 hover:border-white/[0.16] hover:text-white transition-all whitespace-nowrap"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir ejercicio
        </button>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[#5A5A72]">
          {filteredExercises.length} ejercicio{filteredExercises.length !== 1 ? "s" : ""}
        </span>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-1.5 text-[10px] font-bold text-[#00E5FF]">
          {filteredExercises.length}
        </span>
      </div>

      {/* Grid */}
      {filteredExercises.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-white">Sin ejercicios</p>
          <p className="text-[12px] text-[#5A5A72] text-center max-w-[200px]">
            {search.trim() ? "No se encontraron ejercicios" : "Añade ejercicios a tu biblioteca"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => openEditModal(exercise)}
              onDelete={() => setDeleteTarget(exercise)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ExerciseFormModal
        isOpen={modalOpen}
        title={editingExercise ? (editingExercise.is_global ? "Personalizar ejercicio" : "Editar ejercicio") : "Nuevo ejercicio"}
        form={form}
        saving={saving}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSave={handleSave}
        onClose={closeModal}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        exerciseName={deleteTarget?.name ?? ""}
        isGlobal={deleteTarget?.is_global ?? false}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
