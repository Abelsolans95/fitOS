/* ────────────────────────────────────────────
   Active Training — Reducer, State & Actions
   Extracted from useActiveTraining.ts (Rule 51)
   ──────────────────────────────────────────── */

import type { SetEntry, Phase } from "./types";

/* ────────────────────────────────────────────
   State
   ──────────────────────────────────────────── */

export interface TrainingState {
  phase: Phase;
  currentExIdx: number;
  allSets: Record<number, SetEntry[]>;
  savedExercises: number[];
  exerciseNotes: Record<number, string>;
  exerciseRpe: Record<number, string>;
  exerciseStimulus: Record<number, number>;
  exerciseFatigue: Record<number, number>;
  rpeGlobal: number;
  restTime: number;
  restTotal: number;
  elapsed: number;
  sessionStart: number;
  sessionId: string | null;
}

export const initialState: TrainingState = {
  phase: "loading",
  currentExIdx: 0,
  allSets: {},
  savedExercises: [],
  exerciseNotes: {},
  exerciseRpe: {},
  exerciseStimulus: {},
  exerciseFatigue: {},
  rpeGlobal: 7,
  restTime: 0,
  restTotal: 0,
  elapsed: 0,
  sessionStart: 0,
  sessionId: null,
};

/* ────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────── */

export type TrainingAction =
  | { type: "INIT_SETS"; sets: Record<number, SetEntry[]> }
  | {
      type: "RESUME";
      currentExIdx: number;
      sets: Record<number, SetEntry[]>;
      savedExercises: number[];
      notes: Record<number, string>;
      sessionId: string;
      sessionStart: number;
      elapsed: number;
    }
  | { type: "START_TRAINING"; sessionId: string; sessionStart: number }
  | { type: "NEXT_EXERCISE" }
  | { type: "PREV_EXERCISE" }
  | {
      type: "COMPLETE_SET";
      exIdx: number;
      setIdx: number;
      restSeconds: number;
    }
  | { type: "MARK_SAVED"; exIdx: number }
  | { type: "SET_NOTES"; exIdx: number; notes: string }
  | { type: "SET_EXERCISE_RPE"; exIdx: number; value: string }
  | { type: "SET_STIMULUS"; exIdx: number; value: number }
  | { type: "SET_FATIGUE"; exIdx: number; value: number }
  | { type: "SET_RPE"; value: number }
  | {
      type: "UPDATE_SET_VALUE";
      exIdx: number;
      setIdx: number;
      field: "weight_kg" | "reps_done" | "rir" | "rpe";
      value: string;
    }
  | { type: "SKIP_REST" }
  | { type: "TICK_REST" }
  | { type: "TICK_ELAPSED" }
  | { type: "SET_PHASE"; phase: Phase }
  | { type: "RESET" };

/* ────────────────────────────────────────────
   Reducer
   ──────────────────────────────────────────── */

export function trainingReducer(
  state: TrainingState,
  action: TrainingAction
): TrainingState {
  switch (action.type) {
    case "INIT_SETS":
      return { ...state, allSets: action.sets, phase: "ready" };

    case "RESUME":
      return {
        ...state,
        currentExIdx: action.currentExIdx,
        allSets: action.sets,
        savedExercises: action.savedExercises,
        exerciseNotes: action.notes,
        sessionId: action.sessionId,
        sessionStart: action.sessionStart,
        elapsed: action.elapsed,
        phase: "training",
      };

    case "START_TRAINING":
      return {
        ...state,
        phase: "training",
        sessionId: action.sessionId,
        sessionStart: action.sessionStart,
      };

    case "NEXT_EXERCISE":
      return {
        ...state,
        currentExIdx: state.currentExIdx + 1,
        phase: "training",
      };

    case "PREV_EXERCISE":
      return {
        ...state,
        currentExIdx: Math.max(0, state.currentExIdx - 1),
        phase: "training",
      };

    case "COMPLETE_SET": {
      const sets = [...(state.allSets[action.exIdx] || [])];
      if (!sets[action.setIdx] || sets[action.setIdx].completed) return state;
      sets[action.setIdx] = { ...sets[action.setIdx], completed: true };
      const allDone = sets.every((s) => s.completed);
      return {
        ...state,
        allSets: { ...state.allSets, [action.exIdx]: sets },
        phase: allDone ? "sfr" : "rest",
        restTime: allDone ? state.restTime : action.restSeconds,
        restTotal: allDone ? state.restTotal : action.restSeconds,
      };
    }

    case "MARK_SAVED": {
      if (state.savedExercises.includes(action.exIdx)) return state;
      return {
        ...state,
        savedExercises: [...state.savedExercises, action.exIdx],
      };
    }

    case "SET_EXERCISE_RPE":
      return {
        ...state,
        exerciseRpe: { ...state.exerciseRpe, [action.exIdx]: action.value },
      };

    case "SET_STIMULUS":
      return {
        ...state,
        exerciseStimulus: { ...state.exerciseStimulus, [action.exIdx]: action.value },
      };

    case "SET_FATIGUE":
      return {
        ...state,
        exerciseFatigue: { ...state.exerciseFatigue, [action.exIdx]: action.value },
      };

    case "SET_NOTES":
      return {
        ...state,
        exerciseNotes: {
          ...state.exerciseNotes,
          [action.exIdx]: action.notes,
        },
      };

    case "SET_RPE":
      return { ...state, rpeGlobal: action.value };

    case "UPDATE_SET_VALUE": {
      const sets = [...(state.allSets[action.exIdx] || [])];
      sets[action.setIdx] = {
        ...sets[action.setIdx],
        [action.field]: action.value,
      };
      return {
        ...state,
        allSets: { ...state.allSets, [action.exIdx]: sets },
      };
    }

    case "SKIP_REST":
      return { ...state, phase: "training", restTime: 0 };

    case "TICK_REST": {
      const next = state.restTime - 1;
      if (next <= 0) return { ...state, restTime: 0, phase: "training" };
      return { ...state, restTime: next };
    }

    case "TICK_ELAPSED":
      return { ...state, elapsed: state.elapsed + 1 };

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}
