"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DarkSelect } from "@/components/ui/DarkSelect";
import { createClient } from "@/lib/supabase";

const SESSION_TYPES = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "telefonica", label: "Telefónica" },
  { value: "evaluacion", label: "Evaluación inicial" },
  { value: "seguimiento", label: "Seguimiento" },
];

interface BookAppointmentModalProps {
  trainerId: string;
  clientId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function BookAppointmentModal({ trainerId, clientId, onClose, onCreated }: BookAppointmentModalProps) {
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
    const ends_at = new Date(new Date(starts_at).getTime() + parseInt(form.duration) * 60000).toISOString();

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
      toast.error("Error al solicitar la cita. Inténtalo de nuevo.");
      console.error("[BookAppointmentModal] Error creando cita:", insertErr);
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
          <p className="mt-1 text-sm text-[#8B8BA3]">Tu entrenador recibirá la solicitud y la confirmará.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 scrollbar-thin">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Motivo / Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Revisión de técnica, Sesión de piernas…"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Tipo de sesión *</label>
              <DarkSelect value={form.session_type} onChange={(v) => setForm((f) => ({ ...f, session_type: v }))} options={SESSION_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Duración estimada</label>
              <DarkSelect value={form.duration} onChange={(v) => setForm((f) => ({ ...f, duration: v }))} options={[30, 45, 60, 75, 90, 120].map((d) => ({ value: String(d), label: `${d} min` }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Fecha preferida *</label>
              <input type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40 [color-scheme:dark]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Hora preferida *</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/40 [color-scheme:dark]" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Mensaje para tu entrenador (opcional)</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Cuéntale qué quieres trabajar o cualquier duda…" className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40" />
          </div>

          {error && <p className="text-xs text-[#FF1744]">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-[#8B8BA3] transition-colors hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#00E5FF] py-2.5 text-sm font-bold text-[#0A0A0F] transition-opacity disabled:opacity-50">
              {saving ? "Enviando…" : "Solicitar cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
