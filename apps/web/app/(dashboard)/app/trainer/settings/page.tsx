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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setError("No se pudo obtener la sesión del usuario."); setLoading(false); return; }

        const { data: profile } = await supabase.from("profiles").select("business_name, specialty, bio").eq("user_id", user.id).single();
        if (profile) { setBusinessName(profile.business_name || ""); setSpecialty(profile.specialty || ""); setBio(profile.bio || ""); }

        const { data: promoData } = await supabase.from("trainer_promo_codes").select("id, code").eq("trainer_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).single();
        if (promoData) { setPromoCode(promoData.code); setPromoCodeId(promoData.id); }

        const { data: formData } = await supabase.from("onboarding_forms").select("fields").eq("trainer_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (formData?.fields) setFormFieldCount((formData.fields as unknown[]).length);
      } catch { setError("Error inesperado al cargar la configuración."); }
      finally { setLoading(false); }
    };
    loadProfile();
  }, []);

  const handleCopyCode = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
    } catch {
      const t = document.createElement("textarea");
      t.value = promoCode; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true); setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const firstName = (user.user_metadata?.full_name || "FITOS").split(" ")[0].toUpperCase().slice(0, 6);
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const newCode = `${firstName}-${suffix}`;

      if (promoCodeId) {
        const { error: updateError } = await supabase.from("trainer_promo_codes").update({ code: newCode }).eq("id", promoCodeId);
        if (updateError) { setError("Error al regenerar el código. Puede que ya exista."); return; }
      } else {
        const { data: newPromo, error: insertError } = await supabase.from("trainer_promo_codes")
          .insert({ trainer_id: user.id, code: newCode, is_active: true, max_uses: null, current_uses: 0 }).select("id").single();
        if (insertError) { setError("Error al crear el código."); return; }
        if (newPromo) setPromoCodeId(newPromo.id);
      }
      setPromoCode(newCode);
    } catch { setError("Error inesperado al regenerar el código."); }
    finally { setRegenerating(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("No se pudo obtener la sesión."); setSaving(false); return; }
      const { error: updateError } = await supabase.from("profiles")
        .update({ business_name: businessName || null, specialty: specialty || null, bio: bio || null })
        .eq("user_id", user.id);
      if (updateError) { setError("Error al guardar los cambios."); setSaving(false); return; }
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Error inesperado al guardar."); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes st-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .st-in { animation: st-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .st-1 { animation-delay: 0.04s; } .st-2 { animation-delay: 0.14s; } .st-3 { animation-delay: 0.24s; }

        .st-input { transition: border-color 0.2s ease; background: #0A0A0F; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0 16px; height: 42px; width: 100%; color: white; font-size: 13px; outline: none; }
        .st-input:focus { border-color: rgba(0,229,255,0.4); }
        .st-input::placeholder { color: #5A5A72; }
        .st-textarea { transition: border-color 0.2s ease; background: #0A0A0F; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 16px; width: 100%; color: white; font-size: 13px; outline: none; resize: none; }
        .st-textarea:focus { border-color: rgba(0,229,255,0.4); }
        .st-textarea::placeholder { color: #5A5A72; }
        .save-btn { transition: all 0.25s ease; }
        .save-btn:hover:not(:disabled) { box-shadow: 0 0 24px rgba(0,229,255,0.35); background: #2BEEFF; }
        .ghost-btn { transition: all 0.2s ease; }
        .ghost-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.04); color: white; }
      `}</style>

      <div className="space-y-7">

        {/* ── Header ── */}
        <div className="st-in st-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Configuración</p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em] text-white">Ajustes</h1>
          <p className="mt-1 text-[13px] text-[#8B8BA3]">Configura tu perfil y código promocional</p>
        </div>

        {/* ── Banners ── */}
        {error && (
          <div className="rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/05 px-4 py-3">
            <p className="text-[13px] text-[#FF1744]">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-[#00C853]/20 bg-[#00C853]/05 px-4 py-3 flex items-center gap-2">
            <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <p className="text-[13px] text-[#00C853]">Cambios guardados correctamente</p>
          </div>
        )}

        {/* ── Promo Code ── */}
        <div className="st-in st-2 relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
          {/* Accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #00E5FF, transparent)" }} />
          {/* Glow */}
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#00E5FF] opacity-[0.04] blur-[40px]" />

          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00E5FF]">— Código promocional</p>
            <h2 className="mt-1 text-[17px] font-bold text-white">Comparte con tus clientes</h2>
            <p className="mt-1 text-[13px] text-[#8B8BA3]">
              Tus clientes usan este código al registrarse para vincularse contigo automáticamente.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Code display */}
              <div className="flex h-12 flex-1 items-center rounded-xl border border-[#00E5FF]/15 bg-white/[0.02] px-5">
                <span className="font-mono text-[18px] font-bold tracking-[0.15em] text-[#00E5FF]">
                  {promoCode || "Sin código"}
                </span>
              </div>

              {/* Copy */}
              <button type="button" onClick={handleCopyCode} disabled={!promoCode}
                className="save-btn flex h-12 items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-5 text-[13px] font-bold text-[#0A0A0F] disabled:opacity-50">
                {copied ? (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copiado</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/></svg>Copiar</>
                )}
              </button>

              {/* Regenerate */}
              <button type="button" onClick={handleRegenerateCode} disabled={regenerating}
                className="ghost-btn flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-transparent px-5 text-[13px] font-medium text-[#8B8BA3] disabled:opacity-50">
                {regenerating ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8B8BA3] border-t-transparent" />Regenerando...</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"/></svg>Regenerar</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Profile ── */}
        <div className="st-in st-3 relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #7C3AED, transparent)" }} />
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#7C3AED] opacity-[0.04] blur-[40px]" />

          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7C3AED]">— Perfil</p>
            <h2 className="mt-1 text-[17px] font-bold text-white">Información de entrenador</h2>
            <p className="mt-1 text-[13px] text-[#8B8BA3]">Tus clientes verán esta información en la app</p>

            <div className="mt-6 space-y-5">
              {/* Business name */}
              <div className="space-y-1.5">
                <label htmlFor="business_name" className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Nombre del negocio
                </label>
                <input id="business_name" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="Ej: FitCoach Pro" className="st-input" />
              </div>

              {/* Specialty */}
              <div className="space-y-1.5">
                <label htmlFor="specialty" className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Especialidad
                </label>
                <input id="specialty" type="text" value={specialty} onChange={e => setSpecialty(e.target.value)}
                  placeholder="Ej: Entrenamiento funcional, nutrición deportiva" className="st-input" />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label htmlFor="bio" className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Bio
                </label>
                <textarea id="bio" rows={4} value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Cuéntale a tus clientes sobre ti y tu experiencia..." className="st-textarea" />
              </div>

              {/* Form field count stat */}
              {formFieldCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.04] px-4 py-3">
                  <span className="flex h-6 min-w-[28px] items-center justify-center rounded-md bg-[#00E5FF]/10 px-2 text-[11px] font-bold text-[#00E5FF]">
                    {formFieldCount}
                  </span>
                  <span className="text-[13px] text-[#8B8BA3]">campos en tu formulario de onboarding</span>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={handleSave} disabled={saving}
                className="save-btn flex items-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-2.5 text-[13px] font-bold text-[#0A0A0F] disabled:opacity-50">
                {saving ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />Guardando...</>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
