"use client";

import { BodyMetric, METRIC_CONFIG } from "./types";

interface MetricHistoryListProps {
  metrics: BodyMetric[];
}

export function MetricHistoryList({ metrics }: MetricHistoryListProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
      <h3 className="mb-4 text-sm font-medium text-white">Historial de mediciones</h3>

      {metrics.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#8B8BA3]">
          Aún no tienes mediciones registradas
        </div>
      ) : (
        <div className="space-y-3">
          {[...metrics]
            .reverse()
            .slice(0, 20)
            .map((metric) => (
              <div
                key={metric.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-[#8B8BA3]">
                    {new Date(metric.recorded_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {metric.notes && (
                    <span className="max-w-[200px] truncate text-xs italic text-[#8B8BA3]/60">
                      {metric.notes}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {METRIC_CONFIG.map((config) => {
                    const val = metric[config.key];
                    if (val === null || val === undefined) return null;
                    return (
                      <div key={config.key} className="flex items-baseline gap-1">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: config.color }}
                        >
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
      )}
    </div>
  );
}
