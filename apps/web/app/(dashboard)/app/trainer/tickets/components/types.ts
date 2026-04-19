export type {
  SupportTicket,
  TicketReply,
  TicketCategory,
  TicketStatus,
} from "@kuvox/shared";
export { TICKET_CATEGORIES, TICKET_STATUSES } from "@kuvox/shared";

export type TicketTab = "all" | "open" | "in_progress" | "resolved";
