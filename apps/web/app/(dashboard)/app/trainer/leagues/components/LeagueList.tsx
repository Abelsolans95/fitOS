"use client";

import React from "react";
import type { League, LeagueStatus } from "@kuvox/shared";
import { LEAGUE_METRICS, LEAGUE_STATUSES } from "@kuvox/shared";

interface LeagueListProps {
  leagues: League[];
  confirmDeleteId: string | null;
  deleting: boolean;
  onViewLeaderboard: (id: string) => void;
  onUpdateStatus: (id: string, status: LeagueStatus) => void;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  onEnrollAll: (id: string) => void;
  enrolling: boolean;
}

const STATUS_COLORS: Record<LeagueStatus, { bg: string; text: string }> = {
  upcoming: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]" },
  active: { bg: "bg-[#00C853]/10", text: "text-[#00C853]" },
  completed: { bg: "bg-[#8B8BA3]/10", text: "text-[#8B8BA3]" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const LeagueList = React.memo(function LeagueList({
  leagues,
  confirmDeleteId,
  deleting,
  onViewLeaderboard,
  onUpdateStatus,
  onConfirmDelete,
  onDelete,
  onEnrollAll,
  enrolling,
}: LeagueListProps) {
  if (leagues.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#7C3AED]/10">
          <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-3.52 1.122 6.023 6.023 0 0 1-3.52-1.122" />
          </svg>
        </div>
        <p className="text-sm text-[#8B8BA3]">No hay ligas creadas</p>
        <p className="mt-1 text-xs text-[#5A5A72]">
          Crea tu primera liga para motivar a tus clientes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leagues.map((league) => {
        const metricLabel = LEAGUE_METRICS.find((m) => m.value === league.metric)?.label ?? league.metric;
        const statusLabel = LEAGUE_STATUSES.find((s) => s.value === league.status)?.label ?? league.status;
        const statusColor = STATUS_COLORS[league.status as LeagueStatus] ?? STATUS_COLORS.upcoming;
        const isConfirmingDelete = confirmDeleteId === league.id;

        return (
          <div
            key={league.id}
            className="rounded-2xl border border-white/10 bg-[#12121A] p-5 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white truncate">{league.title}</h3>
                {league.description && (
                  <p className="mt-1 text-xs text-[#5A5A72] line-clamp-2">{league.description}</p>
                )}
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor.bg} ${statusColor.text}`}>
                {statusLabel}
              </span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-xs text-[#8B8BA3]">
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                {metricLabel}
                {league.metric === "custom" && league.custom_metric_name && ` (${league.custom_metric_name})`}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                {formatDate(league.starts_at)} — {formatDate(league.ends_at)}
              </span>
              {league.prize && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                  {league.prize}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => onViewLeaderboard(league.id)}
                className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
              >
                Clasificacion
              </button>

              {league.status === "upcoming" && (
                <button
                  onClick={() => onUpdateStatus(league.id, "active")}
                  className="rounded-lg border border-[#00C853]/20 px-3 py-1.5 text-xs font-medium text-[#00C853] transition-colors hover:bg-[#00C853]/10"
                >
                  Activar
                </button>
              )}

              {league.status === "active" && (
                <button
                  onClick={() => onUpdateStatus(league.id, "completed")}
                  className="rounded-lg border border-[#FF9100]/20 px-3 py-1.5 text-xs font-medium text-[#FF9100] transition-colors hover:bg-[#FF9100]/10"
                >
                  Completar
                </button>
              )}

              {league.status !== "completed" && (
                <button
                  onClick={() => onEnrollAll(league.id)}
                  disabled={enrolling}
                  className="rounded-lg border border-[#7C3AED]/20 px-3 py-1.5 text-xs font-medium text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/10 disabled:opacity-50"
                >
                  {enrolling ? "Inscribiendo..." : "Inscribir todos"}
                </button>
              )}

              {isConfirmingDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDelete(league.id)}
                    disabled={deleting}
                    className="rounded-lg bg-[#FF1744]/10 px-3 py-1.5 text-xs font-medium text-[#FF1744] transition-colors hover:bg-[#FF1744]/20 disabled:opacity-50"
                  >
                    {deleting ? "Eliminando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => onConfirmDelete(null)}
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#8B8BA3] transition-colors hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onConfirmDelete(league.id)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#8B8BA3] transition-colors hover:text-[#FF1744]"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
