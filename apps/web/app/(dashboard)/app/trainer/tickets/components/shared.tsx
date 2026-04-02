import { memo } from "react";
import type { TicketCategory, TicketStatus } from "./types";

// ── Category styling ──

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

// ── Status styling ──

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

// ── Empty state ──

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="mb-4 h-12 w-12 text-[#5A5A72]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
      </svg>
      <p className="text-sm text-[#5A5A72]">{message}</p>
    </div>
  );
}

export { timeAgo } from "@/lib/utils";
