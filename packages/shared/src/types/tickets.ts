// ── Support Tickets types ────────────────────────────────────────────────────

export type TicketCategory = "nutricion" | "rutina" | "lesion" | "general";
export type TicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicket {
  id: string;
  trainer_id: string;
  client_id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  image_url: string | null;
  status: TicketStatus;
  trainer_read_at: string | null;
  created_at: string;
  updated_at: string;
  /** Enriched from profiles join */
  client_name?: string;
  /** Count of unread replies */
  unread_count?: number;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
  /** Enriched */
  sender_name?: string;
  sender_role?: "trainer" | "client";
}

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "nutricion", label: "Nutrición" },
  { value: "rutina", label: "Rutina" },
  { value: "lesion", label: "Lesión" },
  { value: "general", label: "General" },
];

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Abierta" },
  { value: "in_progress", label: "En progreso" },
  { value: "resolved", label: "Resuelta" },
];
