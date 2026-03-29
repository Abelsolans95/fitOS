"use client";

import type { Appointment, ClientOption } from "./types";
import { SESSION_TYPES, STATUS_STYLES, formatDateTime, formatDuration } from "./shared";

// ── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appt, clients, isTrainer, actionLoading, onConfirm, onCancel, onComplete,
}: {
  appt: Appointment; clients: ClientOption[]; isTrainer: boolean; actionLoading: string | null;
  onConfirm: (id: string) => void; onCancel: (id: string) => void; onComplete: (id: string) => void;
}) {
  const statusStyle = STATUS_STYLES[appt.status] ?? STATUS_STYLES.pending;
  const client = clients.find((c) => c.client_id === appt.client_id);
  const isPast = new Date(appt.starts_at) < new Date();

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#12121A]/60 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
            <span className="text-[11px] text-[#5A5A72]">
              {SESSION_TYPES.find((t) => t.value === appt.session_type)?.label ?? appt.session_type}
            </span>
          </div>
          <h3 className="text-base font-bold text-white truncate">{appt.title}</h3>
          {isTrainer && client && (
            <p className="mt-0.5 text-xs text-[#8B8BA3]">
              Cliente: <span className="text-white">{client.full_name ?? client.client_id}</span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-[#00E5FF]">{formatDateTime(appt.starts_at)}</p>
          <p className="text-xs text-[#5A5A72]">{formatDuration(appt.starts_at, appt.ends_at)}</p>
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
        {appt.meeting_url && (
          <a
            href={appt.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#00E5FF] hover:underline"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Enlace de videoconferencia
          </a>
        )}
        {appt.google_event_id && (
          <span className="flex items-center gap-1 text-[#00C853]">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Sync Google Calendar
          </span>
        )}
      </div>

      {appt.notes && (
        <p className="mt-3 rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-[#8B8BA3] italic">
          {appt.notes}
        </p>
      )}

      {isTrainer && !isPast && appt.status !== "cancelled" && appt.status !== "completed" && (
        <div className="mt-4 flex gap-2">
          {appt.status === "pending" && (
            <button
              onClick={() => onConfirm(appt.id)}
              disabled={!!actionLoading}
              className="rounded-lg bg-[#00C853]/10 px-3 py-1.5 text-xs font-semibold text-[#00C853] transition-colors hover:bg-[#00C853]/20 disabled:opacity-40"
            >
              {actionLoading === appt.id + "confirmed" ? "…" : "Confirmar"}
            </button>
          )}
          {appt.status === "confirmed" && (
            <button
              onClick={() => onComplete(appt.id)}
              disabled={!!actionLoading}
              className="rounded-lg bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/20 disabled:opacity-40"
            >
              {actionLoading === appt.id + "completed" ? "…" : "Marcar completada"}
            </button>
          )}
          <button
            onClick={() => onCancel(appt.id)}
            disabled={!!actionLoading}
            className="rounded-lg bg-[#FF1744]/10 px-3 py-1.5 text-xs font-semibold text-[#FF1744] transition-colors hover:bg-[#FF1744]/20 disabled:opacity-40"
          >
            {actionLoading === appt.id + "cancelled" ? "…" : "Cancelar"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── List View (exported) ─────────────────────────────────────────────────────

export function AppointmentList({
  appointments, clients, actionLoading, filterStatus, onFilterChange, onConfirm, onCancel, onComplete,
}: {
  appointments: Appointment[]; clients: ClientOption[]; actionLoading: string | null;
  filterStatus: string; onFilterChange: (s: string) => void;
  onConfirm: (id: string) => void; onCancel: (id: string) => void; onComplete: (id: string) => void;
}) {
  const filtered = appointments.filter(
    (a) => filterStatus === "all" || a.status === filterStatus
  );

  const upcoming = filtered.filter(
    (a) => new Date(a.starts_at) >= new Date() && a.status !== "cancelled"
  );
  const past = filtered.filter(
    (a) => new Date(a.starts_at) < new Date() || a.status === "cancelled"
  );

  return (
    <>
      {/* Pending integrations notice */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-[#FF9100]/20 bg-[#FF9100]/5 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-[#FF9100]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#FF9100]">Pendiente</p>
            <p className="text-xs text-[#FF9100]/70">Google Calendar — requiere OAuth 2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7C3AED]">Pendiente</p>
            <p className="text-xs text-[#7C3AED]/70">Emails Resend — requiere dominio verificado</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "cancelled", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterStatus === s
                ? "bg-[#00E5FF]/10 text-[#00E5FF] ring-1 ring-[#00E5FF]/30"
                : "text-[#5A5A72] hover:text-[#8B8BA3]"
            }`}
          >
            {s === "all" ? "Todas" : STATUS_STYLES[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
          Próximas ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121A]/60 px-6 py-10 text-center">
            <p className="text-sm text-[#5A5A72]">No hay citas próximas</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                clients={clients}
                isTrainer
                actionLoading={actionLoading}
                onConfirm={onConfirm}
                onCancel={onCancel}
                onComplete={onComplete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Historial ({past.length})
          </h2>
          <div className="flex flex-col gap-3">
            {past.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                clients={clients}
                isTrainer
                actionLoading={actionLoading}
                onConfirm={onConfirm}
                onCancel={onCancel}
                onComplete={onComplete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121A]/60 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <svg className="h-6 w-6 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">Sin citas aún</p>
          <p className="mt-1 text-xs text-[#5A5A72]">Crea la primera cita con uno de tus clientes</p>
        </div>
      )}
    </>
  );
}
