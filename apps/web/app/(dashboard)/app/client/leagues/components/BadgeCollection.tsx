"use client";

import React from "react";
import type { Badge, UserBadge } from "@kuvox/shared";
import { BADGE_ICONS } from "@kuvox/shared";

interface BadgeCollectionProps {
  badges: Badge[];
  userBadges: UserBadge[];
}

export const BadgeCollection = React.memo(function BadgeCollection({
  badges,
  userBadges,
}: BadgeCollectionProps) {
  const earnedSet = new Set(userBadges.map((ub) => ub.badge_id));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Mis Insignias
          <span className="ml-2 text-sm font-normal text-[#5A5A72]">
            {userBadges.length} / {badges.length}
          </span>
        </h2>

        {badges.length === 0 ? (
          <p className="text-center text-sm text-[#5A5A72] py-8">
            No hay insignias disponibles
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {badges.map((badge) => {
              const earned = earnedSet.has(badge.id);
              const icon = BADGE_ICONS[badge.icon] ?? badge.icon;
              const earnedBadge = userBadges.find(
                (ub) => ub.badge_id === badge.id
              );

              return (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    earned
                      ? "border-[#00E5FF]/20 bg-[#00E5FF]/5"
                      : "border-white/[0.04] bg-white/[0.02] opacity-40"
                  }`}
                >
                  <div className="mb-2 text-2xl">{icon}</div>
                  <p
                    className={`text-xs font-semibold ${
                      earned ? "text-white" : "text-[#5A5A72]"
                    }`}
                  >
                    {badge.name}
                  </p>
                  <p className="mt-1 text-[10px] text-[#5A5A72] line-clamp-2">
                    {badge.description}
                  </p>
                  {earned && earnedBadge && (
                    <p className="mt-2 text-[10px] text-[#00E5FF]">
                      {new Date(earnedBadge.earned_at).toLocaleDateString(
                        "es-ES",
                        {
                          day: "2-digit",
                          month: "short",
                        }
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
