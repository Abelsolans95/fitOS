import { memo } from "react";
import type { TicketCategory, TicketStatus } from "./types";

const CATEGORY_STYLES: Record<TicketCategory, { bg: string; text: string; label: string }> = {
  nutricion: { bg: "bg-[#00C853]/10", text: "text-[#00C853]", label: "Nutrición" },
  rutina: { bg: "bg-[#00E5FF]/10", text: "text-[#00E5FF]", label: "Rutina" },
  lesion: { bg: "bg-[#FF1744]/10", text: "text-[#FF1744]", label: "Lesión" },
  general: { bg: "bg-[#7C3AED]/10", text: "text-[#7C3AED]", label: "General" },
};

export const CategoryBadge = memo(function CategoryBadge({ category }: { category: TicketCategory }) {
  const s = CATEGORY_STYLES[category];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
});

const STATUS_STYLES: Record<TicketStatus, { bg: string; text: string; dot: string; label: string }> = {
  open: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]", dot: "bg-[#FF9100]", label: "Abierta" },
  in_progress: { bg: "bg-[#00E5FF]/10", text: "text-[#00E5FF]", dot: "bg-[#00E5FF]", label: "En progreso" },
  resolved: { bg: "bg-[#00C853]/10", text: "text-[#00C853]", dot: "bg-[#00C853]", label: "Resuelta" },
};

export const StatusBadge = memo(function StatusBadge({ status }: { status: TicketStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
});

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
