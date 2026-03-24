// Shared UI components and utilities used across all tab components.

import { TabKey } from "./types";

export const TABS: { key: TabKey; label: string }[] = [
  { key: "perfil", label: "Perfil" },
  { key: "progreso", label: "Progreso" },
  { key: "rutina", label: "Rutina" },
  { key: "menu", label: "Menú" },
  { key: "formulario", label: "Formulario" },
  { key: "comunicacion", label: "Chat" },
];

export const GOAL_LABELS: Record<string, string> = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  perdida_peso: "Pérdida de peso",
  mantenimiento: "Mantenimiento",
};

export function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-[#00C853]/10", text: "text-[#00C853]", label: "Activo" },
    inactive: { bg: "bg-[#8B8BA3]/10", text: "text-[#8B8BA3]", label: "Inactivo" },
    pending: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]", label: "Confirmar email" },
  };
  const style = config[status] ?? config.inactive;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-[#8B8BA3]">
        {icon}
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-[#8B8BA3]">{description}</p>
    </div>
  );
}
