"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/* ── Types ── */

interface ExerciseMetricRow {
  exercise_name: string;
  session_date: string;
  total_volume_kg: number | null;
  stress_index: number | null;
  stimulus_rating: number | null;
  fatigue_rating: number | null;
  sets_data: { weight_kg: number; reps_done: number }[];
}

interface ChartPoint {
  date: string;
  label: string;
  volume: number;
  stressIndex: number | null;
  sfr: number | null;
  maxWeight: number;
  stimulus: number | null;
  fatigue: number | null;
}

/* ── Helpers ── */

function formatShortDate(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

/* ── Chart tooltip ── */

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#12121A] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === "number" ? p.value.toFixed(1) : "—"}</span>
        </p>
      ))}
    </div>
  );
}

/* ── Trend badge ── */

function getTrend(values: (number | null)[]): { label: string; color: string } {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length < 2) return { label: "Sin datos", color: "#5A5A72" };
  const recent = valid.slice(-3);
  const older = valid.slice(0, Math.max(1, valid.length - 3));
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
  const diff = ((avgRecent - avgOlder) / avgOlder) * 100;
  if (diff > 5) return { label: `+${diff.toFixed(0)}%`, color: "#00C853" };
  if (diff < -5) return { label: `${diff.toFixed(0)}%`, color: "#FF1744" };
  return { label: "Estable", color: "#FF9100" };
}

/* ── Main component ── */

export const ExerciseAnalytics = memo(function ExerciseAnalytics({
  clientId,
}: {
  clientId: string;
}) {
  const [metrics, setMetrics] = useState<ExerciseMetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("weight_log")
        .select("exercise_name, session_date, total_volume_kg, stress_index, stimulus_rating, fatigue_rating, sets_data")
        .eq("client_id", clientId)
        .order("session_date", { ascending: true })
        .limit(500);

      if (error) {
        toast.error("Error cargando métricas de ejercicios");
        console.error("[ExerciseAnalytics] Error:", error);
      }
      setMetrics((data ?? []) as ExerciseMetricRow[]);
      setLoading(false);
    };
    load();
  }, [clientId]);

  // Unique exercise names sorted alphabetically
  const exerciseNames = useMemo(() => {
    const names = new Set(metrics.map((m) => m.exercise_name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [metrics]);

  // Auto-select first exercise
  useEffect(() => {
    if (!selectedExercise && exerciseNames.length > 0) {
      setSelectedExercise(exerciseNames[0]);
    }
  }, [exerciseNames, selectedExercise]);

  // Chart data for selected exercise
  const chartData = useMemo((): ChartPoint[] => {
    if (!selectedExercise) return [];
    return metrics
      .filter((m) => m.exercise_name === selectedExercise)
      .map((m) => {
        const maxWeight = (m.sets_data ?? []).reduce(
          (max, s) => Math.max(max, s.weight_kg ?? 0),
          0
        );
        const sfr =
          m.stimulus_rating && m.fatigue_rating
            ? Math.round((m.stimulus_rating / m.fatigue_rating) * 100) / 100
            : null;
        return {
          date: m.session_date,
          label: formatShortDate(m.session_date),
          volume: m.total_volume_kg ?? 0,
          stressIndex: m.stress_index,
          sfr,
          maxWeight,
          stimulus: m.stimulus_rating,
          fatigue: m.fatigue_rating,
        };
      });
  }, [metrics, selectedExercise]);

  // Trends
  const volumeTrend = useMemo(() => getTrend(chartData.map((d) => d.volume)), [chartData]);
  const stressTrend = useMemo(() => getTrend(chartData.map((d) => d.stressIndex)), [chartData]);
  const sfrTrend = useMemo(() => getTrend(chartData.map((d) => d.sfr)), [chartData]);
  const weightTrend = useMemo(() => getTrend(chartData.map((d) => d.maxWeight)), [chartData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (exerciseNames.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-[#5A5A72]">
          No hay datos de ejercicios registrados todavía
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Exercise selector */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
          Ejercicio
        </label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-[#12121A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/50"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {chartData.length < 2 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-[#5A5A72]">
            Necesita al menos 2 sesiones para mostrar gráficas
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Volumen" trend={volumeTrend} value={`${Math.round(chartData[chartData.length - 1]?.volume ?? 0)} kg`} color="#7C3AED" />
            <SummaryCard label="Stress Index" trend={stressTrend} value={chartData[chartData.length - 1]?.stressIndex?.toFixed(0) ?? "—"} color="#00E5FF" />
            <SummaryCard label="SFR" trend={sfrTrend} value={chartData[chartData.length - 1]?.sfr?.toFixed(2) ?? "—"} color="#FF9100" />
            <SummaryCard label="Peso Máx" trend={weightTrend} value={`${chartData[chartData.length - 1]?.maxWeight ?? 0} kg`} color="#00C853" />
          </div>

          {/* Volume + Stress Index chart */}
          <ChartCard title="Volumen e Índice de Estrés">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "#5A5A72", fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: "#7C3AED", fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#00E5FF", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#7C3AED" strokeWidth={2} name="Volumen (kg)" dot={{ fill: "#7C3AED", r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="stressIndex" stroke="#00E5FF" strokeWidth={2} name="Stress Index" dot={{ fill: "#00E5FF", r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* SFR chart */}
          {chartData.some((d) => d.sfr != null) && (
            <ChartCard title="Ratio Estímulo / Fatiga (SFR)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={{ fill: "#5A5A72", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#FF9100", fontSize: 10 }} domain={[0, "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={1} stroke="#5A5A72" strokeDasharray="4 4" label={{ value: "SFR = 1", fill: "#5A5A72", fontSize: 10 }} />
                  <Line type="monotone" dataKey="sfr" stroke="#FF9100" strokeWidth={2} name="SFR" dot={{ fill: "#FF9100", r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Max weight chart */}
          <ChartCard title="Peso Máximo por Sesión">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "#5A5A72", fontSize: 10 }} />
                <YAxis tick={{ fill: "#00C853", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="maxWeight" stroke="#00C853" strokeWidth={2} name="Peso Máx (kg)" dot={{ fill: "#00C853", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Stimulus + Fatigue breakdown */}
          {chartData.some((d) => d.stimulus != null) && (
            <ChartCard title="Estímulo vs Fatiga">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={{ fill: "#5A5A72", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#5A5A72", fontSize: 10 }} domain={[0, 5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="stimulus" stroke="#7C3AED" strokeWidth={2} name="Estímulo" dot={{ fill: "#7C3AED", r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="fatigue" stroke="#FF9100" strokeWidth={2} name="Fatiga" dot={{ fill: "#FF9100", r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
});

/* ── Sub-components ── */

function SummaryCard({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string;
  trend: { label: string; color: string };
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
        {label}
      </p>
      <p className="mt-1 text-lg font-black" style={{ color }}>
        {value}
      </p>
      <span
        className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold"
        style={{ color: trend.color, backgroundColor: `${trend.color}15` }}
      >
        {trend.label}
      </span>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8B8BA3]">
        {title}
      </h4>
      {children}
    </div>
  );
}
