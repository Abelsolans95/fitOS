// ── Chat messages types ───────────────────────────────────────────────────────

export interface Message {
  id: string;
  trainer_id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}
