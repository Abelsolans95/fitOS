// Onboarding section grouping utility — shared between web and mobile

export interface SectionGroup {
  section: {
    id: string;
    label: string;
    description?: string;
    enabled?: boolean;
  } | null;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
    description?: string;
    enabled?: boolean;
  }>;
}

/**
 * Groups a flat array of form fields by section.
 * Section fields (type === "section") act as group headers.
 * Fields before any section are grouped under `section: null`.
 * Returns only enabled sections (enabled !== false).
 */
export function groupFieldsBySection(
  fields: Array<{ id: string; type: string; enabled?: boolean; [key: string]: unknown }>
): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let currentGroup: SectionGroup | null = null;

  for (const field of fields) {
    if (field.type === "section") {
      currentGroup = {
        section: {
          id: field.id,
          label: field.label as string,
          description: field.description as string | undefined,
          enabled: (field.enabled as boolean | undefined) ?? true,
        },
        fields: [],
      };
      groups.push(currentGroup);
    } else {
      if (!currentGroup) {
        currentGroup = { section: null, fields: [] };
        groups.push(currentGroup);
      }
      currentGroup.fields.push(field as SectionGroup["fields"][number]);
    }
  }

  return groups;
}

/**
 * Filters out disabled sections and their fields.
 * Sections with enabled === false are excluded.
 */
export function getEnabledSections(groups: SectionGroup[]): SectionGroup[] {
  return groups.filter((g) => !g.section || g.section.enabled !== false);
}
