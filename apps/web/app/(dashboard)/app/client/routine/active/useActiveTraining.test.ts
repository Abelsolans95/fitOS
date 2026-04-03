import { describe, it, expect } from "vitest";
import { trainingReducer, initialState, type TrainingState } from "./active-training-reducer";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSet(completed = false) {
  return { weight_kg: "60", reps_done: "10", rir: "2", rpe: "", completed };
}

function stateWithSets(sets: Record<number, ReturnType<typeof makeSet>[]>): TrainingState {
  return { ...initialState, allSets: sets, phase: "training" };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("trainingReducer — initial state", () => {
  it("starts in loading phase", () => {
    expect(initialState.phase).toBe("loading");
    expect(initialState.currentExIdx).toBe(0);
    expect(initialState.rpeGlobal).toBe(7);
  });
});

describe("trainingReducer — INIT_SETS", () => {
  it("stores sets and transitions to ready", () => {
    const sets = { 0: [makeSet()], 1: [makeSet()] };
    const next = trainingReducer(initialState, { type: "INIT_SETS", sets });
    expect(next.phase).toBe("ready");
    expect(next.allSets).toEqual(sets);
  });
});

describe("trainingReducer — START_TRAINING", () => {
  it("transitions to training phase and records sessionId", () => {
    const next = trainingReducer(initialState, {
      type: "START_TRAINING",
      sessionId: "sess-1",
      sessionStart: 1000,
    });
    expect(next.phase).toBe("training");
    expect(next.sessionId).toBe("sess-1");
    expect(next.sessionStart).toBe(1000);
  });
});

describe("trainingReducer — COMPLETE_SET", () => {
  it("marks a set completed and enters rest phase when sets remain", () => {
    const state = stateWithSets({ 0: [makeSet(), makeSet()] });
    const next = trainingReducer(state, {
      type: "COMPLETE_SET",
      exIdx: 0,
      setIdx: 0,
      restSeconds: 90,
    });
    expect(next.allSets[0][0].completed).toBe(true);
    expect(next.allSets[0][1].completed).toBe(false);
    expect(next.phase).toBe("rest");
    expect(next.restTime).toBe(90);
    expect(next.restTotal).toBe(90);
  });

  it("stays in training phase when all sets are done", () => {
    const state = stateWithSets({ 0: [makeSet(true), makeSet()] });
    const next = trainingReducer(state, {
      type: "COMPLETE_SET",
      exIdx: 0,
      setIdx: 1,
      restSeconds: 90,
    });
    expect(next.allSets[0][1].completed).toBe(true);
    expect(next.phase).toBe("sfr"); // all done → SFR phase (stimulus/fatigue rating)
  });

  it("ignores already-completed sets", () => {
    const state = stateWithSets({ 0: [makeSet(true), makeSet()] });
    const next = trainingReducer(state, {
      type: "COMPLETE_SET",
      exIdx: 0,
      setIdx: 0,
      restSeconds: 90,
    });
    expect(next).toBe(state); // referential equality — no change
  });
});

describe("trainingReducer — SKIP_REST / TICK_REST", () => {
  it("SKIP_REST transitions to training immediately", () => {
    const state: TrainingState = { ...initialState, phase: "rest", restTime: 45 };
    const next = trainingReducer(state, { type: "SKIP_REST" });
    expect(next.phase).toBe("training");
    expect(next.restTime).toBe(0);
  });

  it("TICK_REST decrements restTime", () => {
    const state: TrainingState = { ...initialState, phase: "rest", restTime: 5 };
    const next = trainingReducer(state, { type: "TICK_REST" });
    expect(next.restTime).toBe(4);
    expect(next.phase).toBe("rest");
  });

  it("TICK_REST transitions to training when reaching 0", () => {
    const state: TrainingState = { ...initialState, phase: "rest", restTime: 1 };
    const next = trainingReducer(state, { type: "TICK_REST" });
    expect(next.restTime).toBe(0);
    expect(next.phase).toBe("training");
  });
});

describe("trainingReducer — navigation", () => {
  it("NEXT_EXERCISE increments currentExIdx", () => {
    const state: TrainingState = { ...initialState, currentExIdx: 1, phase: "training" };
    const next = trainingReducer(state, { type: "NEXT_EXERCISE" });
    expect(next.currentExIdx).toBe(2);
  });

  it("PREV_EXERCISE decrements currentExIdx but not below 0", () => {
    const state: TrainingState = { ...initialState, currentExIdx: 0, phase: "training" };
    const next = trainingReducer(state, { type: "PREV_EXERCISE" });
    expect(next.currentExIdx).toBe(0);

    const state2: TrainingState = { ...initialState, currentExIdx: 3, phase: "training" };
    const next2 = trainingReducer(state2, { type: "PREV_EXERCISE" });
    expect(next2.currentExIdx).toBe(2);
  });
});

describe("trainingReducer — UPDATE_SET_VALUE", () => {
  it("updates a field on a specific set", () => {
    const state = stateWithSets({ 0: [makeSet(), makeSet()] });
    const next = trainingReducer(state, {
      type: "UPDATE_SET_VALUE",
      exIdx: 0,
      setIdx: 1,
      field: "weight_kg",
      value: "80",
    });
    expect(next.allSets[0][1].weight_kg).toBe("80");
    expect(next.allSets[0][0].weight_kg).toBe("60"); // untouched
  });
});

describe("trainingReducer — RESUME", () => {
  it("restores session state correctly", () => {
    const sets = { 0: [makeSet(true)], 1: [makeSet()] };
    const next = trainingReducer(initialState, {
      type: "RESUME",
      currentExIdx: 1,
      sets,
      savedExercises: [0],
      notes: { 0: "felt heavy" },
      sessionId: "sess-resume",
      sessionStart: 500,
      elapsed: 120,
    });
    expect(next.phase).toBe("training");
    expect(next.currentExIdx).toBe(1);
    expect(next.savedExercises).toContain(0);
    expect(next.exerciseNotes[0]).toBe("felt heavy");
    expect(next.sessionId).toBe("sess-resume");
    expect(next.elapsed).toBe(120);
  });
});

describe("trainingReducer — RPE + notes", () => {
  it("SET_RPE updates global RPE", () => {
    const next = trainingReducer(initialState, { type: "SET_RPE", value: 9 });
    expect(next.rpeGlobal).toBe(9);
  });

  it("SET_EXERCISE_RPE stores per-exercise RPE", () => {
    const next = trainingReducer(initialState, { type: "SET_EXERCISE_RPE", exIdx: 2, value: "8" });
    expect(next.exerciseRpe[2]).toBe("8");
  });

  it("SET_NOTES stores per-exercise notes", () => {
    const next = trainingReducer(initialState, { type: "SET_NOTES", exIdx: 0, notes: "great pump" });
    expect(next.exerciseNotes[0]).toBe("great pump");
  });
});

describe("trainingReducer — RESET", () => {
  it("returns initial state", () => {
    const modified: TrainingState = { ...initialState, phase: "training", elapsed: 999 };
    const next = trainingReducer(modified, { type: "RESET" });
    expect(next).toEqual(initialState);
  });
});
