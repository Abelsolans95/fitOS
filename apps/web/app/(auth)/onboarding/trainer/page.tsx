"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spotlight, SpotlightCard } from "@/components/ui/spotlight";
import { type FormField } from "@/components/onboarding/FormFieldEditor";
import { createClient } from "@/lib/supabase";
import { Spinner, StepIndicator } from "./components/Shared";
import { StepProfile, type Specialty } from "./components/StepProfile";
import { StepFormEditor } from "./components/StepFormEditor";
import { StepPromoCode } from "./components/StepPromoCode";

export default function TrainerOnboardingPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const routerRef = useRef(router);
  routerRef.current = router;

  // Global state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // Step 0 state
  const [businessName, setBusinessName] = useState("");
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const [bio, setBio] = useState("");

  // Step 1 state
  const [formTitle, setFormTitle] = useState("Formulario de Onboarding");
  const [formDescription, setFormDescription] = useState(
    "Completa este formulario para que pueda conocerte mejor y personalizar tu plan."
  );
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formTab, setFormTab] = useState<"editor" | "preview">("editor");

  // Step 2 state
  const [promoCode, setPromoCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabaseRef.current.auth.getUser();
      if (!user) {
        routerRef.current.push("/login");
        return;
      }
      setUserId(user.id);
      setUserName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || ""
      );
    }
    fetchUser();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Step 0 — Save Business Profile                                   */
  /* ---------------------------------------------------------------- */

  const isStep1Valid = businessName.trim().length > 0 && specialty !== "";

  const saveBusinessProfile = async () => {
    if (!userId || !isStep1Valid) return;
    setError(null);
    setLoading(true);

    try {
      const { error: upsertError } = await supabaseRef.current
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            role: "trainer",
            business_name: businessName.trim(),
            specialty,
            bio: bio.trim() || null,
          },
          { onConflict: "user_id" }
        );

      if (upsertError) throw upsertError;
      setCurrentStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el perfil. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Step 1 — Save Onboarding Form                                    */
  /* ---------------------------------------------------------------- */

  const isStep2Valid = formTitle.trim().length > 0 && formFields.length > 0;

  const saveOnboardingForm = async () => {
    if (!userId || !isStep2Valid) return;
    setError(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabaseRef.current
        .from("onboarding_forms")
        .insert({
          trainer_id: userId,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          fields: formFields,
          is_active: true,
        });

      if (insertError) throw insertError;
      setCurrentStep(2);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el formulario. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Step 2 — Generate promo code                                     */
  /* ---------------------------------------------------------------- */

  // Refs to read current state values in the promo-code effect without adding them as deps
  const businessNameRef = useRef(businessName);
  businessNameRef.current = businessName;
  const userNameRef = useRef(userName);
  userNameRef.current = userName;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const promoCodeRef = useRef(promoCode);
  promoCodeRef.current = promoCode;

  // Automatically generate the code when entering step 2
  useEffect(() => {
    if (currentStep !== 2 || promoCodeRef.current) return;

    async function generateCode() {
      setLoading(true);
      setError(null);

      try {
        const trainerName = businessNameRef.current || userNameRef.current || "trainer";

        const { data, error: rpcError } = await supabaseRef.current.rpc(
          "generate_promo_code",
          { trainer_name: trainerName }
        );

        if (rpcError) throw rpcError;

        const code = data as string;
        setPromoCode(code);

        // Insert into trainer_promo_codes table
        await supabaseRef.current.from("trainer_promo_codes").insert({
          trainer_id: userIdRef.current,
          code,
          is_active: true,
          current_uses: 0,
        });
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message :
            "Error al generar el codigo promocional. Intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    }

    generateCode();
  }, [currentStep]);

  const copyCode = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = promoCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await supabaseRef.current.auth.updateUser({
        data: { onboarding_completed: true },
      });
    } catch {
      // Non-critical
    }
    router.push("/app/trainer/dashboard");
  };

  const completeOnboarding = async () => {
    setLoading(true);
    // Mark the profile as onboarding_completed
    try {
      await supabaseRef.current.auth.updateUser({
        data: { onboarding_completed: true },
      });
    } catch {
      // Non-critical — continue to dashboard anyway
    }
    router.push("/app/trainer/dashboard");
  };

  /* ---------------------------------------------------------------- */
  /*  Navigation helpers                                               */
  /* ---------------------------------------------------------------- */

  const goBack = () => {
    setError(null);
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleNext = async () => {
    if (currentStep === 0) await saveBusinessProfile();
    else if (currentStep === 1) await saveOnboardingForm();
    else await completeOnboarding();
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <Spotlight className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Fit<span className="text-[#00E5FF]">OS</span>
          </h1>
          <p className="mt-2 text-sm text-[#8B8BA3]">
            Configura tu cuenta de entrenador
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Card */}
        <SpotlightCard className="p-8">
          {/* Step 0 — Business Profile */}
          {currentStep === 0 && (
            <StepProfile
              businessName={businessName}
              setBusinessName={setBusinessName}
              specialty={specialty}
              setSpecialty={setSpecialty}
              bio={bio}
              setBio={setBio}
            />
          )}

          {/* Step 1 — Onboarding Form Editor */}
          {currentStep === 1 && (
            <StepFormEditor
              formTitle={formTitle}
              setFormTitle={setFormTitle}
              formDescription={formDescription}
              setFormDescription={setFormDescription}
              formFields={formFields}
              setFormFields={setFormFields}
              formTab={formTab}
              setFormTab={setFormTab}
            />
          )}

          {/* Step 2 — Promo Code */}
          {currentStep === 2 && (
            <StepPromoCode
              loading={loading}
              promoCode={promoCode}
              codeCopied={codeCopied}
              onCopy={copyCode}
            />
          )}

          {/* Error display */}
          {error && (
            <div className="mt-6 rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center gap-3">
            {/* Back button */}
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex items-center gap-1 rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-[#8B8BA3] transition-all duration-200 hover:border-white/20 hover:bg-[#1A1A2E] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                Anterior
              </button>
            )}

            {/* Next / Complete button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={
                loading ||
                (currentStep === 0 && !isStep1Valid) ||
                (currentStep === 1 && !isStep2Valid) ||
                (currentStep === 2 && !promoCode)
              }
              className="ml-auto flex items-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-3 text-sm font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner />
                  {currentStep === 2 ? "Finalizando..." : "Guardando..."}
                </>
              ) : currentStep === 2 ? (
                <>
                  Completar
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
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
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </SpotlightCard>

        {/* Skip link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="text-xs text-[#8B8BA3]/60 hover:text-[#8B8BA3] transition-colors underline underline-offset-2"
          >
            Saltar onboarding — configurar desde Ajustes
          </button>
        </div>
      </div>
    </Spotlight>
  );
}
