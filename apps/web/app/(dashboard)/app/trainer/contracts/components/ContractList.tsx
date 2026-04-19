"use client";

import React from "react";
import { CONTRACT_STATUSES } from "@kuvox/shared";
import { StatusBadge, timeAgo } from "./shared";
import type { Contract, ContractTab } from "./types";

interface ContractListProps {
  contracts: Contract[];
  selectedId: string | null;
  activeTab: ContractTab;
  onSelectContract: (id: string) => void;
  onSetTab: (tab: ContractTab) => void;
}

const TABS: { value: ContractTab; label: string }[] = [
  { value: "all", label: "Todos" },
  ...CONTRACT_STATUSES,
];

export const ContractList = React.memo(function ContractList({
  contracts,
  selectedId,
  activeTab,
  onSelectContract,
  onSetTab,
}: ContractListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onSetTab(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                : "text-[#5A5A72] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {contracts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#5A5A72]">
            No hay contratos en esta categoria
          </p>
        ) : (
          contracts.map((contract) => (
            <button
              key={contract.id}
              onClick={() => onSelectContract(contract.id)}
              className={`w-full rounded-xl border p-4 text-left transition-all hover:border-white/10 ${
                selectedId === contract.id
                  ? "border-[#00E5FF]/30 bg-[#00E5FF]/[0.03]"
                  : "border-white/[0.06] bg-[#12121A]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{contract.title}</p>
                  <p className="mt-0.5 text-xs text-[#8B8BA3]">
                    {contract.client_name ?? "Cliente"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={contract.status} />
                  <span className="text-[10px] text-[#5A5A72]">{timeAgo(contract.created_at)}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
});
