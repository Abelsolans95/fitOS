"use client";

import { useState, useRef } from "react";
import type { Appointment, ClientOption } from "./types";
import { SESSION_TYPES, STATUS_STYLES, STATUS_BG, formatDateTime, formatDuration } from "./shared";

// ── Calendar helpers ─────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00-21:00
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

// ── Appointment Popover ──────────────────────────────────────────────────────

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

// ── Appointment Pill ─────────────────────────────────────────────────────────

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

// ── Month Grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  days, calDate, today, appointments, clients, onHover, onLeave, onDayClick,
}: {
  days: Date[]; calDate: Date; today: Date; appointments: Appointment[]; clients: ClientOption[];
  onHover: (a: Appointment, e: React.MouseEvent) => void; onLeave: () => void;
  onDayClick: (d: Date) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#12121A]/60 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/[0.04]">
        {DAY_NAMES.map((d) => (
          <div key={d} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            {d}
          </div>
        ))}
      </div>
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

// ── Week Grid ────────────────────────────────────────────────────────────────

function WeekGrid({
  days, today, appointments, clients, onHover, onLeave,
}: {
  days: Date[]; today: Date; appointments: Appointment[]; clients: ClientOption[];
  onHover: (a: Appointment, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const ROW_H = 48;

  return (
    <div className="overflow-auto rounded-2xl border border-white/[0.06] bg-[#12121A]/60">
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
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        <div className="border-r border-white/[0.04]">
          {HOURS.map((h) => (
            <div key={h} className="flex items-start justify-end pr-2 text-[10px] font-semibold text-[#5A5A72]"
              style={{ height: ROW_H }}>
              {fmtHour(h)}
            </div>
          ))}
        </div>
        {days.map((day, di) => {
          const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={di} className={`relative border-r border-white/[0.04] ${isToday ? "bg-[#00E5FF]/[0.02]" : ""}`}>
              {HOURS.map((h) => (
                <div key={h} className="border-b border-white/[0.03]" style={{ height: ROW_H }} />
              ))}
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

// ── Day Grid ─────────────────────────────────────────────────────────────────

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
      <div className={`border-b border-white/[0.06] px-4 py-3 ${isToday ? "bg-[#00E5FF]/5" : ""}`}>
        <p className={`text-sm font-bold capitalize ${isToday ? "text-[#00E5FF]" : "text-white"}`}>
          {fmtDayFull(date)}
          {isToday && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#00E5FF]/60">Hoy</span>}
        </p>
        <p className="text-[11px] text-[#5A5A72]">{dayAppts.length} cita{dayAppts.length !== 1 ? "s" : ""}</p>
      </div>
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

// ── Calendar View (exported) ─────────────────────────────────────────────────

type CalMode = "month" | "week" | "day";

export function AppointmentCalendar({
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
