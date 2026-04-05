import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts } from "../theme";
import { groupFieldsBySection, getEnabledSections } from "@fitos/shared";

import { FormStep } from "./onboarding/FormStep";
import { PhysicalDataStep } from "./onboarding/PhysicalDataStep";
import { StepIndicator } from "./onboarding/StepIndicator";
import type { FormField, OnboardingForm, Responses } from "./onboarding/types";

/* -------------------------------------------------------------------------- */
/*  Main Screen (orchestrator)                                                 */
/* -------------------------------------------------------------------------- */

export default function OnboardingScreen() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form data
  const [trainerName, setTrainerName] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [form, setForm] = useState<OnboardingForm | null>(null);
  const [responses, setResponses] = useState<Responses>({});

  // Profile data
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");

  /* ----- Compute sections from form fields ----- */

  const sectionGroups = useMemo(() => {
    if (!form) return [];
    return getEnabledSections(
      groupFieldsBySection(form.fields as Array<FormField & Record<string, unknown>>)
    );
  }, [form]);

  const hasSections = sectionGroups.some((g) => g.section !== null);
  const formStepCount = form ? (hasSections ? sectionGroups.length : 1) : 0;
  const totalSteps = formStepCount + 1;
  const isProfileStep = step > formStepCount;
  const currentSectionIndex = step - 1;

  const stepLabel = useMemo(() => {
    if (isProfileStep) return "Datos fisicos";
    if (hasSections) return sectionGroups[currentSectionIndex]?.section?.label ?? "General";
    return "Formulario de tu entrenador";
  }, [isProfileStep, hasSections, sectionGroups, currentSectionIndex]);

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
        setPageError("No se encontro un entrenador vinculado a tu cuenta.");
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
        .order("created_at", { ascending: false })
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

  /* ----- Save responses ----- */

  const saveResponses = async (): Promise<boolean> => {
    if (!form || !trainerId || !user) return true;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("onboarding_responses").upsert(
        {
          form_id: form.id,
          client_id: user.id,
          trainer_id: trainerId,
          responses,
        },
        { onConflict: "form_id,client_id" }
      );
      if (error) {
        Alert.alert("Error", "No se pudieron guardar las respuestas.");
        setSubmitting(false);
        return false;
      }
    } catch {
      Alert.alert("Error", "Error inesperado.");
      setSubmitting(false);
      return false;
    }
    setSubmitting(false);
    return true;
  };

  /* ----- Validation ----- */

  const validateCurrentFormStep = (): boolean => {
    if (!form) return true;

    const fieldsToValidate = hasSections
      ? (sectionGroups[currentSectionIndex]?.fields ?? [])
      : form.fields.filter((f) => f.type !== "section");

    for (const field of fieldsToValidate) {
      if (field.required) {
        const val = responses[field.id];
        if (val === undefined || val === "" || val === null) {
          Alert.alert("Campo obligatorio", `Por favor completa: ${field.label}`);
          return false;
        }
        if (Array.isArray(val) && val.length === 0) {
          Alert.alert("Campo obligatorio", `Selecciona al menos una opcion en: ${field.label}`);
          return false;
        }
      }
    }
    return true;
  };

  /* ----- Navigation ----- */

  const handleNext = async () => {
    if (!isProfileStep) {
      if (!validateCurrentFormStep()) return;
      const saved = await saveResponses();
      if (!saved) return;
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  /* ----- Complete ----- */

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
    } catch {
      Alert.alert("Error", "Error al guardar el perfil.");
    }

    setSubmitting(false);
  };

  /* ----- Response change handler ----- */

  const handleResponseChange = useCallback(
    (fieldId: string, val: string | number | boolean | string[]) => {
      setResponses((prev) => ({ ...prev, [fieldId]: val }));
    },
    []
  );

  /* ----- Get fields for current form step ----- */

  const currentFields = useMemo((): FormField[] => {
    if (!form || isProfileStep) return [];
    if (hasSections) return (sectionGroups[currentSectionIndex]?.fields ?? []) as FormField[];
    return form.fields.filter((f) => f.type !== "section");
  }, [form, isProfileStep, hasSections, sectionGroups, currentSectionIndex]);

  const currentSection = hasSections
    ? sectionGroups[currentSectionIndex]?.section ?? null
    : null;

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
        <Text style={styles.logo}>Fit<Text style={{ color: colors.cyan }}>OS</Text></Text>
        <Text style={styles.subtitle}>Completa tu perfil para empezar</Text>

        <StepIndicator currentStep={step} totalSteps={totalSteps} stepLabel={stepLabel} />

        {!isProfileStep && (
          <FormStep
            form={form}
            currentFields={currentFields}
            currentSection={currentSection}
            trainerName={trainerName}
            responses={responses}
            step={step}
            submitting={submitting}
            onResponseChange={handleResponseChange}
            onBack={handleBack}
            onNext={handleNext}
          />
        )}

        {isProfileStep && (
          <PhysicalDataStep
            height={height}
            weight={weight}
            goal={goal}
            dietaryRestrictions={dietaryRestrictions}
            allergies={allergies}
            dislikedFoods={dislikedFoods}
            submitting={submitting}
            onHeightChange={setHeight}
            onWeightChange={setWeight}
            onGoalChange={setGoal}
            onDietaryRestrictionsChange={setDietaryRestrictions}
            onAllergiesChange={setAllergies}
            onDislikedFoodsChange={setDislikedFoods}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles (orchestrator-only: loading, error, layout)                         */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 24, paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 24 },

  logo: { fontSize: 36, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, textAlign: "center", marginTop: 16 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, marginBottom: 20 },
  loadingText: { fontSize: 13, color: colors.muted, marginTop: 12 },

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
  retryButtonText: { fontSize: 15, fontFamily: fonts.bold, color: colors.bg },
});
