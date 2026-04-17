import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme";
import { styles } from "./styles";

interface HeroCardProps {
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export const HeroCard = React.memo(function HeroCard({
  totalKcal,
  totalProtein,
  totalCarbs,
  totalFat,
}: HeroCardProps) {
  const macros = [
    { label: "PROTEÍNA", value: totalProtein, color: colors.cyan, unit: "g" },
    { label: "CARBOS", value: totalCarbs, color: colors.orange, unit: "g" },
    { label: "GRASA", value: totalFat, color: colors.violet, unit: "g" },
  ];

  return (
    <View style={styles.heroCard}>
      <LinearGradient
        colors={["rgba(0, 229, 255, 0.08)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.heroLabel}>HOY</Text>
      <Text style={styles.heroKcal}>{Math.round(totalKcal)}</Text>
      <Text style={styles.heroUnit}>kilocalorías</Text>

      <View style={styles.macroGrid}>
        {macros.map((m) => (
          <View key={m.label} style={styles.macroCell}>
            <View style={[styles.macroBar, { backgroundColor: m.color }]} />
            <Text style={[styles.macroValue, { color: m.color }]}>
              {Math.round(m.value)}
              {m.unit}
            </Text>
            <Text style={styles.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});
