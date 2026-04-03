import { IcBrain, IcCamera, IcUsers, IcPhone, IcCal } from "./Icons";

export function FeaturesSection() {
  return (
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
  );
}
