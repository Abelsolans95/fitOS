"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spotlight, SpotlightCard } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldEditor, type FormField } from "@/components/onboarding/FormFieldEditor";
import { FormPreview } from "@/components/onboarding/FormPreview";
import { createClient } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SPECIALTIES = [
  "Fitness general",
  "Hipertrofia",
  "Fuerza",
  "CrossFit",
  "Yoga/Pilates",
  "Nutricion deportiva",
  "Rehabilitacion",
  "Otro",
] as const;

type Specialty = (typeof SPECIALTIES)[number];

const STEP_LABELS = [
  "Perfil de negocio",
  "Formulario de onboarding",
  "Codigo promocional",
] as const;

/* ------------------------------------------------------------------ */
/*  Reusable tiny components                                           */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-6 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
        />
      </div>

      {/* Step dots with labels */}
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isFuture = idx > currentStep;

          return (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? "border-[#00E5FF] bg-[#00E5FF] text-[#0A0A0F]"
                    : isCurrent
                    ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.3)]"
                    : "border-white/[0.12] bg-transparent text-[#8B8BA3]/60"
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors duration-300 ${
                  isCurrent
                    ? "text-[#00E5FF]"
                    : isCompleted
                    ? "text-white/70"
                    : "text-[#8B8BA3]/50"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function TrainerOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Global state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // Step 1 state
  const [businessName, setBusinessName] = useState("");
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const [bio, setBio] = useState("");

  // Step 2 state
  const [formTitle, setFormTitle] = useState("Formulario de Onboarding");
  const [formDescription, setFormDescription] = useState(
    "Completa este formulario para que pueda conocerte mejor y personalizar tu plan."
  );
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formTab, setFormTab] = useState<"editor" | "preview">("editor");

  // Step 3 state
  const [promoCode, setPromoCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setUserName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || ""
      );
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Step 1 — Save Business Profile                                   */
  /* ---------------------------------------------------------------- */

  const isStep1Valid = businessName.trim().length > 0 && specialty !== "";

  const saveBusinessProfile = async () => {
    if (!userId || !isStep1Valid) return;
    setError(null);
    setLoading(true);

    try {
      const { error: upsertError } = await supabase
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
    } catch (err: any) {
      setError(err?.message || "Error al guardar el perfil. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Step 2 — Save Onboarding Form                                    */
  /* ---------------------------------------------------------------- */

  const isStep2Valid = formTitle.trim().length > 0 && formFields.length > 0;

  const saveOnboardingForm = async () => {
    if (!userId || !isStep2Valid) return;
    setError(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabase
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
    } catch (err: any) {
      setError(
        err?.message || "Error al guardar el formulario. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Step 3 — Generate promo code                                     */
  /* ---------------------------------------------------------------- */

  // Automatically generate the code when entering step 3
  useEffect(() => {
    if (currentStep !== 2 || promoCode) return;

    async function generateCode() {
      setLoading(true);
      setError(null);

      try {
        const trainerName = businessName || userName || "trainer";

        const { data, error: rpcError } = await supabase.rpc(
          "generate_promo_code",
          { trainer_name: trainerName }
        );

        if (rpcError) throw rpcError;

        const code = data as string;
        setPromoCode(code);

        // Insert into trainer_promo_codes table
        await supabase.from("trainer_promo_codes").insert({
          trainer_id: userId,
          code,
          is_active: true,
          current_uses: 0,
        });
      } catch (err: any) {
        setError(
          err?.message ||
            "Error al generar el codigo promocional. Intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    }

    generateCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await supabase.auth.updateUser({
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
      await supabase.auth.updateUser({
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
          {/* ============ STEP 1 — Business Profile ============ */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Perfil de negocio
                </h2>
                <p className="mt-1 text-sm text-[#8B8BA3]">
                  Cuentanos sobre ti y tu negocio de entrenamiento.
                </p>
              </div>

              {/* Business name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-[#8B8BA3]">
                  Nombre del negocio <span className="text-[#FF1744]">*</span>
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Ej: FitPro Studio, Carlos Training..."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                />
              </div>

              {/* Specialty */}
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-[#8B8BA3]">
                  Especialidad <span className="text-[#FF1744]">*</span>
                </Label>
                <div className="relative">
                  <select
                    id="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as Specialty)}
                    className="h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 pr-10 text-sm text-white transition-colors outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20"
                  >
                    <option value="" disabled className="bg-[#12121A] text-[#8B8BA3]">
                      Selecciona tu especialidad
                    </option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s} className="bg-[#12121A] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                  {/* Chevron icon */}
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg
                      className="h-4 w-4 text-[#8B8BA3]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-[#8B8BA3]">
                  Bio / Descripcion{" "}
                  <span className="text-[#8B8BA3]/50">(opcional)</span>
                </Label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Describe tu experiencia, tu enfoque y que te diferencia de otros entrenadores..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2.5 text-sm text-white placeholder:text-[#8B8BA3]/50 transition-colors outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 resize-none"
                />
                <p className="text-xs text-[#8B8BA3]/50">
                  {bio.length}/500 caracteres
                </p>
              </div>
            </div>
          )}

          {/* ============ STEP 2 — Onboarding Form ============ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Formulario de onboarding
                </h2>
                <p className="mt-1 text-sm text-[#8B8BA3]">
                  Crea el formulario que tus nuevos clientes completaran al
                  registrarse contigo.
                </p>
              </div>

              {/* Form title & description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="formTitle" className="text-[#8B8BA3]">
                    Titulo del formulario{" "}
                    <span className="text-[#FF1744]">*</span>
                  </Label>
                  <Input
                    id="formTitle"
                    type="text"
                    placeholder="Ej: Formulario de Bienvenida"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formDesc" className="text-[#8B8BA3]">
                    Descripcion{" "}
                    <span className="text-[#8B8BA3]/50">(opcional)</span>
                  </Label>
                  <textarea
                    id="formDesc"
                    rows={2}
                    placeholder="Un mensaje de bienvenida para tus clientes..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2.5 text-sm text-white placeholder:text-[#8B8BA3]/50 transition-colors outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 resize-none"
                  />
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex rounded-lg bg-[#0A0A0F] p-1">
                <button
                  type="button"
                  onClick={() => setFormTab("editor")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    formTab === "editor"
                      ? "bg-[#1A1A2E] text-[#00E5FF] shadow-sm"
                      : "text-[#8B8BA3] hover:text-white"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                    Editor
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab("preview")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    formTab === "preview"
                      ? "bg-[#1A1A2E] text-[#7C3AED] shadow-sm"
                      : "text-[#8B8BA3] hover:text-white"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                    Vista previa
                  </span>
                </button>
              </div>

              {/* Editor or Preview */}
              <div className="min-h-[280px]">
                {formTab === "editor" ? (
                  <FormFieldEditor
                    fields={formFields}
                    onFieldsChange={setFormFields}
                  />
                ) : (
                  <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-6">
                    <FormPreview
                      title={formTitle}
                      description={formDescription}
                      fields={formFields}
                    />
                  </div>
                )}
              </div>

              {/* Field count hint */}
              {formFields.length === 0 && (
                <p className="text-center text-xs text-[#FF1744]/70">
                  Necesitas al menos 1 campo para continuar
                </p>
              )}
            </div>
          )}

          {/* ============ STEP 3 — Promo Code ============ */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white">
                  Tu codigo promocional
                </h2>
                <p className="mt-1 text-sm text-[#8B8BA3]">
                  Comparte este codigo con tus clientes para que se registren
                  contigo.
                </p>
              </div>

              {/* Code display */}
              {loading && !promoCode ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Spinner className="h-8 w-8 text-[#00E5FF]" />
                  <p className="text-sm text-[#8B8BA3]">
                    Generando tu codigo...
                  </p>
                </div>
              ) : promoCode ? (
                <div className="space-y-6">
                  {/* Main code card */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#00E5FF]/20 bg-gradient-to-br from-[#00E5FF]/5 via-transparent to-[#7C3AED]/5 p-8">
                    {/* Decorative glow */}
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#00E5FF]/10 blur-3xl" />
                    <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[#7C3AED]/10 blur-3xl" />

                    <div className="relative text-center">
                      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#8B8BA3]">
                        Tu codigo
                      </p>
                      <p className="font-mono text-3xl font-bold tracking-[0.2em] text-[#00E5FF] sm:text-4xl">
                        {promoCode}
                      </p>
                    </div>
                  </div>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={copyCode}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all duration-200 ${
                      codeCopied
                        ? "border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]"
                        : "border-[#00E5FF]/20 bg-[#00E5FF]/5 text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/30"
                    }`}
                  >
                    {codeCopied ? (
                      <>
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
                        Copiado al portapapeles
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                          />
                        </svg>
                        Copiar codigo
                      </>
                    )}
                  </button>

                  {/* Share section */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-[#7C3AED]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                        />
                      </svg>
                      <h3 className="text-sm font-medium text-white">
                        Compartir codigo
                      </h3>
                    </div>
                    <p className="text-xs text-[#8B8BA3] leading-relaxed">
                      Envia este codigo a tus clientes para que lo ingresen al
                      registrarse. Asi quedaran vinculados automaticamente a tu
                      cuenta.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Registrate en FitOS con mi codigo: ${promoCode}`;
                          const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                          window.open(url, "_blank");
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#12121A] py-2.5 text-xs text-[#8B8BA3] transition-all hover:border-[#25D366]/30 hover:bg-[#25D366]/5 hover:text-[#25D366]"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const subject = encodeURIComponent("Tu codigo para FitOS");
                          const body = encodeURIComponent(
                            `Hola!\n\nRegistrate en FitOS con mi codigo promocional: ${promoCode}\n\nNos vemos en la plataforma!`
                          );
                          window.open(
                            `mailto:?subject=${subject}&body=${body}`,
                            "_blank"
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#12121A] py-2.5 text-xs text-[#8B8BA3] transition-all hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/5 hover:text-[#00E5FF]"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                          />
                        </svg>
                        Email
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ============ Error display ============ */}
          {error && (
            <div className="mt-6 rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
              {error}
            </div>
          )}

          {/* ============ Navigation buttons ============ */}
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
