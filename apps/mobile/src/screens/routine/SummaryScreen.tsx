import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { colors, spacing } from "../../theme";
import { formatTime } from "./constants";
import { CheckIcon } from "./icons";
import { st } from "./styles";

interface SummaryResult {
  name: string;
  progress: string;
  color: string;
}

interface Props {
  routineTitle: string;
  dayLabel: string;
  activeWeek: number;
  elapsed: number;
  summaryData: { totalVol: number; totalSetsCount: number; results: SummaryResult[] };
  onBack: () => void;
}

export function SummaryScreen({ routineTitle, dayLabel, activeWeek, elapsed, summaryData, onBack }: Props) {
  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <View style={st.summaryHeader}>
        <View style={st.summaryBadgeWrap}>
          <CheckIcon size={16} color={colors.green} />
          <Text style={st.summaryBadge}>SESIÓN COMPLETADA</Text>
        </View>
        <Text style={st.summaryTitle}>{routineTitle}</Text>
        <Text style={st.summaryDay}>{dayLabel} · Sem {activeWeek}</Text>
      </View>

      <View style={st.statsRow}>
        <View style={st.statCard}>
          <Text style={[st.statValue, { color: colors.cyan }]}>{formatTime(elapsed)}</Text>
          <Text style={st.statLabel}>DURACIÓN</Text>
        </View>
        <View style={st.statCard}>
          <Text style={[st.statValue, { color: colors.violet }]}>{Math.round(summaryData.totalVol).toLocaleString()}</Text>
          <Text style={st.statLabel}>VOL (KG)</Text>
        </View>
        <View style={st.statCard}>
          <Text style={[st.statValue, { color: colors.orange }]}>{summaryData.totalSetsCount}</Text>
          <Text style={st.statLabel}>SERIES</Text>
        </View>
      </View>

      <Text style={st.sectionLabel}>RESULTADOS POR EJERCICIO</Text>
      {summaryData.results.map((r, i) => (
        <View key={i} style={st.resultRow}>
          <View style={st.resultLeft}>
            <View style={st.resultIdx}><Text style={st.resultIdxText}>{i + 1}</Text></View>
            <Text style={st.resultName} numberOfLines={1}>{r.name}</Text>
          </View>
          <View style={[st.resultBadge, { backgroundColor: r.color + "15" }]}>
            <Text style={[st.resultProgress, { color: r.color }]}>{r.progress}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[st.primaryBtn, { marginTop: spacing.xxl }]}
        activeOpacity={0.8}
        onPress={onBack}
      >
        <Text style={st.primaryBtnText}>Volver a mi rutina</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
