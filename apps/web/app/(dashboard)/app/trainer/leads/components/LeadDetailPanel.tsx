"use client";

import React from "react";
import type { Lead, LeadStatus, LeadSource } from "./types";
import { COLUMNS, SOURCE_LABELS } from "./types";

interface LeadDetailPanelProps {
  lead: Lead;
  saving: boolean;
  onClose: () => void;
  onUpdateStatus: (status: LeadStatus) => void;
  onUpdateNotes: (notes: string) => void;
  onDelete: () => void;
}

export function LeadDetailPanel({
  lead,
  saving,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
}: LeadDetailPanelProps) {
  const dateStr = new Date(lead.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const currentCol = COLUMNS.find((c) => c.status === lead.status);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0E0E18] p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{lead.name}</h2>
            <p className="mt-0.5 text-sm text-[#8B8BA3]">{lead.email}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
              Estado
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLUMNS.map((col) => (
                <button
                  key={col.status}
                  onClick={() => onUpdateStatus(col.status)}
                  disabled={saving}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    lead.status === col.status
                      ? "ring-1"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: `${col.color}15`,
                    color: col.color,
                    ...(lead.status === col.status ? { ringColor: col.color } : {}),
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {lead.phone && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Telefono</p>
                <p className="mt-1 text-sm text-white">{lead.phone}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Origen</p>
              <p className="mt-1 text-sm text-white">{SOURCE_LABELS[lead.source] ?? lead.source}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Fecha</p>
              <p className="mt-1 text-sm text-white">{dateStr}</p>
            </div>
            {lead.goal && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Objetivo</p>
                <p className="mt-1 text-sm text-white">{lead.goal}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
              Notas
            </label>
            <textarea
              value={lead.notes ?? ""}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Anade notas sobre este lead..."
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-white/20"
            />
          </div>

          {/* Delete */}
          <div className="border-t border-white/10 pt-5">
            <button
              onClick={onDelete}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-2.5 text-sm font-semibold text-[#FF1744] transition-colors hover:bg-[#FF1744]/10 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Eliminar lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
