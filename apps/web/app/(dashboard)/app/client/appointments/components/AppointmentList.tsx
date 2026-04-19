"use client";

import { memo } from "react";
import { isSafeHttpsUrl } from "@/lib/url-validation";

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

function ClientAppointmentCard({
  appt, trainerName, onCancel, cancelling,
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
    <div className="rounded-2xl border border-white/10 bg-[#12121A]/60 p-5 backdrop-blur-sm">
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
            <p className="mt-0.5 text-xs text-[#8B8BA3]">Con <span className="text-white">{trainerName}</span></p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-[#00E5FF]">
            {new Date(appt.starts_at).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <p className="text-xs text-[#8B8BA3]">
            {new Date(appt.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
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
        {appt.meeting_url && appt.status === "confirmed" && isSafeHttpsUrl(appt.meeting_url) && (
          <a href={appt.meeting_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#00E5FF] hover:underline">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Unirse a la sesión
          </a>
        )}
      </div>

      {appt.notes && (
        <p className="mt-3 rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-[#8B8BA3] italic">{appt.notes}</p>
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

interface AppointmentListProps {
  upcoming: Appointment[];
  past: Appointment[];
  trainerName: string | null;
  trainerId: string | null;
  cancelling: string | null;
  onCancel: (id: string) => void;
  onRequestAppointment: () => void;
}

export const AppointmentList = memo(function AppointmentList({ upcoming, past, trainerName, trainerId, cancelling, onCancel, onRequestAppointment }: AppointmentListProps) {
  return (
    <>
      {/* No trainer */}
      {!trainerId && (
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">No tienes un entrenador asignado.</p>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Próximas ({upcoming.length})</h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((appt) => (
              <ClientAppointmentCard key={appt.id} appt={appt} trainerName={trainerName} onCancel={onCancel} cancelling={cancelling} />
            ))}
          </div>
        </section>
      )}

      {/* Empty upcoming */}
      {upcoming.length === 0 && trainerId && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#12121A]/60 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <svg className="h-6 w-6 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">No tienes citas próximas</p>
          <p className="mt-1 text-xs text-[#5A5A72]">Solicita una cita a tu entrenador</p>
          <button
            onClick={onRequestAppointment}
            className="mt-4 rounded-xl bg-[#00E5FF]/10 px-4 py-2 text-sm font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20"
          >
            Solicitar cita
          </button>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Historial ({past.length})</h2>
          <div className="flex flex-col gap-3">
            {past.map((appt) => (
              <ClientAppointmentCard key={appt.id} appt={appt} trainerName={trainerName} onCancel={onCancel} cancelling={cancelling} />
            ))}
          </div>
        </section>
      )}
    </>
  );
});
