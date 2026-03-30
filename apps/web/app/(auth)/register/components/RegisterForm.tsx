"use client";

import Link from "next/link";
import type { PromoValidation, Role } from "../types";

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

interface RegisterFormProps {
  role: Role;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  promoCode: string;
  promo: PromoValidation;
  error: string | null;
  loading: boolean;
  isFormValid: boolean;
  isPasswordValid: boolean;
  onRoleChange: (role: Role) => void;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onPromoCodeChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ROLES = [
  { value: "trainer" as Role, label: "Entrenador", sub: "Gestiona tu negocio", color: "#00E5FF", Icon: IcTrainer },
  { value: "client" as Role, label: "Cliente", sub: "Entrena con tu PT", color: "#7C3AED", Icon: IcClient },
];

export function RegisterForm({
  role, fullName, email, password, confirmPassword, promoCode, promo, error, loading,
  isFormValid, isPasswordValid,
  onRoleChange, onFullNameChange, onEmailChange, onPasswordChange, onConfirmPasswordChange, onPromoCodeChange, onSubmit,
}: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ── Role selector ── */}
      <div className="reg-up ru-2">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">¿Cuál es tu perfil?</p>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, label, sub, color, Icon }) => {
            const active = role === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onRoleChange(value)}
                className="role-card"
                style={active ? { borderColor: color, background: `${color}0A`, boxShadow: `0 0 20px ${color}18` } : {}}
              >
                <span style={{ color: active ? color : "#5A5A72" }}><Icon /></span>
                <span className="text-[13px] font-bold" style={{ color: active ? "white" : "#8B8BA3" }}>{label}</span>
                <span className="text-[11px] text-[#5A5A72]">{sub}</span>
                {active && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: color }}>
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
              onChange={e => onPromoCodeChange(e.target.value.toUpperCase())}
              required
              className={`auth-field auth-field-mono pr-8 ${promo.valid ? "auth-field-valid" : promo.error ? "auth-field-error" : ""}`}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              {promo.loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[#5A5A72] border-t-transparent block" />}
              {!promo.loading && promo.valid && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00C853]"><IcCheck /></span>}
              {!promo.loading && promo.error && <span className="text-[#FF1744] text-sm">✗</span>}
            </div>
          </div>
          {promo.valid && promo.trainer_name && (
            <p className="mt-1.5 text-[11px] text-[#00C853] font-medium">✓ Entrenador: {promo.trainer_name}</p>
          )}
          {promo.error && <p className="mt-1.5 text-[11px] text-[#FF1744]">{promo.error}</p>}
        </div>
      )}

      {/* ── Fields (shown after role selected) ── */}
      {role && (
        <>
          <div className="fade-in">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">Nombre completo</label>
            <input type="text" placeholder="Tu nombre completo" value={fullName} onChange={e => onFullNameChange(e.target.value)} required className="auth-field" />
          </div>

          <div className="fade-in">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">Email</label>
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => onEmailChange(e.target.value)} required autoComplete="email" className="auth-field" />
          </div>

          <div className="fade-in">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">Contraseña</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => onPasswordChange(e.target.value)} required autoComplete="new-password" className="auth-field" />
            {password.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {[
                  { ok: password.length >= 8, label: "8 chars" },
                  { ok: /[A-Z]/.test(password), label: "Mayúscula" },
                  { ok: /[0-9]/.test(password), label: "Número" },
                ].map(({ ok, label }) => (
                  <span key={label} className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
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
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">Confirmar contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => onConfirmPasswordChange(e.target.value)}
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
  );
}
