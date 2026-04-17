import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { colors } from "../../theme";
import { styles } from "./styles";

interface HealthCardProps {
  steps: number | null;
  sleepHours: number | null;
  heartRate: number | null;
  weightKg: number | null;
  loading: boolean;
  available: boolean;
  permissionGranted: boolean;
  onConnect: () => void;
  onRefresh: () => void;
}

export const HealthCard = React.memo(function HealthCard({
  steps,
  sleepHours,
  heartRate,
  weightKg,
  loading,
  available,
  permissionGranted,
  onConnect,
  onRefresh,
}: HealthCardProps) {
  if (!available) return null;

  if (!permissionGranted) {
    return (
      <TouchableOpacity
        style={styles.healthConnectCard}
        onPress={onConnect}
        activeOpacity={0.85}
        disabled={loading}
      >
        <LinearGradient
          colors={["#12121A", "#1a1a2e"]}
          style={styles.healthConnectGradient}
        >
          <View style={styles.healthConnectContent}>
            <View
              style={[
                styles.healthIconBox,
                { backgroundColor: colors.greenDim },
              ]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  stroke={colors.green}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.healthConnectTitle}>Conectar Salud</Text>
              <Text style={styles.healthConnectSubtitle}>
                {Platform.OS === "ios" ? "Apple Health" : "Health Connect"} — pasos, sueno, peso
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={colors.green} />
            ) : (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  stroke={colors.muted}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const hasAnyData =
    steps != null || sleepHours != null || heartRate != null || weightKg != null;

  return (
    <View style={styles.healthCard}>
      <View style={styles.healthCardHeader}>
        <Text style={styles.healthCardTitle}>
          {Platform.OS === "ios" ? "APPLE HEALTH" : "HEALTH CONNECT"}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={loading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.cyan} />
          ) : (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                stroke={colors.cyan}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </TouchableOpacity>
      </View>

      {!hasAnyData && !loading ? (
        <Text style={styles.healthNoData}>Sin datos disponibles</Text>
      ) : (
        <View style={styles.healthGrid}>
          <View style={styles.healthMetric}>
            <View style={[styles.healthMetricDot, { backgroundColor: colors.cyan }]} />
            <Text style={styles.healthMetricLabel}>Pasos</Text>
            <Text style={[styles.healthMetricValue, { color: colors.cyan }]}>
              {steps != null ? steps.toLocaleString("es-ES") : "—"}
            </Text>
          </View>

          <View style={styles.healthMetric}>
            <View style={[styles.healthMetricDot, { backgroundColor: colors.violet }]} />
            <Text style={styles.healthMetricLabel}>Sueno</Text>
            <Text style={[styles.healthMetricValue, { color: colors.violet }]}>
              {sleepHours != null ? `${sleepHours}h` : "—"}
            </Text>
          </View>

          <View style={styles.healthMetric}>
            <View style={[styles.healthMetricDot, { backgroundColor: colors.error }]} />
            <Text style={styles.healthMetricLabel}>FC</Text>
            <Text style={[styles.healthMetricValue, { color: colors.error }]}>
              {heartRate != null ? `${heartRate}` : "—"}
            </Text>
            {heartRate != null && <Text style={styles.healthMetricUnit}>bpm</Text>}
          </View>

          <View style={styles.healthMetric}>
            <View style={[styles.healthMetricDot, { backgroundColor: colors.green }]} />
            <Text style={styles.healthMetricLabel}>Peso</Text>
            <Text style={[styles.healthMetricValue, { color: colors.green }]}>
              {weightKg != null ? `${weightKg}` : "—"}
            </Text>
            {weightKg != null && <Text style={styles.healthMetricUnit}>kg</Text>}
          </View>
        </View>
      )}
    </View>
  );
});
