import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import type { League, LeagueParticipant, LeagueStatus } from "@kuvox/shared";
import { LEAGUE_METRICS } from "@kuvox/shared";
import { colors } from "../../theme";
import { styles, PODIUM_COLORS, formatDate } from "./styles";
import { StatusBadge } from "./StatusBadge";

interface LeagueCardProps {
  league: League;
  isSelected: boolean;
  leaderboard: LeagueParticipant[];
  loadingLeaderboard: boolean;
  joining: boolean;
  onToggleSelect: (leagueId: string) => void;
  onJoin: (leagueId: string) => void;
}

export const LeagueCard = React.memo(function LeagueCard({
  league,
  isSelected,
  leaderboard,
  loadingLeaderboard,
  joining,
  onToggleSelect,
  onJoin,
}: LeagueCardProps) {
  const metricLabel =
    LEAGUE_METRICS.find((m) => m.value === league.metric)?.label ?? league.metric;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {league.title}
        </Text>
        <StatusBadge status={league.status as LeagueStatus} />
      </View>

      {league.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {league.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{metricLabel}</Text>
        <Text style={styles.metaText}>
          {formatDate(league.starts_at)} — {formatDate(league.ends_at)}
        </Text>
      </View>

      {league.prize ? (
        <Text style={styles.prize}>Premio: {league.prize}</Text>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onToggleSelect(league.id)}
        >
          <Text style={styles.actionBtnText}>
            {isSelected ? "Ocultar" : "Clasificacion"}
          </Text>
        </TouchableOpacity>

        {league.status !== "completed" && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.joinBtn]}
            onPress={() => onJoin(league.id)}
            disabled={joining}
          >
            <Text style={styles.joinBtnText}>{joining ? "..." : "Unirse"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSelected && (
        <View style={styles.leaderboard}>
          {loadingLeaderboard ? (
            <ActivityIndicator color={colors.cyan} style={{ marginVertical: 16 }} />
          ) : leaderboard.length === 0 ? (
            <Text style={styles.emptyLeaderboard}>No hay participantes aun</Text>
          ) : (
            leaderboard.map((p) => {
              const rank = p.rank ?? 0;
              const isPodium = rank >= 1 && rank <= 3;
              return (
                <View key={p.id} style={styles.leaderRow}>
                  <View
                    style={[
                      styles.rankCircle,
                      isPodium && {
                        backgroundColor: `${PODIUM_COLORS[rank - 1]}30`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        isPodium && { color: PODIUM_COLORS[rank - 1] },
                      ]}
                    >
                      {rank}
                    </Text>
                  </View>
                  <Text style={styles.leaderName} numberOfLines={1}>
                    {p.client_name ?? "Sin nombre"}
                  </Text>
                  <Text style={styles.leaderScore}>
                    {Number(p.score).toLocaleString("es-ES")} pts
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
});
