"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  created_at: string;
}

interface ClientOption {
  client_id: string;
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
  pending:   { bg: "bg-[#FF9100]/10",  text: "text-[#FF9100]",  label: "Pendiente" },
  confirmed: { bg: "bg-[#00C853]/10",  text: "text-[#00C853]",  label: "Confirmada" },
  cancelled: { bg: "bg-[#FF1744]/10",  text: "text-[#FF1744]",  label: "Cancelada" },
  completed: { bg: "bg-[#7C3AED]/10",  text: "text-[#7C3AED]",  label: "Completada" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
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

// ── Modal: crear cita ───────────────────────────────────────────────────────

interface CreateModalProps {
  clients: ClientOption[];
  onClose: () => void;
  onCreated: () => void;
  trainerId: string;
}

function CreateAppointmentModal({ clients, onClose, onCreated, trainerId }: CreateModalProps) {
  const [form, setForm] = useState({
    client_id: clients[0]?.client_id ?? "",
    title: "",
    session_type: "presencial",
    date: "",
    start_time: "",
    duration: "60",
    notes: "",
    location: "",
    meeting_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.title || !form.date || !form.start_time) {
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
      client_id: form.client_id,
      title: form.title,
      session_type: form.session_type,
      starts_at,
      ends_at,
      status: "confirmed", // Trainer-created = auto-confirmed
      notes: form.notes || null,
      location: form.location || null,
      meeting_url: form.meeting_url || null,
    });

    setSaving(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    // TODO: sendAppointmentEmail cuando Resend esté configurado
    // TODO: syncAppointmentToCalendar cuando OAuth de Google esté configurado

    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#12121A] shadow-2xl">
        <h2 className="shrink-0 px-6 pt-6 pb-2 text-lg font-bold text-white">Nueva cita</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 scrollbar-thin">
          {/* Cliente */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Cliente *
            </label>
            <select
              value={form.client_id}
              onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40"
            >
              {clients.map((c) => (
                <option key={c.client_id} value={c.client_id} className="bg-[#12121A]">
                  {c.full_name ?? c.client_id}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Sesión de fuerza"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
            />
          </div>

          {/* Tipo + Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Tipo *
              </label>
              <select
                value={form.session_type}
                onChange={(e) => setForm((f) => ({ ...f, session_type: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40"
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#12121A]">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Duración *
              </label>
              <select
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40"
              >
                {[30, 45, 60, 75, 90, 120].map((d) => (
                  <option key={d} value={String(d)} className="bg-[#12121A]">
                    {d} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Fecha *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Hora *
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Ubicación / URL (condicional por tipo) */}
          {form.session_type === "presencial" || form.session_type === "evaluacion" ? (
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Lugar
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Ej: Gym Center, sala 2"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
              />
            </div>
          ) : form.session_type === "online" ? (
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Enlace de videoconferencia
              </label>
              <input
                type="url"
                value={form.meeting_url}
                onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
              />
            </div>
          ) : null}

          {/* Notas */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Notas (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Indicaciones para la sesión…"
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
            />
          </div>

          {/* Google Calendar notice */}
          <div className="rounded-xl border border-[#FF9100]/20 bg-[#FF9100]/5 px-4 py-3">
            <p className="text-[11px] text-[#FF9100]">
              <span className="font-bold">Pendiente:</span> Sincronización con Google Calendar disponible cuando se configure OAuth 2.0.
            </p>
          </div>

          {error && (
            <p className="text-xs text-[#FF1744]">{error}</p>
          )}

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
              {saving ? "Guardando…" : "Crear cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Calendar helpers ─────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00-21:00
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_BG: Record<string, string> = {
  pending:   "bg-[#FF9100]/20 border-[#FF9100]/40 text-[#FF9100]",
  confirmed: "bg-[#00C853]/20 border-[#00C853]/40 text-[#00C853]",
  cancelled: "bg-[#FF1744]/10 border-[#FF1744]/30 text-[#FF1744] opacity-50",
  completed: "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#7C3AED]",
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  let offset = first.getDay() - 1;
  if (offset < 0) offset = 6;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i));
}

function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function fmtHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

function fmtDayFull(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

// ── Appointment Popover (compact 1/3 card) ──────────────────────────────────

function AppointmentPopover({
  appt, clients, actionLoading, onConfirm, onCancel, onComplete, position, onMouseEnter, onMouseLeave,
}: {
  appt: Appointment; clients: ClientOption[]; actionLoading: string | null;
  onConfirm: (id: string) => void; onCancel: (id: string) => void; onComplete: (id: string) => void;
  position: { top: number; left: number }; onMouseEnter: () => void; onMouseLeave: () => void;
}) {
  const ss = STATUS_STYLES[appt.status] ?? STATUS_STYLES.pending;
  const client = clients.find((c) => c.client_id === appt.client_id);
  const isPast = new Date(appt.starts_at) < new Date();
  const typeLabel = SESSION_TYPES.find((t) => t.value === appt.session_type)?.label ?? appt.session_type;

  return (
    <div
      className="fixed z-[100] w-72 rounded-xl border border-white/[0.1] bg-[#12121A] p-4 shadow-2xl shadow-black/60 backdrop-blur-xl"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${ss.bg} ${ss.text}`}>
          {ss.label}
        </span>
        <span className="text-[10px] text-[#5A5A72]">{typeLabel}</span>
      </div>
      <h4 className="text-sm font-bold text-white truncate">{appt.title}</h4>
      {client && (
        <p className="text-[11px] text-[#8B8BA3] mt-0.5">
          Cliente: <span className="text-white">{client.full_name ?? "—"}</span>
        </p>
      )}
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
        <span className="font-semibold text-[#00E5FF]">{formatDateTime(appt.starts_at)}</span>
        <span className="text-[#5A5A72]">· {formatDuration(appt.starts_at, appt.ends_at)}</span>
      </div>
      {appt.notes && <p className="mt-1.5 text-[11px] text-[#5A5A72] italic line-clamp-2">{appt.notes}</p>}
      {!isPast && appt.status !== "cancelled" && appt.status !== "completed" && (
        <div className="mt-3 flex gap-1.5 border-t border-white/[0.06] pt-3">
          {appt.status === "pending" && (
            <button onClick={() => onConfirm(appt.id)} disabled={!!actionLoading}
              className="rounded-md bg-[#00C853]/10 px-2 py-1 text-[10px] font-semibold text-[#00C853] hover:bg-[#00C853]/20 disabled:opacity-40">
              {actionLoading === appt.id + "confirmed" ? "…" : "Confirmar"}
            </button>
          )}
          {appt.status === "confirmed" && (
            <button onClick={() => onComplete(appt.id)} disabled={!!actionLoading}
              className="rounded-md bg-[#7C3AED]/10 px-2 py-1 text-[10px] font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/20 disabled:opacity-40">
              {actionLoading === appt.id + "completed" ? "…" : "Completada"}
            </button>
          )}
          <button onClick={() => onCancel(appt.id)} disabled={!!actionLoading}
            className="rounded-md bg-[#FF1744]/10 px-2 py-1 text-[10px] font-semibold text-[#FF1744] hover:bg-[#FF1744]/20 disabled:opacity-40">
            {actionLoading === appt.id + "cancelled" ? "…" : "Cancelar"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Appointment Pill (used in calendar cells) ───────────────────────────────

function ApptPill({
  appt, clients, onHover, onLeave, compact,
}: {
  appt: Appointment; clients: ClientOption[];
  onHover: (e: React.MouseEvent) => void; onLeave: () => void; compact?: boolean;
}) {
  const client = clients.find((c) => c.client_id === appt.client_id);
  const cls = STATUS_BG[appt.status] ?? STATUS_BG.pending;
  const time = new Date(appt.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const typeIcon = appt.session_type === "online" ? "🖥" : appt.session_type === "telefonica" ? "📞" : "📍";

  if (compact) {
    return (
      <button
        type="button"
        onMouseEnter={onHover} onMouseLeave={onLeave}
        className={`w-full truncate rounded border px-1 py-0.5 text-left text-[9px] font-medium leading-tight ${cls}`}
      >
        {time} {client?.full_name?.split(" ")[0] ?? ""}
      </button>
    );
  }

  return (
    <button
      type="button"
      onMouseEnter={onHover} onMouseLeave={onLeave}
      className={`flex w-full items-center gap-1.5 truncate rounded-lg border px-2 py-1 text-left text-[11px] font-medium ${cls}`}
    >
      <span className="shrink-0 text-[10px]">{typeIcon}</span>
      <span className="truncate">
        {time} · {client?.full_name?.split(" ")[0] ?? ""} — {appt.title}
      </span>
    </button>
  );
}

// ── Calendar View ───────────────────────────────────────────────────────────

type CalMode = "month" | "week" | "day";

function CalendarView({
  appointments, clients, actionLoading, onConfirm, onCancel, onComplete,
}: {
  appointments: Appointment[]; clients: ClientOption[]; actionLoading: string | null;
  onConfirm: (id: string) => void; onCancel: (id: string) => void; onComplete: (id: string) => void;
}) {
  const [calDate, setCalDate] = useState(new Date());
  const [mode, setMode] = useState<CalMode>("month");
  const [hovered, setHovered] = useState<{ appt: Appointment; pos: { top: number; left: number } } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPopover = (appt: Appointment, e: React.MouseEvent) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = Math.min(rect.right + 8, window.innerWidth - 300);
    const top = Math.min(rect.top, window.innerHeight - 280);
    setHovered({ appt, pos: { top, left } });
  };

  const startHide = () => {
    hideTimer.current = setTimeout(() => setHovered(null), 200);
  };

  const cancelHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const navigate = (dir: -1 | 1) => {
    setCalDate((d) => {
      const n = new Date(d);
      if (mode === "month") n.setMonth(n.getMonth() + dir);
      else if (mode === "week") n.setDate(n.getDate() + dir * 7);
      else n.setDate(n.getDate() + dir);
      return n;
    });
  };

  const today = new Date();

  // Filter non-cancelled for calendar
  const visible = appointments.filter((a) => a.status !== "cancelled");

  return (
    <div className="space-y-4">
      {/* Mode tabs + navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
          {(["month", "week", "day"] as CalMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${mode === m ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#8B8BA3]"}`}>
              {m === "month" ? "Mensual" : m === "week" ? "Semanal" : "Diario"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] text-[#8B8BA3] hover:text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button onClick={() => setCalDate(new Date())}
            className="rounded-lg border border-white/[0.06] px-3 py-1 text-xs font-semibold text-[#8B8BA3] hover:text-white">
            Hoy
          </button>
          <button onClick={() => navigate(1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] text-[#8B8BA3] hover:text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <span className="ml-1 text-sm font-bold capitalize text-white">
            {mode === "month" ? fmtMonthYear(calDate) : mode === "week"
              ? (() => { const w = getWeekDays(calDate); return `${w[0].getDate()} – ${w[6].getDate()} ${fmtMonthYear(w[0])}`; })()
              : fmtDayFull(calDate)}
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      {mode === "month" && (
        <MonthGrid days={getMonthGrid(calDate.getFullYear(), calDate.getMonth())} calDate={calDate} today={today}
          appointments={visible} clients={clients} onHover={showPopover} onLeave={startHide}
          onDayClick={(d) => { setCalDate(d); setMode("day"); }} />
      )}
      {mode === "week" && (
        <WeekGrid days={getWeekDays(calDate)} today={today} appointments={visible} clients={clients}
          onHover={showPopover} onLeave={startHide} />
      )}
      {mode === "day" && (
        <DayGrid date={calDate} today={today} appointments={visible} clients={clients}
          onHover={showPopover} onLeave={startHide} />
      )}

      {/* Popover */}
      {hovered && (
        <AppointmentPopover
          appt={hovered.appt} clients={clients} actionLoading={actionLoading}
          onConfirm={onConfirm} onCancel={onCancel} onComplete={onComplete}
          position={hovered.pos} onMouseEnter={cancelHide} onMouseLeave={startHide}
        />
      )}
    </div>
  );
}

// ── Month Grid ──────────────────────────────────────────────────────────────

function MonthGrid({
  days, calDate, today, appointments, clients, onHover, onLeave, onDayClick,
}: {
  days: Date[]; calDate: Date; today: Date; appointments: Appointment[]; clients: ClientOption[];
  onHover: (a: Appointment, e: React.MouseEvent) => void; onLeave: () => void;
  onDayClick: (d: Date) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#12121A]/60 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-white/[0.04]">
        {DAY_NAMES.map((d) => (
          <div key={d} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            {d}
          </div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === calDate.getMonth();
          const isToday = isSameDay(day, today);
          const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), day))
            .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`min-h-[90px] border-b border-r border-white/[0.03] p-1 cursor-pointer transition-colors hover:bg-white/[0.02] ${
                !inMonth ? "opacity-30" : ""
              }`}
            >
              <div className={`mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                isToday ? "bg-[#00E5FF] text-[#0A0A0F]" : "text-[#8B8BA3]"
              }`}>
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <ApptPill key={a.id} appt={a} clients={clients} compact
                    onHover={(e) => onHover(a, e)} onLeave={onLeave} />
                ))}
                {dayAppts.length > 3 && (
                  <span className="text-[9px] font-semibold text-[#5A5A72] pl-1">+{dayAppts.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week Grid ───────────────────────────────────────────────────────────────

function WeekGrid({
  days, today, appointments, clients, onHover, onLeave,
}: {
  days: Date[]; today: Date; appointments: Appointment[]; clients: ClientOption[];
  onHover: (a: Appointment, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const ROW_H = 48; // px per hour

  return (
    <div className="overflow-auto rounded-2xl border border-white/[0.06] bg-[#12121A]/60">
      {/* Day headers */}
      <div className="sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.06] bg-[#12121A]">
        <div className="border-r border-white/[0.04]" />
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className={`border-r border-white/[0.04] px-2 py-2 text-center ${isToday ? "bg-[#00E5FF]/5" : ""}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A72]">{DAY_NAMES[i]}</p>
              <p className={`text-sm font-bold ${isToday ? "text-[#00E5FF]" : "text-white"}`}>{d.getDate()}</p>
            </div>
          );
        })}
      </div>
      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {/* Hour labels + rows */}
        <div className="border-r border-white/[0.04]">
          {HOURS.map((h) => (
            <div key={h} className="flex items-start justify-end pr-2 text-[10px] font-semibold text-[#5A5A72]"
              style={{ height: ROW_H }}>
              {fmtHour(h)}
            </div>
          ))}
        </div>
        {/* Day columns */}
        {days.map((day, di) => {
          const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={di} className={`relative border-r border-white/[0.04] ${isToday ? "bg-[#00E5FF]/[0.02]" : ""}`}>
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div key={h} className="border-b border-white/[0.03]" style={{ height: ROW_H }} />
              ))}
              {/* Appointments */}
              {dayAppts.map((a) => {
                const start = new Date(a.starts_at);
                const end = new Date(a.ends_at);
                const startH = start.getHours() + start.getMinutes() / 60;
                const endH = end.getHours() + end.getMinutes() / 60;
                const top = (startH - HOURS[0]) * ROW_H;
                const height = Math.max((endH - startH) * ROW_H, 20);
                const cls = STATUS_BG[a.status] ?? STATUS_BG.pending;
                const client = clients.find((c) => c.client_id === a.client_id);
                const time = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

                return (
                  <button
                    key={a.id}
                    type="button"
                    onMouseEnter={(e) => onHover(a, e)} onMouseLeave={onLeave}
                    className={`absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[10px] leading-tight font-medium transition-opacity hover:opacity-80 ${cls}`}
                    style={{ top, height }}
                  >
                    <span className="font-bold">{time}</span>
                    {height > 30 && <span className="block truncate">{client?.full_name?.split(" ")[0] ?? ""}</span>}
                    {height > 48 && <span className="block truncate text-[9px] opacity-70">{a.title}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day Grid ────────────────────────────────────────────────────────────────

function DayGrid({
  date, today, appointments, clients, onHover, onLeave,
}: {
  date: Date; today: Date; appointments: Appointment[]; clients: ClientOption[];
  onHover: (a: Appointment, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const ROW_H = 60;
  const isToday = isSameDay(date, today);
  const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), date))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <div className="overflow-auto rounded-2xl border border-white/[0.06] bg-[#12121A]/60">
      {/* Header */}
      <div className={`border-b border-white/[0.06] px-4 py-3 ${isToday ? "bg-[#00E5FF]/5" : ""}`}>
        <p className={`text-sm font-bold capitalize ${isToday ? "text-[#00E5FF]" : "text-white"}`}>
          {fmtDayFull(date)}
          {isToday && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#00E5FF]/60">Hoy</span>}
        </p>
        <p className="text-[11px] text-[#5A5A72]">{dayAppts.length} cita{dayAppts.length !== 1 ? "s" : ""}</p>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-[60px_1fr]">
        <div className="border-r border-white/[0.04]">
          {HOURS.map((h) => (
            <div key={h} className="flex items-start justify-end pr-2 pt-0.5 text-[10px] font-semibold text-[#5A5A72]"
              style={{ height: ROW_H }}>
              {fmtHour(h)}
            </div>
          ))}
        </div>
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} className="border-b border-white/[0.03]" style={{ height: ROW_H }} />
          ))}
          {dayAppts.map((a) => {
            const start = new Date(a.starts_at);
            const end = new Date(a.ends_at);
            const startH = start.getHours() + start.getMinutes() / 60;
            const endH = end.getHours() + end.getMinutes() / 60;
            const top = (startH - HOURS[0]) * ROW_H;
            const height = Math.max((endH - startH) * ROW_H, 28);
            const cls = STATUS_BG[a.status] ?? STATUS_BG.pending;
            const client = clients.find((c) => c.client_id === a.client_id);
            const time = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            const endTime = end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            const typeLabel = SESSION_TYPES.find((t) => t.value === a.session_type)?.label ?? a.session_type;

            return (
              <button
                key={a.id}
                type="button"
                onMouseEnter={(e) => onHover(a, e)} onMouseLeave={onLeave}
                className={`absolute inset-x-2 overflow-hidden rounded-lg border px-3 py-1.5 text-left transition-opacity hover:opacity-80 ${cls}`}
                style={{ top, height }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{time} – {endTime}</span>
                  <span className="text-[10px] opacity-70">{typeLabel}</span>
                </div>
                {height > 36 && (
                  <p className="text-[11px] font-semibold truncate mt-0.5">{a.title}</p>
                )}
                {height > 52 && client && (
                  <p className="text-[10px] opacity-70 truncate">{client.full_name ?? "—"}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TrainerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setTrainerId(user.id);

    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("trainer_id", user.id)
      .order("starts_at", { ascending: true });

    setAppointments((data as Appointment[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setTrainerId(user.id);

      // Load clients
      const { data: rels } = await supabase
        .from("trainer_clients")
        .select("client_id")
        .eq("trainer_id", user.id)
        .eq("status", "active");

      if (rels && rels.length > 0) {
        const ids = rels.map((r) => r.client_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ids);
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
    await supabase.from("appointments").update(update).eq("id", id);
    await fetchAppointments();
    setActionLoading(null);
    // TODO: sendAppointmentEmail cuando Resend esté configurado
  };

  const filtered = appointments.filter(
    (a) => filterStatus === "all" || a.status === filterStatus
  );

  const upcoming = filtered.filter(
    (a) => new Date(a.starts_at) >= new Date() && a.status !== "cancelled"
  );
  const past = filtered.filter(
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
          <h1 className="text-2xl font-black tracking-tight text-white">Citas</h1>
          <p className="mt-1 text-sm text-[#8B8BA3]">
            Gestiona las sesiones con tus clientes
          </p>
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

      {/* View toggle: Lista / Calendario */}
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

      {/* ── Calendar View ── */}
      {viewMode === "calendar" && (
        <CalendarView
          appointments={appointments}
          clients={clients}
          actionLoading={actionLoading}
          onConfirm={(id) => updateStatus(id, "confirmed")}
          onCancel={(id) => updateStatus(id, "cancelled")}
          onComplete={(id) => updateStatus(id, "completed")}
        />
      )}

      {/* ── List View ── */}
      {viewMode === "list" && <>

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
            onClick={() => setFilterStatus(s)}
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
                onConfirm={(id) => updateStatus(id, "confirmed")}
                onCancel={(id) => updateStatus(id, "cancelled")}
                onComplete={(id) => updateStatus(id, "completed")}
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
                onConfirm={(id) => updateStatus(id, "confirmed")}
                onCancel={(id) => updateStatus(id, "cancelled")}
                onComplete={(id) => updateStatus(id, "completed")}
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

      </>}

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

// ── Appointment card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  clients,
  isTrainer,
  actionLoading,
  onConfirm,
  onCancel,
  onComplete,
}: {
  appt: Appointment;
  clients: ClientOption[];
  isTrainer: boolean;
  actionLoading: string | null;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
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

        {/* Date block */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-[#00E5FF]">{formatDateTime(appt.starts_at)}</p>
          <p className="text-xs text-[#5A5A72]">{formatDuration(appt.starts_at, appt.ends_at)}</p>
        </div>
      </div>

      {/* Details row */}
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

      {/* Actions */}
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
