import { describe, it, expect } from "vitest";
import { getOnboardingSectionsTemplate, SECTION_TEMPLATES } from "./onboarding-templates";

describe("onboarding-templates", () => {
  describe("SECTION_TEMPLATES", () => {
    it("has 5 section templates", () => {
      expect(SECTION_TEMPLATES).toHaveLength(5);
    });

    it("each template has required fields", () => {
      for (const t of SECTION_TEMPLATES) {
        expect(t.id).toBeTruthy();
        expect(t.label).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.icon).toBeTruthy();
      }
    });
  });

  describe("getOnboardingSectionsTemplate", () => {
    it("returns a non-empty array of form fields", () => {
      const fields = getOnboardingSectionsTemplate();
      expect(fields.length).toBeGreaterThan(0);
    });

    it("contains exactly 5 section fields", () => {
      const fields = getOnboardingSectionsTemplate();
      const sections = fields.filter((f) => f.type === "section");
      expect(sections).toHaveLength(5);
    });

    it("all sections have enabled=true", () => {
      const fields = getOnboardingSectionsTemplate();
      const sections = fields.filter((f) => f.type === "section");
      for (const s of sections) {
        expect(s.enabled).toBe(true);
      }
    });

    it("generates unique IDs on each call", () => {
      const fields1 = getOnboardingSectionsTemplate();
      const fields2 = getOnboardingSectionsTemplate();
      const ids1 = fields1.map((f) => f.id);
      const ids2 = fields2.map((f) => f.id);
      // No IDs should overlap between calls
      const overlap = ids1.filter((id) => ids2.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it("all IDs are unique within a single call", () => {
      const fields = getOnboardingSectionsTemplate();
      const ids = fields.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("has at least one required field", () => {
      const fields = getOnboardingSectionsTemplate();
      const required = fields.filter((f) => f.required);
      expect(required.length).toBeGreaterThan(0);
    });

    it("includes known field types", () => {
      const fields = getOnboardingSectionsTemplate();
      const types = new Set(fields.map((f) => f.type));
      expect(types.has("section")).toBe(true);
      expect(types.has("textarea")).toBe(true);
      expect(types.has("select")).toBe(true);
      expect(types.has("boolean")).toBe(true);
    });
  });
});
