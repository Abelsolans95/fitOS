"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spotlight, SpotlightCard } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [promo, setPromo] = useState<PromoValidation>({
    valid: false,
    loading: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounced promo code validation (500ms)
  const validatePromoCode = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setPromo({ valid: false, loading: false });
      return;
    }

    setPromo((prev) => ({ ...prev, loading: true }));

    const supabase = createClient();
    const { data, error } = await supabase
      .from("trainer_promo_codes")
      .select(
        `
        id,
        trainer_id,
        code,
        is_active,
        max_uses,
        current_uses,
        expires_at
      `
      )
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setPromo({
        valid: false,
        error: "Código no válido o inactivo",
        loading: false,
      });
      return;
    }

    // Check max uses
    if (data.max_uses !== null && data.current_uses >= data.max_uses) {
      setPromo({
        valid: false,
        error: "Este código ha alcanzado su límite de usos",
        loading: false,
      });
      return;
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setPromo({
        valid: false,
        error: "Este código ha expirado",
        loading: false,
      });
      return;
    }

    // Get trainer name
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

  // Debounce effect
  useEffect(() => {
    if (role !== "client" || !promoCode) return;

    const timer = setTimeout(() => {
      validatePromoCode(promoCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [promoCode, role, validatePromoCode]);

  // Password validation
  const passwordErrors = (() => {
    const errors: string[] = [];
    if (password.length > 0 && password.length < 8) errors.push("Mínimo 8 caracteres");
    if (password.length > 0 && !/[A-Z]/.test(password)) errors.push("Al menos 1 mayúscula");
    if (password.length > 0 && !/[0-9]/.test(password)) errors.push("Al menos 1 número");
    return errors;
  })();

  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const isFormValid =
    role &&
    fullName.trim() &&
    email.trim() &&
    isPasswordValid &&
    password === confirmPassword &&
    (role === "trainer" || (role === "client" && promo.valid));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();

    // 1. Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName.trim(),
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Insert user_roles
    if (authData.user) {
      await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role,
      });

      // 3. If client: create trainer_clients via API route (uses service_role to bypass RLS)
      if (role === "client" && promo.trainer_id && promo.promo_code_id) {
        await fetch("/api/complete-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainer_id: promo.trainer_id,
            client_id: authData.user.id,
            promo_code_id: promo.promo_code_id,
            email,
          }),
        });
      }
    }

    // 4. Redirect based on role
    if (role === "trainer") {
      router.push("/onboarding/trainer");
    } else {
      router.push("/onboarding/client");
    }
  };

  return (
    <Spotlight className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Fit<span className="text-[#00E5FF]">OS</span>
          </h1>
          <p className="mt-2 text-sm text-[#8B8BA3]">
            Crea tu cuenta
          </p>
        </div>

        <SpotlightCard>
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role Selector */}
            <div className="space-y-3">
              <Label className="text-[#8B8BA3]">¿Cuál es tu perfil?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole("trainer"); setPromoCode(""); setPromo({ valid: false, loading: false }); }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-all duration-200 ${
                    role === "trainer"
                      ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                      : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                  <span className="font-medium">Soy Entrenador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-all duration-200 ${
                    role === "client"
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                      : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span className="font-medium">Soy Cliente</span>
                </button>
              </div>
            </div>

            {/* Promo Code — Only for Clients */}
            {role === "client" && (
              <div className="space-y-2">
                <Label htmlFor="promoCode" className="text-[#8B8BA3]">
                  Código de tu entrenador <span className="text-[#FF1744]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="promoCode"
                    type="text"
                    placeholder="Ej: CARLOS-X7K2"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    required
                    className={`border-white/[0.08] bg-[#0A0A0F] pr-10 font-mono text-white uppercase placeholder:text-[#8B8BA3]/50 focus:ring-[#00E5FF]/20 ${
                      promo.valid
                        ? "border-[#00C853] focus:border-[#00C853]"
                        : promo.error
                        ? "border-[#FF1744] focus:border-[#FF1744]"
                        : "focus:border-[#00E5FF]"
                    }`}
                  />
                  {/* Status icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {promo.loading && (
                      <svg className="h-4 w-4 animate-spin text-[#8B8BA3]" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {!promo.loading && promo.valid && (
                      <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!promo.loading && promo.error && (
                      <svg className="h-4 w-4 text-[#FF1744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                {/* Validation message */}
                {promo.valid && promo.trainer_name && (
                  <p className="text-xs text-[#00C853]">
                    ✓ Entrenador: <strong>{promo.trainer_name}</strong>
                  </p>
                )}
                {promo.error && (
                  <p className="text-xs text-[#FF1744]">{promo.error}</p>
                )}
              </div>
            )}

            {/* Full Name */}
            {role && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#8B8BA3]">
                    Nombre completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#8B8BA3]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#8B8BA3]">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                  />
                  {passwordErrors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {passwordErrors.map((err) => (
                        <span key={err} className="rounded-md bg-[#FF1744]/10 px-2 py-0.5 text-xs text-[#FF1744]">
                          {err}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#8B8BA3]">
                    Confirmar contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:ring-[#00E5FF]/20 ${
                      confirmPassword && password !== confirmPassword
                        ? "border-[#FF1744] focus:border-[#FF1744]"
                        : "focus:border-[#00E5FF]"
                    }`}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-[#FF1744]">Las contraseñas no coinciden</p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full rounded-xl bg-[#00E5FF] py-3 font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creando cuenta...
                    </span>
                  ) : (
                    `Crear cuenta como ${role === "trainer" ? "Entrenador" : "Cliente"}`
                  )}
                </button>
              </>
            )}
          </form>
        </SpotlightCard>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-[#8B8BA3]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </Spotlight>
  );
}
