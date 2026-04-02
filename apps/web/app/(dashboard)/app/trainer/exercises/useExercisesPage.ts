"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Exercise, ExerciseFormData } from "./components/types";
import { EMPTY_FORM } from "./components/types";

export function useExercisesPage() {
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
        setError("No se pudo obtener la sesion del usuario.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

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

      const hiddenIds = new Set(
        (ovResult.data ?? []).map((ov: { exercise_id: string }) => ov.exercise_id)
      );

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
          const { error: cloneError } = await supabase
            .from("trainer_exercise_library")
            .insert({ ...exercisePayload, trainer_id: userId, is_global: false });
          if (cloneError) { setError("Error al crear tu versión: " + cloneError.message); setSaving(false); return; }

          const { error: ovError } = await supabase
            .from("trainer_exercise_overrides")
            .upsert({ trainer_id: userId, exercise_id: editingExercise.id, hidden: true }, { onConflict: "trainer_id,exercise_id" });
          if (ovError) { setError("Error al ocultar el global: " + ovError.message); setSaving(false); return; }
        } else {
          const { error: updateError } = await supabase
            .from("trainer_exercise_library")
            .update(exercisePayload)
            .eq("id", editingExercise.id)
            .eq("trainer_id", userId);
          if (updateError) { setError("Error al actualizar el ejercicio: " + updateError.message); setSaving(false); return; }
        }
      } else {
        const { error: insertError } = await supabase
          .from("trainer_exercise_library")
          .insert({ ...exercisePayload, trainer_id: userId, is_global: false });
        if (insertError) { setError("Error al crear el ejercicio: " + insertError.message); setSaving(false); return; }
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

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      if (deleteTarget.is_global) {
        const { error: ovError } = await supabase
          .from("trainer_exercise_overrides")
          .upsert({ trainer_id: userId, exercise_id: deleteTarget.id, hidden: true }, { onConflict: "trainer_id,exercise_id" });
        if (ovError) { setError("Error al ocultar el ejercicio: " + ovError.message); setDeleting(false); return; }
      } else {
        const { error: deleteError } = await supabase
          .from("trainer_exercise_library")
          .delete()
          .eq("id", deleteTarget.id)
          .eq("trainer_id", userId);
        if (deleteError) { setError("Error al eliminar el ejercicio."); setDeleting(false); return; }
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

  return {
    loading, error, setError, loadExercises,
    search, setSearch,
    ownershipFilter, setOwnershipFilter,
    filteredExercises,
    modalOpen, editingExercise, form, saving,
    openCreateModal, openEditModal, closeModal, updateForm, handleSave,
    deleteTarget, setDeleteTarget, deleting, handleDelete,
  };
}
