"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : authError.message);
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role;
    if (role === "trainer") router.push("/app/trainer/dashboard");
    else router.push("/app/client/dashboard");
  };

  return (
    <>
      <style>{`
        @keyframes login-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-up { animation: login-up 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .lu-1 { animation-delay: 0.05s; }
        .lu-2 { animation-delay: 0.15s; }
        .lu-3 { animation-delay: 0.25s; }
        .lu-4 { animation-delay: 0.35s; }
        .lu-5 { animation-delay: 0.42s; }

        @keyframes scan-down { from { top: -2px; } to { top: 100%; } }
        .scan-line { animation: scan-down 7s linear infinite; }

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

        .btn-signin {
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
        .btn-signin::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          transition: left 0.45s ease;
        }
        .btn-signin:hover::before { left: 100%; }
        .btn-signin:hover { box-shadow: 0 0 32px rgba(0,229,255,0.45); background: #1AEEFF; }
        .btn-signin:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-signin:disabled::before { display: none; }
      `}</style>

      <div className="flex min-h-screen bg-[#0A0A0F] text-white">

        {/* ── Photo panel (left 55%) ── */}
        <div className="hidden lg:block relative w-[55%] overflow-hidden">
          <Image
            src="/auth-login.jpg"
            fill
            className="object-cover object-center"
            alt="FitOS gym"
            priority
          />

          {/* Gradient: right edge dissolves into form panel */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(10,10,15,0.15) 0%, rgba(10,10,15,0.2) 55%, rgba(10,10,15,0.88) 88%, #0A0A0F 100%)" }}
          />
          {/* Bottom gradient for headline legibility */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0.4) 30%, transparent 60%)" }}
          />

          {/* Horizontal scan line */}
          <div className="scan-line pointer-events-none absolute left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.18) 40%, rgba(0,229,255,0.18) 60%, transparent 100%)" }}
          />

          {/* Panel content */}
          <div className="absolute inset-0 flex flex-col justify-between p-12">
            {/* Top: back link */}
            <Link href="/" className="group inline-flex items-center gap-2 text-[12px] text-[#5A5A72] transition-colors hover:text-white w-fit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
              </svg>
              Volver al inicio
            </Link>

            {/* Bottom: headline + stat chips */}
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-[#00E5FF]/70">
                — Plataforma
              </p>
              <h2 className="text-[clamp(28px,2.8vw,44px)] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-white">
                Todo lo que<br />
                necesitas para<br />
                <span className="text-[#00E5FF]">entrenar mejor.</span>
              </h2>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {[
                  { val: "+500", label: "entrenadores" },
                  { val: "14 días", label: "gratis" },
                  { val: "IA", label: "integrada" },
                ].map(chip => (
                  <div key={chip.val} className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-black/30 backdrop-blur-sm px-4 py-1.5">
                    <span className="text-[13px] font-bold text-[#00E5FF]">{chip.val}</span>
                    <span className="text-[11px] text-[#8B8BA3]">{chip.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vertical label on right edge */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
            <div className="h-16 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,229,255,0.25), transparent)" }} />
            <p
              className="text-[9px] font-bold uppercase tracking-[0.45em] text-[#3A3A52]"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              FitOS · 2026
            </p>
            <div className="h-16 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,229,255,0.25), transparent)" }} />
          </div>
        </div>

        {/* ── Form panel (right 45%) ── */}
        <div className="dot-grid relative flex w-full flex-col items-center justify-center px-8 py-16 lg:w-[45%]">
          {/* Glow orb top */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[#00E5FF] opacity-[0.04] blur-[90px]" />

          <div className="relative w-full max-w-[360px]">

            {/* Mobile: logo + back */}
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link href="/" className="text-[15px] font-extrabold tracking-tight">
                Fit<span className="text-[#00E5FF]">OS</span>
              </Link>
              <Link href="/" className="text-[11px] text-[#5A5A72] hover:text-white transition-colors">← Volver</Link>
            </div>

            {/* Header */}
            <div className="login-up lu-1 mb-10">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Acceso</p>
              <h1 className="text-[30px] font-extrabold uppercase tracking-[-0.02em] text-white leading-none">
                Iniciar sesión
              </h1>
              <p className="mt-2.5 text-[13px] text-[#8B8BA3]">Bienvenido de vuelta</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-7">

              <div className="login-up lu-2">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className="auth-field"
                />
              </div>

              <div className="login-up lu-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#5A5A72]">
                    Contraseña
                  </label>
                  <Link href="/forgot-password" className="text-[11px] text-[#5A5A72] hover:text-[#00E5FF] transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="auth-field"
                />
              </div>

              {error && (
                <div className="login-up flex items-center gap-3 rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/[0.06] px-4 py-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-[#FF1744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="text-[13px] text-[#FF1744]">{error}</p>
                </div>
              )}

              <div className="login-up lu-4">
                <button type="submit" disabled={loading} className="btn-signin">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                      Iniciando sesión...
                    </span>
                  ) : (
                    "Iniciar sesión →"
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="login-up lu-5 mt-10 border-t border-white/[0.06] pt-6">
              <p className="text-[13px] text-[#5A5A72]">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="font-semibold text-white hover:text-[#00E5FF] transition-colors">
                  Regístrate gratis →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
