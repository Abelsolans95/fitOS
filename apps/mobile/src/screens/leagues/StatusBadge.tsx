import React from "react";
import { View, Text } from "react-native";
import type { LeagueStatus } from "@fitos/shared";
import { LEAGUE_STATUSES } from "@fitos/shared";
import { styles } from "./styles";

const colorMap: Record<LeagueStatus, string> = {
  upcoming: "#FF9100",
  active: "#00C853",
  completed: "#8B8BA3",
};

export function StatusBadge({ status }: { status: LeagueStatus }) {
  const label = LEAGUE_STATUSES.find((s) => s.value === status)?.label ?? status;
  const color = colorMap[status] ?? "#8B8BA3";

  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}
