import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, radius, fonts } from "../../theme";

const stimulusLabels: Record<number, string> = {
  1: "Nada", 2: "Poco", 3: "Moderado", 4: "Bueno", 5: "Excelente",
};
const fatigueLabels: Record<number, string> = {
  1: "Mínima", 2: "Baja", 3: "Moderada", 4: "Alta", 5: "Extrema",
};

interface Props {
  exerciseName: string;
  stimulus: number;
  fatigue: number;
  onStimulusChange: (val: number) => void;
  onFatigueChange: (val: number) => void;
  onConfirm: () => void;
}

export function SfrScreen({ exerciseName, stimulus, fatigue, onStimulusChange, onFatigueChange, onConfirm }: Props) {
  const sfr = fatigue > 0 ? Math.round((stimulus / fatigue) * 100) / 100 : 0;
  const sfrColor = sfr >= 1.5 ? colors.green : sfr >= 1 ? colors.orange : colors.red;

  return (
    <View style={s.container}>
      <Text style={s.label}>EJERCICIO COMPLETADO</Text>
      <Text style={s.exerciseName}>{exerciseName}</Text>

      {/* Stimulus */}
      <Text style={s.sectionTitle}>ESTÍMULO MUSCULAR</Text>
      <Text style={s.sectionHint}>¿Cuánto notaste el músculo?</Text>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => onStimulusChange(v)}
            style={[s.btn, stimulus === v && { backgroundColor: colors.violet, borderColor: colors.violet }]}
            activeOpacity={0.7}
          >
            <Text style={[s.btnNum, stimulus === v && { color: colors.white }]}>{v}</Text>
            <Text style={[s.btnLabel, stimulus === v && { color: "rgba(255,255,255,0.8)" }]}>{stimulusLabels[v]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fatigue */}
      <Text style={[s.sectionTitle, { color: colors.orange }]}>FATIGA GENERADA</Text>
      <Text style={s.sectionHint}>¿Cuánta fatiga te dejó?</Text>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => onFatigueChange(v)}
            style={[s.btn, fatigue === v && { backgroundColor: colors.orange, borderColor: colors.orange }]}
            activeOpacity={0.7}
          >
            <Text style={[s.btnNum, fatigue === v && { color: colors.bg }]}>{v}</Text>
            <Text style={[s.btnLabel, fatigue === v && { color: "rgba(10,10,15,0.8)" }]}>{fatigueLabels[v]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SFR preview */}
      {stimulus > 0 && fatigue > 0 && (
        <View style={s.sfrBox}>
          <Text style={s.sfrLabel}>RATIO ESTÍMULO / FATIGA</Text>
          <Text style={[s.sfrValue, { color: sfrColor }]}>{sfr.toFixed(2)}</Text>
          <Text style={s.sfrHint}>
            {sfr >= 1.5 ? "Excelente relación" : sfr >= 1 ? "Aceptable" : "Más fatiga que estímulo"}
          </Text>
        </View>
      )}

      <TouchableOpacity style={s.confirmBtn} activeOpacity={0.8} onPress={onConfirm}>
        <Text style={s.confirmText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontSize: 10, fontFamily: fonts.bold,
    color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.xs,
  },
  exerciseName: {
    fontSize: 22, fontFamily: fonts.extraBold,
    color: colors.white, letterSpacing: -0.5,
    textAlign: "center", marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 10, fontFamily: fonts.bold,
    color: colors.violet, letterSpacing: 1.5, marginBottom: 4,
  },
  sectionHint: {
    fontSize: 11, color: colors.dimmed, marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row", gap: 8, marginBottom: spacing.lg,
  },
  btn: {
    flex: 1, alignItems: "center", paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  btnNum: {
    fontSize: 16, fontFamily: fonts.extraBold, color: colors.muted,
  },
  btnLabel: {
    fontSize: 8, fontFamily: fonts.bold,
    color: colors.dimmed, letterSpacing: 0.5,
    textTransform: "uppercase", marginTop: 2,
  },
  sfrBox: {
    alignItems: "center", marginBottom: spacing.lg,
  },
  sfrLabel: {
    fontSize: 9, fontFamily: fonts.bold,
    color: colors.dimmed, letterSpacing: 2, marginBottom: 4,
  },
  sfrValue: {
    fontSize: 40, fontFamily: fonts.extraBold,
  },
  sfrHint: {
    fontSize: 11, color: colors.dimmed, marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: colors.cyan, paddingHorizontal: 40,
    paddingVertical: 16, borderRadius: radius.xl,
  },
  confirmText: {
    fontSize: 16, fontFamily: fonts.bold, color: colors.bg,
  },
});
