"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spotlight, SpotlightCard } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check for error flag from /auth/callback (link expired)
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "link_expired") {
      setSessionReady(false);
      return;
    }

    // The /auth/callback route already exchanged the code server-side.
    // Just check if there's an active session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session);
    });

    // Also listen for PASSWORD_RECOVERY in case of implicit flow fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const passwordErrors = (() => {
    const errors: string[] = [];
    if (password.length > 0 && password.length < 8) errors.push("Mínimo 8 caracteres");
    if (password.length > 0 && !/[A-Z]/.test(password)) errors.push("Al menos 1 mayúscula");
    if (password.length > 0 && !/[0-9]/.test(password)) errors.push("Al menos 1 número");
    return errors;
  })();

  const isValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after 2 seconds
    setTimeout(() => router.push("/login"), 2000);
  };

  // ── Invalid/expired link ──
  if (!sessionReady) {
    return (
      <Spotlight className="flex min-h-screen w-full items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Fit<span className="text-[#00E5FF]">OS</span>
            </h1>
          </div>
          <SpotlightCard>
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF1744]/10 ring-1 ring-[#FF1744]/30">
                <svg className="h-7 w-7 text-[#FF1744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Enlace no válido</h2>
              <p className="text-sm text-[#8B8BA3]">
                Este enlace de recuperación ha expirado o ya ha sido utilizado. Solicita uno nuevo.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block w-full rounded-xl bg-[#00E5FF] py-3 text-center font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          </SpotlightCard>
        </div>
      </Spotlight>
    );
  }

  return (
    <Spotlight className="flex min-h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Fit<span className="text-[#00E5FF]">OS</span>
          </h1>
          <p className="mt-2 text-sm text-[#8B8BA3]">
            {success ? "¡Contraseña actualizada!" : "Crea tu nueva contraseña"}
          </p>
        </div>

        <SpotlightCard>
          {success ? (
            /* ── Success ── */
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#00E5FF]/10 ring-1 ring-[#00E5FF]/30">
                <svg className="h-7 w-7 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">¡Contraseña actualizada!</h2>
              <p className="text-sm text-[#8B8BA3]">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#8B8BA3]">
                  Nueva contraseña
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

              {error && (
                <div className="rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full rounded-xl bg-[#00E5FF] py-3 font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Actualizando...
                  </span>
                ) : (
                  "Guardar nueva contraseña"
                )}
              </button>
            </form>
          )}
        </SpotlightCard>
      </div>
    </Spotlight>
  );
}
