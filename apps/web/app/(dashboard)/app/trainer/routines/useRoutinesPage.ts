"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  type ClientOption,
  type ExerciseItem,
  type RoutineRow,
  type RoutineExercise,
  type TrainingDay,
  type SetConfig,
  DAYS_OF_WEEK,
  buildScheme,
  makeDefaultSetConfig,
  getWeekDates,
} from "./types";

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface RoutinesState {
  /* Page */
  loading: boolean;
  error: string | null;
  trainerId: string;
  routines: RoutineRow[];
  clients: ClientOption[];
  exercises: ExerciseItem[];
  showCreator: boolean;
  /* Creator */
  step: 1 | 2 | 3;
  crSelectedClientId: string;
  crTitle: string;
  crGoal: "fuerza" | "hipertrofia";
  crMesocycleWeeks: number;
  crStartDate: string;
  crSelectedDays: string[];
  crDayLabels: Record<string, string>;
  crTrainingDays: TrainingDay[];
  crSearchModalDayKey: string | null;
  crSaving: boolean;
}

function getDefaultStartDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

const initialState: RoutinesState = {
  loading: true,
  error: null,
  trainerId: "",
  routines: [],
  clients: [],
  exercises: [],
  showCreator: false,

  step: 1,
  crSelectedClientId: "",
  crTitle: "",
  crGoal: "hipertrofia",
  crMesocycleWeeks: 4,
  crStartDate: getDefaultStartDate(),
  crSelectedDays: [],
  crDayLabels: {},
  crTrainingDays: [],
  crSearchModalDayKey: null,
  crSaving: false,
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type RoutinesAction =
  /* Page */
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | {
      type: "LOAD_DATA_SUCCESS";
      trainerId: string;
      routines: RoutineRow[];
      clients: ClientOption[];
      exercises: ExerciseItem[];
    }
  | { type: "SHOW_CREATOR" }
  | { type: "HIDE_CREATOR" }
  /* Creator nav */
  | { type: "SET_STEP"; step: 1 | 2 | 3 }
  | { type: "INIT_TRAINING_DAYS" }
  /* Creator step 1 */
  | { type: "CR_SET_CLIENT"; clientId: string }
  | { type: "CR_SET_TITLE"; title: string }
  | { type: "CR_SET_GOAL"; goal: "fuerza" | "hipertrofia" }
  | { type: "CR_SET_WEEKS"; weeks: number }
  | { type: "CR_SET_START_DATE"; date: string }
  /* Creator step 2 */
  | { type: "CR_TOGGLE_DAY"; key: string }
  | { type: "CR_SET_DAY_LABEL"; key: string; label: string }
  /* Creator step 3 */
  | { type: "CR_OPEN_SEARCH_MODAL"; dayKey: string }
  | { type: "CR_CLOSE_SEARCH_MODAL" }
  | { type: "CR_ADD_EXERCISE"; dayKey: string; exercise: ExerciseItem }
  | {
      type: "CR_UPDATE_EXERCISE";
      dayKey: string;
      exIndex: number;
      updates: Partial<RoutineExercise>;
    }
  | {
      type: "CR_UPDATE_SET_CONFIG";
      dayKey: string;
      exIndex: number;
      setIndex: number;
      updates: Partial<SetConfig>;
    }
  | { type: "CR_REMOVE_EXERCISE"; dayKey: string; exIndex: number }
  | { type: "CR_MOVE_EXERCISE"; dayKey: string; exIndex: number; direction: -1 | 1 }
  | { type: "CR_SET_SAVING"; saving: boolean };

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

function routinesReducer(state: RoutinesState, action: RoutinesAction): RoutinesState {
  switch (action.type) {
    /* ── Page ── */
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "LOAD_DATA_SUCCESS":
      return {
        ...state,
        trainerId: action.trainerId,
        routines: action.routines,
        clients: action.clients,
        exercises: action.exercises,
        loading: false,
        error: null,
      };
    case "SHOW_CREATOR":
      return { ...state, showCreator: true };
    case "HIDE_CREATOR":
      return {
        ...state,
        showCreator: false,
        step: 1,
        crSelectedClientId: "",
        crTitle: "",
        crGoal: "hipertrofia",
        crMesocycleWeeks: 4,
        crStartDate: getDefaultStartDate(),
        crSelectedDays: [],
        crDayLabels: {},
        crTrainingDays: [],
        crSearchModalDayKey: null,
        crSaving: false,
      };

    /* ── Creator nav ── */
    case "SET_STEP":
      return { ...state, step: action.step };
    case "INIT_TRAINING_DAYS":
      return {
        ...state,
        crTrainingDays: state.crSelectedDays.map((key) => {
          const dayInfo = DAYS_OF_WEEK.find((d) => d.key === key);
          return {
            key,
            label: dayInfo?.label ?? key,
            dayLabel: state.crDayLabels[key] || "",
            exercises: [],
          };
        }),
      };

    /* ── Creator step 1 ── */
    case "CR_SET_CLIENT":
      return { ...state, crSelectedClientId: action.clientId };
    case "CR_SET_TITLE":
      return { ...state, crTitle: action.title };
    case "CR_SET_GOAL":
      return { ...state, crGoal: action.goal };
    case "CR_SET_WEEKS":
      return { ...state, crMesocycleWeeks: action.weeks };
    case "CR_SET_START_DATE":
      return { ...state, crStartDate: action.date };

    /* ── Creator step 2 ── */
    case "CR_TOGGLE_DAY": {
      const prev = state.crSelectedDays;
      const next = prev.includes(action.key)
        ? prev.filter((d) => d !== action.key)
        : [...prev, action.key];
      return { ...state, crSelectedDays: next };
    }
    case "CR_SET_DAY_LABEL":
      return {
        ...state,
        crDayLabels: { ...state.crDayLabels, [action.key]: action.label },
      };

    /* ── Creator step 3 ── */
    case "CR_OPEN_SEARCH_MODAL":
      return { ...state, crSearchModalDayKey: action.dayKey };
    case "CR_CLOSE_SEARCH_MODAL":
      return { ...state, crSearchModalDayKey: null };

    case "CR_ADD_EXERCISE": {
      const isFuerza = state.crGoal === "fuerza";
      const newEx: RoutineExercise = {
        exercise_id: action.exercise.id,
        name: action.exercise.name,
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
        order: 0,
        mode: "equal",
        sets_config: [],
      };
      return {
        ...state,
        crTrainingDays: state.crTrainingDays.map((d) => {
          if (d.key !== action.dayKey) return d;
          return {
            ...d,
            exercises: [...d.exercises, { ...newEx, order: d.exercises.length }],
          };
        }),
      };
    }

    case "CR_UPDATE_EXERCISE":
      return {
        ...state,
        crTrainingDays: state.crTrainingDays.map((d) => {
          if (d.key !== action.dayKey) return d;
          return {
            ...d,
            exercises: d.exercises.map((e, i) => {
              if (i !== action.exIndex) return e;
              const updated = { ...e, ...action.updates };

              // Switch to "different" → init sets_config
              if (action.updates.mode === "different" && e.mode !== "different") {
                const count = updated.sets || 3;
                updated.sets = count;
                updated.sets_config = Array.from({ length: count }, () =>
                  makeDefaultSetConfig(updated)
                );
              }
              // Switch to "equal" → clear sets_config
              if (action.updates.mode === "equal") {
                updated.sets_config = [];
              }
              // Sets count change in "different" → resize
              if (action.updates.sets !== undefined && updated.mode === "different") {
                const newCount = action.updates.sets;
                const current = updated.sets_config;
                if (newCount > current.length) {
                  const fill = Array.from(
                    { length: newCount - current.length },
                    () => makeDefaultSetConfig(updated)
                  );
                  updated.sets_config = [...current, ...fill];
                } else {
                  updated.sets_config = current.slice(0, newCount);
                }
              }

              return updated;
            }),
          };
        }),
      };

    case "CR_UPDATE_SET_CONFIG":
      return {
        ...state,
        crTrainingDays: state.crTrainingDays.map((d) => {
          if (d.key !== action.dayKey) return d;
          return {
            ...d,
            exercises: d.exercises.map((e, i) => {
              if (i !== action.exIndex) return e;
              return {
                ...e,
                sets_config: e.sets_config.map((sc, si) =>
                  si === action.setIndex ? { ...sc, ...action.updates } : sc
                ),
              };
            }),
          };
        }),
      };

    case "CR_REMOVE_EXERCISE":
      return {
        ...state,
        crTrainingDays: state.crTrainingDays.map((d) => {
          if (d.key !== action.dayKey) return d;
          return {
            ...d,
            exercises: d.exercises
              .filter((_, i) => i !== action.exIndex)
              .map((e, i) => ({ ...e, order: i })),
          };
        }),
      };

    case "CR_MOVE_EXERCISE":
      return {
        ...state,
        crTrainingDays: state.crTrainingDays.map((d) => {
          if (d.key !== action.dayKey) return d;
          const newIndex = action.exIndex + action.direction;
          if (newIndex < 0 || newIndex >= d.exercises.length) return d;
          const exercises = [...d.exercises];
          [exercises[action.exIndex], exercises[newIndex]] = [
            exercises[newIndex],
            exercises[action.exIndex],
          ];
          return { ...d, exercises: exercises.map((e, i) => ({ ...e, order: i })) };
        }),
      };

    case "CR_SET_SAVING":
      return { ...state, crSaving: action.saving };

    default:
      return state;
  }
}

/* ────────────────────────────────────────────
   Hook
   ──────────────────────────────────────────── */

export function useRoutinesPage() {
  const [state, dispatch] = useReducer(routinesReducer, initialState);

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

      dispatch({
        type: "LOAD_DATA_SUCCESS",
        trainerId: user.id,
        routines: normalizedRoutines,
        clients: normalizedClients,
        exercises: normalizedExercises,
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
      return day.exercises.reduce((sum, ex) => sum + ex.sets + ex.rest_pause_sets, 0);
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

      const flatExercises = state.crTrainingDays.flatMap((day) =>
        day.exercises.map((ex) => {
          const scheme = buildScheme(ex);
          const sets = ex.mode === "different" ? ex.sets_config.length : ex.sets;
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
        trainer_id: state.trainerId,
        client_id: state.crSelectedClientId,
        title: state.crTitle,
        goal: state.crGoal,
        duration_months: Math.max(1, Math.ceil(state.crMesocycleWeeks / 4)),
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

  return {
    state,
    dispatch,
    weekDates,
    totalSets,
    handleSave,
  };
}
