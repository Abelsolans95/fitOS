"use client";

import React from "react";
import type { League, LeagueParticipant, LeagueStatus } from "@kuvox/shared";
import { LEAGUE_METRICS, LEAGUE_STATUSES } from "@kuvox/shared";

interface ClientLeagueListProps {
  leagues: League[];
  selectedLeagueId: string | null;
  leaderboard: LeagueParticipant[];
  loadingLeaderboard: boolean;
  joining: boolean;
  onSelectLeague: (id: string | null) => void;
  onJoin: (id: string) => void;
}

const STATUS_COLORS: Record<LeagueStatus, { bg: string; text: string }> = {
  upcoming: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]" },
  active: { bg: "bg-[#00C853]/10", text: "text-[#00C853]" },
  completed: { bg: "bg-[#8B8BA3]/10", text: "text-[#8B8BA3]" },
};

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

export const ClientLeagueList = React.memo(function ClientLeagueList({
  leagues,
  selectedLeagueId,
  leaderboard,
  loadingLeaderboard,
  joining,
  onSelectLeague,
  onJoin,
}: ClientLeagueListProps) {
  if (leagues.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#7C3AED]/10">
          <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-3.52 1.122 6.023 6.023 0 0 1-3.52-1.122" />
          </svg>
        </div>
        <p className="text-sm text-[#8B8BA3]">No hay ligas disponibles</p>
        <p className="mt-1 text-xs text-[#5A5A72]">
          Tu entrenador aun no ha creado ninguna liga
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
        const isSelected = selectedLeagueId === league.id;

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
              <span>{metricLabel}</span>
              <span>
                {formatDate(league.starts_at)} — {formatDate(league.ends_at)}
              </span>
              {league.prize && <span>Premio: {league.prize}</span>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onSelectLeague(isSelected ? null : league.id)}
                className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
              >
                {isSelected ? "Ocultar clasificacion" : "Ver clasificacion"}
              </button>

              {league.status !== "completed" && (
                <button
                  onClick={() => onJoin(league.id)}
                  disabled={joining}
                  className="rounded-lg bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-medium text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/20 disabled:opacity-50"
                >
                  {joining ? "Uniendose..." : "Unirse"}
                </button>
              )}
            </div>

            {/* Leaderboard inline */}
            {isSelected && (
              <div className="mt-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                {loadingLeaderboard ? (
                  <div className="flex h-20 items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-center text-xs text-[#5A5A72] py-4">
                    No hay participantes aun
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((p) => {
                      const rank = p.rank ?? 0;
                      const isPodium = rank >= 1 && rank <= 3;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-lg px-3 py-2"
                        >
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: isPodium
                                ? `${PODIUM_COLORS[rank - 1]}20`
                                : "rgba(255,255,255,0.04)",
                              color: isPodium ? PODIUM_COLORS[rank - 1] : "#8B8BA3",
                            }}
                          >
                            {rank}
                          </div>
                          <p className="flex-1 text-sm text-white truncate">
                            {p.client_name ?? "Sin nombre"}
                          </p>
                          <p className="text-sm font-bold text-[#00E5FF]">
                            {Number(p.score).toLocaleString("es-ES")} pts
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
