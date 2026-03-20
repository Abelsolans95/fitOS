import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DailyStats {
  kcalConsumed: number;
  kcalTarget: number;
  workoutDone: boolean;
  streak: number;
}

// Circular progress ring using SVG
function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const size = 120;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceHover}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.cyan}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.ringNumber}>{consumed}</Text>
      <Text style={styles.ringUnit}>kcal</Text>
    </View>
  );
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

  const remaining = Math.max(stats.kcalTarget - stats.kcalConsumed, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>{name || "Atleta"}</Text>
        </View>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[colors.cyan, colors.violet]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {(name || "A").charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* Bento Grid: Main calorie card + side stats */}
      <View style={styles.bentoRow}>
        {/* Large calorie card */}
        <View style={[styles.bentoCard, styles.bentoLarge]}>
          <Text style={styles.bentoCardLabel}>CALORÍAS HOY</Text>
          <CalorieRing consumed={stats.kcalConsumed} target={stats.kcalTarget} />
          <View style={styles.kcalMeta}>
            <View style={styles.kcalMetaItem}>
              <Text style={styles.kcalMetaValue}>{stats.kcalTarget}</Text>
              <Text style={styles.kcalMetaLabel}>objetivo</Text>
            </View>
            <View style={styles.kcalMetaDivider} />
            <View style={styles.kcalMetaItem}>
              <Text style={[styles.kcalMetaValue, { color: colors.green }]}>{remaining}</Text>
              <Text style={styles.kcalMetaLabel}>restante</Text>
            </View>
          </View>
        </View>

        {/* Side stack */}
        <View style={styles.bentoSide}>
          {/* Workout status */}
          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: stats.workoutDone ? colors.green : colors.dimmed },
              ]}
            />
            <Text style={styles.bentoSmallLabel}>ENTRENO</Text>
            <Text
              style={[
                styles.bentoSmallValue,
                { color: stats.workoutDone ? colors.green : colors.muted },
              ]}
            >
              {stats.workoutDone ? "Hecho" : "Pendiente"}
            </Text>
          </View>

          {/* Streak */}
          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.orange }]} />
            <Text style={styles.bentoSmallLabel}>RACHA</Text>
            <Text style={[styles.bentoSmallValue, { color: colors.orange }]}>
              {stats.streak} <Text style={styles.bentoSmallUnit}>días</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Quick actions - bento style */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsGrid}>
        {[
          {
            label: "Escanear\ncomida",
            color: colors.cyan,
            bgColor: colors.cyanDim,
            icon: (
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  stroke={colors.cyan}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  stroke={colors.cyan}
                  strokeWidth={1.5}
                />
              </Svg>
            ),
          },
          {
            label: "Ver\nrutina",
            color: colors.violet,
            bgColor: colors.violetDim,
            icon: (
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3.75 13.5L14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  stroke={colors.violet}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ),
          },
          {
            label: "Registrar\npeso",
            color: colors.green,
            bgColor: colors.greenDim,
            icon: (
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941"
                  stroke={colors.green}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ),
          },
          {
            label: "Ver\nmenú",
            color: colors.orange,
            bgColor: colors.orangeDim,
            icon: (
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5"
                  stroke={colors.orange}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ),
          },
        ].map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.7}>
            <View style={[styles.actionIconBox, { backgroundColor: action.bgColor }]}>
              {action.icon}
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  greeting: { fontSize: 13, color: colors.muted, letterSpacing: 0.3 },
  name: { fontSize: 28, fontWeight: "900", color: colors.white, letterSpacing: -0.5, marginTop: 2 },
  avatarContainer: { ...shadows.glow(colors.cyan) },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: colors.bg },

  // Bento Grid
  bentoRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  bentoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.subtle,
  },
  bentoLarge: {
    flex: 3,
    alignItems: "center",
  },
  bentoSide: {
    flex: 2,
    gap: spacing.md,
  },
  bentoSmall: {
    flex: 1,
    justifyContent: "center",
  },
  bentoCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.dimmed,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },

  // Calorie ring
  ringNumber: { fontSize: 26, fontWeight: "900", color: colors.white, letterSpacing: -1 },
  ringUnit: { fontSize: 10, color: colors.muted, marginTop: -2, letterSpacing: 1 },

  // Kcal meta
  kcalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  kcalMetaItem: { alignItems: "center" },
  kcalMetaValue: { fontSize: 16, fontWeight: "800", color: colors.white },
  kcalMetaLabel: { fontSize: 9, color: colors.dimmed, letterSpacing: 1, marginTop: 2 },
  kcalMetaDivider: { width: 1, height: 24, backgroundColor: colors.border },

  // Status cards
  statusIndicator: { width: 6, height: 6, borderRadius: 3, marginBottom: spacing.sm },
  bentoSmallLabel: { fontSize: 9, fontWeight: "700", color: colors.dimmed, letterSpacing: 1.5, marginBottom: 4 },
  bentoSmallValue: { fontSize: 18, fontWeight: "800", color: colors.white },
  bentoSmallUnit: { fontSize: 12, fontWeight: "600" },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.dimmed,
    letterSpacing: 2,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },

  // Actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  actionCard: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2 - 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 18,
  },
});
