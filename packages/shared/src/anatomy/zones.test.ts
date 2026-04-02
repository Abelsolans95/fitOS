import { describe, it, expect } from "vitest";
import {
  MUSCLE_ZONES,
  ALL_ZONE_IDS,
  ZONE_LABELS,
  getZonesByView,
  ANATOMY_VIEWBOX,
  ANATOMY_WIDTH,
  ANATOMY_HEIGHT,
} from "./zones";

describe("anatomy/zones", () => {
  it("exports a non-empty array of MUSCLE_ZONES", () => {
    expect(MUSCLE_ZONES.length).toBeGreaterThan(0);
  });

  it("all zones have required fields", () => {
    for (const z of MUSCLE_ZONES) {
      expect(z.id).toBeTruthy();
      expect(z.label).toBeTruthy();
      expect(["front", "back"]).toContain(z.view);
      expect(z.path).toBeTruthy();
    }
  });

  it("all zone IDs are unique", () => {
    expect(new Set(ALL_ZONE_IDS).size).toBe(ALL_ZONE_IDS.length);
  });

  it("ZONE_LABELS maps every zone ID to a label", () => {
    for (const id of ALL_ZONE_IDS) {
      expect(ZONE_LABELS[id]).toBeTruthy();
    }
  });

  describe("getZonesByView", () => {
    it("returns only front zones for 'front'", () => {
      const front = getZonesByView("front");
      expect(front.length).toBeGreaterThan(0);
      for (const z of front) {
        expect(z.view).toBe("front");
      }
    });

    it("returns only back zones for 'back'", () => {
      const back = getZonesByView("back");
      expect(back.length).toBeGreaterThan(0);
      for (const z of back) {
        expect(z.view).toBe("back");
      }
    });

    it("front + back equals total", () => {
      const front = getZonesByView("front");
      const back = getZonesByView("back");
      expect(front.length + back.length).toBe(MUSCLE_ZONES.length);
    });
  });

  it("ANATOMY_VIEWBOX is correct format", () => {
    expect(ANATOMY_VIEWBOX).toBe("0 0 400 720");
    expect(ANATOMY_WIDTH).toBe(400);
    expect(ANATOMY_HEIGHT).toBe(720);
  });

  it("has known zones for key body parts", () => {
    const ids = new Set(ALL_ZONE_IDS);
    expect(ids.has("neck")).toBe(true);
    expect(ids.has("abs")).toBe(true);
    expect(ids.has("chest_left")).toBe(true);
    expect(ids.has("lower_back")).toBe(true);
    expect(ids.has("glute_left")).toBe(true);
    expect(ids.has("quadriceps_right")).toBe(true);
  });
});
