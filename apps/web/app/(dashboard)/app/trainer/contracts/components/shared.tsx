import type { ContractStatus } from "./types";

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Borrador", color: "text-[#8B8BA3]", bg: "bg-[#8B8BA3]/10" },
  sent: { label: "Enviado", color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10" },
  viewed: { label: "Visto", color: "text-[#FF9100]", bg: "bg-[#FF9100]/10" },
  signed: { label: "Firmado", color: "text-[#00C853]", bg: "bg-[#00C853]/10" },
  expired: { label: "Expirado", color: "text-[#FF1744]", bg: "bg-[#FF1744]/10" },
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="mb-4 h-12 w-12 text-[#5A5A72]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
      <p className="text-sm text-[#5A5A72]">{message}</p>
    </div>
  );
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mes`;
}
