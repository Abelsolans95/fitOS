"use client";

import { ExerciseFormData } from "./types";
import { XIcon } from "./Icons";

export function ExerciseFormModal({
  isOpen,
  title,
  form,
  saving,
  onChange,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  form: ExerciseFormData;
  saving: boolean;
  onChange: (patch: Partial<ExerciseFormData>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[18px] border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">
              Ejercicio
            </p>
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white border border-white/[0.08]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Nombre <span className="text-[#FF1744]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Ej: Press de banca"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Descripcion
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe el ejercicio, tecnica, consejos..."
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Categoría
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => onChange({ category: e.target.value })}
              placeholder="Ej: Pecho, Espalda, Pierna, Bíceps..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
            />
            <p className="mt-1 text-[11px] text-[#5A5A72]">
              Texto libre — usa lo que tenga sentido para ti
            </p>
          </div>

          {/* Primary muscles */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Músculos principales
            </label>
            <input
              type="text"
              value={form.primary_muscles}
              onChange={(e) => onChange({ primary_muscles: e.target.value })}
              placeholder="Ej: Pectoral mayor, Deltoides anterior"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
            />
            <p className="mt-1 text-[11px] text-[#5A5A72]">Separados por comas (opcional)</p>
          </div>

          {/* Secondary muscles */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              Músculos secundarios
            </label>
            <input
              type="text"
              value={form.secondary_muscles}
              onChange={(e) => onChange({ secondary_muscles: e.target.value })}
              placeholder="Ej: Tríceps, Serrato anterior"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
            />
            <p className="mt-1 text-[11px] text-[#5A5A72]">Separados por comas (opcional)</p>
          </div>

          {/* Video URL */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
              URL de video
            </label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => onChange({ video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
            />
            <p className="mt-1 text-[11px] text-[#5A5A72]">
              YouTube o Vimeo (opcional)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="border border-white/[0.1] text-[#8B8BA3] rounded-xl px-4 py-2 text-[13px] hover:border-white/[0.18] hover:text-white transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !form.name.trim()}
            className="bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                Guardando...
              </span>
            ) : (
              "Guardar ejercicio"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
