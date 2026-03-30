"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { BodyMetric, MetricKey, TimeFilter } from "./components/types";
import { MetricChart } from "./components/MetricChart";
import { MetricForm } from "./components/MetricForm";
import { MetricHistoryList } from "./components/MetricHistoryList";

export default function ProgressPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedChart, setSelectedChart] = useState<MetricKey>("body_weight_kg");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data, error } = await supabase
          .from("body_metrics")
          .select("*")
          .eq("client_id", user.id)
          .order("recorded_at", { ascending: true })
          .limit(100);

        if (error) {
          toast.error("Error al cargar las métricas de progreso");
          console.error("[ProgressPage] Error cargando métricas:", error);
          return;
        }
        if (data) setMetrics(data);
      } catch {
        // silently fail — auth errors handled above
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMetricSaved = (metric: BodyMetric) => {
    setMetrics((prev) => [...prev, metric]);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

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
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva medición
        </button>
      </div>

      {/* New metric form */}
      {showForm && userId && (
        <MetricForm
          userId={userId}
          onSaved={handleMetricSaved}
          onCancel={handleCancelForm}
        />
      )}

      {/* Chart + metric selector */}
      <MetricChart
        metrics={metrics}
        selectedChart={selectedChart}
        onSelectChart={setSelectedChart}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      {/* History list */}
      <MetricHistoryList metrics={metrics} />
    </div>
  );
}
