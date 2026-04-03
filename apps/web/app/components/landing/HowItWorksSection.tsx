const STEPS = [
  { n: "01", title: "Añade tu cliente", desc: "Importa o crea el perfil en segundos. Rellena el onboarding con sus objetivos, historial y equipamiento.", accent: "#00E5FF" },
  { n: "02", title: "La IA diseña el plan", desc: "Genera rutinas periodizadas y menús nutricionales personalizados con un solo prompt. Revisa, ajusta y asigna.", accent: "#7C3AED" },
  { n: "03", title: "El cliente entrena", desc: "Tu cliente accede desde su app móvil, registra series y pesos, y tú ves el progreso en tiempo real.", accent: "#FF9100" },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="px-4 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Proceso</p>
          <h2 className="text-[clamp(28px,4vw,50px)] font-extrabold uppercase leading-tight tracking-[-0.03em]">
            En marcha en <span className="text-[#FF9100]">3 pasos.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map(({ n, title, desc, accent }) => (
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
  );
}
