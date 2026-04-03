import { describe, it, expect } from "vitest";
import {
  getWeekDates,
  getWeekTarget,
  getMealTotals,
  buildMealSlots,
  DAYS_OF_WEEK,
} from "./nutrition-types";
import type { MealFood, WeekTarget } from "./nutrition-types";

describe("nutrition-types helpers", () => {
  describe("DAYS_OF_WEEK", () => {
    it("has 7 days", () => {
      expect(DAYS_OF_WEEK).toHaveLength(7);
    });

    it("starts with Lunes and ends with Domingo", () => {
      expect(DAYS_OF_WEEK[0].label).toBe("Lunes");
      expect(DAYS_OF_WEEK[6].label).toBe("Domingo");
    });
  });

  describe("getWeekDates", () => {
    it("returns dates for selected days in week 1", () => {
      // 2026-04-06 is a Monday
      const startDate = new Date(2026, 3, 6); // April 6, 2026 (Monday)
      const result = getWeekDates(startDate, 1, ["lunes", "miercoles", "viernes"]);
      expect(result).toHaveLength(3);
      expect(result[0].day).toBe("lunes");
      expect(result[1].day).toBe("miercoles");
      expect(result[2].day).toBe("viernes");
    });

    it("formats dates as dd/mm", () => {
      const startDate = new Date(2026, 3, 6); // Monday April 6
      const result = getWeekDates(startDate, 1, ["lunes"]);
      expect(result[0].date).toMatch(/^\d{2}\/\d{2}$/);
    });

    it("advances dates for week 2", () => {
      // Monday April 6 2026
      const startDate = new Date(2026, 3, 6);
      const week1 = getWeekDates(startDate, 1, ["lunes"]);
      const week2 = getWeekDates(startDate, 2, ["lunes"]);
      // Week 2 monday should be 7 days later
      expect(week1[0].date).toBe("06/04");
      expect(week2[0].date).toBe("13/04");
    });

    it("handles domingo correctly (day 0)", () => {
      // Monday April 6 2026
      const startDate = new Date(2026, 3, 6);
      const result = getWeekDates(startDate, 1, ["domingo"]);
      expect(result).toHaveLength(1);
      expect(result[0].day).toBe("domingo");
      // Domingo is day 0, Monday is day 1 — diff should be +6
      expect(result[0].date).toBe("12/04");
    });

    it("returns empty array for no selected days", () => {
      const startDate = new Date(2026, 3, 6);
      const result = getWeekDates(startDate, 1, []);
      expect(result).toHaveLength(0);
    });

    it("handles all 7 days", () => {
      const startDate = new Date(2026, 3, 6); // Monday
      const allDays = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
      const result = getWeekDates(startDate, 1, allDays);
      expect(result).toHaveLength(7);
    });
  });

  describe("getWeekTarget", () => {
    const defaults = {
      kcal: 2500 as number | "",
      proteinPct: 30,
      carbsPct: 40,
      fatPct: 30,
    };

    it("returns defaults when week has no override", () => {
      const result = getWeekTarget(1, {}, defaults);
      expect(result).toEqual({
        kcal: 2500,
        proteinPct: 30,
        carbsPct: 40,
        fatPct: 30,
      });
    });

    it("returns the week-specific target when it exists", () => {
      const weeklyTargets: Record<number, WeekTarget> = {
        2: { kcal: 2200, proteinPct: 35, carbsPct: 35, fatPct: 30 },
      };
      const result = getWeekTarget(2, weeklyTargets, defaults);
      expect(result.kcal).toBe(2200);
      expect(result.proteinPct).toBe(35);
    });

    it("returns defaults for a different week than the overridden one", () => {
      const weeklyTargets: Record<number, WeekTarget> = {
        2: { kcal: 2200, proteinPct: 35, carbsPct: 35, fatPct: 30 },
      };
      const result = getWeekTarget(1, weeklyTargets, defaults);
      expect(result.kcal).toBe(2500);
    });

    it("handles empty string kcal in defaults", () => {
      const emptyDefaults = { kcal: "" as number | "", proteinPct: 30, carbsPct: 40, fatPct: 30 };
      const result = getWeekTarget(1, {}, emptyDefaults);
      expect(result.kcal).toBe("");
    });

    it("handles week 0", () => {
      const weeklyTargets: Record<number, WeekTarget> = {
        0: { kcal: 1800, proteinPct: 40, carbsPct: 30, fatPct: 30 },
      };
      const result = getWeekTarget(0, weeklyTargets, defaults);
      expect(result.kcal).toBe(1800);
    });
  });

  describe("getMealTotals", () => {
    it("returns zeros for empty array", () => {
      const result = getMealTotals([]);
      expect(result).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
    });

    it("returns exact values for a single food", () => {
      const foods: MealFood[] = [
        { food_id: "1", name: "Pollo", portion_g: 200, kcal: 330, protein: 62, carbs: 0, fat: 7.2 },
      ];
      const result = getMealTotals(foods);
      expect(result.kcal).toBe(330);
      expect(result.protein).toBe(62);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(7.2);
    });

    it("sums multiple foods correctly", () => {
      const foods: MealFood[] = [
        { food_id: "1", name: "Arroz", portion_g: 100, kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
        { food_id: "2", name: "Pollo", portion_g: 150, kcal: 248, protein: 46.5, carbs: 0, fat: 5.4 },
      ];
      const result = getMealTotals(foods);
      expect(result.kcal).toBe(378);
      expect(result.protein).toBe(49.2);
      expect(result.carbs).toBe(28);
      expect(result.fat).toBe(5.7);
    });

    it("rounds to 1 decimal place", () => {
      const foods: MealFood[] = [
        { food_id: "1", name: "A", portion_g: 100, kcal: 100.33, protein: 10.11, carbs: 20.22, fat: 5.66 },
        { food_id: "2", name: "B", portion_g: 100, kcal: 100.33, protein: 10.11, carbs: 20.22, fat: 5.66 },
      ];
      const result = getMealTotals(foods);
      // 100.33 + 100.33 = 200.66 → rounded to 200.7
      expect(result.kcal).toBe(200.7);
      expect(result.protein).toBe(20.2);
      expect(result.carbs).toBe(40.4);
      expect(result.fat).toBe(11.3);
    });

    it("handles decimal precision edge case", () => {
      const foods: MealFood[] = [
        { food_id: "1", name: "A", portion_g: 100, kcal: 0.1, protein: 0.1, carbs: 0.1, fat: 0.1 },
        { food_id: "2", name: "B", portion_g: 100, kcal: 0.2, protein: 0.2, carbs: 0.2, fat: 0.2 },
      ];
      const result = getMealTotals(foods);
      expect(result.kcal).toBe(0.3);
      expect(result.protein).toBe(0.3);
    });
  });

  describe("buildMealSlots", () => {
    it("returns 3 main meals with 0 snacks", () => {
      const slots = buildMealSlots(3, 0);
      expect(slots).toHaveLength(3);
      expect(slots.every((s) => !s.isSnack)).toBe(true);
      expect(slots.map((s) => s.label)).toEqual(["Desayuno", "Almuerzo", "Cena"]);
    });

    it("returns 3 main meals + 1 snack (4 total)", () => {
      const slots = buildMealSlots(3, 1);
      expect(slots).toHaveLength(4);
      const snacks = slots.filter((s) => s.isSnack);
      expect(snacks).toHaveLength(1);
      // Snack should be between main meals
      expect(slots[0].label).toBe("Desayuno");
      expect(slots[1].label).toBe("Snack");
      expect(slots[1].isSnack).toBe(true);
      expect(slots[2].label).toBe("Almuerzo");
      expect(slots[3].label).toBe("Cena");
    });

    it("returns 3 main meals + 2 snacks (5 total)", () => {
      const slots = buildMealSlots(3, 2);
      expect(slots).toHaveLength(5);
      const snacks = slots.filter((s) => s.isSnack);
      expect(snacks).toHaveLength(2);
    });

    it("places snacks between main meals first, then appends extras", () => {
      // 3 main meals have 2 gaps (between 1-2, 2-3), so 3 snacks = 2 in gaps + 1 appended
      const slots = buildMealSlots(3, 3);
      expect(slots).toHaveLength(6);
      const snacks = slots.filter((s) => s.isSnack);
      expect(snacks).toHaveLength(3);
      // Last slot should be a trailing snack
      expect(slots[slots.length - 1].isSnack).toBe(true);
    });

    it("handles 4 main meals", () => {
      const slots = buildMealSlots(4, 0);
      expect(slots).toHaveLength(4);
      expect(slots.map((s) => s.label)).toEqual([
        "Desayuno", "Almuerzo", "Comida", "Cena",
      ]);
    });

    it("handles 5 main meals", () => {
      const slots = buildMealSlots(5, 0);
      expect(slots).toHaveLength(5);
      expect(slots.map((s) => s.label)).toEqual([
        "Desayuno", "Almuerzo", "Comida", "Merienda", "Cena",
      ]);
    });

    it("falls back to 3-meal labels for unknown mainMeals value", () => {
      const slots = buildMealSlots(7, 0);
      expect(slots).toHaveLength(3);
      expect(slots.map((s) => s.label)).toEqual(["Desayuno", "Almuerzo", "Cena"]);
    });

    it("all main slots have isSnack=false", () => {
      const slots = buildMealSlots(3, 2);
      const mainSlots = slots.filter((s) => !s.isSnack);
      expect(mainSlots).toHaveLength(3);
      for (const s of mainSlots) {
        expect(s.isSnack).toBe(false);
      }
    });
  });
});
