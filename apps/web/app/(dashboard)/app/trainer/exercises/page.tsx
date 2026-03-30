"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Exercise, ExerciseFormData, OWNERSHIP_FILTERS, EMPTY_FORM } from "./components/types";
import { SearchIcon, PlusIcon, XIcon, DumbbellIcon } from "./components/Icons";
import { PillFilter } from "./components/Shared";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExerciseFormModal } from "./components/ExerciseFormModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

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
  const [ownershipFilter, setOwnershipFilter] = useState<"todos" | "global" | "propio">("todos");

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

      // Load exercises + overrides in parallel
      const [exResult, ovResult] = await Promise.all([
        supabase
          .from("trainer_exercise_library")
          .select("id, trainer_id, name, description, muscle_groups, secondary_muscles, category, video_url, is_global, created_at")
          .or(`is_global.eq.true,trainer_id.eq.${user.id}`)
          .order("name", { ascending: true }),
        supabase
          .from("trainer_exercise_overrides")
          .select("exercise_id, hidden")
          .eq("trainer_id", user.id)
          .eq("hidden", true),
      ]);

      if (exResult.error) {
        setError("Error al cargar los ejercicios.");
        setLoading(false);
        return;
      }

      // Build set of hidden global exercise IDs
      const hiddenIds = new Set(
        (ovResult.data ?? []).map((ov: { exercise_id: string }) => ov.exercise_id)
      );

      // Mark hidden exercises
      const merged = (exResult.data ?? []).map((ex: Exercise) => ({
        ...ex,
        _is_hidden: hiddenIds.has(ex.id),
      }));

      setExercises(merged as Exercise[]);
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
    // Filter out hidden exercises (globals that this trainer has "deleted")
    let result = exercises.filter((ex) => !ex._is_hidden);

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ex) => ex.name.toLowerCase().includes(q));
    }

    // Ownership filter
    if (ownershipFilter === "global") {
      result = result.filter((ex) => ex.is_global);
    } else if (ownershipFilter === "propio") {
      result = result.filter((ex) => !ex.is_global);
    }

    return result;
  }, [exercises, search, ownershipFilter]);

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

  const updateForm = useCallback((patch: Partial<ExerciseFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !userId) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const exercisePayload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        muscle_groups: form.primary_muscles.split(",").map((s) => s.trim()).filter(Boolean),
        secondary_muscles: form.secondary_muscles.split(",").map((s) => s.trim()).filter(Boolean),
        category: form.category.trim() || null,
        video_url: form.video_url.trim() || null,
      };

      if (editingExercise) {
        if (editingExercise.is_global) {
          // Editing a GLOBAL → clone as private + hide original
          // 1. Create private copy with trainer's changes
          const { error: cloneError } = await supabase
            .from("trainer_exercise_library")
            .insert({
              ...exercisePayload,
              trainer_id: userId,
              is_global: false,
            });

          if (cloneError) {
            setError("Error al crear tu versión: " + cloneError.message);
            setSaving(false);
            return;
          }

          // 2. Hide the original global for this trainer
          const { error: ovError } = await supabase
            .from("trainer_exercise_overrides")
            .upsert(
              {
                trainer_id: userId,
                exercise_id: editingExercise.id,
                hidden: true,
              },
              { onConflict: "trainer_id,exercise_id" }
            );

          if (ovError) {
            setError("Error al ocultar el global: " + ovError.message);
            setSaving(false);
            return;
          }
        } else {
          // Editing an OWN exercise → direct update
          const { error: updateError } = await supabase
            .from("trainer_exercise_library")
            .update(exercisePayload)
            .eq("id", editingExercise.id)
            .eq("trainer_id", userId);

          if (updateError) {
            setError("Error al actualizar el ejercicio: " + updateError.message);
            setSaving(false);
            return;
          }
        }
      } else {
        // Creating a NEW own exercise
        const { error: insertError } = await supabase
          .from("trainer_exercise_library")
          .insert({
            ...exercisePayload,
            trainer_id: userId,
            is_global: false,
          });

        if (insertError) {
          setError("Error al crear el ejercicio: " + insertError.message);
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

      if (deleteTarget.is_global) {
        // "Delete" a GLOBAL exercise → hide it via override (only for this trainer)
        const { error: ovError } = await supabase
          .from("trainer_exercise_overrides")
          .upsert(
            {
              trainer_id: userId,
              exercise_id: deleteTarget.id,
              hidden: true,
            },
            { onConflict: "trainer_id,exercise_id" }
          );

        if (ovError) {
          setError("Error al ocultar el ejercicio: " + ovError.message);
          setDeleting(false);
          return;
        }
      } else {
        // Delete an OWN exercise → real delete
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
        <div className="rounded-[18px] border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-[13px] text-[#FF1744]">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            loadExercises();
          }}
          className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
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
    <>
      <style>{`
        @keyframes ex-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ex-in { animation: ex-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .ex-1  { animation-delay: 0.04s; }
        .ex-2  { animation-delay: 0.14s; }
        .ex-3  { animation-delay: 0.24s; }
      `}</style>

      <div className="space-y-6">
        {/* Inline error toast */}
        {error && exercises.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-3">
            <p className="text-[13px] text-[#FF1744]">{error}</p>
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
        <div className="ex-in ex-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">
              Entrenamiento
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">
                Biblioteca de Ejercicios
              </h1>
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2 text-[11px] font-bold text-[#00E5FF]">
                {filteredExercises.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
          >
            <PlusIcon className="h-4 w-4" />
            Añadir ejercicio
          </button>
        </div>

        {/* Search + Filters */}
        <div className="ex-in ex-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5A72]" />
            <input
              type="text"
              placeholder="Buscar ejercicio por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl pl-10 pr-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
            />
          </div>
          <PillFilter
            options={OWNERSHIP_FILTERS}
            value={ownershipFilter}
            onChange={setOwnershipFilter}
          />
        </div>

        {/* Exercise Grid */}
        <div className="ex-in ex-3">
          {filteredExercises.length === 0 ? (
            <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-12">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
                  <DumbbellIcon className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-semibold text-white">
                  {search.trim() || ownershipFilter !== "todos"
                    ? "No se encontraron ejercicios"
                    : "Aun no hay ejercicios"}
                </p>
                <p className="text-[12px] text-[#5A5A72] text-center">
                  {search.trim() || ownershipFilter !== "todos"
                    ? "Prueba ajustar los filtros de busqueda"
                    : "Crea tu primer ejercicio para empezar a construir tu biblioteca"}
                </p>
                {!search.trim() && ownershipFilter === "todos" && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-2 inline-flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Añadir ejercicio
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
                  onEdit={() => openEditModal(exercise)}
                  onDelete={() => setDeleteTarget(exercise)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        <ExerciseFormModal
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
          isGlobal={deleteTarget?.is_global ?? false}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </>
  );
}
