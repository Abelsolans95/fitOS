"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export interface HealthLog {
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

export interface HealthLogFormData {
  muscle_id: string;
  pain_score: number;
  incident_type: "puntual" | "diagnosticada" | "cronica";
  status: "active" | "recovering" | "recovered";
  notes: string;
}

export function useClientHealth() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const fetchLogs = useCallback(async (cid: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("health_logs")
      .select("id, client_id, trainer_id, reported_by, muscle_id, pain_score, incident_type, status, notes, created_at, updated_at")
      .eq("client_id", cid)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Error al cargar registros de salud"); console.error("[useClientHealth] fetch:", error); return; }
    setLogs((data as HealthLog[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { toast.error("Error de autenticación"); console.error("[useClientHealth] auth:", authError); setLoading(false); return; }

      setClientId(user.id);

      const { data: rel, error: relError } = await supabase
        .from("trainer_clients").select("trainer_id")
        .eq("client_id", user.id).eq("status", "active").single();
      if (relError || !rel) { console.error("[useClientHealth] No trainer rel:", relError); } // No bloqueante
      else { setTrainerId(rel.trainer_id as string); }

      await fetchLogs(user.id);
      setLoading(false);
    };
    init();
  }, [fetchLogs]);

  // Realtime
  useEffect(() => {
    if (!clientId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`health-client-${clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "health_logs", filter: `client_id=eq.${clientId}` },
        () => { fetchLogs(clientId); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, fetchLogs]);

  const handleMuscleClick = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setShowForm(true);
  };

  const handleSubmit = async (data: HealthLogFormData) => {
    if (!clientId || !trainerId) { toast.error("No se pudo identificar tu entrenador"); return; }
    setSaving(true);
    const supabase = createClient();
    const existing = logs.find((l) => l.muscle_id === data.muscle_id && l.status !== "recovered");

    if (existing) {
      const { error } = await supabase.from("health_logs").update({
        pain_score: data.pain_score, incident_type: data.incident_type,
        status: data.status, notes: data.notes || null,
      }).eq("id", existing.id);
      if (error) { toast.error("Error al actualizar el reporte"); console.error("[useClientHealth] update:", error); setSaving(false); return; }
      toast.success("Reporte actualizado");
    } else {
      const { error } = await supabase.from("health_logs").insert({
        client_id: clientId, trainer_id: trainerId, reported_by: "client",
        muscle_id: data.muscle_id, pain_score: data.pain_score,
        incident_type: data.incident_type, status: data.status, notes: data.notes || null,
      });
      if (error) { toast.error("Error al crear el reporte"); console.error("[useClientHealth] insert:", error); setSaving(false); return; }
      toast.success("Molestia reportada");
    }

    setSaving(false);
    setShowForm(false);
    setSelectedMuscle(null);
    if (clientId) fetchLogs(clientId);
  };

  const handleCancel = () => { setShowForm(false); setSelectedMuscle(null); };

  const activeLogs = logs.filter((l) => l.status !== "recovered");
  const recoveredLogs = logs.filter((l) => l.status === "recovered");
  const existingForMuscle = selectedMuscle ? logs.find((l) => l.muscle_id === selectedMuscle && l.status !== "recovered") ?? null : null;

  return {
    logs, loading, selectedMuscle, showForm, saving,
    activeLogs, recoveredLogs, existingForMuscle,
    handleMuscleClick, handleSubmit, handleCancel,
  };
}
