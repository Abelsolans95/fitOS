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
  google_event_id: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export interface ClientOption {
  client_id: string;
  full_name: string | null;
}
