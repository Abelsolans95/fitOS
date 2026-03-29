export const SESSION_TYPES = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "telefonica", label: "Telefónica" },
  { value: "evaluacion", label: "Evaluación inicial" },
  { value: "seguimiento", label: "Seguimiento" },
];

export const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-[#FF9100]/10",  text: "text-[#FF9100]",  label: "Pendiente" },
  confirmed: { bg: "bg-[#00C853]/10",  text: "text-[#00C853]",  label: "Confirmada" },
  cancelled: { bg: "bg-[#FF1744]/10",  text: "text-[#FF1744]",  label: "Cancelada" },
  completed: { bg: "bg-[#7C3AED]/10",  text: "text-[#7C3AED]",  label: "Completada" },
};

export const STATUS_BG: Record<string, string> = {
  pending:   "bg-[#FF9100]/20 border-[#FF9100]/40 text-[#FF9100]",
  confirmed: "bg-[#00C853]/20 border-[#00C853]/40 text-[#00C853]",
  cancelled: "bg-[#FF1744]/10 border-[#FF1744]/30 text-[#FF1744] opacity-50",
  completed: "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#7C3AED]",
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(starts: string, ends: string) {
  const diff = (new Date(ends).getTime() - new Date(starts).getTime()) / 60000;
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
