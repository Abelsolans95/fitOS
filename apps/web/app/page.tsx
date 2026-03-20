import type { Metadata } from "next";
import Link from "next/link";
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

const FEATURES = [
  {
    num: "01",
    title: "Rutinas generadas con IA",
    desc: "Dile a la IA el nivel, objetivo y equipamiento de tu cliente. En segundos tienes un plan de entrenamiento completo, periodizado y listo para asignar. Sin plantillas genéricas, sin perder tiempo.",
    tag: "Entrenamiento",
  },
  {
    num: "02",
    title: "Vision Calorie Tracker",
    desc: "Tu cliente fotografía su plato. La IA identifica los alimentos, estima calorías y macros al instante. El registro nutricional que antes tardaba 10 minutos ahora tarda 3 segundos.",
    tag: "Nutrición",
  },
  {
    num: "03",
    title: "Gestión de clientes centralizada",
    desc: "Onboarding personalizable, métricas de progreso, historial completo y comunicación directa. Toda la información de cada cliente en un solo lugar, sin hojas de cálculo.",
    tag: "Gestión",
  },
  {
    num: "04",
    title: "App móvil para tus clientes",
    desc: "Tus clientes acceden a sus rutinas, menús y progreso desde el móvil. Tú controlas todo desde la web. Sin que tengan que instalar nada complicado ni aprender herramientas nuevas.",
    tag: "App",
  },
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

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu { animation: fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .fu-1 { animation-delay: 0.04s; }
        .fu-2 { animation-delay: 0.14s; }
        .fu-3 { animation-delay: 0.26s; }
        .fu-4 { animation-delay: 0.38s; }
        @media (prefers-reduced-motion: reduce) {
          .fu { animation: none; }
        }
      `}</style>

      <main
        className={`${syne.variable} min-h-screen bg-[#0A0A0F] font-[family-name:var(--font-syne)] text-white`}
      >
        {/* ── Nav ── */}
        <nav
          aria-label="Navegación principal"
          className="fixed top-0 z-50 w-full px-6 py-5 sm:px-10"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-bold tracking-tight" aria-label="FitOS">
              Fit<span className="text-[#00E5FF]">OS</span>
            </span>
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-sm text-[#5A5A72] transition-colors hover:text-white"
              >
                Acceder
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-white transition-colors hover:text-[#00E5FF]"
              >
                Empezar gratis →
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section
          aria-labelledby="hero-heading"
          className="relative flex min-h-screen flex-col justify-center px-6 sm:px-10"
        >
          <div className="mx-auto w-full max-w-6xl py-24">
            <p className="fu fu-1 mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]">
              Para entrenadores personales
            </p>

            <h1
              id="hero-heading"
              className="fu fu-2 text-[clamp(32px,4vw,58px)] font-extrabold uppercase leading-[1.08] tracking-tight"
            >
              La herramienta
              <br />
              que escala
              <br />
              <span className="text-[#00E5FF]">tu negocio.</span>
            </h1>

            <div className="fu fu-3 mt-10 flex flex-col gap-6 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-sm text-sm leading-relaxed text-[#5A5A72]">
                Gestiona clientes, genera rutinas y planes nutricionales
                con inteligencia artificial. Deja de perder tiempo en
                tareas administrativas y céntrate en entrenar.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-[#00E5FF]"
              >
                Prueba gratis — sin tarjeta
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-base transition-colors group-hover:border-[#00E5FF]/40">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        <div className="px-6 sm:px-10">
          <div className="mx-auto max-w-7xl border-t border-white/[0.07]" />
        </div>

        {/* ── Stats ── */}
        <section aria-label="Datos de la oferta" className="px-6 py-16 sm:px-10">
          <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/[0.06]">
            {[
              { val: "14", unit: "días gratis", sub: "sin tarjeta de crédito" },
              { val: "5", unit: "clientes gratis", sub: "para siempre en el plan base" },
              { val: "4", unit: "módulos con IA", sub: "rutinas, nutrición, visión, análisis" },
            ].map(({ val, unit, sub }) => (
              <div key={unit} className="px-6 first:pl-0 last:pr-0 sm:px-10">
                <p className="text-[clamp(36px,5vw,64px)] font-extrabold leading-none text-white">
                  {val}
                </p>
                <p className="mt-2 text-xs uppercase tracking-widest text-[#5A5A72]">{unit}</p>
                <p className="mt-1 hidden text-xs text-[#3A3A52] sm:block">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="px-6 sm:px-10">
          <div className="mx-auto max-w-7xl border-t border-white/[0.07]" />
        </div>

        {/* ── Features ── */}
        <section aria-labelledby="features-heading" className="px-6 py-20 sm:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-12 flex items-baseline justify-between">
              <h2
                id="features-heading"
                className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]"
              >
                Módulos
              </h2>
              <span className="text-[10px] text-[#5A5A72]">04 funcionalidades</span>
            </div>

            <div role="list">
              {FEATURES.map((f) => (
                <article
                  key={f.num}
                  role="listitem"
                  className="group grid grid-cols-12 gap-4 border-b border-white/[0.06] py-7 transition-colors hover:border-white/[0.12]"
                >
                  <span className="col-span-1 pt-0.5 text-[10px] font-medium text-[#5A5A72]">
                    {f.num}
                  </span>
                  <div className="col-span-4 sm:col-span-3">
                    <h3 className="text-base font-bold text-white transition-colors group-hover:text-[#00E5FF]">
                      {f.title}
                    </h3>
                    <span className="mt-1 inline-block text-[9px] font-medium uppercase tracking-widest text-[#3A3A52]">
                      {f.tag}
                    </span>
                  </div>
                  <p className="col-span-7 text-sm leading-relaxed text-[#5A5A72] sm:col-span-8">
                    {f.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="px-6 sm:px-10">
          <div className="mx-auto max-w-7xl border-t border-white/[0.07]" />
        </div>

        {/* ── Pricing ── */}
        <section aria-labelledby="pricing-heading" className="px-6 py-24 sm:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col gap-16 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p
                  id="pricing-heading"
                  className="mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]"
                >
                  Precio
                </p>
                <div className="flex items-baseline gap-4">
                  <span className="text-[clamp(64px,10vw,112px)] font-extrabold leading-none text-white">
                    14
                  </span>
                  <div>
                    <p className="text-xl font-light text-[#5A5A72]">días</p>
                    <p className="text-xl font-light text-[#5A5A72]">gratis</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#5A5A72]">
                  O tus primeros 5 clientes — para siempre.
                </p>
                <p className="mt-1 text-xs text-[#3A3A52]">
                  Sin tarjeta de crédito. Sin compromiso.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <ul
                  aria-label="Qué incluye el plan gratuito"
                  className="flex flex-col gap-3"
                >
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-px w-5 shrink-0 bg-[#00E5FF]" aria-hidden="true" />
                      <span className="text-sm text-[#8B8BA3]">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="mt-6 inline-block border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-[#00E5FF]/50 hover:text-[#00E5FF]"
                >
                  Empezar ahora — es gratis →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.06] px-6 py-8 sm:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-sm font-bold text-[#5A5A72]">
              Fit<span className="text-white">OS</span>
              <span className="ml-3 text-xs font-normal">© 2026</span>
            </span>
            <nav aria-label="Enlaces del pie" className="flex items-center gap-6">
              <Link href="/login" className="text-xs text-[#5A5A72] transition-colors hover:text-white">
                Acceder
              </Link>
              <Link href="/register" className="text-xs text-[#5A5A72] transition-colors hover:text-white">
                Registro
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
