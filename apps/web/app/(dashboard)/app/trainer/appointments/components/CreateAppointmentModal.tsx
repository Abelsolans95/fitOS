"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import type { ClientOption } from "./types";
import { SESSION_TYPES } from "./shared";

interface CreateModalProps {
  clients: ClientOption[];
  onClose: () => void;
  onCreated: () => void;
  trainerId: string;
}

export function CreateAppointmentModal({ clients, onClose, onCreated, trainerId }: CreateModalProps) {
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
      status: "confirmed",
      notes: form.notes || null,
      location: form.location || null,
      meeting_url: form.meeting_url || null,
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

          {/* Ubicación / URL */}
          {form.session_type === "presencial" || form.session_type === "evaluacion" ? (
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Lugar</label>
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
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Enlace de videoconferencia</label>
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
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Notas (opcional)</label>
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
              {saving ? "Guardando…" : "Crear cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
