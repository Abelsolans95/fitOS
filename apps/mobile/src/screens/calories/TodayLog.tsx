import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, spacing } from "../../theme";
import type { FoodLogEntry } from "./types";
import { MEAL_LABELS } from "./types";
import { styles } from "./styles";

interface TodayLogProps {
  loading: boolean;
  logs: FoodLogEntry[];
}

export const TodayLog = React.memo(function TodayLog({
  loading,
  logs,
}: TodayLogProps) {
  return (
    <>
      <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>
        REGISTRO DEL DÍA
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 20 }} />
      ) : logs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513"
                stroke={colors.dimmed}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={styles.emptyText}>Sin registros hoy</Text>
          <Text style={styles.emptySubtext}>Escanea tu primera comida</Text>
        </View>
      ) : (
        logs.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logLeft}>
              <View style={styles.logTimeBox}>
                <Text style={styles.logTime}>
                  {new Date(log.logged_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View>
                <Text style={styles.logMealType}>
                  {MEAL_LABELS[log.meal_type] ?? log.meal_type}
                </Text>
                <View style={styles.logMacroRow}>
                  <Text style={[styles.logMacro, { color: colors.cyan }]}>
                    P:{Math.round(log.total_protein)}g
                  </Text>
                  <Text style={[styles.logMacro, { color: colors.orange }]}>
                    C:{Math.round(log.total_carbs)}g
                  </Text>
                  <Text style={[styles.logMacro, { color: colors.violet }]}>
                    G:{Math.round(log.total_fat)}g
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.logRight}>
              <Text style={styles.logKcal}>{Math.round(log.total_kcal)}</Text>
              <Text style={styles.logKcalUnit}>kcal</Text>
              {(log.source === "ai_vision" || log.source === "ai_suggestion") && (
                <View
                  style={[
                    styles.aiBadge,
                    log.source === "ai_suggestion" && {
                      backgroundColor: colors.orangeDim,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.aiBadgeText,
                      log.source === "ai_suggestion" && { color: colors.orange },
                    ]}
                  >
                    {log.source === "ai_suggestion" ? "SUGERENCIA" : "IA"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </>
  );
});
