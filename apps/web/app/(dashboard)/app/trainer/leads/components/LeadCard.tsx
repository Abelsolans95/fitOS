"use client";

import React from "react";
import type { Lead } from "./types";
import { SOURCE_LABELS } from "./types";

interface LeadCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}

function LeadCardInner({ lead, onSelect, onDragStart }: LeadCardProps) {
  const dateStr = new Date(lead.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onSelect(lead)}
      className="cursor-pointer rounded-xl border border-white/10 bg-[#0A0A0F] p-3 transition-all hover:border-white/[0.12] hover:bg-[#0E0E18] active:scale-[0.98]"
    >
      <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
      <p className="mt-0.5 text-xs text-[#8B8BA3] truncate">{lead.email}</p>

      <div className="mt-2 flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-[#8B8BA3]">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>
        <span className="text-[10px] text-[#5A5A72]">{dateStr}</span>
      </div>
    </div>
  );
}

export const LeadCard = React.memo(LeadCardInner);
