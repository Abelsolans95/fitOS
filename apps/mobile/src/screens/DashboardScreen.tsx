import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";

interface DailyStats {
  kcalConsumed: number;
  kcalTarget: number;
  workoutDone: boolean;
  streak: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [stats, setStats] = useState<DailyStats>({
    kcalConsumed: 0,
    kcalTarget: 2200,
    workoutDone: false,
    streak: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    if (profile) setName(profile.full_name || "");

    const today = new Date().toISOString().split("T")[0];

    // Today's food
    const { data: foodLogs } = await supabase
      .from("food_log")
      .select("total_kcal")
      .eq("client_id", user.id)
      .gte("logged_at", today)
      .lte("logged_at", today + "T23:59:59");

    const kcalConsumed = foodLogs?.reduce((sum, log) => sum + (log.total_kcal || 0), 0) || 0;

    // Today's workout
    const { data: workouts } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", user.id)
      .gte("logged_at", today)
      .limit(1);

    setStats((prev) => ({
      ...prev,
      kcalConsumed: Math.round(kcalConsumed),
      workoutDone: (workouts?.length || 0) > 0,
    }));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const kcalPct = stats.kcalTarget > 0 ? Math.min((stats.kcalConsumed / stats.kcalTarget) * 100, 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.cyan}
        />
      }
    >
      {/* Welcome */}
      <Text style={styles.greeting}>{greeting()},</Text>
      <Text style={styles.name}>{name || "Atleta"}</Text>

      {/* Kcal ring card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calorías hoy</Text>
        <View style={styles.kcalRow}>
          <View style={styles.kcalRingContainer}>
            <View style={[styles.kcalRingBg]} />
            <View
              style={[
                styles.kcalRingFill,
                {
                  transform: [{ rotate: `${(kcalPct / 100) * 360}deg` }],
                },
              ]}
            />
            <View style={styles.kcalRingCenter}>
              <Text style={styles.kcalNumber}>{stats.kcalConsumed}</Text>
              <Text style={styles.kcalUnit}>kcal</Text>
            </View>
          </View>
          <View style={styles.kcalDetails}>
            <View style={styles.kcalDetail}>
              <Text style={styles.kcalDetailLabel}>Objetivo</Text>
              <Text style={styles.kcalDetailValue}>{stats.kcalTarget} kcal</Text>
            </View>
            <View style={styles.kcalDetail}>
              <Text style={styles.kcalDetailLabel}>Restante</Text>
              <Text style={[styles.kcalDetailValue, { color: colors.green }]}>
                {Math.max(stats.kcalTarget - stats.kcalConsumed, 0)} kcal
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Status cards */}
      <View style={styles.statusRow}>
        <View style={[styles.statusCard, styles.statusCardHalf]}>
          <View style={[styles.statusDot, { backgroundColor: stats.workoutDone ? colors.green : colors.muted }]} />
          <Text style={styles.statusLabel}>Entreno hoy</Text>
          <Text style={[styles.statusValue, { color: stats.workoutDone ? colors.green : colors.muted }]}>
            {stats.workoutDone ? "Completado" : "Pendiente"}
          </Text>
        </View>
        <View style={[styles.statusCard, styles.statusCardHalf]}>
          <View style={[styles.statusDot, { backgroundColor: colors.orange }]} />
          <Text style={styles.statusLabel}>Racha</Text>
          <Text style={[styles.statusValue, { color: colors.orange }]}>
            {stats.streak} días
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsGrid}>
        {[
          { label: "Registrar comida", icon: "📸", color: colors.orange },
          { label: "Ver rutina", icon: "💪", color: colors.cyan },
          { label: "Añadir peso", icon: "⚖️", color: colors.violet },
          { label: "Ver menú", icon: "🍽️", color: colors.green },
        ].map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 100 },
  greeting: { fontSize: 14, color: colors.muted, marginTop: 8 },
  name: { fontSize: 28, fontWeight: "800", color: colors.white, marginBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 16 },
  kcalRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  kcalRingContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  kcalRingBg: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: colors.surfaceHover,
  },
  kcalRingFill: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: colors.cyan,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  kcalRingCenter: { alignItems: "center" },
  kcalNumber: { fontSize: 22, fontWeight: "800", color: colors.white },
  kcalUnit: { fontSize: 11, color: colors.muted },
  kcalDetails: { flex: 1, gap: 12 },
  kcalDetail: {},
  kcalDetailLabel: { fontSize: 12, color: colors.muted },
  kcalDetailValue: { fontSize: 16, fontWeight: "700", color: colors.white },
  statusRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  statusCardHalf: { flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  statusLabel: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  statusValue: { fontSize: 15, fontWeight: "700", color: colors.white },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: colors.white, textAlign: "center" },
});
