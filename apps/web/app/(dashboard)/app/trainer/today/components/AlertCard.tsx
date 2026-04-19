"use client";

import Link from "next/link";
import type { TodayAlert } from "@kuvox/shared";

const KIND_META: Record<
  TodayAlert["kind"],
  { label: string; badge: string; dot: string }
> = {
  no_workout: {
    label: "Sin entrenar",
    badge: "bg-[#FF9100]/10 text-[#FF9100] border-[#FF9100]/20",
    dot: "bg-[#FF9100]",
  },
  no_checkin: {
    label: "Sin check-in",
    badge: "bg-[#8B8BA3]/10 text-[#8B8BA3] border-[#8B8BA3]/20",
    dot: "bg-[#8B8BA3]",
  },
  new_injury: {
    label: "Lesión nueva",
    badge: "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/20",
    dot: "bg-[#FF1744]",
  },
  pending_ticket: {
    label: "Consulta pendiente",
    badge: "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20",
    dot: "bg-[#00E5FF]",
  },
  high_stress: {
    label: "Estrés alto",
    badge: "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20",
    dot: "bg-[#7C3AED]",
  },
  high_pain: {
    label: "Dolor alto",
    badge: "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/20",
    dot: "bg-[#FF1744]",
  },
};

function describe(alert: TodayAlert): string {
  switch (alert.kind) {
    case "no_workout":
      return `${alert.days_since_last}+ días sin entrenar`;
    case "no_checkin":
      return alert.hours_since_last == null
        ? "Nunca ha hecho check-in"
        : `${alert.hours_since_last}h sin check-in`;
    case "new_injury":
      return `Lesión: ${alert.muscle_id}${
        alert.severity != null ? ` (severidad ${alert.severity})` : ""
      }`;
    case "pending_ticket":
      return `${alert.category} — ${alert.title}`;
    case "high_stress":
      return `Estrés ${alert.stress_level}/5 el ${alert.checkin_date}`;
    case "high_pain":
      return `Dolor ${alert.pain_level}/5 el ${alert.checkin_date}`;
  }
}

export function AlertCard({ alert }: { alert: TodayAlert }) {
  const meta = KIND_META[alert.kind];
  const clientHref = `/app/trainer/clients/${alert.client_id}`;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#12121A] p-4 transition-colors hover:border-white/[0.12]">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
        <div className="min-w-0">
          <Link
            href={clientHref}
            className="block truncate text-sm font-semibold text-white hover:text-[#00E5FF]"
          >
            {alert.client_name}
          </Link>
          <p className="truncate text-xs text-[#8B8BA3]">{describe(alert)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>
    </div>
  );
}
