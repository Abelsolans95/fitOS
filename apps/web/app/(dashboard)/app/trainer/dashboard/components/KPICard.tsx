"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface KPICardProps {
  label: string;
  value: number;
  icon: ReactNode;
  href: string;
  hint: string;
}

/**
 * Restrained KPI card — grayscale by default with a single cyan accent on hover.
 * The multi-color palette of the old dashboard was fighting for attention; this
 * puts focus on numbers, not on hues.
 */
export function KPICard({ label, value, icon, href, hint }: KPICardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E18]/60 p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00E5FF]/40 hover:bg-white/[0.03]"
    >
      <div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#8B8BA3] transition-colors group-hover:bg-[#00E5FF]/10 group-hover:text-[#00E5FF]">
        {icon}
      </div>
      <p className="text-[42px] font-extrabold leading-none tracking-[-0.04em] text-white">
        {value}
      </p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5A5A72]">
        {label}
      </p>
      <div className="mt-3 flex items-center gap-1 text-[#00E5FF] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="text-[10px]">{hint}</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
