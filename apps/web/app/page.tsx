import type { Metadata } from "next";
import { Syne } from "next/font/google";

import { LandingStyles } from "./components/landing/LandingStyles";
import { NavBar } from "./components/landing/NavBar";
import { HeroSection } from "./components/landing/HeroSection";
import { TickerBar } from "./components/landing/TickerBar";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { PhotoBreakSection } from "./components/landing/PhotoBreakSection";
import { HowItWorksSection } from "./components/landing/HowItWorksSection";
import { TestimonialsSection } from "./components/landing/TestimonialsSection";
import { PricingSection } from "./components/landing/PricingSection";
import { CTASection } from "./components/landing/CTASection";
import { Footer } from "./components/landing/Footer";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kuvox — Software para Entrenadores Personales con IA",
  description:
    "La herramienta que usan los entrenadores personales para escalar su negocio. Genera rutinas y menús con IA, gestiona clientes y analiza comidas con la cámara. Prueba gratis: 14 días o tus primeros 5 clientes.",
  alternates: { canonical: process.env.NEXT_PUBLIC_BASE_URL ?? "https://fit-os-web.vercel.app" },
};

export default function LandingPage() {
  return (
    <>
      <LandingStyles />

      <main className={`${syne.variable} bg-[#0A0A0F] font-[family-name:var(--font-syne)] text-white overflow-x-hidden w-full`}>
        <NavBar />
        <HeroSection />
        <TickerBar />
        <FeaturesSection />
        <PhotoBreakSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
