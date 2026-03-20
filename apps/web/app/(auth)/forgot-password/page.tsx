"use client";

import { useState } from "react";
import Link from "next/link";
import { Spotlight, SpotlightCard } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : "https://fitos-web.vercel.app/auth/callback?next=/reset-password";

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (authError) {
      setError("Algo ha fallado. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <Spotlight className="flex min-h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Fit<span className="text-[#00E5FF]">OS</span>
          </h1>
          <p className="mt-2 text-sm text-[#8B8BA3]">Recupera tu contraseña</p>
        </div>

        <SpotlightCard>
          {sent ? (
            /* ── Success state ── */
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#00E5FF]/10 ring-1 ring-[#00E5FF]/30">
                <svg className="h-7 w-7 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">¡Revisa tu bandeja de entrada!</h2>
              <p className="text-sm text-[#8B8BA3]">
                Si el email <span className="text-white">{email}</span> está registrado, recibirás un enlace para restablecer tu contraseña.
              </p>
              <p className="text-xs text-[#8B8BA3]/60">
                ¿No ves el email? Revisa la carpeta de spam.
              </p>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-[#8B8BA3]">
                Introduce tu email y te enviaremos un enlace para que puedas crear una nueva contraseña.
              </p>

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

              {error && (
                <div className="rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-[#00E5FF] py-3 font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </button>
            </form>
          )}
        </SpotlightCard>

        <p className="mt-6 text-center text-sm text-[#8B8BA3]">
          <Link href="/login" className="font-medium text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </Spotlight>
  );
}
