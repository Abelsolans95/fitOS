import React from "react";
import { View, Text } from "react-native";
import type { Badge, UserBadge } from "@fitos/shared";
import { BADGE_ICONS } from "@fitos/shared";
import { colors } from "../../theme";
import { styles } from "./styles";

interface BadgesGridProps {
  badges: Badge[];
  userBadges: UserBadge[];
}

export const BadgesGrid = React.memo(function BadgesGrid({
  badges,
  userBadges,
}: BadgesGridProps) {
  const earnedSet = new Set(userBadges.map((ub) => ub.badge_id));

  return (
    <View style={styles.badgesGrid}>
      <Text style={styles.badgesHeader}>
        Mis Insignias ({userBadges.length} / {badges.length})
      </Text>
      {badges.length === 0 ? (
        <Text style={styles.emptyCardText}>No hay insignias disponibles</Text>
      ) : (
        <View style={styles.badgesRow}>
          {badges.map((badge) => {
            const earned = earnedSet.has(badge.id);
            const icon = BADGE_ICONS[badge.icon] ?? badge.icon;

            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  earned ? styles.badgeEarned : styles.badgeLocked,
                ]}
              >
                <Text style={styles.badgeIcon}>{icon}</Text>
                <Text
                  style={[
                    styles.badgeName,
                    !earned && { color: colors.dimmed },
                  ]}
                  numberOfLines={1}
                >
                  {badge.name}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>
                  {badge.description}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});
