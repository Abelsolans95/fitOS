import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, fonts } from "../../theme";
import { DynamicField } from "./DynamicField";
import type { FormField, OnboardingForm, Responses } from "./types";
import type { SectionGroup } from "@fitos/shared";

interface FormStepProps {
  form: OnboardingForm | null;
  currentFields: FormField[];
  currentSection: SectionGroup["section"] | null;
  trainerName: string;
  responses: Responses;
  step: number;
  submitting: boolean;
  onResponseChange: (fieldId: string, val: string | number | boolean | string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function FormStep({
  form,
  currentFields,
  currentSection,
  trainerName,
  responses,
  step,
  submitting,
  onResponseChange,
  onBack,
  onNext,
}: FormStepProps) {
  return (
    <View style={styles.section}>
      {/* Section header */}
      {currentSection ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.violet }]}>
            {currentSection.label}
          </Text>
          {currentSection.description && (
            <Text style={styles.sectionSubtitle}>{currentSection.description}</Text>
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            Formulario de <Text style={{ color: colors.cyan }}>{trainerName}</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            Tu entrenador necesita esta informacion para personalizar tu plan.
          </Text>
        </>
      )}

      {!form ? (
        <View style={styles.noFormCard}>
          <Text style={styles.noFormText}>
            Tu entrenador aun no ha configurado un formulario de onboarding.
          </Text>
          <Text style={styles.noFormHint}>Puedes continuar al siguiente paso.</Text>
        </View>
      ) : (
        currentFields.map((field) => (
          <View key={field.id} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={{ color: colors.red }}> *</Text>}
            </Text>
            <DynamicField
              field={field}
              value={responses[field.id]}
              onChange={(val) => onResponseChange(field.id, val)}
            />
          </View>
        ))
      )}

      {/* Navigation */}
      <View style={styles.actionsRow}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.primaryButton, submitting && { opacity: 0.5 }, step > 1 && { flex: 1 }]}
          onPress={onNext}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.primaryButtonText}>Siguiente</Text>
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

  noFormCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
  },
  noFormText: { fontSize: 14, color: colors.muted, textAlign: "center" },
  noFormHint: { fontSize: 12, color: colors.muted + "80", textAlign: "center", marginTop: 8 },

  primaryButton: {
    backgroundColor: colors.cyan,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 16, fontFamily: fonts.bold, color: colors.bg },
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
