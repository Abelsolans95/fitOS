"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : authError.message
      );
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role;

    if (role === "trainer") {
      router.push("/app/trainer/dashboard");
    } else {
      router.push("/app/client/dashboard");
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
            Plataforma
          </p>
          <h2 className="text-[clamp(32px,3.5vw,48px)] font-extrabold uppercase leading-[1.05] tracking-tight">
            Todo lo que<br />
            necesitas para<br />
            <span className="text-[#00E5FF]">entrenar mejor.</span>
          </h2>
        </div>

        <p className="text-xs text-[#5A5A72]">
          © 2026 FitOS · Todos los derechos reservados
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="mb-10 block text-base font-bold tracking-tight lg:hidden">
            Fit<span className="text-[#00E5FF]">OS</span>
          </Link>

          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]">
            Acceso
          </p>
          <h1 className="mb-8 text-2xl font-extrabold uppercase tracking-tight">
            Iniciar sesión
          </h1>

          <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A5A72]">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] text-[#5A5A72] transition-colors hover:text-white"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-b border-white/[0.12] bg-transparent py-2.5 text-sm text-white placeholder:text-[#5A5A72] focus:border-[#00E5FF] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="border-l-2 border-[#FF1744] pl-3 text-sm text-[#FF1744]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full border border-white/20 py-3 text-sm font-semibold text-white transition-all hover:border-[#00E5FF]/60 hover:text-[#00E5FF] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión →"}
            </button>
          </form>

          <div className="mt-10 border-t border-white/[0.06] pt-6">
            <p className="text-xs text-[#5A5A72]">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-white transition-colors hover:text-[#00E5FF]">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
