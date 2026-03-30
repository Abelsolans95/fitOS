"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
  icon: ReactNode;
  href: string;
  hint: string;
}

function IcArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

export function KPICard({ label, value, color, bg, border, icon, href, hint }: KPICardProps) {
  return (
    <Link
      href={href}
      className="kpi-card group"
      style={{ "--card-color": color } as React.CSSProperties}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = border;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 50px -12px ${color}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div className="kpi-orb" style={{ background: color }} />
      <div className="relative p-5">
        <div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: bg, color }}>
          {icon}
        </div>
        <p className="shimmer-num text-[42px] font-extrabold leading-none tracking-[-0.04em]">
          {value}
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5A5A72]">
          {label}
        </p>
        <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="text-[10px]" style={{ color }}>{hint}</span>
          <IcArrow />
        </div>
      </div>
    </Link>
  );
}
