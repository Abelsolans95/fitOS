export interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "boolean" | "scale" | "date" | "section";
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  enabled?: boolean;
}

export interface OnboardingForm {
  id: string;
  title: string;
  fields: FormField[];
}

export type Responses = Record<string, string | number | boolean | string[]>;

export const GOAL_OPTIONS = [
  { label: "Hipertrofia", value: "hipertrofia" },
  { label: "Fuerza", value: "fuerza" },
  { label: "Perdida de peso", value: "perdida_peso" },
  { label: "Mantenimiento", value: "mantenimiento" },
];

export const DIETARY_RESTRICTIONS = [
  "Vegetariano", "Vegano", "Sin gluten", "Sin lactosa",
  "Sin frutos secos", "Halal", "Kosher",
];
