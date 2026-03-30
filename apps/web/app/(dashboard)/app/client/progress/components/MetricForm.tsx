"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { BodyMetric, NewMetric, METRIC_CONFIG, EMPTY_METRIC } from "./types";

interface MetricFormProps {
  userId: string;
  onSaved: (metric: BodyMetric) => void;
  onCancel: () => void;
}

export function MetricForm({ userId, onSaved, onCancel }: MetricFormProps) {
  const [newMetric, setNewMetric] = useState<NewMetric>({ ...EMPTY_METRIC });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
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
        toast.error("Error al guardar la medición");
        console.error("[MetricForm] Error al guardar medición:", error);
        setSaveError(`Error al guardar: ${error.message}`);
        return;
      }

      if (data) {
        onSaved(data as BodyMetric);
        setNewMetric({ ...EMPTY_METRIC });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado al guardar.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
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
              onChange={(e) =>
                setNewMetric((prev) => ({ ...prev, [config.key]: e.target.value }))
              }
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
          onChange={(e) =>
            setNewMetric((prev) => ({ ...prev, notes: e.target.value }))
          }
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
          onClick={onCancel}
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
  );
}
