import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";
import { useLeaguesData, type TabKey } from "./leagues/useLeaguesData";
import { LeagueCard } from "./leagues/LeagueCard";
import { BadgesGrid } from "./leagues/BadgesGrid";

// Generic trophy glyph to replace the 🏆 emoji (platform-inconsistent rendering).
function TrophyIcon({ size = 40, color = colors.dimmed }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
import { styles } from "./leagues/styles";

export default function LeaguesScreen() {
  const { user } = useAuth();
  const {
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
  } = useLeaguesData(user?.id);

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
        <TrophyIcon size={40} />
        <Text style={[styles.emptyTitle, { marginTop: 12 }]}>Ligas no disponibles</Text>
        <Text style={styles.emptySubtitle}>
          Tu entrenador aun no ha activado el sistema de gamificacion
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(124,58,237,0.15)", "transparent"]}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Ligas y Logros</Text>
        <Text style={styles.subtitle}>Compite y gana insignias</Text>
      </LinearGradient>

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
                <TrophyIcon size={32} />
                <Text style={[styles.emptyCardText, { marginTop: 8 }]}>
                  No hay ligas disponibles
                </Text>
              </View>
            ) : (
              leagues.map((league) => (
                <LeagueCard
                  key={league.id}
                  league={league}
                  isSelected={selectedLeagueId === league.id}
                  leaderboard={
                    selectedLeagueId === league.id ? leaderboard : []
                  }
                  loadingLeaderboard={loadingLeaderboard}
                  joining={joining}
                  onToggleSelect={handleSelectLeague}
                  onJoin={handleJoin}
                />
              ))
            )}
          </>
        )}

        {activeTab === "badges" && (
          <BadgesGrid badges={badges} userBadges={userBadges} />
        )}
      </ScrollView>
    </View>
  );
}
