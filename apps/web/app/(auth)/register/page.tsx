"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

type Role = "trainer" | "client" | null;

interface PromoValidation {
  valid: boolean;
  trainer_name?: string;
  trainer_id?: string;
  promo_code_id?: string;
  error?: string;
  loading: boolean;
}

const IcTrainer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IcClient = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const IcCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7"/>
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<PromoValidation>({ valid: false, loading: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePromoCode = useCallback(async (code: string) => {
    if (!code || code.length < 3) { setPromo({ valid: false, loading: false }); return; }
    setPromo(prev => ({ ...prev, loading: true }));
    const supabase = createClient();
    const { data, error: qErr } = await supabase
      .from("trainer_promo_codes")
      .select("id, trainer_id, code, is_active, max_uses, current_uses, expires_at")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (qErr || !data) { setPromo({ valid: false, error: "Código no válido o inactivo", loading: false }); return; }
    if (data.max_uses !== null && data.current_uses >= data.max_uses) { setPromo({ valid: false, error: "Este código ha alcanzado su límite de usos", loading: false }); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromo({ valid: false, error: "Este código ha expirado", loading: false }); return; }

    const { data: profile, error: profileErr } = await supabase.from("profiles").select("full_name, business_name").eq("user_id", data.trainer_id).single();
    if (profileErr) {
      console.error("[Register] Error al obtener perfil del entrenador:", profileErr);
    }
    setPromo({ valid: true, trainer_name: profile?.business_name || profile?.full_name || "Entrenador", trainer_id: data.trainer_id, promo_code_id: data.id, loading: false });
  }, []);

  useEffect(() => {
    if (role !== "client" || !promoCode) return;
    const timer = setTimeout(() => { validatePromoCode(promoCode); }, 500);
    return () => clearTimeout(timer);
  }, [promoCode, role, validatePromoCode]);

  const passwordErrors = (() => {
    const errs: string[] = [];
    if (password.length > 0 && password.length < 8) errs.push("8 caracteres");
    if (password.length > 0 && !/[A-Z]/.test(password)) errs.push("Mayúscula");
    if (password.length > 0 && !/[0-9]/.test(password)) errs.push("Número");
    return errs;
  })();

  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const isFormValid =
    role && fullName.trim() && email.trim() && isPasswordValid &&
    password === confirmPassword &&
    (role === "trainer" || (role === "client" && promo.valid));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName.trim() } },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (authData.user) {
      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: authData.user.id, role });
      if (roleError) {
        console.error("[Register] Error al asignar rol:", roleError);
        setError("Error al configurar tu cuenta. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      if (role === "client" && promo.trainer_id && promo.promo_code_id) {
        const res = await fetch("/api/complete-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trainer_id: promo.trainer_id, client_id: authData.user.id, promo_code_id: promo.promo_code_id, email }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || "Error al vincular con tu entrenador. Intenta de nuevo.");
          setLoading(false);
          return;
        }
      }
    }
    if (role === "trainer") router.push("/onboarding/trainer");
    else router.push("/onboarding/client");
  };

  const ROLES = [
    { value: "trainer" as Role, label: "Entrenador", sub: "Gestiona tu negocio", color: "#00E5FF", Icon: IcTrainer },
    { value: "client" as Role, label: "Cliente", sub: "Entrena con tu PT", color: "#7C3AED", Icon: IcClient },
  ];

  const FEATURES = [
    { text: "Gestión completa de clientes", color: "#00E5FF" },
    { text: "Rutinas y nutrición con IA", color: "#7C3AED" },
    { text: "App móvil para tus clientes", color: "#FF9100" },
  ];

  return (
    <>
      <style>{`
        @keyframes reg-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reg-up { animation: reg-up 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .ru-1 { animation-delay: 0.04s; }
        .ru-2 { animation-delay: 0.12s; }
        .ru-3 { animation-delay: 0.20s; }
        .ru-4 { animation-delay: 0.28s; }
        .ru-5 { animation-delay: 0.36s; }
        .ru-6 { animation-delay: 0.44s; }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fade-in 0.35s ease both; }

        .dot-grid {
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 26px 26px;
        }

        .auth-field {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.09);
          padding: 11px 0;
          font-size: 14px;
          color: white;
          font-family: var(--font-syne);
          outline: none;
          transition: border-color 0.2s ease;
        }
        .auth-field:focus { border-bottom-color: #00E5FF; }
        .auth-field::placeholder { color: #5A5A72; }
        .auth-field-mono { font-family: 'Courier New', monospace; letter-spacing: 0.08em; }
        .auth-field-valid { border-bottom-color: #00C853 !important; }
        .auth-field-error { border-bottom-color: #FF1744 !important; }

        .role-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          color: white;
        }
        .role-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.02); }

        .btn-register {
          position: relative;
          overflow: hidden;
          width: 100%;
          background: #00E5FF;
          color: #0A0A0F;
          font-weight: 800;
          font-size: 14px;
          font-family: var(--font-jakarta), sans-serif;
          letter-spacing: 0.04em;
          padding: 14px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-register::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          transition: left 0.45s ease;
        }
        .btn-register:hover::before { left: 100%; }
        .btn-register:hover { box-shadow: 0 0 32px rgba(0,229,255,0.45); background: #1AEEFF; }
        .btn-register:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-register:disabled::before { display: none; }

        .btn-register-violet {
          background: #7C3AED;
        }
        .btn-register-violet:hover { box-shadow: 0 0 32px rgba(124,58,237,0.45); background: #8B4FF8; }
      `}</style>

      <div className="flex min-h-screen bg-[#0A0A0F] text-white">

        {/* ── Form panel (left) ── */}
        <div className="dot-grid relative flex w-full flex-col items-center justify-center overflow-y-auto px-8 py-16 lg:w-[50%]">
          {/* Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[#7C3AED] opacity-[0.04] blur-[90px]" />

          <div className="relative w-full max-w-[400px]">

            {/* Mobile: logo + back */}
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link href="/" className="text-[15px] font-extrabold tracking-tight">
                Fit<span className="text-[#00E5FF]">OS</span>
              </Link>
              <Link href="/" className="text-[11px] text-[#5A5A72] hover:text-white transition-colors">← Volver</Link>
            </div>

            {/* Header */}
            <div className="reg-up ru-1 mb-8">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Registro</p>
              <h1 className="text-[30px] font-extrabold uppercase tracking-[-0.02em] text-white leading-none">
                Crear cuenta
              </h1>
              <p className="mt-2.5 text-[13px] text-[#8B8BA3]">
                14 días gratis · Sin tarjeta de crédito
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">

              {/* ── Role selector ── */}
              <div className="reg-up ru-2">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                  ¿Cuál es tu perfil?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(({ value, label, sub, color, Icon }) => {
                    const active = role === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setRole(value); setPromoCode(""); setPromo({ valid: false, loading: false }); }}
                        className="role-card"
                        style={active ? { borderColor: color, background: `${color}0A`, boxShadow: `0 0 20px ${color}18` } : {}}
                      >
                        <span style={{ color: active ? color : "#5A5A72" }}>
                          <Icon />
                        </span>
                        <span className="text-[13px] font-bold" style={{ color: active ? "white" : "#8B8BA3" }}>
                          {label}
                        </span>
                        <span className="text-[11px] text-[#5A5A72]">{sub}</span>
                        {active && (
                          <div
                            className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ background: color }}
                          >
                            <IcCheck />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Promo code (client only) ── */}
              {role === "client" && (
                <div className="fade-in">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                    Código de tu entrenador <span className="text-[#FF1744]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej: CARLOS-X7K2"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      required
                      className={`auth-field auth-field-mono pr-8 ${promo.valid ? "auth-field-valid" : promo.error ? "auth-field-error" : ""}`}
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      {promo.loading && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[#5A5A72] border-t-transparent block" />
                      )}
                      {!promo.loading && promo.valid && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00C853]">
                          <IcCheck />
                        </span>
                      )}
                      {!promo.loading && promo.error && (
                        <span className="text-[#FF1744] text-sm">✗</span>
                      )}
                    </div>
                  </div>
                  {promo.valid && promo.trainer_name && (
                    <p className="mt-1.5 text-[11px] text-[#00C853] font-medium">✓ Entrenador: {promo.trainer_name}</p>
                  )}
                  {promo.error && (
                    <p className="mt-1.5 text-[11px] text-[#FF1744]">{promo.error}</p>
                  )}
                </div>
              )}

              {/* ── Fields (shown after role selected) ── */}
              {role && (
                <>
                  <div className="fade-in">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="auth-field"
                    />
                  </div>

                  <div className="fade-in">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="auth-field"
                    />
                  </div>

                  <div className="fade-in">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="auth-field"
                    />
                    {password.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {[
                          { ok: password.length >= 8, label: "8 chars" },
                          { ok: /[A-Z]/.test(password), label: "Mayúscula" },
                          { ok: /[0-9]/.test(password), label: "Número" },
                        ].map(({ ok, label }) => (
                          <span
                            key={label}
                            className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
                            style={ok
                              ? { borderColor: "rgba(0,200,83,0.3)", color: "#00C853", background: "rgba(0,200,83,0.06)" }
                              : { borderColor: "rgba(255,255,255,0.08)", color: "#5A5A72" }
                            }
                          >
                            {ok ? "✓" : "·"} {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="fade-in">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`auth-field ${confirmPassword && password !== confirmPassword ? "auth-field-error" : confirmPassword && password === confirmPassword && isPasswordValid ? "auth-field-valid" : ""}`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1.5 text-[11px] text-[#FF1744]">Las contraseñas no coinciden</p>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/[0.06] px-4 py-3">
                      <svg className="h-4 w-4 flex-shrink-0 text-[#FF1744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <p className="text-[13px] text-[#FF1744]">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className={`btn-register ${role === "client" ? "btn-register-violet" : ""}`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                        Creando cuenta...
                      </span>
                    ) : (
                      `Crear cuenta como ${role === "trainer" ? "Entrenador" : "Cliente"} →`
                    )}
                  </button>
                </>
              )}
            </form>

            {/* Footer */}
            <div className="reg-up ru-6 mt-10 border-t border-white/[0.06] pt-6">
              <p className="text-[13px] text-[#5A5A72]">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-semibold text-white hover:text-[#00E5FF] transition-colors">
                  Inicia sesión →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── Photo panel (right) ── */}
        <div className="hidden lg:block relative w-[50%] overflow-hidden">
          <Image
            src="/auth-register.jpg"
            fill
            className="object-cover object-top"
            alt="FitOS athlete"
            priority
          />

          {/* Gradient: left edge blends into form panel */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to left, rgba(10,10,15,0.1) 0%, rgba(10,10,15,0.15) 55%, rgba(10,10,15,0.88) 88%, #0A0A0F 100%)" }}
          />
          {/* Bottom gradient */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.35) 35%, transparent 65%)" }}
          />
          {/* Violet center glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[#7C3AED] opacity-[0.08] blur-[100px]" />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-12">
            {/* Top: logo */}
            <div className="flex justify-end">
              <Link href="/" className="text-[15px] font-extrabold tracking-tight text-white">
                Fit<span className="text-[#00E5FF]">OS</span>
              </Link>
            </div>

            {/* Bottom: feature card */}
            <div className="rounded-2xl border border-white/[0.1] bg-[#0A0A0F]/65 backdrop-blur-xl p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-[#7C3AED]">
                — Todo incluido
              </p>
              <div className="space-y-3.5">
                {FEATURES.map(({ text, color }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    <span className="text-[13px] text-[#C8C8D8]">{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-white/[0.08] pt-4">
                <p className="text-[11px] text-[#5A5A72]">
                  Empieza gratis · Sin compromisos · Cancela cuando quieras
                </p>
              </div>
            </div>
          </div>

          {/* Vertical label on left edge */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
            <div className="h-16 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.25), transparent)" }} />
            <p
              className="text-[9px] font-bold uppercase tracking-[0.45em] text-[#3A3A52]"
              style={{ writingMode: "vertical-rl" }}
            >
              FitOS · 2026
            </p>
            <div className="h-16 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.25), transparent)" }} />
          </div>
        </div>
      </div>
    </>
  );
}
