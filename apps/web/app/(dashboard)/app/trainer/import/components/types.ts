import type { InferredColumnType } from "@/lib/excel-parser";

export interface DetectedColumn {
  index: number;
  header: string | null;
  inferred_type: InferredColumnType;
  confidence: number;
  sample_values: (string | number | null)[];
  reasoning: string;
}

export interface ParsedSheet {
  name: string;
  columns: DetectedColumn[];
  rows: Record<string, any>[];
  row_count: number;
}

export interface ReconciliationMatch {
  id: string;
  name: string;
  is_global: boolean;
  similarity: number;
}

export interface ReconciliationResult {
  original_name: string;
  matches: ReconciliationMatch[];
  best_match: { id: string; name: string; similarity: number } | null;
  confidence: number;
  status: "auto_matched" | "review" | "no_match";
}

export type Step = "upload" | "mapping" | "reconcile" | "review";

export type DecisionMap = Record<
  string,
  { action: "link" | "create" | "skip"; matched_id?: string; custom_name?: string }
>;

export const COLUMN_TYPE_LABELS: Record<InferredColumnType, string> = {
  exercise_name: "Nombre del ejercicio",
  sets: "Series",
  reps: "Repeticiones",
  weight_kg: "Peso (kg)",
  rir: "RIR",
  rpe: "RPE",
  rest_seconds: "Descanso (seg)",
  day_label: "Día / Sesión",
  week_number: "Semana",
  notes: "Notas",
  scheme: "Esquema (3x8-10)",
  coach_notes: "Notas del coach",
  video_url: "Vídeo",
  date: "Fecha",
  series_weight: "Peso serie",
  series_reps: "Reps serie",
  previous_data: "Datos anteriores",
  exercise_category: "Categoría (texto libre)",
  unknown: "No usar",
};

export const ALL_COLUMN_TYPES: InferredColumnType[] = [
  "exercise_name",
  "scheme",
  "sets",
  "reps",
  "weight_kg",
  "series_weight",
  "series_reps",
  "rir",
  "rpe",
  "rest_seconds",
  "day_label",
  "week_number",
  "date",
  "notes",
  "coach_notes",
  "video_url",
  "previous_data",
  "exercise_category",
  "unknown",
];
