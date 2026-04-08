"use client";

import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  { text: "Gestión completa de clientes", color: "#00E5FF" },
  { text: "Rutinas y nutrición con IA", color: "#7C3AED" },
  { text: "App móvil para tus clientes", color: "#FF9100" },
];

export function RegisterPhotoPanel() {
  return (
    <div className="hidden lg:block relative w-[50%] overflow-hidden">
      <Image src="/auth-register.jpg" fill className="object-cover object-top" alt="Kuvox athlete" priority />

      <div className="absolute inset-0" style={{ background: "linear-gradient(to left, rgba(10,10,15,0.1) 0%, rgba(10,10,15,0.15) 55%, rgba(10,10,15,0.88) 88%, #0A0A0F 100%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.35) 35%, transparent 65%)" }} />
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[#7C3AED] opacity-[0.08] blur-[100px]" />

      <div className="absolute inset-0 flex flex-col justify-between p-12">
        <div className="flex justify-end">
          <Link href="/" className="text-[15px] font-extrabold tracking-tight text-white">
            Kuv<span className="text-[#00E5FF]">ox</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#0A0A0F]/65 backdrop-blur-xl p-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-[#7C3AED]">— Todo incluido</p>
          <div className="space-y-3.5">
            {FEATURES.map(({ text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </span>
                <span className="text-[13px] text-[#C8C8D8]">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-white/[0.08] pt-4">
            <p className="text-[11px] text-[#5A5A72]">Empieza gratis · Sin compromisos · Cancela cuando quieras</p>
          </div>
        </div>
      </div>

      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
        <div className="h-16 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.25), transparent)" }} />
        <p className="text-[9px] font-bold uppercase tracking-[0.45em] text-[#3A3A52]" style={{ writingMode: "vertical-rl" }}>Kuvox · 2026</p>
        <div className="h-16 w-px" style={{ background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.25), transparent)" }} />
      </div>
    </div>
  );
}
