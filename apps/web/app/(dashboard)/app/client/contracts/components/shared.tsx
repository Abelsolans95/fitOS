import type { ContractStatus } from "./types";

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Borrador", color: "text-[#8B8BA3]", bg: "bg-[#8B8BA3]/10" },
  sent: { label: "Pendiente", color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10" },
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
