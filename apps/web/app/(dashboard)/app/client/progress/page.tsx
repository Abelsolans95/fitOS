"use client";

import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase";

interface BodyMetric {
  id: string;
  recorded_at: string;
  body_weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  right_arm_cm: number | null;
  right_thigh_cm: number | null;
  notes: string | null;
}

interface NewMetric {
  body_weight_kg: string;
  body_fat_pct: string;
  muscle_mass_kg: string;
  chest_cm: string;
  waist_cm: string;
  hips_cm: string;
  right_arm_cm: string;
  right_thigh_cm: string;
  notes: string;
}

type MetricKey = "body_weight_kg" | "body_fat_pct" | "muscle_mass_kg" | "chest_cm" | "waist_cm" | "hips_cm" | "right_arm_cm" | "right_thigh_cm";

const METRIC_CONFIG: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: "body_weight_kg", label: "Peso", unit: "kg", color: "#00E5FF" },
  { key: "body_fat_pct", label: "Grasa corporal", unit: "%", color: "#FF9100" },
  { key: "muscle_mass_kg", label: "Masa muscular", unit: "kg", color: "#7C3AED" },
  { key: "chest_cm", label: "Pecho", unit: "cm", color: "#00C853" },
  { key: "waist_cm", label: "Cintura", unit: "cm", color: "#FF1744" },
  { key: "hips_cm", label: "Cadera", unit: "cm", color: "#00E5FF" },
  { key: "right_arm_cm", label: "Brazo", unit: "cm", color: "#7C3AED" },
  { key: "right_thigh_cm", label: "Muslo", unit: "cm", color: "#FF9100" },
];

const EMPTY_METRIC: NewMetric = {
  body_weight_kg: "",
  body_fat_pct: "",
  muscle_mass_kg: "",
  chest_cm: "",
  waist_cm: "",
  hips_cm: "",
  right_arm_cm: "",
  right_thigh_cm: "",
  notes: "",
};

export default function ProgressPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newMetric, setNewMetric] = useState<NewMetric>({ ...EMPTY_METRIC });
  const [selectedChart, setSelectedChart] = useState<MetricKey>("body_weight_kg");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data } = await supabase
          .from("body_metrics")
          .select("*")
          .eq("client_id", user.id)
          .order("recorded_at", { ascending: true });

        if (data) setMetrics(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {
        client_id: userId,
        recorded_at: new Date().toISOString(),
      };

      (Object.keys(newMetric) as (keyof NewMetric)[]).forEach((key) => {
        const val = newMetric[key];
        if (key === "notes") {
          if (val) payload.notes = val;
        } else {
          const num = parseFloat(val);
          if (!isNaN(num) && num > 0) payload[key] = num;
        }
      });

      const { data, error } = await supabase
        .from("body_metrics")
        .insert(payload)
        .select()
        .single();

      if (error) {
        setSaveError(`Error al guardar: ${error.message}`);
        return;
      }
      if (data) {
        setMetrics((prev) => [...prev, data]);
        setNewMetric({ ...EMPTY_METRIC });
        setShowForm(false);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // Chart data for selected metric
  const chartData = useMemo(() => {
    return metrics
      .filter((m) => m[selectedChart] !== null && m[selectedChart] !== undefined)
      .map((m) => ({
        date: new Date(m.recorded_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
        value: m[selectedChart] as number,
      }));
  }, [metrics, selectedChart]);

  // Calculate chart bounds
  const chartMin = chartData.length > 0 ? Math.min(...chartData.map((d) => d.value)) : 0;
  const chartMax = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 100;
  const chartRange = chartMax - chartMin || 1;

  // Latest vs first comparison
  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const diff = last - first;
    const pct = ((diff / first) * 100).toFixed(1);
    return { diff: diff.toFixed(1), pct, direction: diff > 0 ? "up" : diff < 0 ? "down" : "same" };
  }, [chartData]);

  const selectedConfig = METRIC_CONFIG.find((c) => c.key === selectedChart)!;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Progreso</h1>
          <p className="mt-1 text-sm text-[#8B8BA3]">Evolución de tus medidas corporales</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva medición
        </button>
      </div>

      {/* New metric form */}
      {showForm && (
        <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#0E0E18]/60 backdrop-blur-xl p-6">
          <h3 className="mb-4 text-sm font-medium text-white">Registrar medición</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {METRIC_CONFIG.map((config) => (
              <div key={config.key} className="space-y-1">
                <label className="text-xs text-[#8B8BA3]">
                  {config.label} ({config.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="—"
                  value={newMetric[config.key]}
                  onChange={(e) => setNewMetric((prev) => ({ ...prev, [config.key]: e.target.value }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-[#8B8BA3]/40 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            <label className="text-xs text-[#8B8BA3]">Notas (opcional)</label>
            <input
              type="text"
              placeholder="Ej: después de vacaciones, inicio dieta..."
              value={newMetric.notes}
              onChange={(e) => setNewMetric((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-[#8B8BA3]/40 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20"
            />
          </div>
          {saveError && (
            <p className="mt-3 rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/5 px-3 py-2 text-xs text-[#FF1744]">
              {saveError}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewMetric({ ...EMPTY_METRIC }); }}
              className="rounded-lg px-4 py-2 text-sm text-[#8B8BA3] transition-colors hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#00E5FF] px-5 py-2 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Chart metric selector */}
      <div className="flex flex-wrap gap-2">
        {METRIC_CONFIG.map((config) => (
          <button
            key={config.key}
            type="button"
            onClick={() => setSelectedChart(config.key)}
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

      {/* Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">
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

        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-10 w-10 text-[#8B8BA3]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
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
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedConfig.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={selectedConfig.color} stopOpacity={0} />
                  </linearGradient>
                  {/* Neon glow filter for lines */}
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
                  cursor={{ stroke: selectedConfig.color, strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value;
                      return (
                        <div className="rounded-xl border border-white/10 bg-[#0A0A0F]/90 p-4 shadow-2xl backdrop-blur-xl transition-all">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8B8BA3]">{label}</p>
                          <div className="flex items-baseline gap-1">
                            <span 
                              className="text-2xl font-bold" 
                              style={{ color: selectedConfig.color, textShadow: `0 0 16px ${selectedConfig.color}60` }}
                            >
                              {value}
                            </span>
                            <span className="text-xs font-medium text-[#8B8BA3] uppercase">{selectedConfig.unit}</span>
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
                  activeDot={{
                    r: 6,
                    fill: "#0E0E18",
                    stroke: selectedConfig.color,
                    strokeWidth: 3,
                    style: { filter: `drop-shadow(0 0 8px ${selectedConfig.color}90)` }
                  } as any}
                  dot={{
                    r: 4,
                    fill: "#0A0A0F",
                    stroke: selectedConfig.color,
                    strokeWidth: 2,
                    strokeOpacity: 0.8
                  } as any}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Metrics history */}
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
                      <span className="max-w-[200px] truncate text-xs text-[#8B8BA3]/60 italic">
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
    </div>
  );
}
