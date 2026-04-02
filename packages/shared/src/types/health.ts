// ── Health & anatomy types ────────────────────────────────────────────────────

export interface HealthLog {
  id: string;
  client_id: string;
  trainer_id: string;
  reported_by: "coach" | "client";
  muscle_id: string;
  pain_score: number;
  incident_type: "puntual" | "diagnosticada" | "cronica";
  status: "active" | "recovering" | "recovered";
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface HealthLogFormData {
  muscle_id: string;
  pain_score: number;
  incident_type: "puntual" | "diagnosticada" | "cronica";
  status: "active" | "recovering" | "recovered";
  notes: string;
}

export interface MuscleRegion {
  id: string;
  label: string;
  path: string;
}
