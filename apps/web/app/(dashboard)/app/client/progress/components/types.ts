export interface BodyMetric {
  id: string;
  recorded_at: string;
  body_weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  right_arm_cm: number | null;
  right_thigh_cm: number | null;
  notes: string | null;
}

export interface NewMetric {
  body_weight_kg: string;
  body_fat_pct: string;
  muscle_mass_kg: string;
  chest_cm: string;
  waist_cm: string;
  hips_cm: string;
  right_arm_cm: string;
  right_thigh_cm: string;
  notes: string;
}

export type MetricKey =
  | "body_weight_kg"
  | "body_fat_pct"
  | "muscle_mass_kg"
  | "chest_cm"
  | "waist_cm"
  | "hips_cm"
  | "right_arm_cm"
  | "right_thigh_cm";

export const METRIC_CONFIG: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: "body_weight_kg", label: "Peso", unit: "kg", color: "#00E5FF" },
  { key: "body_fat_pct", label: "Grasa corporal", unit: "%", color: "#FF9100" },
  { key: "muscle_mass_kg", label: "Masa muscular", unit: "kg", color: "#7C3AED" },
  { key: "chest_cm", label: "Pecho", unit: "cm", color: "#00C853" },
  { key: "waist_cm", label: "Cintura", unit: "cm", color: "#FF1744" },
  { key: "hips_cm", label: "Cadera", unit: "cm", color: "#00E5FF" },
  { key: "right_arm_cm", label: "Brazo", unit: "cm", color: "#7C3AED" },
  { key: "right_thigh_cm", label: "Muslo", unit: "cm", color: "#FF9100" },
];

export const EMPTY_METRIC: NewMetric = {
  body_weight_kg: "",
  body_fat_pct: "",
  muscle_mass_kg: "",
  chest_cm: "",
  waist_cm: "",
  hips_cm: "",
  right_arm_cm: "",
  right_thigh_cm: "",
  notes: "",
};

export type TimeFilter = "all" | "1y" | "6m" | "3m" | "1m" | "1w";

export const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "Histórico" },
  { value: "1y", label: "1 año" },
  { value: "6m", label: "6 meses" },
  { value: "3m", label: "3 meses" },
  { value: "1m", label: "1 mes" },
  { value: "1w", label: "1 sem" },
];
