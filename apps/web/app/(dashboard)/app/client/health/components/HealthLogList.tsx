import { memo } from "react";
import { MUSCLE_LABELS } from "@/components/health/AnatomyMap";
import type { HealthLog } from "../useClientHealth";

const INCIDENT_LABELS: Record<string, string> = {
  puntual: "Molestia puntual",
  diagnosticada: "Lesión diagnosticada",
  cronica: "Dolor crónico",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Activa", bg: "bg-[#FF1744]/10", text: "text-[#FF1744]" },
  recovering: { label: "En recuperación", bg: "bg-[#FF9100]/10", text: "text-[#FF9100]" },
  recovered: { label: "Recuperada", bg: "bg-[#00C853]/10", text: "text-[#00C853]" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  activeLogs: HealthLog[];
  recoveredLogs: HealthLog[];
  onLogClick: (muscleId: string) => void;
}

export const HealthLogList = memo(function HealthLogList({ activeLogs, recoveredLogs, onLogClick }: Props) {
  return (
    <>
      {/* Active issues */}
      <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Incidencias activas</h2>
        {activeLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-[#8B8BA3]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Sin molestias activas</p>
            <p className="text-xs text-[#8B8BA3]">Toca un músculo en el mapa para reportar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeLogs.map((log) => (
              <button
                key={log.id} type="button"
                onClick={() => onLogClick(log.muscle_id)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{MUSCLE_LABELS[log.muscle_id] ?? log.muscle_id}</span>
                      <span className={`text-lg font-black ${log.pain_score >= 6 ? "text-[#FF1744]" : "text-[#FF9100]"}`}>{log.pain_score}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CONFIG[log.status]?.bg} ${STATUS_CONFIG[log.status]?.text}`}>
                        {STATUS_CONFIG[log.status]?.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#5A5A72]">
                      <span>{INCIDENT_LABELS[log.incident_type]}</span>
                      <span>·</span>
                      <span>{log.reported_by === "coach" ? "Entrenador" : "Tú"}</span>
                      <span>·</span>
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                    {log.notes && <p className="mt-2 text-xs text-[#8B8BA3] line-clamp-2">{log.notes}</p>}
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recovered history */}
      {recoveredLogs.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Historial recuperado</h2>
          <div className="space-y-3">
            {recoveredLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{MUSCLE_LABELS[log.muscle_id] ?? log.muscle_id}</span>
                  <span className="rounded-full bg-[#00C853]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00C853]">Recuperada</span>
                </div>
                <div className="mt-1 text-xs text-[#5A5A72]">
                  <span>{INCIDENT_LABELS[log.incident_type]}</span>
                  <span> · Dolor máx: {log.pain_score}</span>
                  <span> · {formatDate(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
});
