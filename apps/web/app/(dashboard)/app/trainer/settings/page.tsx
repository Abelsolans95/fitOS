"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function TrainerSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  const [formFieldCount, setFormFieldCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesión del usuario.");
          setLoading(false);
          return;
        }

        // Load profile from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name, specialty, bio")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setBusinessName(profile.business_name || "");
          setSpecialty(profile.specialty || "");
          setBio(profile.bio || "");
        }

        // Load promo code from trainer_promo_codes table
        const { data: promoData } = await supabase
          .from("trainer_promo_codes")
          .select("id, code")
          .eq("trainer_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (promoData) {
          setPromoCode(promoData.code);
          setPromoCodeId(promoData.id);
        }

        // Load onboarding form field count (preview only)
        const { data: formData } = await supabase
          .from("onboarding_forms")
          .select("fields")
          .eq("trainer_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (formData?.fields) {
          setFormFieldCount((formData.fields as unknown[]).length);
        }
      } catch {
        setError("Error inesperado al cargar la configuración.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleCopyCode = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = promoCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Generate a random code: NAME-XXXX format
      const trainerName = user.user_metadata?.full_name || "FITOS";
      const firstName = trainerName.split(" ")[0].toUpperCase().slice(0, 6);
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let suffix = "";
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const newCode = `${firstName}-${suffix}`;

      if (promoCodeId) {
        // Update existing code
        const { error: updateError } = await supabase
          .from("trainer_promo_codes")
          .update({ code: newCode })
          .eq("id", promoCodeId);

        if (updateError) {
          setError("Error al regenerar el código. Puede que ya exista.");
          return;
        }
      } else {
        // Create new promo code
        const { data: newPromo, error: insertError } = await supabase
          .from("trainer_promo_codes")
          .insert({
            trainer_id: user.id,
            code: newCode,
            is_active: true,
            max_uses: null,
            current_uses: 0,
          })
          .select("id")
          .single();

        if (insertError) {
          setError("Error al crear el código.");
          return;
        }
        if (newPromo) setPromoCodeId(newPromo.id);
      }

      setPromoCode(newCode);
    } catch {
      setError("Error inesperado al regenerar el código.");
    } finally {
      setRegenerating(false);
    }
  };


  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("No se pudo obtener la sesión del usuario.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          business_name: businessName || null,
          specialty: specialty || null,
          bio: bio || null,
        })
        .eq("user_id", user.id);

      if (updateError) {
        setError("Error al guardar los cambios.");
        setSaving(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ajustes</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Configura tu perfil y código promocional
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-3">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="rounded-xl border border-[#00C853]/20 bg-[#00C853]/5 px-4 py-3">
          <p className="text-sm text-[#00C853]">Cambios guardados correctamente</p>
        </div>
      )}

      {/* Promo Code Section */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        <h2 className="text-lg font-semibold text-white">Código promocional</h2>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Comparte este código con tus clientes para que se registren contigo
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Code display */}
          <div className="flex h-12 flex-1 items-center rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4">
            <span className="font-mono text-lg font-bold tracking-widest text-[#00E5FF]">
              {promoCode || "Sin código"}
            </span>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!promoCode}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                Copiar
              </>
            )}
          </button>

          {/* Regenerate button */}
          <button
            type="button"
            onClick={handleRegenerateCode}
            disabled={regenerating}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-transparent px-5 text-sm font-medium text-[#E8E8ED] transition-all hover:border-white/[0.15] hover:bg-white/[0.04] disabled:opacity-50"
          >
            {regenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E8E8ED] border-t-transparent" />
                Regenerando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Regenerar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        <h2 className="text-lg font-semibold text-white">Perfil</h2>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Información de tu perfil como entrenador
        </p>

        <div className="mt-6 space-y-5">
          {/* Business name */}
          <div className="space-y-1.5">
            <label
              htmlFor="business_name"
              className="block text-xs font-medium uppercase tracking-wider text-[#8B8BA3]"
            >
              Nombre del negocio
            </label>
            <input
              id="business_name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: FitCoach Pro"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <label
              htmlFor="specialty"
              className="block text-xs font-medium uppercase tracking-wider text-[#8B8BA3]"
            >
              Especialidad
            </label>
            <input
              id="specialty"
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ej: Entrenamiento funcional, nutrición deportiva"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label
              htmlFor="bio"
              className="block text-xs font-medium uppercase tracking-wider text-[#8B8BA3]"
            >
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a tus clientes sobre ti y tu experiencia..."
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>

      {/* Onboarding Form Section */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Formulario de onboarding</h2>
            <p className="mt-1 text-sm text-[#8B8BA3]">
              Este formulario lo rellenarán tus clientes al registrarse contigo
            </p>
          </div>
          {formFieldCount > 0 && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-md bg-[#00E5FF]/10 px-1.5 text-xs font-bold text-[#00E5FF]">
              {formFieldCount} campos
            </span>
          )}
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => router.push("/app/trainer/forms")}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-5 py-3 text-sm font-medium text-[#E8E8ED] transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
          >
            <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
            Editar formulario de onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
