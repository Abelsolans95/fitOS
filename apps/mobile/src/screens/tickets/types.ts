import type { TicketCategory, TicketStatus, SupportTicket, TicketReply } from "@kuvox/shared";
import { colors, fonts } from "../../theme";

export type ScreenView = "list" | "create" | "detail";

export const CATEGORY_COLORS: Record<TicketCategory, string> = {
  nutricion: colors.success,
  rutina: colors.cyan,
  lesion: colors.error,
  general: colors.violet,
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: colors.orange,
  in_progress: colors.cyan,
  resolved: colors.success,
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierta",
  in_progress: "En progreso",
  resolved: "Resuelta",
};

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export type { SupportTicket, TicketReply, TicketCategory };
