"use client";

import { BodyMetric } from "./types";
import { EmptyState, formatDate } from "./shared";

export function TabProgreso({ metrics }: { metrics: BodyMetric[] }) {
  if (metrics.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        }
        title="Sin datos de progreso"
        description="Aún no hay métricas corporales registradas"
      />
    );
  }

  return (
    <div className="space-y-2">
      {metrics.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
        >
          <div className="flex items-center gap-4">
            {m.body_weight_kg != null && (
              <div>
                <p className="text-xs text-[#8B8BA3]">Peso</p>
                <p className="text-sm font-medium text-white">{m.body_weight_kg} kg</p>
              </div>
            )}
            {m.body_fat_pct != null && (
              <div>
                <p className="text-xs text-[#8B8BA3]">Grasa corporal</p>
                <p className="text-sm font-medium text-white">{m.body_fat_pct}%</p>
              </div>
            )}
          </div>
          <p className="text-xs text-[#8B8BA3]">{formatDate(m.recorded_at)}</p>
        </div>
      ))}
    </div>
  );
}
