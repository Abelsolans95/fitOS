import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const BASE_URL = "https://fit-os-web.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "FitOS — Software para Entrenadores Personales",
    template: "%s | FitOS",
  },
  description:
    "FitOS es la plataforma SaaS para entrenadores personales. Genera rutinas y menús con IA, gestiona clientes, analiza comidas con visión artificial y controla el progreso desde web y móvil. Prueba gratis 14 días.",
  keywords: [
    "software entrenador personal",
    "aplicacion entrenador personal",
    "plataforma fitness entrenadores",
    "gestión clientes fitness",
    "rutinas con inteligencia artificial",
    "nutricion inteligente entrenadores",
    "app fitness entrenadores",
    "SaaS entrenador personal España",
    "generador rutinas IA",
    "seguimiento clientes gym",
  ],
  authors: [{ name: "FitOS" }],
  creator: "FitOS",
  publisher: "FitOS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: BASE_URL,
    siteName: "FitOS",
    title: "FitOS — Software para Entrenadores Personales",
    description:
      "Gestiona clientes, genera rutinas y menús con IA, analiza comidas con la cámara. Todo lo que necesita tu negocio de entrenamiento personal.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FitOS — Plataforma para Entrenadores Personales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitOS — Software para Entrenadores Personales",
    description:
      "Gestiona clientes, genera rutinas y menús con IA. Prueba gratis 14 días.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "FitOS",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, iOS, Android",
              description:
                "Plataforma SaaS para entrenadores personales con IA para rutinas, nutrición y seguimiento de clientes.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
                description: "14 días gratis, sin tarjeta de crédito",
              },
              url: BASE_URL,
            }),
          }}
        />
      </head>
      <body
        className={`${syne.variable} ${inter.variable} font-[family-name:var(--font-syne)] antialiased overflow-x-hidden`}
      >
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
