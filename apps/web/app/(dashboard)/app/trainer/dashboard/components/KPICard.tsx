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
  /** Net change versus 7 days ago. Positive renders cyan up, negative red down, 0 muted. */
  delta?: number;
  /** Last ~30 daily samples for the sparkline. Length is normalised, missing days = 0. */
  sparkline?: number[];
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 100;
  const h = 24;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      className="h-6 w-full text-[#3A3A52] transition-colors group-hover:text-[#00E5FF]"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const sign = delta > 0 ? "+" : "";
  const tone =
    delta > 0
      ? "text-[#00C853]"
      : delta < 0
      ? "text-[#FF1744]"
      : "text-[#5A5A72]";
  return (
    <span className={`text-[10px] font-semibold tabular-nums ${tone}`}>
      {sign}
      {delta} esta semana
    </span>
  );
}

/**
 * Restrained KPI card — grayscale by default with a single cyan accent on hover.
 * Optional 7-day delta + 30-day sparkline make the card feel alive without
 * drowning the number.
 */
export function KPICard({
  label,
  value,
  icon,
  href,
  hint,
  delta,
  sparkline,
}: KPICardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E18]/60 p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00E5FF]/40 hover:bg-white/[0.03]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#8B8BA3] transition-colors group-hover:bg-[#00E5FF]/10 group-hover:text-[#00E5FF]">
          {icon}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="h-6 w-20">
            <Sparkline values={sparkline} />
          </div>
        )}
      </div>
      <p className="text-[36px] font-extrabold leading-none tracking-[-0.04em] text-white">
        {value}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5A5A72]">
          {label}
        </p>
        {typeof delta === "number" && <DeltaBadge delta={delta} />}
      </div>
      <div className="mt-3 flex items-center gap-1 text-[#00E5FF] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="text-[10px]">{hint}</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
