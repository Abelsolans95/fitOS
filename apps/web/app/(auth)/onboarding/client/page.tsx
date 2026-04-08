"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Spotlight, SpotlightCard } from "@/components/ui/spotlight";
import { createClient } from "@/lib/supabase";
import { groupFieldsBySection, getEnabledSections } from "@fitos/shared";
import { Spinner, StepIndicator } from "./components/Shared";
import { StepDynamicForm } from "./components/StepDynamicForm";
import { StepProfile } from "./components/StepProfile";
import type { FormField, OnboardingForm, TrainerInfo, Responses, GoalValue } from "./components/types";

export default function ClientOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Global loading / error
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [form, setForm] = useState<OnboardingForm | null>(null);
  const [responses, setResponses] = useState<Responses>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Profile state (last step)
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<GoalValue | "">("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  /* ----- Compute sections from form fields ----- */

  const sectionGroups = useMemo(() => {
    if (!form) return [];
    return getEnabledSections(groupFieldsBySection(form.fields as Array<FormField & Record<string, unknown>>));
  }, [form]);

  const hasSections = sectionGroups.some((g) => g.section !== null);

  // Steps: form steps (sections or 1 flat) + 1 profile step
  // If no form, only 1 step (profile)
  const formStepCount = form ? (hasSections ? sectionGroups.length : 1) : 0;
  const totalSteps = formStepCount + 1;

  const [step, setStep] = useState(1);
  const isProfileStep = step > formStepCount;
  const currentSectionIndex = step - 1; // 0-indexed into sectionGroups

  /* ----- Step labels for indicator ----- */

  const stepLabels = useMemo(() => {
    const labels: string[] = [];
    if (hasSections) {
      for (const group of sectionGroups) {
        labels.push(group.section?.label ?? "General");
      }
    } else if (form) {
      labels.push("Formulario de tu entrenador");
    }
    labels.push("Datos fisicos y preferencias");
    return labels;
  }, [hasSections, sectionGroups, form]);

  /* ----- Fetch trainer + form on mount ----- */

  const fetchTrainerForm = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setPageError("Debes iniciar sesion para continuar.");
        setPageLoading(false);
        return;
      }

      const trainerRes = await fetch("/api/client-trainer");
      if (!trainerRes.ok) {
        const body = await trainerRes.json().catch(() => ({}));
        setPageError(
          body.error || "No se encontro un entrenador vinculado a tu cuenta. Contacta con tu entrenador."
        );
        setPageLoading(false);
        return;
      }
      const tc: { trainer_id: string; full_name: string } = await trainerRes.json();
      setTrainer({ trainer_id: tc.trainer_id, full_name: tc.full_name });

      const { data: forms, error: formErr } = await supabase
        .from("onboarding_forms")
        .select("id, title, fields")
        .eq("trainer_id", tc.trainer_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (formErr) {
        setPageError("Error al cargar el formulario de onboarding.");
        setPageLoading(false);
        return;
      }

      if (forms && forms.length > 0) {
        const f = forms[0];
        setForm({
          id: f.id,
          title: f.title,
          fields: (f.fields as FormField[]) ?? [],
        });

        // Initialize boolean & multiselect fields
        const initial: Responses = {};
        for (const field of (f.fields as FormField[]) ?? []) {
          if (field.type === "boolean") initial[field.id] = false;
          if (field.type === "multiselect") initial[field.id] = [];
        }
        setResponses(initial);
      }
    } catch {
      setPageError("Ocurrio un error inesperado. Intenta nuevamente.");
    }

    setPageLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrainerForm();
  }, [fetchTrainerForm]);

  /* ----- Validation ----- */

  const validateCurrentFormStep = (): boolean => {
    if (!form) return true;

    // Get fields for current step
    const fieldsToValidate = hasSections
      ? (sectionGroups[currentSectionIndex]?.fields ?? [])
      : form.fields.filter((f) => f.type !== "section");

    const errors: Record<string, string> = {};
    for (const field of fieldsToValidate) {
      if (field.required) {
        const val = responses[field.id];
        if (val === undefined || val === "" || val === null) {
          errors[field.id] = "Este campo es obligatorio";
        } else if (Array.isArray(val) && val.length === 0) {
          errors[field.id] = "Selecciona al menos una opcion";
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    if (!height || Number(height) <= 0) errors.height = "Ingresa tu altura";
    if (!weight || Number(weight) <= 0) errors.weight = "Ingresa tu peso";
    if (!goal) errors.goal = "Selecciona un objetivo";
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ----- Save form responses ----- */

  const saveResponses = async (): Promise<boolean> => {
    if (!form || !trainer) return true;

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No auth");

      const { error: insertErr } = await supabase
        .from("onboarding_responses")
        .upsert(
          {
            form_id: form.id,
            client_id: user.id,
            trainer_id: trainer.trainer_id,
            responses,
          },
          { onConflict: "form_id,client_id" }
        );

      if (insertErr) {
        setPageError(`Error al guardar las respuestas: ${insertErr.message}`);
        setSubmitting(false);
        return false;
      }
    } catch {
      setPageError("Error al guardar las respuestas. Intenta nuevamente.");
      setSubmitting(false);
      return false;
    }
    setSubmitting(false);
    return true;
  };

  /* ----- Navigation ----- */

  const handleNext = async () => {
    if (!isProfileStep) {
      // Form step — validate current section
      if (!validateCurrentFormStep()) return;

      // Save after each section (upsert, so safe to call multiple times)
      const saved = await saveResponses();
      if (!saved) return;

      setStep(step + 1);
      setPageError(null);
      setFieldErrors({});
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setPageError(null);
      setFieldErrors({});
    }
  };

  /* ----- Final submit ----- */

  const handleComplete = async () => {
    if (!validateProfile()) return;

    setSubmitting(true);
    setPageError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No auth");

      const foodPreferences = {
        dietary_restrictions: dietaryRestrictions,
        allergies: allergies.trim(),
        disliked_foods: dislikedFoods.trim(),
      };

      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          role: (user.user_metadata?.role as string) || "client",
          height: Number(height),
          weight: Number(weight),
          goal,
          food_preferences: foodPreferences,
        }, { onConflict: "user_id" });

      if (profileErr) {
        setPageError(`Error al guardar tu perfil: ${profileErr.message}`);
        setSubmitting(false);
        return;
      }

      // Non-blocking body_metrics insert
      const { error: metricsErr } = await supabase
        .from("body_metrics")
        .insert({
          client_id: user.id,
          recorded_at: new Date().toISOString(),
          body_weight_kg: Number(weight),
        });
      if (metricsErr) {
        console.error("[ClientOnboardingPage] Error inserting body_metrics:", metricsErr);
      }

      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });

      router.push("/app/client/dashboard");
    } catch {
      setPageError("Ocurrio un error inesperado. Intenta nuevamente.");
      setSubmitting(false);
    }
  };

  /* ----- Response updater ----- */

  const updateResponse = (fieldId: string, val: string | number | boolean | string[]) => {
    setResponses((prev) => ({ ...prev, [fieldId]: val }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  /* ======================================================================== */
  /*  Loading State                                                           */
  /* ======================================================================== */

  if (pageLoading) {
    return (
      <Spotlight className="flex min-h-screen w-full items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-[#00E5FF]" />
          <p className="text-sm text-[#8B8BA3]">Cargando formulario...</p>
        </div>
      </Spotlight>
    );
  }

  /* ======================================================================== */
  /*  Error State (no trainer, etc.)                                          */
  /* ======================================================================== */

  if (pageError && !trainer) {
    return (
      <Spotlight className="flex min-h-screen w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Kuv<span className="text-[#00E5FF]">ox</span>
            </h1>
          </div>
          <SpotlightCard>
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF1744]/10">
                <svg
                  className="h-6 w-6 text-[#FF1744]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[#8B8BA3]">{pageError}</p>
              <button
                onClick={() => fetchTrainerForm()}
                className="mt-2 rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                Reintentar
              </button>
            </div>
          </SpotlightCard>
        </div>
      </Spotlight>
    );
  }

  /* ======================================================================== */
  /*  Main Wizard                                                             */
  /* ======================================================================== */

  return (
    <Spotlight className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Kuv<span className="text-[#00E5FF]">ox</span>
          </h1>
          <p className="mt-2 text-sm text-[#8B8BA3]">
            Completa tu perfil para empezar
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <StepIndicator current={step} total={totalSteps} />
          <div className="mt-3 flex justify-center">
            <span className="text-xs text-[#8B8BA3]">
              Paso {step} de {totalSteps}
              {stepLabels[step - 1] && ` — ${stepLabels[step - 1]}`}
            </span>
          </div>
        </div>

        <SpotlightCard className="max-h-[70vh] overflow-y-auto">
          {/* Form steps (sections or flat) */}
          {!isProfileStep && (
            <StepDynamicForm
              trainer={trainer}
              form={form}
              responses={responses}
              errors={fieldErrors}
              pageError={pageError}
              submitting={submitting}
              onUpdateResponse={updateResponse}
              onNext={handleNext}
              onBack={handleBack}
              sectionGroup={hasSections ? sectionGroups[currentSectionIndex] : undefined}
              isFirstStep={step === 1}
            />
          )}

          {/* Profile step */}
          {isProfileStep && (
            <StepProfile
              height={height}
              setHeight={setHeight}
              weight={weight}
              setWeight={setWeight}
              goal={goal}
              setGoal={setGoal}
              dietaryRestrictions={dietaryRestrictions}
              setDietaryRestrictions={setDietaryRestrictions}
              allergies={allergies}
              setAllergies={setAllergies}
              dislikedFoods={dislikedFoods}
              setDislikedFoods={setDislikedFoods}
              step2Errors={step2Errors}
              setStep2Errors={setStep2Errors}
              pageError={pageError}
              submitting={submitting}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          )}
        </SpotlightCard>
      </div>
    </Spotlight>
  );
}
