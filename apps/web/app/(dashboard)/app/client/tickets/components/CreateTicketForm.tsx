"use client";

import { memo } from "react";
import type { TicketCategory } from "./types";
import { TICKET_CATEGORIES } from "./types";

interface CreateTicketFormProps {
  category: TicketCategory;
  subject: string;
  description: string;
  submitting: boolean;
  onSetCategory: (c: TicketCategory) => void;
  onSetSubject: (v: string) => void;
  onSetDescription: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const CATEGORY_ICONS: Record<TicketCategory, { icon: string; color: string; bgColor: string }> = {
  nutricion: { icon: "🥗", color: "text-[#00C853]", bgColor: "border-[#00C853]/20 hover:border-[#00C853]/40 hover:bg-[#00C853]/5" },
  rutina: { icon: "💪", color: "text-[#00E5FF]", bgColor: "border-[#00E5FF]/20 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5" },
  lesion: { icon: "🩹", color: "text-[#FF1744]", bgColor: "border-[#FF1744]/20 hover:border-[#FF1744]/40 hover:bg-[#FF1744]/5" },
  general: { icon: "❓", color: "text-[#7C3AED]", bgColor: "border-[#7C3AED]/20 hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5" },
};

const SELECTED_STYLES: Record<TicketCategory, string> = {
  nutricion: "border-[#00C853]/60 bg-[#00C853]/10",
  rutina: "border-[#00E5FF]/60 bg-[#00E5FF]/10",
  lesion: "border-[#FF1744]/60 bg-[#FF1744]/10",
  general: "border-[#7C3AED]/60 bg-[#7C3AED]/10",
};

export const CreateTicketForm = memo(function CreateTicketForm({
  category,
  subject,
  description,
  submitting,
  onSetCategory,
  onSetSubject,
  onSetDescription,
  onSubmit,
  onCancel,
}: CreateTicketFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Nueva consulta</h2>
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-[#5A5A72] transition-colors hover:text-white"
        >
          Cancelar
        </button>
      </div>

      {/* Category picker */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Categoría
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TICKET_CATEGORIES.map((c) => {
            const icon = CATEGORY_ICONS[c.value];
            const selected = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => onSetCategory(c.value)}
                className={`rounded-xl border p-4 text-center transition-all ${
                  selected ? SELECTED_STYLES[c.value] : `border-white/[0.06] bg-[#12121A] ${icon.bgColor}`
                }`}
              >
                <span className="text-2xl">{icon.icon}</span>
                <p className={`mt-2 text-sm font-semibold ${selected ? icon.color : "text-[#8B8BA3]"}`}>
                  {c.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Asunto
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSetSubject(e.target.value)}
          placeholder="¿Sobre qué es tu consulta?"
          maxLength={200}
          className="w-full rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => onSetDescription(e.target.value)}
          placeholder="Describe tu duda o problema con el mayor detalle posible..."
          rows={6}
          className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
        />
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={submitting || !subject.trim() || !description.trim()}
        className="w-full rounded-xl bg-[#00E5FF] py-3 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80 disabled:opacity-40"
      >
        {submitting ? "Enviando..." : "Enviar consulta al coach"}
      </button>
    </div>
  );
});
