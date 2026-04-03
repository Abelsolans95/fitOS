/* ────────────────────────────────────────────
   Client Routine — Reducer + State + Actions
   Extracted from useClientRoutine.ts
   ──────────────────────────────────────────── */

import type { PreviousLog } from "./active/types";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

export interface RoutineRaw {
  id: string;
  title: string;
  duration_months: number;
  total_weeks?: number;
  goal: string;
  exercises?: import("./active/types").ExerciseData[];
  days?: import("./active/types").DayData[];
  is_active: boolean;
  sent_at: string | null;
  created_at: string;
  trainer_id?: string;
}

export interface SetInput {
  weight_kg: string;
  reps_done: string;
  type: "main" | "rest_pause";
}

export interface InProgressSession {
  id: string;
  routine_id: string;
  day_label: string;
  week_number: number;
}

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface ClientRoutineState {
  loading: boolean;
  error: string | null;
  routine: RoutineRaw | null;
  userId: string | null;
  previousLogs: PreviousLog[];
  activeWeek: number;
  activeDay: string | null;
  isTracking: boolean;
  sessionInputs: Record<string, SetInput[]>;
  clientNotes: Record<string, string>;
  exerciseRpe: Record<string, string>;
  rpeGlobal: number;
  saving: boolean;
  inProgressSession: InProgressSession | null;
  completedSessions: Set<string>;
}

export const initialState: ClientRoutineState = {
  loading: true,
  error: null,
  routine: null,
  userId: null,
  previousLogs: [],
  activeWeek: 1,
  activeDay: null,
  isTracking: false,
  sessionInputs: {},
  clientNotes: {},
  exerciseRpe: {},
  rpeGlobal: 7,
  saving: false,
  inProgressSession: null,
  completedSessions: new Set(),
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type ClientRoutineAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | {
      type: "LOAD_SUCCESS";
      userId: string;
      routine: RoutineRaw | null;
      previousLogs: PreviousLog[];
      completedSessions: Set<string>;
      inProgressSession: InProgressSession | null;
    }
  | { type: "SET_ACTIVE_WEEK"; week: number }
  | { type: "SET_ACTIVE_DAY"; day: string }
  | { type: "START_TRACKING"; sessionInputs: Record<string, SetInput[]> }
  | { type: "STOP_TRACKING" }
  | {
      type: "UPDATE_SET";
      exerciseName: string;
      setIndex: number;
      field: "weight_kg" | "reps_done";
      value: string;
    }
  | { type: "SET_CLIENT_NOTE"; exerciseName: string; note: string }
  | { type: "SET_EXERCISE_RPE"; exerciseName: string; value: string }
  | { type: "SET_RPE"; value: number }
  | { type: "SET_SAVING"; saving: boolean }
  | { type: "SESSION_SAVED"; previousLogs: PreviousLog[] }
  | { type: "SET_PREVIOUS_LOGS"; previousLogs: PreviousLog[] };

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

export function clientRoutineReducer(
  state: ClientRoutineState,
  action: ClientRoutineAction
): ClientRoutineState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };

    case "LOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        userId: action.userId,
        routine: action.routine,
        previousLogs: action.previousLogs,
        completedSessions: action.completedSessions,
        inProgressSession: action.inProgressSession,
      };

    case "SET_ACTIVE_WEEK":
      return { ...state, activeWeek: action.week };

    case "SET_ACTIVE_DAY":
      return { ...state, activeDay: action.day };

    case "START_TRACKING":
      return {
        ...state,
        isTracking: true,
        sessionInputs: action.sessionInputs,
        clientNotes: {},
      };

    case "STOP_TRACKING":
      return { ...state, isTracking: false };

    case "UPDATE_SET": {
      const updated = { ...state.sessionInputs };
      const sets = [...(updated[action.exerciseName] ?? [])];
      sets[action.setIndex] = {
        ...sets[action.setIndex],
        [action.field]: action.value,
      };
      updated[action.exerciseName] = sets;
      return { ...state, sessionInputs: updated };
    }

    case "SET_EXERCISE_RPE":
      return {
        ...state,
        exerciseRpe: { ...state.exerciseRpe, [action.exerciseName]: action.value },
      };

    case "SET_CLIENT_NOTE":
      return {
        ...state,
        clientNotes: {
          ...state.clientNotes,
          [action.exerciseName]: action.note,
        },
      };

    case "SET_RPE":
      return { ...state, rpeGlobal: action.value };

    case "SET_SAVING":
      return { ...state, saving: action.saving };

    case "SESSION_SAVED":
      return {
        ...state,
        isTracking: false,
        saving: false,
        previousLogs: action.previousLogs,
      };

    case "SET_PREVIOUS_LOGS":
      return { ...state, previousLogs: action.previousLogs };

    default:
      return state;
  }
}
