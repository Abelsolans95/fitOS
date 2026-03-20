import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "FitOS — Plataforma para Entrenadores y Clientes de Fitness",
  description:
    "La plataforma SaaS definitiva para entrenadores personales. Gestión de clientes, rutinas, menús nutricionales e IA avanzada.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${syne.variable} ${inter.variable} font-[family-name:var(--font-syne)] antialiased`}>
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
