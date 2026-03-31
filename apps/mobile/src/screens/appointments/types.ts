export interface Appointment {
  id: string;
  trainer_id: string;
  client_id: string;
  title: string;
  session_type: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  location: string | null;
  meeting_url: string | null;
}

export interface TrainerInfo {
  user_id: string;
  full_name: string | null;
}

export const SESSION_TYPES = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "telefonica", label: "Telefónica" },
  { value: "evaluacion", label: "Evaluación inicial" },
  { value: "seguimiento", label: "Seguimiento" },
];
