"use client";

import React, { useState } from "react";
import type { Lead, LeadColumn } from "./types";
import { LeadCard } from "./LeadCard";

interface KanbanColumnProps {
  column: LeadColumn;
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onDrop: (leadId: string, newStatus: Lead["status"]) => void;
}

function KanbanColumnInner({ column, leads, onSelect, onDragStart, onDrop }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      onDrop(leadId, column.status);
    }
  };

  return (
    <div
      className={`flex h-full min-w-[260px] flex-col rounded-2xl border bg-[#12121A] transition-colors ${
        dragOver ? "border-white/[0.15] bg-[#16162A]" : "border-white/[0.06]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-3">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B8BA3]">
          {column.label}
        </span>
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-md bg-white/[0.06] px-1.5 text-[10px] font-bold text-[#5A5A72]">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onSelect={onSelect}
            onDragStart={onDragStart}
          />
        ))}
        {leads.length === 0 && (
          <div className="flex h-20 items-center justify-center">
            <p className="text-xs text-[#5A5A72]">Sin leads</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const KanbanColumn = React.memo(KanbanColumnInner);
