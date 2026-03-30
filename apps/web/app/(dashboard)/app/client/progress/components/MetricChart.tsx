"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BodyMetric, MetricKey, METRIC_CONFIG, TimeFilter, TIME_FILTERS } from "./types";

interface MetricChartProps {
  metrics: BodyMetric[];
  selectedChart: MetricKey;
  onSelectChart: (key: MetricKey) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
}

export function MetricChart({
  metrics,
  selectedChart,
  onSelectChart,
  timeFilter,
  onTimeFilterChange,
}: MetricChartProps) {
  const chartData = useMemo(() => {
    let filteredMetrics = metrics.filter(
      (m) => m[selectedChart] !== null && m[selectedChart] !== undefined
    );

    if (timeFilter !== "all") {
      const limitDate = new Date();
      if (timeFilter === "1y") limitDate.setFullYear(limitDate.getFullYear() - 1);
      else if (timeFilter === "6m") limitDate.setMonth(limitDate.getMonth() - 6);
      else if (timeFilter === "3m") limitDate.setMonth(limitDate.getMonth() - 3);
      else if (timeFilter === "1m") limitDate.setMonth(limitDate.getMonth() - 1);
      else if (timeFilter === "1w") limitDate.setDate(limitDate.getDate() - 7);

      filteredMetrics = filteredMetrics.filter(
        (m) => new Date(m.recorded_at) >= limitDate
      );
    }

    return filteredMetrics.map((m) => ({
      date: new Date(m.recorded_at).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      }),
      value: m[selectedChart] as number,
    }));
  }, [metrics, selectedChart, timeFilter]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const diff = last - first;
    const pct = ((diff / first) * 100).toFixed(1);
    return {
      diff: diff.toFixed(1),
      pct,
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
    };
  }, [chartData]);

  const selectedConfig = METRIC_CONFIG.find((c) => c.key === selectedChart)!;

  return (
    <>
      {/* Metric selector buttons */}
      <div className="flex flex-wrap gap-2">
        {METRIC_CONFIG.map((config) => (
          <button
            key={config.key}
            type="button"
            onClick={() => onSelectChart(config.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedChart === config.key
                ? "text-[#0A0A0F]"
                : "border border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:text-white"
            }`}
            style={
              selectedChart === config.key
                ? { backgroundColor: config.color }
                : undefined
            }
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Chart card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="flex items-center text-sm font-medium text-white">
              {selectedConfig.label}
              <span className="ml-1 text-[#8B8BA3]">({selectedConfig.unit})</span>
            </h3>
            {trend && (
              <div
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                  trend.direction === "down"
                    ? "bg-[#00C853]/10 text-[#00C853]"
                    : trend.direction === "up"
                    ? "bg-[#FF9100]/10 text-[#FF9100]"
                    : "bg-white/[0.05] text-[#8B8BA3]"
                }`}
              >
                {trend.direction === "down" ? "↓" : trend.direction === "up" ? "↑" : "→"}{" "}
                {trend.diff} {selectedConfig.unit} ({trend.pct}%)
              </div>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto overflow-y-hidden rounded-xl border border-white/[0.06] bg-[#0A0A0F]/50 p-1">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.value}
                onClick={() => onTimeFilterChange(tf.value)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                  timeFilter === tf.value
                    ? "bg-white/[0.1] text-white shadow-sm"
                    : "text-[#8B8BA3] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="mb-3 h-10 w-10 text-[#8B8BA3]/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
              />
            </svg>
            <p className="text-sm text-[#8B8BA3]">
              Necesitas al menos 2 registros para ver el gráfico
            </p>
            <p className="mt-1 text-xs text-[#8B8BA3]/60">
              Añade mediciones para ver tu evolución
            </p>
          </div>
        ) : (
          <div className="relative h-[300px] w-full pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={selectedConfig.color}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={selectedConfig.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <filter id="neonGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="stroke-white/5"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8B8BA3", fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8B8BA3", fontSize: 11, fontWeight: 500 }}
                  dx={-10}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  cursor={{
                    stroke: selectedConfig.color,
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                    opacity: 0.4,
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value;
                      return (
                        <div className="rounded-xl border border-white/10 bg-[#0A0A0F]/90 p-4 shadow-2xl backdrop-blur-xl transition-all">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8B8BA3]">
                            {label}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span
                              className="text-2xl font-bold"
                              style={{
                                color: selectedConfig.color,
                                textShadow: `0 0 16px ${selectedConfig.color}60`,
                              }}
                            >
                              {value}
                            </span>
                            <span className="text-xs font-medium uppercase text-[#8B8BA3]">
                              {selectedConfig.unit}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={selectedConfig.color}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#splitColor)"
                  animationDuration={1500}
                  animationEasing="ease-out"
                  filter="url(#neonGlow)"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  activeDot={
                    {
                      r: 6,
                      fill: "#0E0E18",
                      stroke: selectedConfig.color,
                      strokeWidth: 3,
                      style: {
                        filter: `drop-shadow(0 0 8px ${selectedConfig.color}90)`,
                      },
                    } as any
                  }
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  dot={
                    {
                      r: 4,
                      fill: "#0A0A0F",
                      stroke: selectedConfig.color,
                      strokeWidth: 2,
                      strokeOpacity: 0.8,
                    } as any
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}
