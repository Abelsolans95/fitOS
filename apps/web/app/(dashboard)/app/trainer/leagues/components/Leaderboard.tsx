"use client";

import React from "react";
import type { LeagueParticipant } from "@kuvox/shared";

interface LeaderboardProps {
  participants: LeagueParticipant[];
  loading: boolean;
  onClose: () => void;
  leagueTitle: string;
}

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export const Leaderboard = React.memo(function Leaderboard({
  participants,
  loading,
  onClose,
  leagueTitle,
}: LeaderboardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Clasificacion</h3>
          <button onClick={onClose} className="text-[#5A5A72] hover:text-white transition-colors text-sm">
            Cerrar
          </button>
        </div>
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Clasificacion</h3>
          <p className="text-xs text-[#5A5A72] mt-0.5">{leagueTitle}</p>
        </div>
        <button onClick={onClose} className="text-[#5A5A72] hover:text-white transition-colors text-sm">
          Cerrar
        </button>
      </div>

      {participants.length === 0 ? (
        <p className="text-center text-sm text-[#5A5A72] py-8">
          No hay participantes aun
        </p>
      ) : (
        <div className="space-y-2">
          {participants.map((p) => {
            const rank = p.rank ?? 0;
            const isPodium = rank >= 1 && rank <= 3;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  isPodium ? "bg-white/[0.04]" : "bg-white/[0.02]"
                }`}
              >
                {/* Rank */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: isPodium
                      ? `${PODIUM_COLORS[rank - 1]}20`
                      : "rgba(255,255,255,0.04)",
                    color: isPodium ? PODIUM_COLORS[rank - 1] : "#8B8BA3",
                  }}
                >
                  {rank}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {p.client_name ?? "Sin nombre"}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-sm font-bold text-[#00E5FF]">
                    {Number(p.score).toLocaleString("es-ES")}
                  </p>
                  <p className="text-[10px] text-[#5A5A72]">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
