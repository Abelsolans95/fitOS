/* ────────────────────────────────────────────
   Routines — Reducer (pure state management)
   ──────────────────────────────────────────── */

import {
  type ExerciseItem,
  type RoutineRow,
  type RoutineExercise,
  type RoutineTemplate,
  type TemplateExercise,
  type TrainingDay,
  type SetConfig,
  type WeekConfig,
  type ClientOption,
  DAYS_OF_WEEK,
  makeDefaultSetConfig,
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
  templates: RoutineTemplate[];
  showCreator: boolean;
  activeTab: "rutinas" | "ejercicios";
  /* Creator */
  step: 1 | 2 | 3;
  crSelectedClientId: string;
  crTitle: string;
  crGoal: string;
  crMesocycleWeeks: number;
  crStartDate: string;
  crSelectedDays: string[];
  crDayLabels: Record<string, string>;
  crTrainingDays: TrainingDay[];
  crSearchModalDayKey: string | null;
  crSaving: boolean;
  /* Templates */
  crSelectedTemplateId: string;
  crSavingTemplate: boolean;
  crShowTemplateModal: boolean;
}

export function getDefaultStartDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

export const initialRoutinesState: RoutinesState = {
  loading: true,
  error: null,
  trainerId: "",
  routines: [],
  clients: [],
  exercises: [],
  templates: [],
  showCreator: false,

  step: 1,
  crSelectedClientId: "",
  crTitle: "",
  crGoal: "",
  crMesocycleWeeks: 4,
  crStartDate: getDefaultStartDate(),
  crSelectedDays: [],
  crDayLabels: {},
  crTrainingDays: [],
  crSearchModalDayKey: null,
  crSaving: false,

  crSelectedTemplateId: "",
  crSavingTemplate: false,
  crShowTemplateModal: false,
  activeTab: "rutinas" as const,
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
      templates: RoutineTemplate[];
    }
  | { type: "SHOW_CREATOR" }
  | { type: "HIDE_CREATOR" }
  /* Creator nav */
  | { type: "SET_STEP"; step: 1 | 2 | 3 }
  | { type: "INIT_TRAINING_DAYS" }
  /* Creator step 1 */
  | { type: "CR_SET_CLIENT"; clientId: string }
  | { type: "CR_SET_TITLE"; title: string }
  | { type: "CR_SET_GOAL"; goal: string }
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
  | {
      type: "CR_ADD_DERIVATIVE_SET";
      dayKey: string;
      exIndex: number;
      afterSetIndex: number;
      setType: "rest_pause" | "drop_set";
    }
  | {
      type: "CR_REMOVE_DERIVATIVE_SET";
      dayKey: string;
      exIndex: number;
      setIndex: number;
    }
  | {
      type: "CR_UPDATE_WEEKLY_CONFIG";
      dayKey: string;
      exIndex: number;
      weeklyConfig: Record<number, WeekConfig>;
    }
  | { type: "CR_REMOVE_EXERCISE"; dayKey: string; exIndex: number }
  | { type: "CR_MOVE_EXERCISE"; dayKey: string; exIndex: number; direction: -1 | 1 }
  | { type: "CR_SET_SAVING"; saving: boolean }
  /* Templates */
  | { type: "LOAD_TEMPLATES"; templates: RoutineTemplate[] }
  | { type: "CR_SELECT_TEMPLATE"; templateId: string }
  | { type: "CR_APPLY_TEMPLATE"; template: RoutineTemplate }
  | { type: "CR_SHOW_TEMPLATE_MODAL"; show: boolean }
  | { type: "CR_SET_SAVING_TEMPLATE"; saving: boolean }
  | { type: "SET_TAB"; tab: "rutinas" | "ejercicios" };

/* ────────────────────────────────────────────
   Internal helpers (used only by the reducer)
   ──────────────────────────────────────────── */

/** Map training-day exercises from a template into RoutineExercise[] */
function mapTemplateExercises(
  tplExercises: TemplateExercise[],
  dayKey: string,
  dayLabel: string
): RoutineExercise[] {
  return tplExercises
    .filter((te) =>
      dayLabel ? te.day_label === dayLabel : te.day_of_week === dayKey
    )
    .sort((a, b) => a.order - b.order)
    .map((te, idx) => ({
      exercise_id: te.exercise_id,
      name: te.name,
      scheme: "",
      sets: te.sets,
      reps_min: te.reps_min,
      reps_max: te.reps_max,
      rest_pause_sets: te.rest_pause_sets,
      rir: 1,
      target_weight: null,
      rest_s: te.rest_s,
      progression_rule: te.progression_rule,
      coach_notes: te.coach_notes,
      order: idx,
      mode: te.mode,
      sets_config: te.sets_config
        ? te.sets_config.map((sc) => ({ ...sc, rir: 1, target_weight: null }))
        : [],
      weekly_config: te.weekly_config
        ? Object.fromEntries(
            Object.entries(te.weekly_config).map(([wk, wc]) => [
              Number(wk),
              {
                ...wc,
                rir: 1,
                target_weight: null,
                sets_detail: wc.sets_detail
                  ? wc.sets_detail.map((sd) => ({ ...sd, rir: 1, target_weight: null }))
                  : undefined,
              },
            ])
          )
        : undefined,
    }));
}

/** Update a single training day's exercises immutably */
function mapTrainingDay(
  days: TrainingDay[],
  dayKey: string,
  fn: (day: TrainingDay) => TrainingDay
): TrainingDay[] {
  return days.map((d) => (d.key === dayKey ? fn(d) : d));
}

/** Update a single exercise within a day immutably */
function mapExerciseInDay(
  day: TrainingDay,
  exIndex: number,
  fn: (ex: RoutineExercise) => RoutineExercise
): TrainingDay {
  return {
    ...day,
    exercises: day.exercises.map((e, i) => (i === exIndex ? fn(e) : e)),
  };
}

/** Create a default new exercise from a library item */
function createNewExercise(exercise: ExerciseItem, order: number): RoutineExercise {
  return {
    exercise_id: exercise.id,
    name: exercise.name,
    scheme: "3x8-12",
    sets: 3,
    reps_min: 8,
    reps_max: 12,
    rest_pause_sets: 0,
    rir: 1,
    target_weight: null,
    rest_s: 90,
    progression_rule: "",
    coach_notes: "",
    order,
    mode: "equal",
    sets_config: [],
  };
}

/** Handle mode switches and sets count changes for CR_UPDATE_EXERCISE */
function applyExerciseUpdate(
  ex: RoutineExercise,
  updates: Partial<RoutineExercise>
): RoutineExercise {
  const updated = { ...ex, ...updates };

  // Switch to "different" → init sets_config
  if (updates.mode === "different" && ex.mode !== "different") {
    const count = updated.sets || 3;
    updated.sets = count;
    updated.sets_config = Array.from({ length: count }, () =>
      makeDefaultSetConfig(updated)
    );
  }
  // Switch to "equal" → clear sets_config
  if (updates.mode === "equal") {
    updated.sets_config = [];
  }
  // Sets count change in "different" → resize
  if (updates.sets !== undefined && updated.mode === "different") {
    const newCount = updates.sets;
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
}

/** Create a derivative set (rest-pause or drop-set) from a source set */
function createDerivativeSet(
  sourceSet: SetConfig,
  setType: "rest_pause" | "drop_set"
): SetConfig {
  return {
    reps_min: sourceSet.reps_min,
    reps_max: sourceSet.reps_max,
    rir: 0,
    target_weight:
      setType === "drop_set"
        ? (sourceSet.target_weight != null
            ? Math.round(sourceSet.target_weight * 0.8)
            : null)
        : sourceSet.target_weight,
    rest_s: setType === "rest_pause" ? 15 : 0,
    target_rpe: sourceSet.target_rpe,
    set_type: setType,
  };
}

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

export function routinesReducer(
  state: RoutinesState,
  action: RoutinesAction
): RoutinesState {
  switch (action.type) {
    /* ── Page ── */
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
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
        templates: action.templates,
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
        crGoal: "",
        crMesocycleWeeks: 4,
        crStartDate: getDefaultStartDate(),
        crSelectedDays: [],
        crDayLabels: {},
        crTrainingDays: [],
        crSearchModalDayKey: null,
        crSaving: false,
        crSelectedTemplateId: "",
        crSavingTemplate: false,
        crShowTemplateModal: false,
      };

    /* ── Creator nav ── */
    case "SET_STEP":
      return { ...state, step: action.step };

    case "INIT_TRAINING_DAYS": {
      const selectedTpl = state.crSelectedTemplateId
        ? state.templates.find((t) => t.id === state.crSelectedTemplateId)
        : null;

      return {
        ...state,
        crTrainingDays: state.crSelectedDays.map((key) => {
          const dayInfo = DAYS_OF_WEEK.find((d) => d.key === key);
          const dayLabel = state.crDayLabels[key] || "";

          const exercises: RoutineExercise[] = selectedTpl
            ? mapTemplateExercises(
                selectedTpl.exercises as TemplateExercise[],
                key,
                dayLabel
              )
            : [];

          return {
            key,
            label: dayInfo?.label ?? key,
            dayLabel,
            exercises,
          };
        }),
      };
    }

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

    case "CR_ADD_EXERCISE":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) => ({
          ...d,
          exercises: [
            ...d.exercises,
            createNewExercise(action.exercise, d.exercises.length),
          ],
        })),
      };

    case "CR_UPDATE_EXERCISE":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) =>
          mapExerciseInDay(d, action.exIndex, (e) =>
            applyExerciseUpdate(e, action.updates)
          )
        ),
      };

    case "CR_UPDATE_SET_CONFIG":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) =>
          mapExerciseInDay(d, action.exIndex, (e) => ({
            ...e,
            sets_config: e.sets_config.map((sc, si) =>
              si === action.setIndex ? { ...sc, ...action.updates } : sc
            ),
          }))
        ),
      };

    case "CR_ADD_DERIVATIVE_SET":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) =>
          mapExerciseInDay(d, action.exIndex, (e) => {
            const sourceSet = e.sets_config[action.afterSetIndex];
            if (!sourceSet) return e;
            const derivative = createDerivativeSet(sourceSet, action.setType);
            const newConfig = [...e.sets_config];
            newConfig.splice(action.afterSetIndex + 1, 0, derivative);
            return { ...e, sets_config: newConfig, sets: newConfig.length };
          })
        ),
      };

    case "CR_REMOVE_DERIVATIVE_SET":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) =>
          mapExerciseInDay(d, action.exIndex, (e) => {
            const target = e.sets_config[action.setIndex];
            if (!target || !target.set_type || target.set_type === "normal") return e;
            const newConfig = e.sets_config.filter((_, si) => si !== action.setIndex);
            return { ...e, sets_config: newConfig, sets: newConfig.length };
          })
        ),
      };

    case "CR_UPDATE_WEEKLY_CONFIG":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) =>
          mapExerciseInDay(d, action.exIndex, (e) => ({
            ...e,
            weekly_config: action.weeklyConfig,
          }))
        ),
      };

    case "CR_REMOVE_EXERCISE":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) => ({
          ...d,
          exercises: d.exercises
            .filter((_, i) => i !== action.exIndex)
            .map((e, i) => ({ ...e, order: i })),
        })),
      };

    case "CR_MOVE_EXERCISE":
      return {
        ...state,
        crTrainingDays: mapTrainingDay(state.crTrainingDays, action.dayKey, (d) => {
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

    /* ── Templates ── */
    case "LOAD_TEMPLATES":
      return { ...state, templates: action.templates };
    case "CR_SELECT_TEMPLATE":
      if (!action.templateId) {
        return {
          ...state,
          crSelectedTemplateId: "",
          crGoal: "",
          crMesocycleWeeks: 4,
          crSelectedDays: [],
          crDayLabels: {},
        };
      }
      return { ...state, crSelectedTemplateId: action.templateId };
    case "CR_APPLY_TEMPLATE": {
      const tpl = action.template;
      return {
        ...state,
        crSelectedTemplateId: tpl.id,
        crGoal: tpl.goal ?? state.crGoal,
        crMesocycleWeeks: tpl.total_weeks,
        crSelectedDays: [...tpl.training_days],
        crDayLabels: { ...tpl.day_labels },
      };
    }
    case "CR_SHOW_TEMPLATE_MODAL":
      return { ...state, crShowTemplateModal: action.show };
    case "CR_SET_SAVING_TEMPLATE":
      return { ...state, crSavingTemplate: action.saving };

    default:
      return state;
  }
}
