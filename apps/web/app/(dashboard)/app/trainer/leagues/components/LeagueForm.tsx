"use client";

import { DarkSelect } from "@/components/ui/DarkSelect";
import { LEAGUE_METRICS } from "@fitos/shared";
import type { LeagueFormData } from "./types";

interface LeagueFormProps {
  form: LeagueFormData;
  creating: boolean;
  onFieldChange: (field: keyof LeagueFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function LeagueForm({ form, creating, onFieldChange, onSubmit, onCancel }: LeagueFormProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-5">
      <h2 className="text-lg font-bold text-white">Crear nueva liga</h2>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">Titulo *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          placeholder="Ej: Liga de Enero"
          maxLength={100}
          className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors placeholder:text-[#5A5A72] focus:border-[#00E5FF]/40"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">Descripcion</label>
        <textarea
          value={form.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder="Describe la liga..."
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] text-white outline-none transition-colors placeholder:text-[#5A5A72] focus:border-[#00E5FF]/40 resize-none"
        />
      </div>

      {/* Metric */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">Metrica *</label>
        <DarkSelect
          value={form.metric}
          onChange={(v) => onFieldChange("metric", v)}
          options={LEAGUE_METRICS.map((m) => ({ value: m.value, label: m.label }))}
        />
      </div>

      {/* Custom metric name */}
      {form.metric === "custom" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">Nombre de metrica personalizada *</label>
          <input
            type="text"
            value={form.custom_metric_name}
            onChange={(e) => onFieldChange("custom_metric_name", e.target.value)}
            placeholder="Ej: Kms recorridos"
            maxLength={100}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors placeholder:text-[#5A5A72] focus:border-[#00E5FF]/40"
          />
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">Fecha de inicio *</label>
          <input
            type="date"
            value={form.starts_at}
            onChange={(e) => onFieldChange("starts_at", e.target.value)}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">Fecha de fin *</label>
          <input
            type="date"
            value={form.ends_at}
            onChange={(e) => onFieldChange("ends_at", e.target.value)}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Prize */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">Premio</label>
        <input
          type="text"
          value={form.prize}
          onChange={(e) => onFieldChange("prize", e.target.value)}
          placeholder="Ej: 1 mes gratis"
          maxLength={200}
          className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors placeholder:text-[#5A5A72] focus:border-[#00E5FF]/40"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onSubmit}
          disabled={creating}
          className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
        >
          {creating ? "Creando..." : "Crear liga"}
        </button>
        <button
          onClick={onCancel}
          disabled={creating}
          className="rounded-xl border border-white/[0.08] px-6 py-2.5 text-sm font-medium text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
