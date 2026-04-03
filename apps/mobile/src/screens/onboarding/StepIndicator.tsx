import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export function StepIndicator({ currentStep, totalSteps, stepLabel }: StepIndicatorProps) {
  return (
    <>
      <View style={styles.stepRow}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <View style={[styles.stepDot, currentStep >= i + 1 && styles.stepDotActive]} />
            {i < totalSteps - 1 && (
              <View style={[styles.stepLine, currentStep > i + 1 && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.stepLabel}>
        Paso {currentStep} de {totalSteps} — {stepLabel}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, borderWidth: 1, borderColor: colors.border },
  stepDotActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  stepLine: { width: 30, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.cyan },
  stepLabel: { fontSize: 12, color: colors.muted, textAlign: "center", marginBottom: 20 },
});
