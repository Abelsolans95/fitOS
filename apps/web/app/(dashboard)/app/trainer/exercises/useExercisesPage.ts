"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Exercise, ExerciseFormData } from "./components/types";
import { EMPTY_FORM } from "./components/types";

const PAGE_SIZE = 50;
const EXERCISE_COLS = "id, trainer_id, name, description, muscle_groups, secondary_muscles, category, video_url, is_global, created_at";

export function useExercisesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<"todos" | "global" | "propio">("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load overrides ──
  const loadOverrides = useCallback(async (supabase: ReturnType<typeof createClient>, trainerId: string) => {
    const { data, error } = await supabase
      .from("trainer_exercise_overrides")
      .select("exercise_id, hidden")
      .eq("trainer_id", trainerId)
      .eq("hidden", true);
    if (error) { console.error("[useExercisesPage] Error loading overrides:", error); }

    return new Set((data ?? []).map((ov: { exercise_id: string }) => ov.exercise_id));
  }, []);

  // ── Fetch exercises (paginated or search) — matches food library pattern ──
  const fetchExercises = useCallback(async (
    opts?: { append?: boolean; offset?: number; searchQuery?: string }
  ) => {
    if (!userId) return;
    const { append = false, offset = 0, searchQuery } = opts ?? {};
    const isSearch = typeof searchQuery === "string" && searchQuery.trim().length > 0;

    if (append) setLoadingMore(true);

    try {
      const supabase = createClient();
      let query = supabase
        .from("trainer_exercise_library")
        .select(EXERCISE_COLS)
        .or(`is_global.eq.true,trainer_id.eq.${userId}`)
        .order("name", { ascending: true });

      if (isSearch) {
        query = query.ilike("name", `%${searchQuery!.trim()}%`);
      } else {
        query = query.range(offset, offset + PAGE_SIZE - 1);
      }

      const { data, error: qError } = await query;

      if (qError) {
        setError("Error al cargar los ejercicios.");
        return;
      }

      const rows = (data ?? []) as Exercise[];
      const more = !isSearch && rows.length === PAGE_SIZE;

      if (append) {
        setExercises((prev) => [...prev, ...rows]);
      } else {
        setExercises(rows);
      }
      setHasMore(more);
    } catch {
      setError("Error inesperado al cargar los ejercicios.");
    } finally {
      setLoadingMore(false);
    }
  }, [userId]);

  // ── Init — load overrides + first page inline ──
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("No se pudo obtener la sesion del usuario.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const [hidden, exercisesRes] = await Promise.all([
        loadOverrides(supabase, user.id),
        supabase
          .from("trainer_exercise_library")
          .select(EXERCISE_COLS)
          .or(`is_global.eq.true,trainer_id.eq.${user.id}`)
          .order("name", { ascending: true })
          .range(0, PAGE_SIZE - 1),
      ]);

      setHiddenIds(hidden);

      if (exercisesRes.error) {
        setError("Error al cargar los ejercicios.");
        setLoading(false);
        return;
      }

      const rows = (exercisesRes.data ?? []) as Exercise[];
      setExercises(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    };
    init();
  }, []);

  // ── Search with debounce — matches food library pattern exactly ──
  useEffect(() => {
    if (!userId) return;

    if (!search.trim()) {
      // Reset to paginated view (replaces current data with first 50)
      fetchExercises();
      return;
    }

    const timer = setTimeout(() => {
      fetchExercises({ searchQuery: search });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, userId]);

  // ── Load more ──
  const handleLoadMore = useCallback(() => {
    if (!userId || loadingMore || !hasMore) return;
    fetchExercises({ append: true, offset: exercises.length });
  }, [userId, loadingMore, hasMore, exercises.length, fetchExercises]);

  // ── Filtered exercises (client-side ownership filter + hidden) ──
  const filteredExercises = useMemo(() => {
    let result = exercises.filter((ex) => !hiddenIds.has(ex.id) && !ex._is_hidden);
    if (ownershipFilter === "global") result = result.filter((ex) => ex.is_global);
    else if (ownershipFilter === "propio") result = result.filter((ex) => !ex.is_global);
    return result;
  }, [exercises, ownershipFilter, hiddenIds]);

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
      setError(null);
      // Reload overrides + exercises
      const supabase2 = createClient();
      const hidden = await loadOverrides(supabase2, userId);
      setHiddenIds(hidden);
      await fetchExercises({ searchQuery: search.trim() || undefined });
    } catch {
      setError("Error inesperado al guardar el ejercicio.");
    } finally {
      setSaving(false);
    }
  }, [form, userId, editingExercise, closeModal, fetchExercises, loadOverrides, search]);

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
      setError(null);
      const supabase2 = createClient();
      const hidden = await loadOverrides(supabase2, userId);
      setHiddenIds(hidden);
      await fetchExercises({ searchQuery: search.trim() || undefined });
    } catch {
      setError("Error inesperado al eliminar el ejercicio.");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, userId, fetchExercises, loadOverrides, search]);

  return {
    loading, loadingMore, hasMore, error, setError,
    search, setSearch,
    ownershipFilter, setOwnershipFilter,
    filteredExercises,
    modalOpen, editingExercise, form, saving,
    openCreateModal, openEditModal, closeModal, updateForm, handleSave,
    deleteTarget, setDeleteTarget, deleting, handleDelete,
    handleLoadMore,
  };
}
