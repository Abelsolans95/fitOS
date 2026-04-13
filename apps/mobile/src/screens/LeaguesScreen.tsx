import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, fonts } from "../theme";
import { shadows } from "../theme";
import type {
  League,
  LeagueParticipant,
  Badge,
  UserBadge,
  LeagueStatus,
} from "@fitos/shared";
import { LEAGUE_METRICS, LEAGUE_STATUSES, BADGE_ICONS } from "@fitos/shared";

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

type TabKey = "leagues" | "badges";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function StatusBadge({ status }: { status: LeagueStatus }) {
  const colorMap: Record<LeagueStatus, string> = {
    upcoming: "#FF9100",
    active: "#00C853",
    completed: "#8B8BA3",
  };
  const label = LEAGUE_STATUSES.find((s) => s.value === status)?.label ?? status;
  const color = colorMap[status] ?? "#8B8BA3";

  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export default function LeaguesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gamificationEnabled, setGamificationEnabled] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("leagues");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeagueParticipant[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [joining, setJoining] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);

      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (!rel) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [communityRes, leaguesRes, badgesRes, userBadgesRes] =
        await Promise.all([
          supabase
            .from("communities")
            .select("gamification_enabled")
            .eq("coach_id", rel.trainer_id)
            .single(),
          supabase
            .from("leagues")
            .select(
              "id, trainer_id, title, description, metric, custom_metric_name, starts_at, ends_at, prize, status, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(100),
          supabase.from("badges").select("id, name, description, icon, condition"),
          supabase
            .from("user_badges")
            .select("id, user_id, badge_id, earned_at")
            .eq("user_id", user.id),
        ]);

      setGamificationEnabled(communityRes.data?.gamification_enabled ?? false);
      setLeagues((leaguesRes.data as League[]) ?? []);
      setBadges((badgesRes.data as Badge[]) ?? []);
      setUserBadges((userBadgesRes.data as UserBadge[]) ?? []);
      setLoading(false);
      setRefreshing(false);
    },
    [user]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadLeaderboard = useCallback(async (leagueId: string) => {
    setLoadingLeaderboard(true);
    const { data: participants, error } = await supabase
      .from("league_participants")
      .select("id, league_id, client_id, score, rank, joined_at")
      .eq("league_id", leagueId)
      .order("score", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[LeaguesScreen] Error loading leaderboard");
      Alert.alert("Error", "No se pudo cargar la clasificacion");
      setLoadingLeaderboard(false);
      return;
    }

    const clientIds = (participants ?? []).map((p) => p.client_id);
    let profileMap: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", clientIds);

      (profiles ?? []).forEach((p) => {
        profileMap[p.user_id] = p.full_name ?? "Sin nombre";
      });
    }

    const enriched = (participants ?? []).map((p, idx) => ({
      ...p,
      rank: idx + 1,
      client_name: profileMap[p.client_id] ?? "Sin nombre",
    }));

    setLeaderboard(enriched);
    setLoadingLeaderboard(false);
  }, []);

  const handleSelectLeague = useCallback(
    (leagueId: string) => {
      if (selectedLeagueId === leagueId) {
        setSelectedLeagueId(null);
        setLeaderboard([]);
        return;
      }
      setSelectedLeagueId(leagueId);
      loadLeaderboard(leagueId);
    },
    [selectedLeagueId, loadLeaderboard]
  );

  const handleJoin = useCallback(
    async (leagueId: string) => {
      if (!user) return;
      setJoining(true);

      const { error } = await supabase.from("league_participants").insert({
        league_id: leagueId,
        client_id: user.id,
        score: 0,
      });

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Info", "Ya participas en esta liga");
        } else {
          console.error("[LeaguesScreen] Error joining league");
          Alert.alert("Error", "No se pudo unir a la liga");
        }
      } else {
        Alert.alert("Exito", "Te has unido a la liga");
      }

      setJoining(false);
    },
    [user]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cyan} size="large" />
      </View>
    );
  }

  if (!gamificationEnabled) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>Ligas no disponibles</Text>
        <Text style={styles.emptySubtitle}>
          Tu entrenador aun no ha activado el sistema de gamificacion
        </Text>
      </View>
    );
  }

  const earnedSet = new Set(userBadges.map((ub) => ub.badge_id));

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["rgba(124,58,237,0.15)", "transparent"]}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Ligas y Logros</Text>
        <Text style={styles.subtitle}>Compite y gana insignias</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(["leagues", "badges"] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "leagues" ? "Ligas" : "Insignias"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.cyan}
          />
        }
      >
        {activeTab === "leagues" && (
          <>
            {leagues.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyCardText}>No hay ligas disponibles</Text>
              </View>
            ) : (
              leagues.map((league) => {
                const metricLabel =
                  LEAGUE_METRICS.find((m) => m.value === league.metric)?.label ??
                  league.metric;
                const isSelected = selectedLeagueId === league.id;

                return (
                  <View key={league.id} style={styles.card}>
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
                        {formatDate(league.starts_at)} —{" "}
                        {formatDate(league.ends_at)}
                      </Text>
                    </View>

                    {league.prize ? (
                      <Text style={styles.prize}>Premio: {league.prize}</Text>
                    ) : null}

                    {/* Actions */}
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSelectLeague(league.id)}
                      >
                        <Text style={styles.actionBtnText}>
                          {isSelected ? "Ocultar" : "Clasificacion"}
                        </Text>
                      </TouchableOpacity>

                      {league.status !== "completed" && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.joinBtn]}
                          onPress={() => handleJoin(league.id)}
                          disabled={joining}
                        >
                          <Text style={styles.joinBtnText}>
                            {joining ? "..." : "Unirse"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Leaderboard */}
                    {isSelected && (
                      <View style={styles.leaderboard}>
                        {loadingLeaderboard ? (
                          <ActivityIndicator
                            color={colors.cyan}
                            style={{ marginVertical: 16 }}
                          />
                        ) : leaderboard.length === 0 ? (
                          <Text style={styles.emptyLeaderboard}>
                            No hay participantes aun
                          </Text>
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
                                      isPodium && {
                                        color: PODIUM_COLORS[rank - 1],
                                      },
                                    ]}
                                  >
                                    {rank}
                                  </Text>
                                </View>
                                <Text
                                  style={styles.leaderName}
                                  numberOfLines={1}
                                >
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
              })
            )}
          </>
        )}

        {activeTab === "badges" && (
          <View style={styles.badgesGrid}>
            <Text style={styles.badgesHeader}>
              Mis Insignias ({userBadges.length} / {badges.length})
            </Text>
            {badges.length === 0 ? (
              <Text style={styles.emptyCardText}>
                No hay insignias disponibles
              </Text>
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
                        earned
                          ? styles.badgeEarned
                          : styles.badgeLocked,
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
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "rgba(0,229,255,0.1)",
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.dimmed,
  },
  tabTextActive: {
    color: colors.cyan,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  prize: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: "#FF9100",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.cyan,
  },
  joinBtn: {
    borderColor: "rgba(124,58,237,0.2)",
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  joinBtnText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.violet,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
  },
  leaderboard: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
    paddingTop: 12,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  leaderName: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  leaderScore: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.cyan,
  },
  emptyLeaderboard: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    paddingVertical: 16,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260,
  },
  emptyCardText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    textAlign: "center",
  },
  // Badges
  badgesGrid: {
    gap: 12,
  },
  badgesHeader: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    width: "47%",
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
  },
  badgeEarned: {
    borderColor: "rgba(0,229,255,0.2)",
    backgroundColor: "rgba(0,229,255,0.05)",
  },
  badgeLocked: {
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.02)",
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.white,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    textAlign: "center",
    marginTop: 4,
  },
});
