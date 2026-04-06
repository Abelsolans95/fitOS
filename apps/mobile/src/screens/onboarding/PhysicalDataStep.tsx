import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, fonts } from "../../theme";
import { GOAL_OPTIONS, DIETARY_RESTRICTIONS } from "./types";

interface PhysicalDataStepProps {
  height: string;
  weight: string;
  goal: string;
  dietaryRestrictions: string[];
  allergies: string;
  dislikedFoods: string;
  submitting: boolean;
  onHeightChange: (val: string) => void;
  onWeightChange: (val: string) => void;
  onGoalChange: (val: string) => void;
  onDietaryRestrictionsChange: (val: string[]) => void;
  onAllergiesChange: (val: string) => void;
  onDislikedFoodsChange: (val: string) => void;
  onBack: () => void;
  onComplete: () => void;
}

export function PhysicalDataStep({
  height,
  weight,
  goal,
  dietaryRestrictions,
  allergies,
  dislikedFoods,
  submitting,
  onHeightChange,
  onWeightChange,
  onGoalChange,
  onDietaryRestrictionsChange,
  onAllergiesChange,
  onDislikedFoodsChange,
  onBack,
  onComplete,
}: PhysicalDataStepProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Datos fisicos y preferencias</Text>
      <Text style={styles.sectionSubtitle}>
        Esta informacion nos ayuda a personalizar tus planes.
      </Text>

      {/* Height & Weight */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Altura (cm) <Text style={{ color: colors.red }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="170"
            placeholderTextColor={colors.muted + "80"}
            value={height}
            onChangeText={onHeightChange}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Peso (kg) <Text style={{ color: colors.red }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="70"
            placeholderTextColor={colors.muted + "80"}
            value={weight}
            onChangeText={onWeightChange}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Goal */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Objetivo <Text style={{ color: colors.red }}>*</Text></Text>
        <View style={styles.optionsGrid}>
          {GOAL_OPTIONS.map(({ label, value }) => {
            const isSelected = goal === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => onGoalChange(value)}
                style={[styles.optionButton, isSelected && styles.optionButtonActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Separator */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>Preferencias alimentarias</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Dietary restrictions */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Restricciones alimentarias</Text>
        <View style={styles.pillsWrap}>
          {DIETARY_RESTRICTIONS.map((r) => {
            const isSelected = dietaryRestrictions.includes(r);
            return (
              <TouchableOpacity
                key={r}
                onPress={() =>
                  onDietaryRestrictionsChange(
                    isSelected
                      ? dietaryRestrictions.filter((x) => x !== r)
                      : [...dietaryRestrictions, r]
                  )
                }
                style={[styles.pill, isSelected && styles.pillActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Allergies */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Alergias</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: cacahuetes, mariscos..."
          placeholderTextColor={colors.muted + "80"}
          value={allergies}
          onChangeText={onAllergiesChange}
          maxLength={500}
        />
      </View>

      {/* Disliked foods */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Alimentos que no me gustan</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: brocoli, higado..."
          placeholderTextColor={colors.muted + "80"}
          value={dislikedFoods}
          onChangeText={onDislikedFoodsChange}
          maxLength={500}
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, submitting && { opacity: 0.5 }]}
          onPress={onComplete}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.completeButtonText}>Completar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.white, textAlign: "center" },
  sectionSubtitle: { fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 4 },

  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontFamily: fonts.medium, color: colors.muted },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.white,
  },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1, gap: 8 },

  // Options (goal select)
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionButton: {
    flexBasis: "47%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionButtonActive: { borderColor: colors.cyan, backgroundColor: colors.cyan + "15" },
  optionText: { fontSize: 14, color: colors.muted },
  optionTextActive: { color: colors.cyan },

  // Pills (dietary restrictions)
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { borderColor: colors.violet, backgroundColor: colors.violet + "20" },
  pillText: { fontSize: 13, color: colors.muted },
  pillTextActive: { color: colors.violet },

  // Separator
  separator: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  separatorLine: { flex: 1, height: 1, backgroundColor: colors.border },
  separatorText: { fontSize: 12, color: colors.muted + "80" },

  // Buttons
  completeButton: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  completeButtonText: { fontSize: 16, fontFamily: fonts.bold, color: colors.bg },
  backButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backButtonText: { fontSize: 14, fontFamily: fonts.medium, color: colors.muted },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
});
