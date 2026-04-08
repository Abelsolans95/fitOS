const TESTIMONIALS = [
  { name: "Carlos M.", role: "Entrenador Personal, Madrid", text: "Kuvox me ha ahorrado más de 2 horas al día. La IA genera rutinas que antes me costaba una hora diseñar.", avatar: "CM" },
  { name: "Sara L.", role: "Coach de Nutrición, BCN", text: "El Vision Calorie Tracker es lo que mis clientes necesitaban. Ya no hay excusas para no registrar lo que comen.", avatar: "SL" },
  { name: "Javi R.", role: "PT Online", text: "Pasé de 8 a 23 clientes en 3 meses gracias a la automatización. La app móvil marca la diferencia.", avatar: "JR" },
  { name: "Ana P.", role: "Entrenadora Funcional", text: "Gestionar 30 clientes desde un solo lugar era impensable. Con Kuvox es mi día a día.", avatar: "AP" },
  { name: "Tomás G.", role: "Box CF Coach", text: "Mis clientes se quedan con la boca abierta cuando ven que tienen su propia app. Me diferencia de la competencia.", avatar: "TG" },
  { name: "Lucía F.", role: "Nutricionista + PT", text: "La integración entre rutinas y nutrición es perfecta. Es el único software que lo hace todo junto.", avatar: "LF" },
];

export function TestimonialsSection() {
  return (
    <section className="overflow-hidden py-20">
      <div className="mb-10 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#5A5A72]">Entrenadores que ya usan Kuvox</p>
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
  );
}
