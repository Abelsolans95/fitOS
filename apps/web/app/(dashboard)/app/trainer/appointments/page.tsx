"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import type { Appointment, ClientOption } from "./components/types";
import { CreateAppointmentModal } from "./components/CreateAppointmentModal";
import { AppointmentCalendar } from "./components/AppointmentCalendar";
import { AppointmentList } from "./components/AppointmentList";

export default function TrainerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setTrainerId(user.id);

    const { data, error: apptError } = await supabase
      .from("appointments")
      .select("*")
      .eq("trainer_id", user.id)
      .order("starts_at", { ascending: true });

    if (apptError) {
      toast.error("Error al cargar las citas");
      console.error("[Appointments] Error cargando citas:", apptError);
      return;
    }

    setAppointments((data as Appointment[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setTrainerId(user.id);

      const { data: rels, error: relsError } = await supabase
        .from("trainer_clients")
        .select("client_id")
        .eq("trainer_id", user.id)
        .eq("status", "active");

      if (relsError) {
        toast.error("Error al cargar los clientes");
        console.error("[Appointments] Error cargando clientes:", relsError);
      }

      if (rels && rels.length > 0) {
        const ids = rels.map((r) => r.client_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ids);
        if (profilesError) {
          console.error("[Appointments] Error cargando perfiles:", profilesError);
          // No bloqueante
        }
        setClients(
          (profiles ?? []).map((p) => ({ client_id: p.user_id, full_name: p.full_name }))
        );
      }

      await fetchAppointments();
      setLoading(false);
    };

    init();
  }, [fetchAppointments]);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    setActionLoading(id + status);
    const supabase = createClient();
    const update: Record<string, unknown> = { status };
    if (status === "cancelled") {
      update.cancelled_by = trainerId;
      if (reason) update.cancellation_reason = reason;
    }
    const { error: updateErr } = await supabase.from("appointments").update(update).eq("id", id);
    if (updateErr) {
      toast.error("Error al actualizar la cita");
      console.error("[Appointments] Error actualizando cita:", updateErr);
    }
    await fetchAppointments();
    setActionLoading(null);
  };

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
          <h1 className="text-2xl font-black tracking-tight text-white">Citas</h1>
          <p className="mt-1 text-sm text-[#8B8BA3]">Gestiona las sesiones con tus clientes</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={clients.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-bold text-[#0A0A0F] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva cita
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 p-1 w-fit">
        {([["list", "Lista"], ["calendar", "Calendario"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              viewMode === key
                ? "bg-[#00E5FF]/10 text-[#00E5FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "text-[#5A5A72] hover:text-[#8B8BA3]"
            }`}
          >
            {key === "list" ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
              </svg>
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <AppointmentCalendar
          appointments={appointments}
          clients={clients}
          actionLoading={actionLoading}
          onConfirm={(id) => updateStatus(id, "confirmed")}
          onCancel={(id) => updateStatus(id, "cancelled")}
          onComplete={(id) => updateStatus(id, "completed")}
        />
      )}

      {/* List View */}
      {viewMode === "list" && (
        <AppointmentList
          appointments={appointments}
          clients={clients}
          actionLoading={actionLoading}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onConfirm={(id) => updateStatus(id, "confirmed")}
          onCancel={(id) => updateStatus(id, "cancelled")}
          onComplete={(id) => updateStatus(id, "completed")}
        />
      )}

      {/* Modal */}
      {showCreate && trainerId && (
        <CreateAppointmentModal
          clients={clients}
          onClose={() => setShowCreate(false)}
          onCreated={fetchAppointments}
          trainerId={trainerId}
        />
      )}
    </div>
  );
}
