"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { HealthLog, HealthLogFormData } from "@fitos/shared";
import type { Gender } from "@/components/health/AnatomyMap";

export type { HealthLog, HealthLogFormData };

export function useClientHealth() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>("male");

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
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) { toast.error("Error de autenticación"); console.error("[useClientHealth] auth:", authError); setLoading(false); return; }
      const user = session.user;

      setClientId(user.id);

      // Fetch gender + trainer in parallel
      const [relResult, profileResult] = await Promise.all([
        supabase.from("trainer_clients").select("trainer_id").eq("client_id", user.id).eq("status", "active").single(),
        supabase.from("profiles").select("gender").eq("user_id", user.id).single(),
      ]);

      if (relResult.error || !relResult.data) { console.error("[useClientHealth] No trainer rel:", relResult.error); } // No bloqueante
      else { setTrainerId(relResult.data.trainer_id as string); }

      if (profileResult.data?.gender) { setGender(profileResult.data.gender as Gender); } // No bloqueante

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

  const handleGenderChange = async (newGender: Gender) => {
    setGender(newGender);
    if (!clientId) return;
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ gender: newGender }).eq("user_id", clientId);
    if (error) { console.error("[useClientHealth] gender update:", error); } // No bloqueante — ya se refleja en UI
  };

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
    logs, loading, selectedMuscle, showForm, saving, gender,
    activeLogs, recoveredLogs, existingForMuscle,
    handleMuscleClick, handleSubmit, handleCancel, handleGenderChange,
  };
}
