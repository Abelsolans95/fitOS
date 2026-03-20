import Link from "next/link";
import { Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const features = [
  {
    num: "01",
    title: "Rutinas con IA",
    desc: "Genera planes de entrenamiento adaptados al nivel, objetivo y equipamiento de cada cliente. Sin plantillas genéricas.",
  },
  {
    num: "02",
    title: "Nutrición inteligente",
    desc: "Diseña menús semanales personalizados y analiza comidas con visión artificial. Macros en segundos.",
  },
  {
    num: "03",
    title: "Gestión de clientes",
    desc: "Onboarding personalizable, seguimiento de métricas y toda la información del cliente en un solo lugar.",
  },
  {
    num: "04",
    title: "App para tus clientes",
    desc: "Tus clientes acceden a sus rutinas, menús y progreso desde el móvil. Tú controlas todo desde la web.",
  },
];

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .fu-1 { animation-delay: 0.05s; }
        .fu-2 { animation-delay: 0.15s; }
        .fu-3 { animation-delay: 0.28s; }
        .fu-4 { animation-delay: 0.40s; }
      `}</style>

      <main className={`${syne.variable} min-h-screen bg-[#0A0A0F] font-[family-name:var(--font-syne)] text-white`}>

        {/* Nav */}
        <nav className="fixed top-0 z-50 w-full px-6 py-5 sm:px-10">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold tracking-tight">
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
                Empezar →
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative flex min-h-screen flex-col justify-center px-6 sm:px-10">
          <div className="mx-auto w-full max-w-6xl py-24">

            <p className="fu fu-1 mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]">
              Para entrenadores personales
            </p>

            <h1 className="fu fu-2 text-[clamp(32px,4vw,58px)] font-extrabold uppercase leading-[1.08] tracking-tight">
              La herramienta
              <br />
              que escala
              <br />
              <span className="text-[#00E5FF]">tu negocio.</span>
            </h1>

            <div className="fu fu-3 mt-10 flex flex-col gap-6 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-xs text-sm leading-relaxed text-[#5A5A72]">
                Gestiona clientes, diseña rutinas y planes
                nutricionales con inteligencia artificial.
                Todo en un lugar.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-[#00E5FF]"
              >
                Empieza gratis
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-base transition-colors group-hover:border-[#00E5FF]/40">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Divider stat */}
        <div className="px-6 sm:px-10">
          <div className="mx-auto max-w-7xl border-t border-white/[0.07]" />
        </div>

        {/* Stats row */}
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/[0.06]">
            {[
              { val: "14", unit: "días gratis" },
              { val: "5", unit: "clientes incluidos" },
              { val: "4", unit: "módulos con IA" },
            ].map(({ val, unit }) => (
              <div key={unit} className="px-6 first:pl-0 last:pr-0 sm:px-10">
                <p className="text-[clamp(36px,5vw,64px)] font-extrabold leading-none text-white">
                  {val}
                </p>
                <p className="mt-2 text-xs text-[#5A5A72] uppercase tracking-widest">{unit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="px-6 sm:px-10">
          <div className="mx-auto max-w-7xl border-t border-white/[0.07]" />
        </div>

        {/* Features — editorial list */}
        <section className="px-6 py-20 sm:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-12 flex items-baseline justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]">
                Módulos
              </p>
              <span className="text-[10px] text-[#5A5A72]">04 funcionalidades</span>
            </div>

            <div>
              {features.map((f) => (
                <div
                  key={f.num}
                  className="group grid grid-cols-12 gap-4 border-b border-white/[0.06] py-7 transition-colors hover:border-white/[0.12]"
                >
                  <span className="col-span-1 text-[10px] font-medium text-[#5A5A72] pt-0.5">
                    {f.num}
                  </span>
                  <h3 className="col-span-4 text-base font-bold text-white transition-colors group-hover:text-[#00E5FF] sm:col-span-3">
                    {f.title}
                  </h3>
                  <p className="col-span-7 text-sm leading-relaxed text-[#5A5A72] sm:col-span-8">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="px-6 sm:px-10">
          <div className="mx-auto max-w-7xl border-t border-white/[0.07]" />
        </div>

        {/* Pricing — minimal */}
        <section className="px-6 py-24 sm:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col gap-16 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-[#5A5A72]">
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
                <p className="mt-4 text-xs text-[#5A5A72]">
                  Sin tarjeta de crédito. Sin compromiso.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <ul className="flex flex-col gap-3">
                  {[
                    "Gestión completa de clientes",
                    "Rutinas generadas con IA",
                    "Planes nutricionales inteligentes",
                    "App móvil para tus clientes",
                    "Vision Calorie Tracker",
                    "Formularios de onboarding",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="h-px w-5 bg-[#00E5FF] shrink-0" />
                      <span className="text-sm text-[#8B8BA3]">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="mt-4 inline-block border border-white/20 px-8 py-3 text-sm font-semibold text-white transition-all hover:border-[#00E5FF]/50 hover:text-[#00E5FF]"
                >
                  Empieza ahora →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] px-6 py-8 sm:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-sm font-bold text-[#5A5A72]">
              Fit<span className="text-white">OS</span>
              <span className="ml-3 text-xs font-normal">© 2026</span>
            </span>
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-xs text-[#5A5A72] transition-colors hover:text-white"
              >
                Acceder
              </Link>
              <Link
                href="/register"
                className="text-xs text-[#5A5A72] transition-colors hover:text-white"
              >
                Registro
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
