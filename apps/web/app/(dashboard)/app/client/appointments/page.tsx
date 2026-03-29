"use client";

import { useState, useEffect, useCallback } from "react";
import { DarkSelect } from "@/components/ui/DarkSelect";
import { createClient } from "@/lib/supabase";

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

const SESSION_TYPES = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "telefonica", label: "Telefónica" },
  { value: "evaluacion", label: "Evaluación inicial" },
  { value: "seguimiento", label: "Seguimiento" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-[#FF9100]/10",  text: "text-[#FF9100]",  label: "Pendiente de confirmación" },
  confirmed: { bg: "bg-[#00C853]/10",  text: "text-[#00C853]",  label: "Confirmada" },
  cancelled: { bg: "bg-[#FF1744]/10",  text: "text-[#FF1744]",  label: "Cancelada" },
  completed: { bg: "bg-[#7C3AED]/10",  text: "text-[#7C3AED]",  label: "Completada" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(starts: string, ends: string) {
  const diff = (new Date(ends).getTime() - new Date(starts).getTime()) / 60000;
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Modal: solicitar cita ────────────────────────────────────────────────────

interface RequestModalProps {
  trainerId: string;
  clientId: string;
  onClose: () => void;
  onCreated: () => void;
}

function RequestAppointmentModal({ trainerId, clientId, onClose, onCreated }: RequestModalProps) {
  const [form, setForm] = useState({
    title: "",
    session_type: "presencial",
    date: "",
    start_time: "",
    duration: "60",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.start_time) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);

    const starts_at = new Date(`${form.date}T${form.start_time}:00`).toISOString();
    const ends_at = new Date(
      new Date(starts_at).getTime() + parseInt(form.duration) * 60000
    ).toISOString();

    const supabase = createClient();
    const { error: insertErr } = await supabase.from("appointments").insert({
      trainer_id: trainerId,
      client_id: clientId,
      title: form.title,
      session_type: form.session_type,
      starts_at,
      ends_at,
      status: "pending",
      notes: form.notes || null,
    });

    setSaving(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#12121A] shadow-2xl">
        <div className="shrink-0 px-6 pt-6 pb-2">
          <h2 className="text-lg font-bold text-white">Solicitar cita</h2>
          <p className="mt-1 text-sm text-[#8B8BA3]">
            Tu entrenador recibirá la solicitud y la confirmará.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 scrollbar-thin">
          {/* Título */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Motivo / Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Revisión de técnica, Sesión de piernas…"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
            />
          </div>

          {/* Tipo + Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Tipo de sesión *
              </label>
              <DarkSelect
                value={form.session_type}
                onChange={(v) => setForm((f) => ({ ...f, session_type: v }))}
                options={SESSION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Duración estimada
              </label>
              <DarkSelect
                value={form.duration}
                onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
                options={[30, 45, 60, 75, 90, 120].map((d) => ({ value: String(d), label: `${d} min` }))}
              />
            </div>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Fecha preferida *
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Hora preferida *
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Mensaje para tu entrenador (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Cuéntale qué quieres trabajar o cualquier duda…"
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
            />
          </div>

          {error && <p className="text-xs text-[#FF1744]">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-[#8B8BA3] transition-colors hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#00E5FF] py-2.5 text-sm font-bold text-[#0A0A0F] transition-opacity disabled:opacity-50"
            >
              {saving ? "Enviando…" : "Solicitar cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

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

    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_id", user.id)
      .order("starts_at", { ascending: true });

    setAppointments((data as Appointment[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setClientId(user.id);

      // Get trainer
      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (rel) {
        setTrainerId(rel.trainer_id as string);
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .eq("user_id", rel.trainer_id)
          .single();
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

  const upcoming = appointments.filter(
    (a) => new Date(a.starts_at) >= new Date() && a.status !== "cancelled"
  );
  const past = appointments.filter(
    (a) => new Date(a.starts_at) < new Date() || a.status === "cancelled"
  );

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

      {/* No trainer */}
      {!trainerId && (
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">No tienes un entrenador asignado.</p>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Próximas ({upcoming.length})
          </h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((appt) => (
              <ClientAppointmentCard
                key={appt.id}
                appt={appt}
                trainerName={trainer?.full_name ?? null}
                onCancel={cancelAppointment}
                cancelling={cancelling}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty upcoming */}
      {upcoming.length === 0 && trainerId && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121A]/60 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <svg className="h-6 w-6 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">No tienes citas próximas</p>
          <p className="mt-1 text-xs text-[#5A5A72]">Solicita una cita a tu entrenador</p>
          <button
            onClick={() => setShowRequest(true)}
            className="mt-4 rounded-xl bg-[#00E5FF]/10 px-4 py-2 text-sm font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20"
          >
            Solicitar cita
          </button>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Historial ({past.length})
          </h2>
          <div className="flex flex-col gap-3">
            {past.map((appt) => (
              <ClientAppointmentCard
                key={appt.id}
                appt={appt}
                trainerName={trainer?.full_name ?? null}
                onCancel={cancelAppointment}
                cancelling={cancelling}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {showRequest && trainerId && clientId && (
        <RequestAppointmentModal
          trainerId={trainerId}
          clientId={clientId}
          onClose={() => setShowRequest(false)}
          onCreated={fetchAppointments}
        />
      )}
    </div>
  );
}

// ── Client appointment card ──────────────────────────────────────────────────

function ClientAppointmentCard({
  appt,
  trainerName,
  onCancel,
  cancelling,
}: {
  appt: Appointment;
  trainerName: string | null;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const statusStyle = STATUS_STYLES[appt.status] ?? STATUS_STYLES.pending;
  const isPast = new Date(appt.starts_at) < new Date();
  const isCancellable = !isPast && appt.status !== "cancelled" && appt.status !== "completed";
  const typeLabel = SESSION_TYPES.find((t) => t.value === appt.session_type)?.label ?? appt.session_type;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#12121A]/60 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
            <span className="text-[11px] text-[#5A5A72]">{typeLabel}</span>
          </div>
          <h3 className="text-base font-bold text-white">{appt.title}</h3>
          {trainerName && (
            <p className="mt-0.5 text-xs text-[#8B8BA3]">
              Con <span className="text-white">{trainerName}</span>
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-[#00E5FF]">
            {new Date(appt.starts_at).toLocaleDateString("es-ES", {
              weekday: "short", day: "numeric", month: "short",
            })}
          </p>
          <p className="text-xs text-[#8B8BA3]">
            {new Date(appt.starts_at).toLocaleTimeString("es-ES", {
              hour: "2-digit", minute: "2-digit",
            })}
            {" · "}
            {Math.round((new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime()) / 60000)} min
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#8B8BA3]">
        {appt.location && (
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            {appt.location}
          </span>
        )}
        {appt.meeting_url && appt.status === "confirmed" && (
          <a
            href={appt.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#00E5FF] hover:underline"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Unirse a la sesión
          </a>
        )}
      </div>

      {appt.notes && (
        <p className="mt-3 rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-[#8B8BA3] italic">
          {appt.notes}
        </p>
      )}

      {appt.cancellation_reason && (
        <p className="mt-3 rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/5 px-3 py-2 text-xs text-[#FF1744]">
          Motivo de cancelación: {appt.cancellation_reason}
        </p>
      )}

      {isCancellable && (
        <div className="mt-4">
          <button
            onClick={() => onCancel(appt.id)}
            disabled={cancelling === appt.id}
            className="rounded-lg bg-[#FF1744]/10 px-3 py-1.5 text-xs font-semibold text-[#FF1744] transition-colors hover:bg-[#FF1744]/20 disabled:opacity-40"
          >
            {cancelling === appt.id ? "Cancelando…" : "Cancelar cita"}
          </button>
        </div>
      )}
    </div>
  );
}
