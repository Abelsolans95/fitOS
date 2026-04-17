import React from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";
import { useHealthData } from "../hooks/useHealthData";
import { CalorieRing } from "./dashboard/CalorieRing";
import { HealthCard } from "./dashboard/HealthCard";
import { QuickActions } from "./dashboard/QuickActions";
import { useDashboardData, greeting } from "./dashboard/useDashboardData";
import { styles } from "./dashboard/styles";

export default function DashboardScreen() {
  const { user } = useAuth();
  const health = useHealthData(user);
  const { name, stats, refreshing, refresh } = useDashboardData(user?.id);

  const remaining = Math.max(stats.kcalTarget - stats.kcalConsumed, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refresh(health.refresh)}
          tintColor={colors.cyan}
        />
      }
    >
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

      <View style={styles.bentoRow}>
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
              <Text style={[styles.kcalMetaValue, { color: colors.green }]}>
                {remaining}
              </Text>
              <Text style={styles.kcalMetaLabel}>restante</Text>
            </View>
          </View>
        </View>

        <View style={styles.bentoSide}>
          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: stats.workoutDone ? colors.green : colors.dimmed,
                },
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

          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <View
              style={[styles.statusIndicator, { backgroundColor: colors.orange }]}
            />
            <Text style={styles.bentoSmallLabel}>RACHA</Text>
            <Text style={[styles.bentoSmallValue, { color: colors.orange }]}>
              {stats.streak} <Text style={styles.bentoSmallUnit}>días</Text>
            </Text>
          </View>
        </View>
      </View>

      <HealthCard
        steps={health.steps}
        sleepHours={health.sleepHours}
        heartRate={health.heartRate}
        weightKg={health.weightKg}
        loading={health.loading}
        available={health.available}
        permissionGranted={health.permissionGranted}
        onConnect={health.connectHealth}
        onRefresh={health.refresh}
      />

      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <QuickActions />
    </ScrollView>
  );
}
