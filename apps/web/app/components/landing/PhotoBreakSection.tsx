import Image from "next/image";

export function PhotoBreakSection() {
  return (
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
            Kuvox automatiza la planificación para que puedas dedicar toda tu energía a lo que de verdad marca la diferencia: tus clientes.
          </p>
        </div>
      </div>
    </section>
  );
}
