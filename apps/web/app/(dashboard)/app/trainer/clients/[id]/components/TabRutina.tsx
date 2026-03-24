"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { UserRoutine, WorkoutSession, WeightLogEntry } from "./types";
import { EmptyState, formatDate } from "./shared";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TabRutina({
  routine,
  clientId,
}: {
  routine: UserRoutine | null;
  clientId: string;
}) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [sessRes, logsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("*")
          .eq("client_id", clientId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(20),
        supabase
          .from("weight_log")
          .select("id, exercise_name, sets_data, total_volume_kg, client_notes, session_id")
          .eq("client_id", clientId)
          .order("session_date", { ascending: false })
          .limit(200),
      ]);
      if (sessRes.error) {
        toast.error("Error al cargar las sesiones");
        console.error("[TabRutina] Error sesiones:", sessRes.error);
      }
      if (logsRes.error) {
        toast.error("Error al cargar el historial de ejercicios");
        console.error("[TabRutina] Error logs:", logsRes.error);
      }
      setSessions((sessRes.data ?? []) as WorkoutSession[]);
      setWeightLogs((logsRes.data ?? []) as WeightLogEntry[]);
      setLoadingSessions(false);
    };
    load();
  }, [clientId]);

  const getLogsForSession = useCallback(
    (sessionId: string) => weightLogs.filter((l) => l.session_id === sessionId),
    [weightLogs]
  );

  if (!routine) {
    return (
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0L22 16.5l-9.75 5.25L2.25 16.5l4.179-2.25" />
          </svg>
        }
        title="Sin rutina asignada"
        description="Este cliente aún no tiene una rutina de entrenamiento"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Active routine info */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-semibold text-white">{routine.title}</h4>
          <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED]">
            Activa
          </span>
        </div>
        <p className="mt-3 text-xs text-[#8B8BA3]">Creada el {formatDate(routine.created_at)}</p>
      </div>

      {/* Session history */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">
          Historial de sesiones
        </h3>

        {loadingSessions ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center text-sm text-[#5A5A72]">
            Aún no ha completado ninguna sesión
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const isExpanded = expandedSession === session.id;
              const logs = isExpanded ? getLogsForSession(session.id) : [];

              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-black text-white">{formatDuration(session.duration_seconds)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Duración</p>
                      </div>
                      <div className="h-8 w-px bg-white/[0.06]" />
                      <div className="text-center">
                        <p className="text-lg font-black text-[#7C3AED]">{Math.round(session.total_volume_kg ?? 0)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Vol (kg)</p>
                      </div>
                      <div className="h-8 w-px bg-white/[0.06]" />
                      <div className="text-center">
                        <p className="text-lg font-black text-[#00E5FF]">{session.total_sets ?? 0}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Series</p>
                      </div>
                      {session.rpe_session && (
                        <>
                          <div className="h-8 w-px bg-white/[0.06]" />
                          <div className="text-center">
                            <p className="text-lg font-black text-[#FF9100]">{session.rpe_session}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">RPE</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#5A5A72]">
                        {session.completed_at ? formatDate(session.completed_at) : formatDate(session.created_at)}
                      </span>
                      <svg
                        className={`h-4 w-4 text-[#5A5A72] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 space-y-3">
                      {logs.length === 0 ? (
                        <p className="text-xs text-[#5A5A72]">Sin datos de ejercicios</p>
                      ) : (
                        logs.map((log) => (
                          <div
                            key={log.id}
                            className="rounded-lg border border-white/[0.04] bg-[#0E0E18]/60 backdrop-blur-xl p-3"
                          >
                            <p className="text-sm font-semibold text-white">{log.exercise_name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(log.sets_data ?? []).map((set, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-white/[0.04] px-2 py-1 text-xs text-[#8B8BA3]"
                                >
                                  <span className="font-semibold text-white">{set.weight_kg}</span>kg ×{" "}
                                  <span className="font-semibold text-white">{set.reps_done}</span>
                                  {set.type === "rest_pause" && (
                                    <span className="ml-1 text-[#FF9100]">RP</span>
                                  )}
                                </span>
                              ))}
                            </div>
                            {log.client_notes && (
                              <p className="mt-2 rounded-md bg-[#7C3AED]/5 px-3 py-2 text-xs text-[#7C3AED]">
                                💬 {log.client_notes}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
