"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    if (!code || code.length < 3) {
      setPromo({ valid: false, loading: false });
      return;
    }
    setPromo((prev) => ({ ...prev, loading: true }));
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trainer_promo_codes")
      .select("id, trainer_id, code, is_active, max_uses, current_uses, expires_at")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setPromo({ valid: false, error: "Código no válido o inactivo", loading: false });
      return;
    }
    if (data.max_uses !== null && data.current_uses >= data.max_uses) {
      setPromo({ valid: false, error: "Este código ha alcanzado su límite de usos", loading: false });
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setPromo({ valid: false, error: "Este código ha expirado", loading: false });
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, business_name")
      .eq("user_id", data.trainer_id)
      .single();

    setPromo({
      valid: true,
      trainer_name: profile?.business_name || profile?.full_name || "Entrenador",
      trainer_id: data.trainer_id,
      promo_code_id: data.id,
      loading: false,
    });
  }, []);

  useEffect(() => {
    if (role !== "client" || !promoCode) return;
    const timer = setTimeout(() => { validatePromoCode(promoCode); }, 500);
    return () => clearTimeout(timer);
  }, [promoCode, role, validatePromoCode]);

  const passwordErrors = (() => {
    const errors: string[] = [];
    if (password.length > 0 && password.length < 8) errors.push("Mínimo 8 caracteres");
    if (password.length > 0 && !/[A-Z]/.test(password)) errors.push("Al menos 1 mayúscula");
    if (password.length > 0 && !/[0-9]/.test(password)) errors.push("Al menos 1 número");
    return errors;
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

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from("user_roles").insert({ user_id: authData.user.id, role });
      if (role === "client" && promo.trainer_id && promo.promo_code_id) {
        const res = await fetch("/api/complete-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainer_id: promo.trainer_id,
            client_id: authData.user.id,
            promo_code_id: promo.promo_code_id,
            email,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || "Error al vincular con tu entrenador. Intenta de nuevo.");
          setLoading(false);
          return;
        }
      }
    }

    if (role === "trainer") {
      router.push("/onboarding/trainer");
    } else {
      router.push("/onboarding/client");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0F] text-white">

      {/* Left panel — brand */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-white/[0.06] p-12 lg:flex">
        <Link href="/" className="text-base font-bold tracking-tight">
          Fit<span className="text-[#00E5FF]">OS</span>
        </Link>

        <div>
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]">
            Empieza hoy
          </p>
          <h2 className="text-[clamp(32px,3.5vw,48px)] font-extrabold uppercase leading-[1.05] tracking-tight">
            14 días gratis.<br />
            Sin tarjeta<br />
            <span className="text-[#00E5FF]">de crédito.</span>
          </h2>
          <ul className="mt-8 space-y-3">
            {[
              "Gestión completa de clientes",
              "Rutinas y nutrición con IA",
              "App móvil para tus clientes",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-px w-4 bg-[#00E5FF]" />
                <span className="text-sm text-[#8B8BA3]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[#5A5A72]">
          © 2026 FitOS · Todos los derechos reservados
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:overflow-y-auto lg:px-16">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="mb-10 block text-base font-bold tracking-tight lg:hidden">
            Fit<span className="text-[#00E5FF]">OS</span>
          </Link>

          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]">
            Registro
          </p>
          <h1 className="mb-8 text-2xl font-extrabold uppercase tracking-tight">
            Crear cuenta
          </h1>

          <form onSubmit={handleRegister} className="space-y-6">

            {/* Role selector */}
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A5A72]">
                ¿Cuál es tu perfil?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "trainer" as Role, label: "Entrenador" },
                  { value: "client" as Role, label: "Cliente" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRole(value); setPromoCode(""); setPromo({ valid: false, loading: false }); }}
                    className={`py-3 text-sm font-semibold border transition-colors ${
                      role === value
                        ? "border-[#00E5FF] text-[#00E5FF]"
                        : "border-white/[0.1] text-[#5A5A72] hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo code — clients only */}
            {role === "client" && (
              <div>
                <label htmlFor="promoCode" className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A5A72]">
                  Código de tu entrenador <span className="text-[#FF1744]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="promoCode"
                    type="text"
                    placeholder="Ej: CARLOS-X7K2"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    required
                    className={`w-full border-b bg-transparent py-2.5 pr-8 font-mono text-sm uppercase text-white placeholder:text-[#5A5A72] focus:outline-none transition-colors ${
                      promo.valid ? "border-[#00C853]" : promo.error ? "border-[#FF1744]" : "border-white/[0.12] focus:border-[#00E5FF]"
                    }`}
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {promo.loading && <span className="text-xs text-[#5A5A72]">...</span>}
                    {!promo.loading && promo.valid && <span className="text-xs text-[#00C853]">✓</span>}
                    {!promo.loading && promo.error && <span className="text-xs text-[#FF1744]">✗</span>}
                  </div>
                </div>
                {promo.valid && promo.trainer_name && (
                  <p className="mt-1 text-xs text-[#00C853]">Entrenador: {promo.trainer_name}</p>
                )}
                {promo.error && (
                  <p className="mt-1 text-xs text-[#FF1744]">{promo.error}</p>
                )}
              </div>
            )}

            {/* Fields — shown after role is selected */}
            {role && (
              <>
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A5A72]">
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full border-b border-white/[0.12] bg-transparent py-2.5 text-sm text-white placeholder:text-[#5A5A72] focus:border-[#00E5FF] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A5A72]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border-b border-white/[0.12] bg-transparent py-2.5 text-sm text-white placeholder:text-[#5A5A72] focus:border-[#00E5FF] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A5A72]">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border-b border-white/[0.12] bg-transparent py-2.5 text-sm text-white placeholder:text-[#5A5A72] focus:border-[#00E5FF] focus:outline-none transition-colors"
                  />
                  {passwordErrors.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {passwordErrors.map((err) => (
                        <span key={err} className="border-l-2 border-[#FF1744] pl-2 text-xs text-[#FF1744]">{err}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A5A72]">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full border-b bg-transparent py-2.5 text-sm text-white placeholder:text-[#5A5A72] focus:outline-none transition-colors ${
                      confirmPassword && password !== confirmPassword
                        ? "border-[#FF1744]"
                        : "border-white/[0.12] focus:border-[#00E5FF]"
                    }`}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 border-l-2 border-[#FF1744] pl-2 text-xs text-[#FF1744]">Las contraseñas no coinciden</p>
                  )}
                </div>

                {error && (
                  <div className="border-l-2 border-[#FF1744] pl-3 text-sm text-[#FF1744]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="mt-2 w-full border border-white/20 py-3 text-sm font-semibold text-white transition-all hover:border-[#00E5FF]/60 hover:text-[#00E5FF] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Creando cuenta..."
                    : `Crear cuenta como ${role === "trainer" ? "Entrenador" : "Cliente"} →`}
                </button>
              </>
            )}
          </form>

          <div className="mt-10 border-t border-white/[0.06] pt-6">
            <p className="text-xs text-[#5A5A72]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-white transition-colors hover:text-[#00E5FF]">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
