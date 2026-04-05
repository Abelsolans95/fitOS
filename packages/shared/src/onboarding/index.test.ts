import { describe, it, expect } from "vitest";
import { groupFieldsBySection, getEnabledSections, type SectionGroup } from "./index";

describe("onboarding/groupFieldsBySection", () => {
  it("groups fields under their section", () => {
    const fields = [
      { id: "s1", type: "section", label: "Section 1", enabled: true },
      { id: "f1", type: "text", label: "Field 1", required: true },
      { id: "f2", type: "textarea", label: "Field 2", required: false },
      { id: "s2", type: "section", label: "Section 2", enabled: true },
      { id: "f3", type: "select", label: "Field 3", required: false },
    ];

    const groups = groupFieldsBySection(fields);
    expect(groups).toHaveLength(2);
    expect(groups[0].section?.label).toBe("Section 1");
    expect(groups[0].fields).toHaveLength(2);
    expect(groups[1].section?.label).toBe("Section 2");
    expect(groups[1].fields).toHaveLength(1);
  });

  it("fields before any section get section: null", () => {
    const fields = [
      { id: "f1", type: "text", label: "Orphan", required: true },
      { id: "s1", type: "section", label: "Section 1", enabled: true },
      { id: "f2", type: "text", label: "Child", required: false },
    ];

    const groups = groupFieldsBySection(fields);
    expect(groups).toHaveLength(2);
    expect(groups[0].section).toBeNull();
    expect(groups[0].fields).toHaveLength(1);
    expect(groups[0].fields[0].label).toBe("Orphan");
  });

  it("handles empty array", () => {
    expect(groupFieldsBySection([])).toHaveLength(0);
  });

  it("handles sections with no fields", () => {
    const fields = [
      { id: "s1", type: "section", label: "Empty", enabled: true },
      { id: "s2", type: "section", label: "Also Empty", enabled: true },
    ];

    const groups = groupFieldsBySection(fields);
    expect(groups).toHaveLength(2);
    expect(groups[0].fields).toHaveLength(0);
    expect(groups[1].fields).toHaveLength(0);
  });

  it("defaults enabled to true when undefined", () => {
    const fields = [
      { id: "s1", type: "section", label: "No enabled prop" },
      { id: "f1", type: "text", label: "Field", required: true },
    ];

    const groups = groupFieldsBySection(fields);
    expect(groups[0].section?.enabled).toBe(true);
  });
});

describe("onboarding/getEnabledSections", () => {
  it("filters out disabled sections", () => {
    const groups: SectionGroup[] = [
      { section: { id: "s1", label: "Enabled", enabled: true }, fields: [{ id: "f1", type: "text", label: "F1", required: false }] },
      { section: { id: "s2", label: "Disabled", enabled: false }, fields: [{ id: "f2", type: "text", label: "F2", required: false }] },
      { section: { id: "s3", label: "Also Enabled", enabled: true }, fields: [] },
    ];

    const result = getEnabledSections(groups);
    expect(result).toHaveLength(2);
    expect(result[0].section?.label).toBe("Enabled");
    expect(result[1].section?.label).toBe("Also Enabled");
  });

  it("keeps groups with section: null", () => {
    const groups: SectionGroup[] = [
      { section: null, fields: [{ id: "f1", type: "text", label: "Orphan", required: true }] },
      { section: { id: "s1", label: "Disabled", enabled: false }, fields: [] },
    ];

    const result = getEnabledSections(groups);
    expect(result).toHaveLength(1);
    expect(result[0].section).toBeNull();
  });

  it("returns empty array when all disabled", () => {
    const groups: SectionGroup[] = [
      { section: { id: "s1", label: "Off", enabled: false }, fields: [] },
    ];

    expect(getEnabledSections(groups)).toHaveLength(0);
  });
});
