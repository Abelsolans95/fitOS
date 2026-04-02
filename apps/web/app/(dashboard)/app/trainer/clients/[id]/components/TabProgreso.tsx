"use client";

import { useState } from "react";
import { BodyMetric } from "./types";
import { EmptyState, formatDate } from "./shared";
import { MetricChart } from "@/app/(dashboard)/app/client/progress/components/MetricChart";
import { MetricKey, TimeFilter, METRIC_CONFIG } from "@/app/(dashboard)/app/client/progress/components/types";

export function TabProgreso({ metrics }: { metrics: BodyMetric[] }) {
  const [selectedChart, setSelectedChart] = useState<MetricKey>("body_weight_kg");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  if (metrics.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        }
        title="Sin datos de progreso"
        description="Este cliente aún no tiene métricas corporales registradas"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <MetricChart
        metrics={metrics}
        selectedChart={selectedChart}
        onSelectChart={setSelectedChart}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      {/* History list — most recent first */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">Historial</p>
        {[...metrics].reverse().map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[#8B8BA3]">{formatDate(m.recorded_at)}</span>
              {m.notes && (
                <span className="max-w-[200px] truncate text-xs italic text-[#8B8BA3]/60">
                  {m.notes}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {METRIC_CONFIG.map((config) => {
                const val = m[config.key as keyof BodyMetric];
                if (val === null || val === undefined) return null;
                return (
                  <div key={config.key} className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold" style={{ color: config.color }}>
                      {val}
                    </span>
                    <span className="text-[10px] text-[#8B8BA3]">
                      {config.unit} {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
