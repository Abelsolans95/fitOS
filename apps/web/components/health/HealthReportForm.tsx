"use client";

import { useState } from "react";
import { MUSCLE_LABELS } from "./AnatomyMap";

export interface HealthLogFormData {
  muscle_id: string;
  pain_score: number;
  incident_type: "puntual" | "diagnosticada" | "cronica";
  status: "active" | "recovering" | "recovered";
  notes: string;
}

interface HealthReportFormProps {
  muscleId: string;
  existingData?: HealthLogFormData | null;
  onSubmit: (data: HealthLogFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const INCIDENT_TYPES = [
  { value: "puntual", label: "Molestia puntual" },
  { value: "diagnosticada", label: "Lesión diagnosticada" },
  { value: "cronica", label: "Dolor crónico" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Activa", color: "text-[#FF1744]" },
  { value: "recovering", label: "En recuperación", color: "text-[#FF9100]" },
  { value: "recovered", label: "Recuperada", color: "text-[#00C853]" },
] as const;

export function HealthReportForm({
  muscleId,
  existingData,
  onSubmit,
  onCancel,
  saving,
}: HealthReportFormProps) {
  const [painScore, setPainScore] = useState(existingData?.pain_score ?? 5);
  const [incidentType, setIncidentType] = useState<HealthLogFormData["incident_type"]>(
    existingData?.incident_type ?? "puntual"
  );
  const [status, setStatus] = useState<HealthLogFormData["status"]>(
    existingData?.status ?? "active"
  );
  const [notes, setNotes] = useState(existingData?.notes ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      muscle_id: muscleId,
      pain_score: painScore,
      incident_type: incidentType,
      status,
      notes,
    });
  };

  const painColor =
    painScore >= 8
      ? "text-[#FF1744]"
      : painScore >= 6
        ? "text-[#FF5722]"
        : painScore >= 4
          ? "text-[#FF9100]"
          : "text-[#FFB74D]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Muscle name header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF1744]/10">
          <svg className="h-5 w-5 text-[#FF1744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-white">
            {MUSCLE_LABELS[muscleId] ?? muscleId}
          </h3>
          <p className="text-xs text-[#8B8BA3]">
            {existingData ? "Actualizar reporte" : "Nuevo reporte de molestia"}
          </p>
        </div>
      </div>

      {/* Pain score slider */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Nivel de dolor
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-[#FF1744]
              [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF1744]
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,23,68,0.4)]"
          />
          <span className={`text-2xl font-black tracking-tight ${painColor}`}>
            {painScore}
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-[#5A5A72]">
          <span>Leve</span>
          <span>Moderado</span>
          <span>Intenso</span>
        </div>
      </div>

      {/* Incident type */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Tipo de incidencia
        </label>
        <div className="grid grid-cols-3 gap-2">
          {INCIDENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setIncidentType(t.value)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                incidentType === t.value
                  ? "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
                  : "border-white/[0.06] bg-white/[0.02] text-[#8B8BA3] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Estado
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                status === s.value
                  ? s.value === "active"
                    ? "border-[#FF1744]/30 bg-[#FF1744]/10 text-[#FF1744]"
                    : s.value === "recovering"
                      ? "border-[#FF9100]/30 bg-[#FF9100]/10 text-[#FF9100]"
                      : "border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]"
                  : "border-white/[0.06] bg-white/[0.02] text-[#8B8BA3] hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Notas / Descripción
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe la sensación, diagnóstico, circunstancias..."
          rows={3}
          className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-sm font-medium text-[#8B8BA3] transition-colors hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-[#00E5FF] py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
        >
          {saving ? "Guardando..." : existingData ? "Actualizar" : "Reportar"}
        </button>
      </div>
    </form>
  );
}
