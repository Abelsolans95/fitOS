"use client";

import type { TodayAlert, TodayAlertKind } from "@kuvox/shared";
import { AlertCard } from "./AlertCard";

interface AlertSectionProps {
  kind: TodayAlertKind;
  title: string;
  subtitle: string;
  alerts: TodayAlert[];
}

export function AlertSection({ kind, title, subtitle, alerts }: AlertSectionProps) {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3" data-kind={kind}>
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white/90">
            {title}
          </h2>
          <p className="text-xs text-[#8B8BA3]">{subtitle}</p>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-white">
          {alerts.length}
        </span>
      </header>

      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <AlertCard key={`${alert.kind}-${alert.client_id}-${i}`} alert={alert} />
        ))}
      </div>
    </section>
  );
}
