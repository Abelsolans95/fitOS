import { describe, it, expect } from "vitest";
import { routinesReducer, initialRoutinesState, type RoutinesState } from "./useRoutinesPage";
import type { ExerciseItem } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeExercise(id = "ex-1", name = "Sentadilla"): ExerciseItem {
  return {
    id,
    name,
    description: null,
    video_url: null,
    video_thumbnail_url: null,
    muscle_groups: ["quadriceps"],
    secondary_muscles: [],
    category: "piernas",
    is_global: true,
    trainer_id: null,
    aliases: [],
  };
}

function stateWithDays(days: string[]): RoutinesState {
  return { ...initialRoutinesState, crSelectedDays: days };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("routinesReducer — initial state", () => {
  it("starts loading with empty data", () => {
    expect(initialRoutinesState.loading).toBe(true);
    expect(initialRoutinesState.routines).toHaveLength(0);
    expect(initialRoutinesState.showCreator).toBe(false);
    expect(initialRoutinesState.step).toBe(1);
  });
});

describe("routinesReducer — page actions", () => {
  it("SET_LOADING updates loading flag", () => {
    const next = routinesReducer(initialRoutinesState, { type: "SET_LOADING", loading: false });
    expect(next.loading).toBe(false);
  });

  it("SET_ERROR sets error and stops loading", () => {
    const next = routinesReducer(initialRoutinesState, { type: "SET_ERROR", error: "Error DB" });
    expect(next.error).toBe("Error DB");
    expect(next.loading).toBe(false);
  });

  it("LOAD_DATA_SUCCESS populates data and clears loading", () => {
    const next = routinesReducer(initialRoutinesState, {
      type: "LOAD_DATA_SUCCESS",
      trainerId: "trainer-1",
      routines: [],
      clients: [],
      exercises: [makeExercise()],
      templates: [],
    });
    expect(next.loading).toBe(false);
    expect(next.error).toBeNull();
    expect(next.trainerId).toBe("trainer-1");
    expect(next.exercises).toHaveLength(1);
  });

  it("SHOW_CREATOR / HIDE_CREATOR toggle the creator panel", () => {
    const shown = routinesReducer(initialRoutinesState, { type: "SHOW_CREATOR" });
    expect(shown.showCreator).toBe(true);
    const hidden = routinesReducer(shown, { type: "HIDE_CREATOR" });
    expect(hidden.showCreator).toBe(false);
  });

  it("SET_TAB changes the active tab", () => {
    const next = routinesReducer(initialRoutinesState, { type: "SET_TAB", tab: "ejercicios" });
    expect(next.activeTab).toBe("ejercicios");
  });
});

describe("routinesReducer — creator step 1", () => {
  it("CR_SET_TITLE updates title", () => {
    const next = routinesReducer(initialRoutinesState, { type: "CR_SET_TITLE", title: "Fuerza 4 semanas" });
    expect(next.crTitle).toBe("Fuerza 4 semanas");
  });

  it("CR_SET_GOAL updates goal", () => {
    const next = routinesReducer(initialRoutinesState, { type: "CR_SET_GOAL", goal: "hipertrofia" });
    expect(next.crGoal).toBe("hipertrofia");
  });

  it("CR_SET_WEEKS updates mesocycle weeks", () => {
    const next = routinesReducer(initialRoutinesState, { type: "CR_SET_WEEKS", weeks: 6 });
    expect(next.crMesocycleWeeks).toBe(6);
  });

  it("CR_SET_CLIENT updates selected client", () => {
    const next = routinesReducer(initialRoutinesState, { type: "CR_SET_CLIENT", clientId: "client-abc" });
    expect(next.crSelectedClientId).toBe("client-abc");
  });
});

describe("routinesReducer — creator step 2 (days)", () => {
  it("CR_TOGGLE_DAY adds a day when not selected", () => {
    const next = routinesReducer(initialRoutinesState, { type: "CR_TOGGLE_DAY", key: "lunes" });
    expect(next.crSelectedDays).toContain("lunes");
  });

  it("CR_TOGGLE_DAY removes a day when already selected", () => {
    const state = stateWithDays(["lunes", "miércoles"]);
    const next = routinesReducer(state, { type: "CR_TOGGLE_DAY", key: "lunes" });
    expect(next.crSelectedDays).not.toContain("lunes");
    expect(next.crSelectedDays).toContain("miércoles");
  });

  it("CR_SET_DAY_LABEL updates the label for a specific day", () => {
    const state = stateWithDays(["lunes"]);
    const next = routinesReducer(state, { type: "CR_SET_DAY_LABEL", key: "lunes", label: "Pierna" });
    expect(next.crDayLabels["lunes"]).toBe("Pierna");
  });
});

describe("routinesReducer — creator step 3 (exercises)", () => {
  it("CR_ADD_EXERCISE adds an exercise to a day", () => {
    const state: RoutinesState = {
      ...initialRoutinesState,
      crTrainingDays: [{ key: "lunes", label: "Pierna", exercises: [] }],
    };
    const next = routinesReducer(state, {
      type: "CR_ADD_EXERCISE",
      dayKey: "lunes",
      exercise: makeExercise(),
    });
    expect(next.crTrainingDays[0].exercises).toHaveLength(1);
    expect(next.crTrainingDays[0].exercises[0].name).toBe("Sentadilla");
  });

  it("CR_REMOVE_EXERCISE removes an exercise by index", () => {
    const state: RoutinesState = {
      ...initialRoutinesState,
      crTrainingDays: [{
        key: "lunes",
        label: "Pierna",
        exercises: [
          { exercise_id: "ex-1", name: "Sentadilla", sets: 4, reps_min: 8, reps_max: 12, rir: 2, target_weight: null, rest_s: 90, scheme: "", rest_pause_sets: 0, progression_rule: "", coach_notes: "", order: 0, mode: "equal", sets_config: [], weekly_config: {} },
          { exercise_id: "ex-2", name: "Prensa", sets: 3, reps_min: 10, reps_max: 15, rir: 2, target_weight: null, rest_s: 60, scheme: "", rest_pause_sets: 0, progression_rule: "", coach_notes: "", order: 1, mode: "equal", sets_config: [], weekly_config: {} },
        ],
      }],
    };
    const next = routinesReducer(state, { type: "CR_REMOVE_EXERCISE", dayKey: "lunes", exIndex: 0 });
    expect(next.crTrainingDays[0].exercises).toHaveLength(1);
    expect(next.crTrainingDays[0].exercises[0].name).toBe("Prensa");
  });

  it("CR_OPEN_SEARCH_MODAL / CR_CLOSE_SEARCH_MODAL toggle the modal", () => {
    const opened = routinesReducer(initialRoutinesState, { type: "CR_OPEN_SEARCH_MODAL", dayKey: "lunes" });
    expect(opened.crSearchModalDayKey).toBe("lunes");
    const closed = routinesReducer(opened, { type: "CR_CLOSE_SEARCH_MODAL" });
    expect(closed.crSearchModalDayKey).toBeNull();
  });
});

describe("routinesReducer — templates", () => {
  it("LOAD_TEMPLATES stores templates", () => {
    const templates = [{ id: "t1", name: "Fuerza Básica", trainer_id: "t", training_days: [], day_labels: {}, exercises: [], total_weeks: 4, goal: "fuerza" }];
    const next = routinesReducer(initialRoutinesState, { type: "LOAD_TEMPLATES", templates });
    expect(next.templates).toHaveLength(1);
  });

  it("CR_SELECT_TEMPLATE stores selected template ID", () => {
    const next = routinesReducer(initialRoutinesState, { type: "CR_SELECT_TEMPLATE", templateId: "tpl-1" });
    expect(next.crSelectedTemplateId).toBe("tpl-1");
  });

  it("CR_SHOW_TEMPLATE_MODAL toggles the template save modal", () => {
    const shown = routinesReducer(initialRoutinesState, { type: "CR_SHOW_TEMPLATE_MODAL", show: true });
    expect(shown.crShowTemplateModal).toBe(true);
    const hidden = routinesReducer(shown, { type: "CR_SHOW_TEMPLATE_MODAL", show: false });
    expect(hidden.crShowTemplateModal).toBe(false);
  });
});
