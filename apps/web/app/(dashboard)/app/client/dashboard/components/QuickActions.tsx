import { memo } from "react";
import Link from "next/link";

export const QuickActions = memo(function QuickActions() {
  return (
    <div>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Acciones rápidas</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/app/client/calories"
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-5 py-4 transition-all hover:border-[#00E5FF]/20 hover:bg-[#00E5FF]/[0.03]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/[0.08] transition-colors group-hover:bg-[#00E5FF]/[0.14]">
            <svg className="h-5 w-5 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Escanear comida</p>
            <p className="text-xs text-[#5A5A72]">Registrar con IA</p>
          </div>
        </Link>

        <Link
          href="/app/client/routine"
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-5 py-4 transition-all hover:border-[#7C3AED]/20 hover:bg-[#7C3AED]/[0.03]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/[0.08] transition-colors group-hover:bg-[#7C3AED]/[0.14]">
            <svg className="h-5 w-5 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Ver rutina</p>
            <p className="text-xs text-[#5A5A72]">Entrenamiento de hoy</p>
          </div>
        </Link>

        <Link
          href="/app/client/progress"
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-5 py-4 transition-all hover:border-[#00C853]/20 hover:bg-[#00C853]/[0.03]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00C853]/[0.08] transition-colors group-hover:bg-[#00C853]/[0.14]">
            <svg className="h-5 w-5 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Registrar progreso</p>
            <p className="text-xs text-[#5A5A72]">Peso y medidas</p>
          </div>
        </Link>
      </div>
    </div>
  );
});
