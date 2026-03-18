import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "boolean" | "scale" | "date";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface OnboardingForm {
  id: string;
  title: string;
  fields: FormField[];
}

type Responses = Record<string, string | number | boolean | string[]>;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const GOAL_OPTIONS = [
  { label: "Hipertrofia", value: "hipertrofia" },
  { label: "Fuerza", value: "fuerza" },
  { label: "Perdida de peso", value: "perdida_peso" },
  { label: "Mantenimiento", value: "mantenimiento" },
];

const DIETARY_RESTRICTIONS = [
  "Vegetariano", "Vegano", "Sin gluten", "Sin lactosa",
  "Sin frutos secos", "Halal", "Kosher",
];

/* -------------------------------------------------------------------------- */
/*  Dynamic Field Renderer                                                     */
/* -------------------------------------------------------------------------- */

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | number | boolean | string[] | undefined;
  onChange: (val: string | number | boolean | string[]) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <TextInput
          style={styles.input}
          placeholder={field.placeholder || ""}
          placeholderTextColor={colors.muted + "80"}
          value={(value as string) ?? ""}
          onChangeText={(t) => onChange(t)}
        />
      );

    case "textarea":
      return (
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          placeholder={field.placeholder || ""}
          placeholderTextColor={colors.muted + "80"}
          value={(value as string) ?? ""}
          onChangeText={(t) => onChange(t)}
          multiline
        />
      );

    case "number":
      return (
        <TextInput
          style={styles.input}
          placeholder={field.placeholder || ""}
          placeholderTextColor={colors.muted + "80"}
          value={value !== undefined && value !== "" ? String(value) : ""}
          onChangeText={(t) => onChange(t === "" ? "" : Number(t))}
          keyboardType="decimal-pad"
        />
      );

    case "date":
      return (
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.muted + "80"}
          value={(value as string) ?? ""}
          onChangeText={(t) => onChange(t)}
        />
      );

    case "select":
      return (
        <View style={styles.optionsGrid}>
          {(field.options ?? []).map((option) => {
            const isSelected = value === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => onChange(option)}
                style={[styles.optionButton, isSelected && styles.optionButtonActive]}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <View style={styles.pillsWrap}>
          {(field.options ?? []).map((option) => {
            const isSelected = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                onPress={() =>
                  onChange(
                    isSelected ? selected.filter((s) => s !== option) : [...selected, option]
                  )
                }
                style={[styles.pill, isSelected && styles.pillActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    case "boolean":
      return (
        <View style={styles.switchRow}>
          <Switch
            value={!!value}
            onValueChange={(val) => onChange(val)}
            trackColor={{ false: colors.border, true: colors.cyan + "60" }}
            thumbColor={value ? colors.cyan : colors.muted}
          />
          <Text style={styles.switchLabel}>{value ? "Sí" : "No"}</Text>
        </View>
      );

    case "scale":
      return (
        <View style={styles.scaleRow}>
          {Array.from({ length: 10 }, (_, i) => {
            const n = i + 1;
            const isSelected = value === n;
            return (
              <TouchableOpacity
                key={n}
                onPress={() => onChange(n)}
                style={[styles.scaleButton, isSelected && styles.scaleButtonActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.scaleText, isSelected && styles.scaleTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Main Screen                                                                */
/* -------------------------------------------------------------------------- */

export default function OnboardingScreen() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Step 1
  const [trainerName, setTrainerName] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [form, setForm] = useState<OnboardingForm | null>(null);
  const [responses, setResponses] = useState<Responses>({});

  // Step 2
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");

  /* ----- Load trainer form ----- */

  const fetchData = useCallback(async () => {
    if (!user) return;
    setPageLoading(true);

    try {
      const { data: tc } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .limit(1)
        .single();

      if (!tc) {
        setPageError("No se encontró un entrenador vinculado a tu cuenta.");
        setPageLoading(false);
        return;
      }

      setTrainerId(tc.trainer_id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, business_name")
        .eq("user_id", tc.trainer_id)
        .single();

      setTrainerName(profile?.business_name || profile?.full_name || "Tu entrenador");

      const { data: forms } = await supabase
        .from("onboarding_forms")
        .select("id, title, fields")
        .eq("trainer_id", tc.trainer_id)
        .eq("is_active", true)
        .limit(1);

      if (forms && forms.length > 0) {
        const f = forms[0];
        const fields = (f.fields as FormField[]) ?? [];
        setForm({ id: f.id, title: f.title, fields });

        const initial: Responses = {};
        for (const field of fields) {
          if (field.type === "boolean") initial[field.id] = false;
          if (field.type === "multiselect") initial[field.id] = [];
        }
        setResponses(initial);
      }
    } catch {
      setPageError("Error al cargar el formulario.");
    }

    setPageLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ----- Step 1 → Save responses & advance ----- */

  const handleNext = async () => {
    // Validate required fields
    if (form) {
      for (const field of form.fields) {
        if (field.required) {
          const val = responses[field.id];
          if (val === undefined || val === "" || val === null) {
            Alert.alert("Campo obligatorio", `Por favor completa: ${field.label}`);
            return;
          }
          if (Array.isArray(val) && val.length === 0) {
            Alert.alert("Campo obligatorio", `Selecciona al menos una opción en: ${field.label}`);
            return;
          }
        }
      }

      setSubmitting(true);
      try {
        const { error } = await supabase.from("onboarding_responses").upsert(
          {
            form_id: form.id,
            client_id: user!.id,
            trainer_id: trainerId,
            responses,
          },
          { onConflict: "form_id,client_id" }
        );
        if (error) {
          Alert.alert("Error", "No se pudieron guardar las respuestas.");
          setSubmitting(false);
          return;
        }
      } catch {
        Alert.alert("Error", "Error inesperado.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    setStep(2);
  };

  /* ----- Step 2 → Save profile & complete ----- */

  const handleComplete = async () => {
    if (!height || Number(height) <= 0) {
      Alert.alert("Campo obligatorio", "Ingresa tu altura");
      return;
    }
    if (!weight || Number(weight) <= 0) {
      Alert.alert("Campo obligatorio", "Ingresa tu peso");
      return;
    }
    if (!goal) {
      Alert.alert("Campo obligatorio", "Selecciona un objetivo");
      return;
    }

    setSubmitting(true);

    try {
      const foodPreferences = {
        dietary_restrictions: dietaryRestrictions,
        allergies: allergies.trim(),
        disliked_foods: dislikedFoods.trim(),
      };

      await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user!.id,
            role: "client",
            height: Number(height),
            weight: Number(weight),
            goal,
            food_preferences: foodPreferences,
          },
          { onConflict: "user_id" }
        );

      await supabase.from("body_metrics").insert({
        client_id: user!.id,
        recorded_at: new Date().toISOString(),
        body_weight_kg: Number(weight),
      });

      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });

      // AuthContext will pick up the metadata change and re-render App
    } catch {
      Alert.alert("Error", "Error al guardar el perfil.");
    }

    setSubmitting(false);
  };

  /* ----- Loading ----- */

  if (pageLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.logo}>Fit<Text style={{ color: colors.cyan }}>OS</Text></Text>
        <ActivityIndicator size="large" color={colors.cyan} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  /* ----- Error (no trainer) ----- */

  if (pageError && !trainerId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.logo}>Fit<Text style={{ color: colors.cyan }}>OS</Text></Text>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{pageError}</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ----- Main ----- */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.logo}>Fit<Text style={{ color: colors.cyan }}>OS</Text></Text>
        <Text style={styles.subtitle}>Completa tu perfil para empezar</Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>
        <Text style={styles.stepLabel}>
          Paso {step} de 2 — {step === 1 ? "Formulario de tu entrenador" : "Datos físicos"}
        </Text>

        {/* ============ STEP 1 ============ */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Formulario de <Text style={{ color: colors.cyan }}>{trainerName}</Text>
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tu entrenador necesita esta información para personalizar tu plan.
            </Text>

            {!form ? (
              <View style={styles.noFormCard}>
                <Text style={styles.noFormText}>
                  Tu entrenador aún no ha configurado un formulario de onboarding.
                </Text>
                <Text style={styles.noFormHint}>Puedes continuar al siguiente paso.</Text>
              </View>
            ) : (
              form.fields.map((field) => (
                <View key={field.id} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {field.label}
                    {field.required && <Text style={{ color: colors.red }}> *</Text>}
                  </Text>
                  <DynamicField
                    field={field}
                    value={responses[field.id]}
                    onChange={(val) => setResponses((prev) => ({ ...prev, [field.id]: val }))}
                  />
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.primaryButton, submitting && { opacity: 0.5 }]}
              onPress={handleNext}
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
        )}

        {/* ============ STEP 2 ============ */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos físicos y preferencias</Text>
            <Text style={styles.sectionSubtitle}>
              Esta información nos ayuda a personalizar tus planes.
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
                  onChangeText={setHeight}
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
                  onChangeText={setWeight}
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
                      onPress={() => setGoal(value)}
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
                        setDietaryRestrictions((prev) =>
                          isSelected ? prev.filter((x) => x !== r) : [...prev, r]
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
                onChangeText={setAllergies}
              />
            </View>

            {/* Disliked foods */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Alimentos que no me gustan</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: brócoli, hígado..."
                placeholderTextColor={colors.muted + "80"}
                value={dislikedFoods}
                onChangeText={setDislikedFoods}
              />
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>Anterior</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.completeButton, submitting && { opacity: 0.5 }]}
                onPress={handleComplete}
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
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 24, paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 24 },

  logo: { fontSize: 36, fontWeight: "800", color: colors.white, textAlign: "center", marginTop: 16 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, marginBottom: 20 },
  loadingText: { fontSize: 13, color: colors.muted, marginTop: 12 },

  // Step indicator
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, borderWidth: 1, borderColor: colors.border },
  stepDotActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  stepLine: { width: 60, height: 2, backgroundColor: colors.border, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: colors.cyan },
  stepLabel: { fontSize: 12, color: colors.muted, textAlign: "center", marginBottom: 20 },

  // Sections
  section: { gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.white, textAlign: "center" },
  sectionSubtitle: { fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 4 },

  // Fields
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.muted },
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

  // Options (select)
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
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, justifyContent: "center", alignItems: "center" },
  radioOuterActive: { borderColor: colors.cyan, backgroundColor: colors.cyan },
  radioInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bg },

  // Pills (multiselect)
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { borderColor: colors.violet, backgroundColor: colors.violet + "20" },
  pillText: { fontSize: 13, color: colors.muted },
  pillTextActive: { color: colors.violet },

  // Switch
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchLabel: { fontSize: 14, color: colors.muted },

  // Scale
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scaleButton: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: "center", alignItems: "center",
  },
  scaleButtonActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  scaleText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  scaleTextActive: { color: colors.bg },

  // No form
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

  // Separator
  separator: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  separatorLine: { flex: 1, height: 1, backgroundColor: colors.border },
  separatorText: { fontSize: 12, color: colors.muted + "80" },

  // Buttons
  primaryButton: {
    backgroundColor: colors.cyan,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "700", color: colors.bg },
  completeButton: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  completeButtonText: { fontSize: 16, fontWeight: "700", color: colors.bg },
  backButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backButtonText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 8 },

  // Error
  errorCard: {
    backgroundColor: colors.red + "15",
    borderWidth: 1,
    borderColor: colors.red + "30",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  errorText: { fontSize: 14, color: colors.red, textAlign: "center" },
  retryButton: {
    backgroundColor: colors.cyan,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  retryButtonText: { fontSize: 15, fontWeight: "700", color: colors.bg },
});
