export type {
  SupportTicket,
  TicketReply,
  TicketCategory,
  TicketStatus,
} from "@fitos/shared";
export { TICKET_CATEGORIES, TICKET_STATUSES } from "@fitos/shared";

export type TicketTab = "all" | "open" | "in_progress" | "resolved";
