"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { AppointmentList } from "./components/AppointmentList";
import { BookAppointmentModal } from "./components/BookAppointmentModal";

interface Appointment {
  id: string;
  trainer_id: string;
  client_id: string;
  title: string;
  session_type: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  location: string | null;
  meeting_url: string | null;
  google_event_id: string | null;
  cancellation_reason: string | null;
}

interface TrainerInfo {
  user_id: string;
  full_name: string | null;
}

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const threeMonthsAhead = new Date(); threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

    const { data, error: apptError } = await supabase
      .from("appointments")
      .select("id, trainer_id, client_id, title, session_type, starts_at, ends_at, status, notes, location, meeting_url, google_event_id, cancellation_reason")
      .eq("client_id", user.id)
      .gte("starts_at", monthAgo.toISOString())
      .lte("starts_at", threeMonthsAhead.toISOString())
      .order("starts_at", { ascending: true })
      .limit(200);

    if (apptError) {
      toast.error("Error al cargar las citas");
      console.error("[ClientAppointments] Error cargando citas:", apptError);
      return;
    }

    setAppointments((data as Appointment[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setClientId(user.id);

      const { data: rel, error: relErr } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();
      if (relErr) { console.error("[ClientAppointments] Error cargando relación trainer:", relErr); } // No bloqueante

      if (rel) {
        setTrainerId(rel.trainer_id as string);
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .eq("user_id", rel.trainer_id)
          .single();
        if (profileErr) { console.error("[ClientAppointments] Error cargando perfil trainer:", profileErr); } // No bloqueante
        setTrainer(profile as TrainerInfo | null);
      }

      await fetchAppointments();
      setLoading(false);
    };

    init();
  }, [fetchAppointments]);

  const cancelAppointment = async (id: string) => {
    setCancelling(id);
    const supabase = createClient();
    await supabase
      .from("appointments")
      .update({ status: "cancelled", cancelled_by: clientId })
      .eq("id", id);
    await fetchAppointments();
    setCancelling(null);
  };

  const upcoming = appointments.filter((a) => new Date(a.starts_at) >= new Date() && a.status !== "cancelled");
  const past = appointments.filter((a) => new Date(a.starts_at) < new Date() || a.status === "cancelled");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Mis citas</h1>
          <p className="mt-1 text-sm text-[#8B8BA3]">
            {trainer ? `Con ${trainer.full_name ?? "tu entrenador"}` : "Sesiones con tu entrenador"}
          </p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          disabled={!trainerId}
          className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-bold text-[#0A0A0F] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Solicitar cita
        </button>
      </div>

      <AppointmentList
        upcoming={upcoming}
        past={past}
        trainerName={trainer?.full_name ?? null}
        trainerId={trainerId}
        cancelling={cancelling}
        onCancel={cancelAppointment}
        onRequestAppointment={() => setShowRequest(true)}
      />

      {/* Modal */}
      {showRequest && trainerId && clientId && (
        <BookAppointmentModal
          trainerId={trainerId}
          clientId={clientId}
          onClose={() => setShowRequest(false)}
          onCreated={fetchAppointments}
        />
      )}
    </div>
  );
}
