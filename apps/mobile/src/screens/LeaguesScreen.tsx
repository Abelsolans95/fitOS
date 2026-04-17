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
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";
import { useLeaguesData, type TabKey } from "./leagues/useLeaguesData";
import { LeagueCard } from "./leagues/LeagueCard";
import { BadgesGrid } from "./leagues/BadgesGrid";
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
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>Ligas no disponibles</Text>
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
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyCardText}>
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
