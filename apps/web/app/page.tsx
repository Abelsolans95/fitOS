import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitOS — Software para Entrenadores Personales con IA",
  description:
    "La herramienta que usan los entrenadores personales para escalar su negocio. Genera rutinas y menús con IA, gestiona clientes y analiza comidas con la cámara. Prueba gratis: 14 días o tus primeros 5 clientes.",
  alternates: { canonical: "https://fit-os-web.vercel.app" },
};

/* ─── Icons ─────────────────────────────────────────────── */
const IcBrain = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
  </svg>
);
const IcCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);
const IcUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>
  </svg>
);
const IcCal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
/* ─── Data ───────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: "Carlos M.", role: "Entrenador Personal, Madrid", text: "FitOS me ha ahorrado más de 2 horas al día. La IA genera rutinas que antes me costaba una hora diseñar.", avatar: "CM" },
  { name: "Sara L.", role: "Coach de Nutrición, BCN", text: "El Vision Calorie Tracker es lo que mis clientes necesitaban. Ya no hay excusas para no registrar lo que comen.", avatar: "SL" },
  { name: "Javi R.", role: "PT Online", text: "Pasé de 8 a 23 clientes en 3 meses gracias a la automatización. La app móvil marca la diferencia.", avatar: "JR" },
  { name: "Ana P.", role: "Entrenadora Funcional", text: "Gestionar 30 clientes desde un solo lugar era impensable. Con FitOS es mi día a día.", avatar: "AP" },
  { name: "Tomás G.", role: "Box CF Coach", text: "Mis clientes se quedan con la boca abierta cuando ven que tienen su propia app. Me diferencia de la competencia.", avatar: "TG" },
  { name: "Lucía F.", role: "Nutricionista + PT", text: "La integración entre rutinas y nutrición es perfecta. Es el único software que lo hace todo junto.", avatar: "LF" },
];

const INCLUDED = [
  "Clientes ilimitados durante el periodo de prueba",
  "Rutinas generadas con IA (Claude AI)",
  "Vision Calorie Tracker — análisis de comidas por foto",
  "Planes nutricionales semanales personalizados",
  "App móvil para cada cliente",
  "Formularios de onboarding personalizables",
  "Seguimiento de métricas y progreso",
  "Google Calendar integrado",
];

/* ─── Page ───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
          50%     { box-shadow: 0 0 0 8px rgba(0,229,255,0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-7px); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0; }
        }

        .fu  { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .fi  { animation: fadeIn 1.2s ease both; }
        .fu-1 { animation-delay: 0.1s; }
        .fu-2 { animation-delay: 0.25s; }
        .fu-3 { animation-delay: 0.42s; }
        .fu-4 { animation-delay: 0.6s; }
        .fu-5 { animation-delay: 0.78s; }

        .shimmer-cyan {
          background: linear-gradient(90deg, #00E5FF 0%, #fff 28%, #7C3AED 55%, #00E5FF 80%);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }

        /* Nav */
        .nav-pill {
          background: rgba(10,10,15,0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 100px;
        }

        /* Premium UI font — buttons, card titles, UI labels */
        .font-jakarta { font-family: var(--font-jakarta), sans-serif; }
        .feat-card h3,
        .feat-card .card-num,
        .how-card h3,
        .pricing-title,
        .nav-cta { font-family: var(--font-jakarta), sans-serif; }

        /* Buttons */
        .btn-primary {
          background: #00E5FF; color: #0A0A0F; font-weight: 800;
          font-family: var(--font-jakarta), sans-serif;
          letter-spacing: 0.01em;
          position: relative; overflow: hidden; transition: all 0.25s ease;
        }
        .btn-primary::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%);
          pointer-events: none;
        }
        .btn-primary:hover {
          background: #2BEEFF;
          box-shadow: 0 0 36px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.18);
          transform: translateY(-1px);
        }
        .btn-ghost {
          border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.7);
          font-family: var(--font-jakarta), sans-serif;
          transition: all 0.25s ease;
        }
        .btn-ghost:hover {
          border-color: rgba(255,255,255,0.28); color: #fff;
          background: rgba(255,255,255,0.05);
        }

        /* Feature cards */
        .feat-card {
          position: relative; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          background: #12121A; border-radius: 20px;
          transition: border-color 0.4s ease, transform 0.35s ease, box-shadow 0.4s ease;
        }
        .feat-card:hover { transform: translateY(-3px); }
        .feat-card[data-c="cyan"]:hover  { border-color: rgba(0,229,255,0.2); box-shadow: 0 20px 60px -15px rgba(0,229,255,0.12); }
        .feat-card[data-c="violet"]:hover { border-color: rgba(124,58,237,0.25); box-shadow: 0 20px 60px -15px rgba(124,58,237,0.15); }
        .feat-card[data-c="orange"]:hover { border-color: rgba(255,145,0,0.25); box-shadow: 0 20px 60px -15px rgba(255,145,0,0.12); }

        .icon-float { animation: float 5s ease-in-out infinite; }

        /* Marquee */
        .marquee-track { display: flex; width: max-content; animation: marquee 30s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }

        /* Ticker */
        .ticker-track { display: flex; width: max-content; animation: ticker 45s linear infinite; }

        /* Testi card */
        .testi-card {
          background: rgba(18,18,26,0.85); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; flex-shrink: 0; width: min(320px, 82vw);
        }

        /* Pricing wrap */
        .pricing-wrap {
          background: linear-gradient(135deg, rgba(0,229,255,0.18), rgba(124,58,237,0.18));
          padding: 1px; border-radius: 24px;
        }
        .pricing-inner { background: #0E0E18; border-radius: 23px; }

        /* Pulse */
        .pulse-dot { animation: pulse-ring 2.5s ease-in-out infinite; }

        /* Cursor blink */
        .cursor { animation: blink 1.1s step-end infinite; }

        /* Scan line on hero product card */
        @keyframes scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          8%   { opacity: 0.6; }
          92%  { opacity: 0.6; }
          100% { transform: translateY(900%); opacity: 0; }
        }
        .scan-line {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, #00E5FF 50%, transparent 100%);
          animation: scan 6s linear infinite; pointer-events: none; z-index: 10;
        }

        /* Word breaking only on mobile — desktop allows natural overflow */
        @media (max-width: 640px) {
          h1, h2, h3 { word-break: break-word; }
        }

        @media (prefers-reduced-motion: reduce) {
          .fu, .fi, .shimmer-cyan, .icon-float, .pulse-dot, .cursor,
          .scan-line, .marquee-track, .ticker-track { animation: none !important; }
          .shimmer-cyan { -webkit-text-fill-color: #00E5FF; }
        }
      `}</style>

      <main className={`${syne.variable} bg-[#0A0A0F] font-[family-name:var(--font-syne)] text-white overflow-x-hidden w-full`}>

        {/* ══ NAV ══════════════════════════════════════════════ */}
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-24px)] sm:w-full sm:max-w-5xl px-0 sm:px-4">
          <nav className="nav-pill flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3">
            <span className="text-[15px] font-extrabold tracking-tight">
              Fit<span className="text-[#00E5FF]">OS</span>
            </span>
            <div className="hidden sm:flex items-center gap-7 text-[13px] text-[#8B8BA3]">
              <a href="#features" className="hover:text-white transition-colors">Módulos</a>
              <a href="#how" className="hover:text-white transition-colors">Cómo funciona</a>
              <a href="#pricing" className="hover:text-white transition-colors">Precio</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="nav-cta btn-ghost rounded-full px-3 py-2 text-[12px] sm:px-4 sm:text-[13px]">Acceder</Link>
              <Link href="/register" className="nav-cta btn-primary rounded-full px-3 py-2 text-[12px] sm:px-4 sm:text-[13px] inline-flex items-center gap-1.5">
                <span className="hidden sm:inline">Empezar gratis</span>
                <span className="sm:hidden">Empezar</span>
                <IcArrow />
              </Link>
            </div>
          </nav>
        </div>

        {/* ══ HERO — full-bleed photo ══════════════════════════ */}
        <section className="relative min-h-screen flex items-center overflow-hidden">

          {/* Background photo */}
          <div className="absolute inset-0">
            <Image
              src="/hero-gym.jpg"
              alt="Entrenador personal con cliente en gimnasio premium"
              fill
              priority
              className="object-cover object-center"
              quality={90}
            />
            {/* Left-to-right dark overlay — heavier on mobile for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-[#0A0A0F]/90 to-[#0A0A0F]/70 sm:via-[#0A0A0F]/85 sm:to-[#0A0A0F]/25" />
            {/* Top fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F]/60 via-transparent to-[#0A0A0F]" />
            {/* Cyan tint overlay to blend photo with brand */}
            <div className="absolute inset-0 bg-[#00E5FF]/[0.03]" />
          </div>

          {/* Content */}
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-10 pt-24 sm:pt-28 pb-20 sm:pb-24">
            <div className="max-w-2xl">

              {/* Badge */}
              <div className="fu fu-1 mb-8">
                <span className="pulse-dot inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/08 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#00E5FF]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                  Para entrenadores personales
                </span>
              </div>

              {/* Headline */}
              <h1 className="fu fu-2 text-[clamp(26px,7.5vw,92px)] font-extrabold leading-[0.95] tracking-[-0.04em] uppercase">
                La plataforma
                <br />
                que escala
                <br />
                <span className="shimmer-cyan">tu negocio.</span>
              </h1>

              {/* Subtext */}
              <p className="fu fu-3 mt-8 max-w-[440px] text-[15px] leading-relaxed text-white/60">
                Genera rutinas y planes nutricionales con IA, gestiona todos tus clientes desde un solo lugar y dales una app móvil propia.
              </p>

              {/* CTAs */}
              <div className="fu fu-4 mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 sm:px-8 sm:py-4 text-[14px] sm:text-[15px] font-jakarta">
                  Prueba gratis — sin tarjeta
                </Link>
                <Link href="/login" className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 sm:px-8 sm:py-4 text-[14px] sm:text-[15px] font-jakarta">
                  Acceder <IcArrow />
                </Link>
              </div>

              <p className="fu fu-5 mt-5 text-[12px] text-white/30">14 días gratis · Sin tarjeta · Sin compromiso</p>

              {/* Stats row */}
              <div className="fu fu-5 mt-10 flex items-center gap-5 sm:gap-8 border-t border-white/[0.08] pt-8">
                {[
                  { val: "14", label: "días gratis" },
                  { val: "5", label: "clientes gratis" },
                  { val: "4×", label: "módulos IA" },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <p className="text-[32px] font-extrabold leading-none text-white">{val}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating product card — right side on desktop */}
          <div className="fi absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block w-[360px]">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0E0E18]/90 backdrop-blur-sm shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
              <div className="scan-line" />
              {/* Chrome */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#12121A]/80 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <span className="h-2 w-2 rounded-full bg-[#28C840]" />
                <span className="ml-2 font-mono text-[10px] text-[#3A3A52]">app.fitos.io</span>
                <span className="ml-auto flex items-center gap-1 rounded-full bg-[#00C853]/10 px-2 py-0.5 text-[9px] font-bold text-[#00C853]">
                  <span className="h-1 w-1 rounded-full bg-[#00C853]" />EN VIVO
                </span>
              </div>
              {/* Content */}
              <div className="p-4 space-y-3">
                {/* AI prompt */}
                <div className="rounded-xl border border-[#00E5FF]/15 bg-[#00E5FF]/[0.05] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#00E5FF] mb-1.5">— Generando con IA</p>
                  <p className="text-[11px] text-white/60">&ldquo;Rutina hipertrofia 4 días, Ana García<span className="cursor text-[#00E5FF]">|</span>&rdquo;</p>
                </div>
                {/* Exercises */}
                <div className="space-y-1.5">
                  {[
                    { ex: "Press Banca", s: "4×8", kg: "50kg", done: true },
                    { ex: "Sentadilla Goblet", s: "4×10", kg: "24kg", done: true },
                    { ex: "Hip Thrust", s: "3×12", kg: "60kg", done: false },
                  ].map(item => (
                    <div key={item.ex} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${item.done ? "border-[#00E5FF]/18 bg-[#00E5FF]/[0.04]" : "border-white/[0.05] bg-white/[0.015]"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${item.done ? "bg-[#00E5FF]" : "bg-[#3A3A52]"}`} />
                        <span className={`text-[11px] font-medium ${item.done ? "text-white" : "text-white/50"}`}>{item.ex}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/30">{item.s}</span>
                        <span className={`text-[10px] font-bold ${item.done ? "text-[#00E5FF]" : "text-white/40"}`}>{item.kg}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ v: "12", l: "Clientes", c: "#00E5FF" }, { v: "4", l: "Hoy", c: "#7C3AED" }, { v: "98%", l: "Adhes.", c: "#00C853" }].map(m => (
                    <div key={m.l} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center">
                      <p className="text-[16px] font-extrabold leading-none" style={{ color: m.c }}>{m.v}</p>
                      <p className="mt-1 text-[8px] text-white/30 uppercase tracking-wide">{m.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating nutrition badge */}
            <div className="absolute -top-4 -left-10 rounded-xl border border-white/[0.1] bg-[#12121A]/90 backdrop-blur-sm px-3.5 py-2.5 shadow-xl" style={{ animation: "float 7s ease-in-out infinite 1s" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF9100]">Visión IA</p>
              <p className="mt-0.5 text-[11px] font-bold text-white">580 kcal detectadas</p>
              <p className="text-[9px] text-white/50">52g P · 62g C · 8g G</p>
            </div>
          </div>
        </section>

        {/* ══ TICKER ══════════════════════════════════════════ */}
        <div className="overflow-hidden border-y border-white/[0.05] bg-[#0C0C14] py-3.5">
          <div className="ticker-track whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.35em] text-[#3A3A52]">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="mx-8">
                Rutinas con IA <span className="mx-5 text-[#00E5FF]/35">·</span>
                Vision Calorie Tracker <span className="mx-5 text-[#7C3AED]/35">·</span>
                App móvil para clientes <span className="mx-5 text-[#FF9100]/35">·</span>
                Google Calendar <span className="mx-5 text-[#00E5FF]/35">·</span>
                Gestión de clientes <span className="mx-5 text-[#7C3AED]/35">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ══ FEATURES BENTO ══════════════════════════════════ */}
        <section id="features" className="px-4 py-16 sm:px-10 sm:py-24">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Módulos</p>
                <h2 className="text-[clamp(24px,4.5vw,54px)] font-extrabold uppercase leading-[1.02] tracking-[-0.03em]">
                  Todo lo que necesitas,
                  <br />
                  <span className="shimmer-cyan">en un solo lugar.</span>
                </h2>
              </div>
              <p className="max-w-xs text-[14px] leading-relaxed text-[#8B8BA3]">
                Cinco módulos integrados para que pases más tiempo entrenando y menos gestionando.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
              {/* Card 01 */}
              <article className="feat-card p-7 lg:col-span-7" data-c="cyan">
                <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#00E5FF] opacity-[0.035] blur-[70px]" />
                <div className="flex items-start gap-4 mb-6">
                  <div className="icon-float inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/08 text-[#00E5FF]"><IcBrain /></div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#00E5FF]">01 — Entrenamiento</span>
                    <h3 className="mt-0.5 text-[20px] font-extrabold text-white">Rutinas generadas con IA</h3>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-[#8B8BA3] max-w-sm mb-7">Dile a la IA el nivel, objetivo y equipamiento. En segundos tienes un plan completo, periodizado y listo para asignar.</p>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-[#5A5A72]"><span className="text-[#00E5FF]">›</span> Fuerza · 4 días · Gimnasio completo</div>
                  <div className="h-px bg-white/[0.04]" />
                  <div className="grid grid-cols-3 gap-2">
                    {[{ d: "Día A", t: "Pecho/Hombro", c: "#00E5FF" }, { d: "Día B", t: "Espalda/Bíceps", c: "#7C3AED" }, { d: "Día C", t: "Pierna", c: "#FF9100" }].map(({ d, t, c }) => (
                      <div key={d} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5 text-center">
                        <p className="text-[10px] font-bold" style={{ color: c }}>{d}</p>
                        <p className="mt-0.5 text-[9px] text-[#5A5A72]">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              {/* Card 02 */}
              <article className="feat-card p-7 lg:col-span-5" data-c="violet">
                <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-[#7C3AED] opacity-[0.05] blur-[60px]" />
                <div className="mb-5 icon-float inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/08 text-[#7C3AED]" style={{ animationDelay: "1.2s" }}><IcCamera /></div>
                <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.3em] text-[#7C3AED]">02 — Nutrición</span>
                <h3 className="mb-3 text-[19px] font-extrabold text-white">Vision Calorie Tracker</h3>
                <p className="text-[13px] leading-relaxed text-[#8B8BA3] mb-5">Tu cliente fotografía su plato. La IA identifica los alimentos y estima calorías y macros al instante.</p>
                <div className="space-y-2">
                  {[{ f: "Pechuga + arroz", k: "580", b: 72 }, { f: "Batido proteína", k: "220", b: 28 }].map(({ f, k, b }) => (
                    <div key={f} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[12px] font-medium text-white">{f}</span>
                        <span className="text-[11px] font-bold text-[#7C3AED]">{k} kcal</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06]">
                        <div className="h-1 rounded-full bg-[#7C3AED]" style={{ width: `${b}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              {/* Cards 03-05 */}
              {[
                { c: "cyan", color: "#00E5FF", num: "03", label: "Gestión", title: "Clientes centralizados", desc: "Onboarding, métricas, historial y comunicación directa. Sin hojas de cálculo.", icon: <IcUsers /> },
                { c: "orange", color: "#FF9100", num: "04", label: "App", title: "App móvil para clientes", desc: "Tus clientes acceden a rutinas, menús y progreso desde el móvil. Tú controlas todo desde la web.", icon: <IcPhone /> },
                { c: "violet", color: "#7C3AED", num: "05", label: "Agenda", title: "Google Calendar", desc: "Sesiones y citas sincronizadas automáticamente con el calendario de cada cliente.", icon: <IcCal /> },
              ].map(({ c, color, num, label, title, desc, icon }) => (
                <article key={num} className="feat-card p-7 lg:col-span-4" data-c={c}>
                  <div className="pointer-events-none absolute right-0 bottom-0 h-40 w-40 rounded-full opacity-[0.05] blur-[50px]" style={{ background: color }} />
                  <div className="mb-5 icon-float inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ border: `1px solid ${color}30`, background: `${color}10`, color }}>{icon}</div>
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color }}>{num} — {label}</span>
                  <h3 className="mb-3 text-[18px] font-extrabold text-white">{title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#8B8BA3]">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PHOTO BREAK — Athlete ════════════════════════════ */}
        <section className="relative overflow-hidden" style={{ height: "60vh", minHeight: "360px" }}>
          <Image
            src="/hero-athlete.jpg"
            alt="Atleta entrenando en gimnasio de alto rendimiento"
            fill
            className="object-cover object-center"
            quality={90}
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-[#0A0A0F]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-[#0A0A0F]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/70 via-transparent to-[#0A0A0F]/70" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#00E5FF]/70 mb-5">Tecnología al servicio del rendimiento</p>
              <h2 className="text-[clamp(26px,6vw,80px)] font-extrabold uppercase leading-[0.95] tracking-[-0.04em]">
                Cada segundo que<br />
                <span className="shimmer-cyan">ahorras, importa.</span>
              </h2>
              <p className="mt-6 text-[15px] text-white/50 max-w-md mx-auto">
                FitOS automatiza la planificación para que puedas dedicar toda tu energía a lo que de verdad marca la diferencia: tus clientes.
              </p>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ════════════════════════════════════ */}
        <section id="how" className="px-4 py-16 sm:px-10 sm:py-24">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Proceso</p>
              <h2 className="text-[clamp(28px,4vw,50px)] font-extrabold uppercase leading-tight tracking-[-0.03em]">
                En marcha en <span className="text-[#FF9100]">3 pasos.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                { n: "01", title: "Añade tu cliente", desc: "Importa o crea el perfil en segundos. Rellena el onboarding con sus objetivos, historial y equipamiento.", accent: "#00E5FF" },
                { n: "02", title: "La IA diseña el plan", desc: "Genera rutinas periodizadas y menús nutricionales personalizados con un solo prompt. Revisa, ajusta y asigna.", accent: "#7C3AED" },
                { n: "03", title: "El cliente entrena", desc: "Tu cliente accede desde su app móvil, registra series y pesos, y tú ves el progreso en tiempo real.", accent: "#FF9100" },
              ].map(({ n, title, desc, accent }) => (
                <div key={n} className="how-card relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#12121A] p-8">
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                  <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full opacity-[0.05] blur-[50px]" style={{ background: accent }} />
                  <p className="text-[36px] font-extrabold leading-none mb-5" style={{ color: accent }}>{n}</p>
                  <h3 className="mb-3 text-[18px] font-extrabold text-white">{title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#8B8BA3]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ════════════════════════════════════ */}
        <section className="overflow-hidden py-20">
          <div className="mb-10 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Entrenadores que ya usan FitOS</p>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0A0A0F] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0A0A0F] to-transparent z-10" />
            <div className="marquee-track gap-4 flex">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={i} className="testi-card p-5 mx-2">
                  <p className="text-[13px] leading-relaxed text-[#8B8BA3] mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-[#7C3AED]/20 border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-white">{t.name}</p>
                      <p className="text-[10px] text-[#5A5A72]">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TRAINER DESK SPLIT + PRICING ════════════════════ */}
        <section id="pricing" className="px-4 py-16 sm:px-10 sm:py-24">
          <div className="mx-auto w-full max-w-7xl">

            <div className="mb-14 text-center">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Precio</p>
              <h2 className="text-[clamp(28px,4.5vw,52px)] font-extrabold uppercase tracking-[-0.03em] leading-tight">
                Empieza gratis.
                <br /><span className="shimmer-cyan">Escala cuando quieras.</span>
              </h2>
            </div>

            {/* Split: photo + pricing */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">

              {/* Photo side */}
              <div className="relative overflow-hidden rounded-2xl min-h-[400px]">
                <Image
                  src="/hero-trainer-desk.jpg"
                  alt="Entrenadora personal revisando analytics en tablet"
                  fill
                  className="object-cover object-center"
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/80 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/40 to-transparent" />
                {/* Caption overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#00E5FF]/80 mb-2">La herramienta del entrenador moderno</p>
                  <p className="text-[22px] font-extrabold leading-tight text-white tracking-[-0.02em]">
                    Todo tu negocio,<br />desde un solo panel.
                  </p>
                </div>
              </div>

              {/* Pricing card */}
              <div className="pricing-wrap">
                <div className="pricing-inner p-8 sm:p-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-end gap-3 mb-2">
                      <span className="pricing-title text-[clamp(72px,10vw,100px)] font-extrabold leading-none" style={{ background: "linear-gradient(160deg,#fff 0%,rgba(255,255,255,0.55) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>14</span>
                      <div className="mb-3">
                        <p className="text-[17px] font-light text-[#8B8BA3] leading-tight">días</p>
                        <p className="text-[17px] font-light text-[#8B8BA3] leading-tight">gratis</p>
                      </div>
                    </div>
                    <p className="text-[14px] text-[#8B8BA3] mb-1">O tus primeros <span className="text-white font-bold">5 clientes</span> — para siempre.</p>
                    <p className="text-[12px] text-[#5A5A72] mb-7">Sin tarjeta. Sin compromiso.</p>

                    <ul className="space-y-2.5 mb-8">
                      {INCLUDED.map(item => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-[#00E5FF]/12 border border-[#00E5FF]/25 flex items-center justify-center text-[#00E5FF]">
                            <IcCheck />
                          </span>
                          <span className="text-[13px] text-[#8B8BA3]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/register" className="btn-primary font-jakarta inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-[14px] w-full">
                    Empezar ahora — es gratis <IcArrow />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 py-20 sm:px-10 sm:py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED] opacity-[0.07] blur-[100px]" />
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00E5FF] opacity-[0.05] blur-[80px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Listo para empezar</p>
            <h2 className="text-[clamp(26px,6vw,70px)] font-extrabold uppercase leading-[0.97] tracking-[-0.04em]">
              Tu negocio merece
              <br />
              <span className="shimmer-cyan">mejores herramientas.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-md text-[14px] leading-relaxed text-[#8B8BA3]">
              Únete a los entrenadores que ya usan FitOS para gestionar sus clientes, ahorrar tiempo y escalar con IA.
            </p>
            <div className="mt-10">
              <Link href="/register" className="btn-primary font-jakarta inline-flex items-center gap-3 rounded-2xl px-10 py-5 text-[15px] uppercase tracking-wide">
                Prueba FitOS gratis <IcArrow />
              </Link>
            </div>
            <p className="mt-5 text-[11px] text-[#5A5A72]">Sin tarjeta · Sin compromiso · 14 días gratis</p>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════ */}
        <footer className="px-4 py-10 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-4">
                <span className="text-[15px] font-extrabold">Fit<span className="text-[#00E5FF]">OS</span></span>
                <span className="text-[11px] text-[#3A3A52]">© 2026 · Software para entrenadores</span>
              </div>
              <nav className="flex items-center gap-6">
                {[["Acceder", "/login"], ["Registro", "/register"], ["Módulos", "#features"], ["Precio", "#pricing"]].map(([label, href]) => (
                  <Link key={label} href={href} className="text-[12px] text-[#5A5A72] transition-colors hover:text-white">{label}</Link>
                ))}
              </nav>
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}
