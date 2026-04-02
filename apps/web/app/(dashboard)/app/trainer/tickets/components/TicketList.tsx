"use client";

import { memo } from "react";
import type { SupportTicket, TicketCategory, TicketTab } from "./types";
import { TICKET_CATEGORIES } from "./types";
import { CategoryBadge, StatusBadge, EmptyState, timeAgo } from "./shared";

interface TicketListProps {
  tickets: SupportTicket[];
  selectedTicketId: string | null;
  activeTab: TicketTab;
  filterCategory: TicketCategory | "all";
  searchQuery: string;
  onSelectTicket: (id: string) => void;
  onSetTab: (tab: TicketTab) => void;
  onSetCategory: (cat: TicketCategory | "all") => void;
  onSetSearch: (q: string) => void;
}

const TABS: { key: TicketTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "open", label: "Abiertas" },
  { key: "in_progress", label: "En progreso" },
  { key: "resolved", label: "Resueltas" },
];

export const TicketList = memo(function TicketList({
  tickets,
  selectedTicketId,
  activeTab,
  filterCategory,
  searchQuery,
  onSelectTicket,
  onSetTab,
  onSetCategory,
  onSetSearch,
}: TicketListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-[#12121A] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onSetTab(tab.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                : "text-[#5A5A72] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSetSearch(e.target.value)}
          placeholder="Buscar consultas..."
          className="flex-1 rounded-lg border border-white/[0.06] bg-[#12121A] px-3 py-2 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
        />
        <select
          value={filterCategory}
          onChange={(e) => onSetCategory(e.target.value as TicketCategory | "all")}
          className="rounded-lg border border-white/[0.06] bg-[#12121A] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">Categoría</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
        {tickets.length === 0 ? (
          <EmptyState message="No hay consultas que coincidan" />
        ) : (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                selectedTicketId === ticket.id
                  ? "border-[#00E5FF]/30 bg-[#00E5FF]/5"
                  : (ticket.unread_count ?? 0) > 0
                    ? "border-[#00E5FF]/20 bg-[#12121A] hover:border-[#00E5FF]/30 shadow-[inset_3px_0_0_0_#00E5FF]"
                    : "border-white/[0.06] bg-[#12121A] hover:border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {ticket.subject}
                    </span>
                    {(ticket.unread_count ?? 0) > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00E5FF] px-1.5 text-[10px] font-bold text-[#0A0A0F] shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                        {ticket.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#5A5A72]">
                    {ticket.client_name} · {timeAgo(ticket.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CategoryBadge category={ticket.category} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-[#8B8BA3]">
                {ticket.description}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
});
