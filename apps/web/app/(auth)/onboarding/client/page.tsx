"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Spotlight, SpotlightCard } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface FormField {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "multiselect"
    | "boolean"
    | "scale"
    | "date";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface OnboardingForm {
  id: string;
  title: string;
  fields: FormField[];
}

interface TrainerInfo {
  trainer_id: string;
  full_name: string;
}

type Responses = Record<string, string | number | boolean | string[]>;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const GOAL_OPTIONS = [
  { label: "Hipertrofia", value: "hipertrofia" },
  { label: "Fuerza", value: "fuerza" },
  { label: "Perdida de peso", value: "perdida_peso" },
  { label: "Mantenimiento", value: "mantenimiento" },
] as const;

type GoalValue = typeof GOAL_OPTIONS[number]["value"];

const DIETARY_RESTRICTIONS = [
  "Vegetariano",
  "Vegano",
  "Sin gluten",
  "Sin lactosa",
  "Sin frutos secos",
  "Halal",
  "Kosher",
] as const;

/* -------------------------------------------------------------------------- */
/*  Spinner                                                                   */
/* -------------------------------------------------------------------------- */

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step Indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isCompleted = step < current;
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-[#00E5FF] text-[#0A0A0F] shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  : isCompleted
                  ? "bg-[#00C853] text-[#0A0A0F]"
                  : "border border-white/[0.08] text-[#8B8BA3]"
              }`}
            >
              {isCompleted ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step
              )}
            </div>
            {i < total - 1 && (
              <div
                className={`h-px w-12 transition-colors duration-300 ${
                  isCompleted ? "bg-[#00C853]" : "bg-white/[0.08]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dynamic Field Renderer                                                    */
/* -------------------------------------------------------------------------- */

function DynamicField({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: string | number | boolean | string[] | undefined;
  onChange: (val: string | number | boolean | string[]) => void;
  error?: string;
}) {
  const inputClasses =
    "border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20";

  switch (field.type) {
    case "text":
      return (
        <Input
          type="text"
          placeholder={field.placeholder || ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
        />
      );

    case "textarea":
      return (
        <textarea
          placeholder={field.placeholder || ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2 text-sm text-white placeholder:text-[#8B8BA3]/50 outline-none transition-colors focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 resize-none`}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder || ""}
          value={value !== undefined && value !== "" ? String(value) : ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : Number(v));
          }}
          className={inputClasses}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClasses} [color-scheme:dark]`}
        />
      );

    case "select":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl border p-3 text-left text-sm transition-all duration-200 ${
                value === option
                  ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                  : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    value === option
                      ? "border-[#00E5FF] bg-[#00E5FF]"
                      : "border-white/20"
                  }`}
                >
                  {value === option && (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#0A0A0F]" />
                  )}
                </div>
                {option}
              </div>
            </button>
          ))}
        </div>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange(
                    isSelected
                      ? selected.filter((s) => s !== option)
                      : [...selected, option]
                  )
                }
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
                  isSelected
                    ? "border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED]"
                    : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    case "boolean":
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={!!value}
            onCheckedChange={(val) => onChange(val)}
            className="data-[state=checked]:bg-[#00E5FF]"
          />
          <span className="text-sm text-[#8B8BA3]">
            {value ? "Si" : "No"}
          </span>
        </div>
      );

    case "scale":
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => {
            const n = i + 1;
            const isSelected = value === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-[#00E5FF] text-[#0A0A0F] shadow-[0_0_12px_rgba(0,229,255,0.25)]"
                    : "border border-white/[0.08] text-[#8B8BA3] hover:border-[#00E5FF]/40 hover:bg-[#1A1A2E]"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function ClientOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Wizard state
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  // Global loading / error
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [form, setForm] = useState<OnboardingForm | null>(null);
  const [responses, setResponses] = useState<Responses>({});
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2 state
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<GoalValue | "">("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  /* ----- Fetch trainer + form on mount ----- */

  const fetchTrainerForm = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);

    try {
      // 1. Get current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setPageError("Debes iniciar sesion para continuar.");
        setPageLoading(false);
        return;
      }

      // 2. Get trainer via API (bypasses RLS)
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

      // 4. Get active onboarding form (most recent)
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

        // Initialize boolean fields to false
        const initial: Responses = {};
        for (const field of (f.fields as FormField[]) ?? []) {
          if (field.type === "boolean") initial[field.id] = false;
          if (field.type === "multiselect") initial[field.id] = [];
        }
        setResponses(initial);
      }
      // If no forms found, step 1 will show a message and let the user skip
    } catch {
      setPageError("Ocurrio un error inesperado. Intenta nuevamente.");
    }

    setPageLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrainerForm();
  }, [fetchTrainerForm]);

  /* ----- Step 1 validation ----- */

  const validateStep1 = (): boolean => {
    if (!form) return true; // No form = skip

    const errors: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.required) {
        const val = responses[field.id];
        if (val === undefined || val === "" || val === null) {
          errors[field.id] = "Este campo es obligatorio";
        } else if (Array.isArray(val) && val.length === 0) {
          errors[field.id] = "Selecciona al menos una opcion";
        }
      }
    }
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ----- Step 2 validation ----- */

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!height || Number(height) <= 0) errors.height = "Ingresa tu altura";
    if (!weight || Number(weight) <= 0) errors.weight = "Ingresa tu peso";
    if (!goal) errors.goal = "Selecciona un objetivo";
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ----- Navigation handlers ----- */

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;

      // Save step 1 responses to DB if form exists
      if (form && trainer) {
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
            return;
          }
        } catch {
          setPageError("Error al guardar las respuestas. Intenta nuevamente.");
          setSubmitting(false);
          return;
        }
        setSubmitting(false);
      }

      setStep(2);
      setPageError(null);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setPageError(null);
    }
  };

  /* ----- Final submit ----- */

  const handleComplete = async () => {
    if (!validateStep2()) return;

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

      // Update profile (upsert in case trigger didn't create the row)
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

      // Insert body_metrics
      const { error: metricsErr } = await supabase
        .from("body_metrics")
        .insert({
          client_id: user.id,
          recorded_at: new Date().toISOString(),
          body_weight_kg: Number(weight),
        });

      if (metricsErr) {
        // Non-blocking — log but continue
        console.error("[ClientOnboardingPage] Error inserting body_metrics:", metricsErr);
      }

      // Mark onboarding as completed in user metadata
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });

      router.push("/app/client/dashboard");
    } catch {
      setPageError("Ocurrio un error inesperado. Intenta nuevamente.");
      setSubmitting(false);
    }
  };

  /* ----- Render helpers ----- */

  const updateResponse = (fieldId: string, val: string | number | boolean | string[]) => {
    setResponses((prev) => ({ ...prev, [fieldId]: val }));
    // Clear error for this field on change
    if (step1Errors[fieldId]) {
      setStep1Errors((prev) => {
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
              Fit<span className="text-[#00E5FF]">OS</span>
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
            Fit<span className="text-[#00E5FF]">OS</span>
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
              {step === 1 && " — Formulario de tu entrenador"}
              {step === 2 && " — Datos fisicos y preferencias"}
            </span>
          </div>
        </div>

        <SpotlightCard className="max-h-[70vh] overflow-y-auto">
          {/* ============================================================== */}
          {/*  STEP 1: Trainer's Onboarding Form                             */}
          {/* ============================================================== */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Trainer header */}
              {trainer && (
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-white">
                    Formulario de{" "}
                    <span className="text-[#00E5FF]">{trainer.full_name}</span>
                  </h2>
                  <p className="mt-1 text-xs text-[#8B8BA3]">
                    Tu entrenador necesita esta informacion para personalizar tu
                    plan.
                  </p>
                </div>
              )}

              {/* No form case */}
              {!form && (
                <div className="rounded-xl border border-white/[0.08] bg-[#1A1A2E]/50 p-6 text-center">
                  <div className="mb-3 flex justify-center">
                    <svg
                      className="h-10 w-10 text-[#8B8BA3]/50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-[#8B8BA3]">
                    Tu entrenador aun no ha configurado un formulario de
                    onboarding.
                  </p>
                  <p className="mt-1 text-xs text-[#8B8BA3]/60">
                    Puedes continuar al siguiente paso.
                  </p>
                </div>
              )}

              {/* Dynamic fields */}
              {form &&
                form.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-[#8B8BA3]">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-[#FF1744]">*</span>
                      )}
                    </Label>
                    <DynamicField
                      field={field}
                      value={responses[field.id]}
                      onChange={(val) => updateResponse(field.id, val)}
                      error={step1Errors[field.id]}
                    />
                    {step1Errors[field.id] && (
                      <p className="text-xs text-[#FF1744]">
                        {step1Errors[field.id]}
                      </p>
                    )}
                  </div>
                ))}

              {/* Error banner */}
              {pageError && (
                <div className="rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
                  {pageError}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-3 text-sm font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Spinner />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Siguiente
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/*  STEP 2: Physical Data & Preferences                           */}
          {/* ============================================================== */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white">
                  Datos fisicos y preferencias
                </h2>
                <p className="mt-1 text-xs text-[#8B8BA3]">
                  Esta informacion nos ayuda a personalizar tus planes.
                </p>
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-[#8B8BA3]">
                    Altura (cm) <span className="text-[#FF1744]">*</span>
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    min={1}
                    max={300}
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      if (step2Errors.height)
                        setStep2Errors((p) => {
                          const c = { ...p };
                          delete c.height;
                          return c;
                        });
                    }}
                    className={`border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:ring-[#00E5FF]/20 ${
                      step2Errors.height
                        ? "border-[#FF1744] focus:border-[#FF1744]"
                        : "focus:border-[#00E5FF]"
                    }`}
                  />
                  {step2Errors.height && (
                    <p className="text-xs text-[#FF1744]">
                      {step2Errors.height}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-[#8B8BA3]">
                    Peso (kg) <span className="text-[#FF1744]">*</span>
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    min={1}
                    max={500}
                    step="0.1"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      if (step2Errors.weight)
                        setStep2Errors((p) => {
                          const c = { ...p };
                          delete c.weight;
                          return c;
                        });
                    }}
                    className={`border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:ring-[#00E5FF]/20 ${
                      step2Errors.weight
                        ? "border-[#FF1744] focus:border-[#FF1744]"
                        : "focus:border-[#00E5FF]"
                    }`}
                  />
                  {step2Errors.weight && (
                    <p className="text-xs text-[#FF1744]">
                      {step2Errors.weight}
                    </p>
                  )}
                </div>
              </div>

              {/* Goal */}
              <div className="space-y-2">
                <Label className="text-[#8B8BA3]">
                  Objetivo <span className="text-[#FF1744]">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setGoal(value);
                        if (step2Errors.goal)
                          setStep2Errors((p) => {
                            const c = { ...p };
                            delete c.goal;
                            return c;
                          });
                      }}
                      className={`rounded-xl border p-3 text-sm transition-all duration-200 ${
                        goal === value
                          ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                          : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {step2Errors.goal && (
                  <p className="text-xs text-[#FF1744]">{step2Errors.goal}</p>
                )}
              </div>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#12121A] px-3 text-[#8B8BA3]/60">
                    Preferencias alimentarias
                  </span>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div className="space-y-2">
                <Label className="text-[#8B8BA3]">
                  Restricciones alimentarias
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_RESTRICTIONS.map((restriction) => {
                    const isSelected =
                      dietaryRestrictions.includes(restriction);
                    return (
                      <button
                        key={restriction}
                        type="button"
                        onClick={() =>
                          setDietaryRestrictions((prev) =>
                            isSelected
                              ? prev.filter((r) => r !== restriction)
                              : [...prev, restriction]
                          )
                        }
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
                          isSelected
                            ? "border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED]"
                            : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
                        }`}
                      >
                        {restriction}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label htmlFor="allergies" className="text-[#8B8BA3]">
                  Alergias
                </Label>
                <Input
                  id="allergies"
                  type="text"
                  placeholder="Ej: cacahuetes, mariscos..."
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                />
              </div>

              {/* Foods I don't like */}
              <div className="space-y-2">
                <Label htmlFor="dislikedFoods" className="text-[#8B8BA3]">
                  Alimentos que no me gustan
                </Label>
                <Input
                  id="dislikedFoods"
                  type="text"
                  placeholder="Ej: brocoli, higado..."
                  value={dislikedFoods}
                  onChange={(e) => setDislikedFoods(e.target.value)}
                  className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                />
              </div>

              {/* Error banner */}
              {pageError && (
                <div className="rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
                  {pageError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-[#8B8BA3] transition-all duration-200 hover:border-white/20 hover:bg-[#1A1A2E] hover:text-white disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 17l-5-5m0 0l5-5m-5 5h12"
                    />
                  </svg>
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#00C853] px-6 py-3 text-sm font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Spinner />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Completar
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </SpotlightCard>
      </div>
    </Spotlight>
  );
}
