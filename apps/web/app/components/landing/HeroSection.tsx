import Link from "next/link";
import Image from "next/image";
import { IcArrow } from "./Icons";

export function HeroSection() {
  return (
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
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#12121A]/80 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
            <span className="ml-2 font-mono text-[10px] text-[#3A3A52]">app.kuvox.io</span>
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
  );
}
