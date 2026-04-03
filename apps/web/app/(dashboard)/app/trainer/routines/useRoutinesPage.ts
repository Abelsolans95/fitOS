"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  type ClientOption,
  type ExerciseItem,
  type RoutineRow,
  type RoutineTemplate,
  type TemplateExercise,
  getWeekDates,
} from "./types";
import {
  routinesReducer,
  initialRoutinesState,
} from "./routines-reducer";
import { flattenExercisesForSave, buildTemplateExercises } from "./routines-helpers";

// Re-export types & state for backward compatibility with components that import from here
export type { RoutinesState, RoutinesAction } from "./routines-reducer";
export { routinesReducer, initialRoutinesState } from "./routines-reducer";

/* ────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────── */

export function useRoutinesPage() {
  const [state, dispatch] = useReducer(routinesReducer, initialRoutinesState);

  /* ── Load data ── */

  const loadData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        dispatch({ type: "SET_ERROR", error: "No se pudo obtener la sesión del usuario." });
        return;
      }

      const [routinesRes, tcRes, exercisesRes, templatesRes] = await Promise.all([
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
        supabase
          .from("routine_templates")
          .select("id, name, training_days, day_labels, exercises, total_weeks, goal, created_at")
          .eq("trainer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (routinesRes.error || tcRes.error) {
        console.error("[RoutinesPage] Error crítico al cargar datos:",
          routinesRes.error || tcRes.error);
        dispatch({
          type: "SET_ERROR",
          error: "Error al cargar los datos. Inténtalo de nuevo."
        });
        return;
      }

      if (exercisesRes.error) {
        console.error("[RoutinesPage] Error al cargar ejercicios:", exercisesRes.error);
        toast.error("Error al cargar la biblioteca de ejercicios");
        // No bloqueante — continuar sin ejercicios
      }

      if (templatesRes.error) {
        console.error("[RoutinesPage] Error al cargar plantillas:", templatesRes.error);
        // No bloqueante — continuar sin plantillas
      }

      const clientIds = (tcRes.data ?? []).map((r) => r.client_id);
      const routineClientIds = (routinesRes.data ?? [])
        .map((r) => r.client_id)
        .filter(Boolean);
      const allUserIds = [...new Set([...clientIds, ...routineClientIds])];

      const { data: profileRows, error: profilesErr } =
        allUserIds.length > 0
          ? await supabase
              .from("profiles")
              .select("user_id, full_name, email")
              .in("user_id", allUserIds)
          : { data: [], error: null };

      if (profilesErr) {
        console.error("[RoutinesPage] Error al cargar perfiles:", profilesErr);
      }

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

      const normalizedExercises: ExerciseItem[] = (exercisesRes.data ?? []).map(
        (e: Record<string, unknown>) => ({
          id: e.id as string,
          name: e.name as string,
          muscle_group: Array.isArray(e.muscle_group)
            ? (e.muscle_group as string[]).join(", ")
            : (e.muscle_group as string) ?? null,
          category: (e.category as string) ?? null,
        })
      );

      const normalizedTemplates: RoutineTemplate[] = (templatesRes.data ?? []).map(
        (t: Record<string, unknown>) => ({
          id: t.id as string,
          name: t.name as string,
          training_days: t.training_days as string[],
          day_labels: (t.day_labels as Record<string, string>) ?? {},
          exercises: (t.exercises as TemplateExercise[]) ?? [],
          total_weeks: (t.total_weeks as number) ?? 4,
          goal: (t.goal as string) ?? null,
          created_at: t.created_at as string,
        })
      );

      dispatch({
        type: "LOAD_DATA_SUCCESS",
        trainerId: user.id,
        routines: normalizedRoutines,
        clients: normalizedClients,
        exercises: normalizedExercises,
        templates: normalizedTemplates,
      });
    } catch {
      dispatch({ type: "SET_ERROR", error: "Error inesperado al cargar los datos." });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Computed ── */

  const weekDates = useMemo(() => {
    if (state.crSelectedDays.length === 0) return [];
    return getWeekDates(new Date(state.crStartDate), 1, state.crSelectedDays);
  }, [state.crStartDate, state.crSelectedDays]);

  const totalSets = useCallback(
    (dayKey: string) => {
      const day = state.crTrainingDays.find((d) => d.key === dayKey);
      if (!day) return 0;
      return day.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    },
    [state.crTrainingDays]
  );

  /* ── Save routine ── */

  const handleSave = useCallback(async () => {
    if (!state.crSelectedClientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!state.crTitle.trim()) {
      toast.error("Escribe un título para la rutina");
      return;
    }
    const hasExercises = state.crTrainingDays.some((d) => d.exercises.length > 0);
    if (!hasExercises) {
      toast.error("Añade al menos un ejercicio");
      return;
    }

    dispatch({ type: "CR_SET_SAVING", saving: true });
    try {
      const supabase = createClient();

      const flatExercises = flattenExercisesForSave(state.crTrainingDays);

      const routineData = {
        trainer_id: state.trainerId,
        client_id: state.crSelectedClientId,
        title: state.crTitle,
        goal: state.crGoal,
        duration_months: Math.max(1, Math.ceil(state.crMesocycleWeeks / 4)),
        total_weeks: state.crMesocycleWeeks,
        training_days: state.crSelectedDays,
        exercises: flatExercises,
        equipment_detected: [] as string[],
        source: "trainer" as const,
        is_active: true,
        sent_at: new Date(state.crStartDate).toISOString(),
      };

      // Deactivate previous routines for this client
      const { error: deactivateErr } = await supabase
        .from("user_routines")
        .update({ is_active: false })
        .eq("client_id", state.crSelectedClientId)
        .eq("is_active", true);

      if (deactivateErr) {
        console.error("[RoutinesPage] Error al desactivar rutinas anteriores:", deactivateErr);
        // No bloqueante — continuamos con la inserción
      }

      const { error } = await supabase.from("user_routines").insert(routineData);

      if (error) {
        console.error("[RoutinesPage] Error inserting routine:", JSON.stringify(error, null, 2));
        toast.error(`Error: ${error.message || error.details || "Error al guardar la rutina"}`);
        dispatch({ type: "CR_SET_SAVING", saving: false });
        return;
      }

      toast.success("Rutina enviada al cliente");
      dispatch({ type: "HIDE_CREATOR" });
      loadData();
    } catch {
      toast.error("Error inesperado");
      dispatch({ type: "CR_SET_SAVING", saving: false });
    }
  }, [
    state.crSelectedClientId,
    state.crTitle,
    state.crGoal,
    state.crMesocycleWeeks,
    state.crStartDate,
    state.crTrainingDays,
    state.trainerId,
    loadData,
  ]);

  /* ── Save template ── */

  const handleSaveTemplate = useCallback(async (templateName: string) => {
    if (!templateName.trim()) {
      toast.error("Escribe un nombre para la plantilla");
      return;
    }
    const hasExercises = state.crTrainingDays.some((d) => d.exercises.length > 0);
    if (!hasExercises) {
      toast.error("Añade al menos un ejercicio antes de guardar la plantilla");
      return;
    }

    dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: true });
    try {
      const supabase = createClient();

      const tplExercises = buildTemplateExercises(state.crTrainingDays);

      const { error } = await supabase.from("routine_templates").insert({
        trainer_id: state.trainerId,
        name: templateName.trim(),
        training_days: state.crSelectedDays,
        day_labels: state.crDayLabels,
        exercises: tplExercises,
        total_weeks: state.crMesocycleWeeks,
        goal: state.crGoal || null,
      });

      if (error) {
        console.error("[RoutinesPage] Error al guardar plantilla:", error);
        toast.error("Error al guardar la plantilla");
        dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
        return;
      }

      toast.success(`Plantilla "${templateName.trim()}" guardada`);
      dispatch({ type: "CR_SHOW_TEMPLATE_MODAL", show: false });
      dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
      // Reload to get the new template in the list
      loadData();
    } catch {
      toast.error("Error inesperado al guardar la plantilla");
      dispatch({ type: "CR_SET_SAVING_TEMPLATE", saving: false });
    }
  }, [
    state.crTrainingDays,
    state.crSelectedDays,
    state.crDayLabels,
    state.crMesocycleWeeks,
    state.crGoal,
    state.trainerId,
    loadData,
  ]);

  return {
    state,
    dispatch,
    weekDates,
    totalSets,
    handleSave,
    handleSaveTemplate,
  };
}
