import Link from "next/link";
import { IcArrow } from "./Icons";

export function CTASection() {
  return (
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
  );
}
