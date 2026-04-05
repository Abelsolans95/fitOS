import Link from "next/link";
import Image from "next/image";
import { IcCheck, IcArrow } from "./Icons";

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

export function PricingSection() {
  return (
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
  );
}
