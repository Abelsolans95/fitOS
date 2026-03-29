"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { AnatomyMap, MUSCLE_LABELS } from "@/components/health/AnatomyMap";
import { HealthReportForm, HealthLogFormData } from "@/components/health/HealthReportForm";
import type { MuscleStatus } from "@/components/health/AnatomyMap";

interface HealthLog {
  id: string;
  client_id: string;
  trainer_id: string;
  reported_by: "coach" | "client";
  muscle_id: string;
  pain_score: number;
  incident_type: "puntual" | "diagnosticada" | "cronica";
  status: "active" | "recovering" | "recovered";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ClientHealthInner() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!clientId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("health_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar registros de salud");
      console.error("[ClientHealth] Error fetching:", error);
      return;
    }
    setLogs((data as HealthLog[]) ?? []);
  }, [clientId]);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Error de autenticación");
        console.error("[ClientHealth] Auth error:", authError);
        setLoading(false);
        return;
      }

      setClientId(user.id);

      // Get trainer relationship
      const { data: rel, error: relError } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (relError || !rel) {
        console.error("[ClientHealth] No trainer relationship:", relError);
        // Non-blocking — client can still view
      } else {
        setTrainerId(rel.trainer_id as string);
      }

      // Fetch logs
      const { data: logsData, error: logsError } = await supabase
        .from("health_logs")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (logsError) {
        toast.error("Error al cargar registros de salud");
        console.error("[ClientHealth] Error fetching logs:", logsError);
      } else {
        setLogs((logsData as HealthLog[]) ?? []);
      }
      setLoading(false);
    };

    init();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!clientId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`health-client-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "health_logs",
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchLogs]);

  const muscleStatuses: MuscleStatus[] = logs
    .filter((l) => l.status !== "recovered")
    .reduce((acc, log) => {
      const existing = acc.find((m) => m.muscle_id === log.muscle_id);
      if (!existing || log.pain_score > existing.pain_score) {
        return [
          ...acc.filter((m) => m.muscle_id !== log.muscle_id),
          { muscle_id: log.muscle_id, pain_score: log.pain_score, status: log.status as MuscleStatus["status"] },
        ];
      }
      return acc;
    }, [] as MuscleStatus[]);

  const handleMuscleClick = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setShowForm(true);
  };

  const existingForMuscle = selectedMuscle
    ? logs.find((l) => l.muscle_id === selectedMuscle && l.status !== "recovered")
    : null;

  const handleSubmit = async (data: HealthLogFormData) => {
    if (!clientId || !trainerId) {
      toast.error("No se pudo identificar tu entrenador");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    if (existingForMuscle) {
      const { error } = await supabase
        .from("health_logs")
        .update({
          pain_score: data.pain_score,
          incident_type: data.incident_type,
          status: data.status,
          notes: data.notes || null,
        })
        .eq("id", existingForMuscle.id);

      if (error) {
        toast.error("Error al actualizar el reporte");
        console.error("[ClientHealth] Update error:", error);
        setSaving(false);
        return;
      }
      toast.success("Reporte actualizado");
    } else {
      const { error } = await supabase.from("health_logs").insert({
        client_id: clientId,
        trainer_id: trainerId,
        reported_by: "client",
        muscle_id: data.muscle_id,
        pain_score: data.pain_score,
        incident_type: data.incident_type,
        status: data.status,
        notes: data.notes || null,
      });

      if (error) {
        toast.error("Error al crear el reporte");
        console.error("[ClientHealth] Insert error:", error);
        setSaving(false);
        return;
      }
      toast.success("Molestia reportada");
    }

    setSaving(false);
    setShowForm(false);
    setSelectedMuscle(null);
    fetchLogs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  const activeLogs = logs.filter((l) => l.status !== "recovered");
  const recoveredLogs = logs.filter((l) => l.status === "recovered");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Mi Salud</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Reporta molestias o lesiones para que tu entrenador las tenga en cuenta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Anatomy map */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Mapa corporal
            </h2>
            {activeLogs.length > 0 && (
              <span className="rounded-full bg-[#FF1744]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF1744]">
                {activeLogs.length} activa{activeLogs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <AnatomyMap
            muscleStatuses={muscleStatuses}
            onMuscleClick={handleMuscleClick}
            selectedMuscle={selectedMuscle}
          />
        </div>

        {/* Right: Form or timeline */}
        <div className="space-y-4">
          {showForm && selectedMuscle ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
              <HealthReportForm
                muscleId={selectedMuscle}
                existingData={
                  existingForMuscle
                    ? {
                        muscle_id: existingForMuscle.muscle_id,
                        pain_score: existingForMuscle.pain_score,
                        incident_type: existingForMuscle.incident_type,
                        status: existingForMuscle.status,
                        notes: existingForMuscle.notes ?? "",
                      }
                    : null
                }
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedMuscle(null);
                }}
                saving={saving}
              />
            </div>
          ) : (
            <>
              {/* Active issues */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
                  Incidencias activas
                </h2>
                {activeLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] py-12">
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
                        key={log.id}
                        type="button"
                        onClick={() => {
                          setSelectedMuscle(log.muscle_id);
                          setShowForm(true);
                        }}
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                {MUSCLE_LABELS[log.muscle_id] ?? log.muscle_id}
                              </span>
                              <span className={`text-lg font-black ${log.pain_score >= 6 ? "text-[#FF1744]" : "text-[#FF9100]"}`}>
                                {log.pain_score}
                              </span>
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
                            {log.notes && (
                              <p className="mt-2 text-xs text-[#8B8BA3] line-clamp-2">{log.notes}</p>
                            )}
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
                <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
                    Historial recuperado
                  </h2>
                  <div className="space-y-3">
                    {recoveredLogs.slice(0, 10).map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {MUSCLE_LABELS[log.muscle_id] ?? log.muscle_id}
                          </span>
                          <span className="rounded-full bg-[#00C853]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00C853]">
                            Recuperada
                          </span>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientHealthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      }
    >
      <ClientHealthInner />
    </Suspense>
  );
}
