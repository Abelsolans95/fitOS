import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import type {
  League,
  LeagueParticipant,
  Badge,
  UserBadge,
} from "@fitos/shared";

export type TabKey = "leagues" | "badges";

export interface LeaguesData {
  loading: boolean;
  refreshing: boolean;
  gamificationEnabled: boolean;
  leagues: League[];
  badges: Badge[];
  userBadges: UserBadge[];
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  selectedLeagueId: string | null;
  leaderboard: LeagueParticipant[];
  loadingLeaderboard: boolean;
  joining: boolean;
  loadData: (isRefresh?: boolean) => Promise<void>;
  handleSelectLeague: (leagueId: string) => void;
  handleJoin: (leagueId: string) => Promise<void>;
}

export function useLeaguesData(userId: string | undefined): LeaguesData {
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
      if (!userId) return;
      if (isRefresh) setRefreshing(true);

      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", userId)
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
            .eq("user_id", userId),
        ]);

      setGamificationEnabled(communityRes.data?.gamification_enabled ?? false);
      setLeagues((leaguesRes.data as League[]) ?? []);
      setBadges((badgesRes.data as Badge[]) ?? []);
      setUserBadges((userBadgesRes.data as UserBadge[]) ?? []);
      setLoading(false);
      setRefreshing(false);
    },
    [userId]
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
      Alert.alert("Error", "No se pudo cargar la clasificacion");
      setLoadingLeaderboard(false);
      return;
    }

    const clientIds = (participants ?? []).map((p) => p.client_id);
    const profileMap: Record<string, string> = {};
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
      if (!userId) return;
      setJoining(true);

      const { error } = await supabase.from("league_participants").insert({
        league_id: leagueId,
        client_id: userId,
        score: 0,
      });

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Info", "Ya participas en esta liga");
        } else {
          Alert.alert("Error", "No se pudo unir a la liga");
        }
      } else {
        Alert.alert("Exito", "Te has unido a la liga");
      }

      setJoining(false);
    },
    [userId]
  );

  return {
    loading,
    refreshing,
    gamificationEnabled,
    leagues,
    badges,
    userBadges,
    activeTab,
    setActiveTab,
    selectedLeagueId,
    leaderboard,
    loadingLeaderboard,
    joining,
    loadData,
    handleSelectLeague,
    handleJoin,
  };
}
