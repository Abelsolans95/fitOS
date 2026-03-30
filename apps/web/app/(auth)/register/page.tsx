"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { RegisterForm } from "./components/RegisterForm";
import { RegisterPhotoPanel } from "./components/RegisterPhotoPanel";
import type { Role, PromoValidation } from "./types";

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
    if (profileErr) { console.error("[Register] Error al obtener perfil del entrenador:", profileErr); }
    setPromo({ valid: true, trainer_name: profile?.business_name || profile?.full_name || "Entrenador", trainer_id: data.trainer_id, promo_code_id: data.id, loading: false });
  }, []);

  useEffect(() => {
    if (role !== "client" || !promoCode) return;
    const timer = setTimeout(() => { validatePromoCode(promoCode); }, 500);
    return () => clearTimeout(timer);
  }, [promoCode, role, validatePromoCode]);

  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const isFormValid =
    !!role && !!fullName.trim() && !!email.trim() && isPasswordValid &&
    password === confirmPassword &&
    (role === "trainer" || (role === "client" && promo.valid));

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setPromoCode("");
    setPromo({ valid: false, loading: false });
  };

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

  return (
    <>
      <style>{`
        @keyframes reg-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .reg-up { animation: reg-up 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .ru-1 { animation-delay: 0.04s; } .ru-2 { animation-delay: 0.12s; } .ru-3 { animation-delay: 0.20s; }
        .ru-4 { animation-delay: 0.28s; } .ru-5 { animation-delay: 0.36s; } .ru-6 { animation-delay: 0.44s; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fade-in 0.35s ease both; }
        .dot-grid { background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 26px 26px; }
        .auth-field { display: block; width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.09); padding: 11px 0; font-size: 14px; color: white; font-family: var(--font-syne); outline: none; transition: border-color 0.2s ease; }
        .auth-field:focus { border-bottom-color: #00E5FF; }
        .auth-field::placeholder { color: #5A5A72; }
        .auth-field-mono { font-family: 'Courier New', monospace; letter-spacing: 0.08em; }
        .auth-field-valid { border-bottom-color: #00C853 !important; }
        .auth-field-error { border-bottom-color: #FF1744 !important; }
        .role-card { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: transparent; cursor: pointer; text-align: left; transition: all 0.2s ease; color: white; }
        .role-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.02); }
        .btn-register { position: relative; overflow: hidden; width: 100%; background: #00E5FF; color: #0A0A0F; font-weight: 800; font-size: 14px; font-family: var(--font-jakarta), sans-serif; letter-spacing: 0.04em; padding: 14px 24px; border-radius: 12px; border: none; cursor: pointer; transition: all 0.25s ease; }
        .btn-register::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent); transition: left 0.45s ease; }
        .btn-register:hover::before { left: 100%; }
        .btn-register:hover { box-shadow: 0 0 32px rgba(0,229,255,0.45); background: #1AEEFF; }
        .btn-register:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-register:disabled::before { display: none; }
        .btn-register-violet { background: #7C3AED; }
        .btn-register-violet:hover { box-shadow: 0 0 32px rgba(124,58,237,0.45); background: #8B4FF8; }
      `}</style>

      <div className="flex min-h-screen bg-[#0A0A0F] text-white">
        {/* ── Form panel (left) ── */}
        <div className="dot-grid relative flex w-full flex-col items-center justify-center overflow-y-auto px-8 py-16 lg:w-[50%]">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[#7C3AED] opacity-[0.04] blur-[90px]" />

          <div className="relative w-full max-w-[400px]">
            {/* Mobile: logo + back */}
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link href="/" className="text-[15px] font-extrabold tracking-tight">Fit<span className="text-[#00E5FF]">OS</span></Link>
              <Link href="/" className="text-[11px] text-[#5A5A72] hover:text-white transition-colors">← Volver</Link>
            </div>

            {/* Header */}
            <div className="reg-up ru-1 mb-8">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Registro</p>
              <h1 className="text-[30px] font-extrabold uppercase tracking-[-0.02em] text-white leading-none">Crear cuenta</h1>
              <p className="mt-2.5 text-[13px] text-[#8B8BA3]">14 días gratis · Sin tarjeta de crédito</p>
            </div>

            <RegisterForm
              role={role}
              fullName={fullName}
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              promoCode={promoCode}
              promo={promo}
              error={error}
              loading={loading}
              isFormValid={isFormValid}
              isPasswordValid={isPasswordValid}
              onRoleChange={handleRoleChange}
              onFullNameChange={setFullName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onPromoCodeChange={setPromoCode}
              onSubmit={handleRegister}
            />

            <div className="reg-up ru-6 mt-10 border-t border-white/[0.06] pt-6">
              <p className="text-[13px] text-[#5A5A72]">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-semibold text-white hover:text-[#00E5FF] transition-colors">Inicia sesión →</Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── Photo panel (right) ── */}
        <RegisterPhotoPanel />
      </div>
    </>
  );
}
