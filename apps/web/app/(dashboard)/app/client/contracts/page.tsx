"use client";

import { Suspense } from "react";
import { useClientContractsPage } from "./useClientContractsPage";
import { ContractView } from "./components/ContractView";
import { StatusBadge, timeAgo } from "./components/shared";

function ContractsPageInner() {
  const {
    state,
    dispatch,
    selectedContract,
    pendingCount,
    handleSelectContract,
    handleSign,
  } = useClientContractsPage();

  if (state.loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-white">Contratos</h1>
        <p className="mt-1 text-sm text-[#5A5A72]">
          {pendingCount > 0
            ? `Tienes ${pendingCount} contrato${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""} de firma`
            : "Revisa y firma los contratos de tu entrenador"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0F] p-4">
        {state.activeView === "detail" && selectedContract ? (
          <ContractView
            contract={selectedContract}
            showSignature={state.showSignature}
            signing={state.signing}
            onSign={handleSign}
            onShowSignature={() => dispatch({ type: "SHOW_SIGNATURE", payload: true })}
            onCancelSignature={() => dispatch({ type: "SHOW_SIGNATURE", payload: false })}
            onBack={() => handleSelectContract(null)}
          />
        ) : (
          <div className="space-y-3">
            {state.contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="mb-4 h-12 w-12 text-[#5A5A72]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="text-sm text-[#5A5A72]">
                  No tienes contratos pendientes
                </p>
              </div>
            ) : (
              state.contracts.map((contract) => {
                const isPending = contract.status === "sent" || contract.status === "viewed";
                return (
                  <button
                    key={contract.id}
                    onClick={() => handleSelectContract(contract.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all hover:border-white/10 ${
                      isPending
                        ? "border-[#00E5FF]/20 bg-[#00E5FF]/[0.02]"
                        : "border-white/10 bg-[#12121A]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-white">
                            {contract.title}
                          </span>
                          {isPending && (
                            <span className="flex h-2 w-2 rounded-full bg-[#00E5FF] shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-[#8B8BA3]">
                          {contract.content.slice(0, 120)}
                          {contract.content.length > 120 ? "..." : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={contract.status} />
                        <span className="text-[10px] text-[#5A5A72]">{timeAgo(contract.created_at)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      }
    >
      <ContractsPageInner />
    </Suspense>
  );
}
