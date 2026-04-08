"use client";

import React from "react";
import { DarkSelect } from "@/components/ui/DarkSelect";
import type { ClientOption, ContractTemplate } from "./types";

interface CreateContractFormProps {
  clients: ClientOption[];
  templates: ContractTemplate[];
  clientId: string;
  title: string;
  content: string;
  templateId: string;
  submitting: boolean;
  onSetClientId: (v: string) => void;
  onSetTitle: (v: string) => void;
  onSetContent: (v: string) => void;
  onApplyTemplate: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const CreateContractForm = React.memo(function CreateContractForm({
  clients,
  templates,
  clientId,
  title,
  content,
  submitting,
  onSetClientId,
  onSetTitle,
  onSetContent,
  onApplyTemplate,
  onSubmit,
  onCancel,
}: CreateContractFormProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-white">Nuevo contrato</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Template selector */}
        {templates.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">
              Plantilla (opcional)
            </label>
            <DarkSelect
              value=""
              onChange={(v) => { if (v) onApplyTemplate(v); }}
              options={templates.map((t) => ({ value: t.id, label: t.title }))}
              placeholder="Usar plantilla..."
            />
          </div>
        )}

        {/* Client selector */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">
            Cliente <span className="text-[#FF1744]">*</span>
          </label>
          <DarkSelect
            value={clientId}
            onChange={onSetClientId}
            options={clients}
            placeholder="Seleccionar cliente..."
          />
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">
            Titulo <span className="text-[#FF1744]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onSetTitle(e.target.value)}
            placeholder="Ej: Contrato de servicios de entrenamiento"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors placeholder:text-[#5A5A72] focus:border-[#00E5FF]/40"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-[#8B8BA3]">
            Contenido <span className="text-[#FF1744]">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => onSetContent(e.target.value)}
            placeholder="Escribe el contenido del contrato..."
            rows={16}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-[13px] text-white outline-none transition-colors placeholder:text-[#5A5A72] focus:border-[#00E5FF]/40"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={submitting || !clientId || !title.trim() || !content.trim()}
          className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80 disabled:opacity-40"
        >
          {submitting ? "Creando..." : "Crear borrador"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm text-[#5A5A72] transition-colors hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
});
