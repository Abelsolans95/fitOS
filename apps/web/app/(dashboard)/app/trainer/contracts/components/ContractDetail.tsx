"use client";

import React from "react";
import { StatusBadge } from "./shared";
import type { Contract, ContractStatus } from "./types";

interface ContractDetailProps {
  contract: Contract;
  confirmDeleteId: string | null;
  onSend: (id: string) => void;
  onExpire: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string | null) => void;
  onBack: () => void;
}

export const ContractDetail = React.memo(function ContractDetail({
  contract,
  confirmDeleteId,
  onSend,
  onExpire,
  onDelete,
  onConfirmDelete,
  onBack,
}: ContractDetailProps) {
  const canSend = contract.status === "draft";
  const canExpire = contract.status === "sent" || contract.status === "viewed";
  const canDelete = contract.status === "draft";
  const isSigned = contract.status === "signed";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:bg-white/[0.04] hover:text-white lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-white">{contract.title}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-[#8B8BA3]">{contract.client_name ?? "Cliente"}</span>
            <StatusBadge status={contract.status as ContractStatus} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#0A0A0F] p-6">
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-[#E8E8ED]">
          {contract.content}
        </div>

        {/* Signature display */}
        {isSigned && contract.signature_data && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-medium text-[#8B8BA3]">Firma del cliente</p>
            <div className="inline-block rounded-xl border border-white/10 bg-white/[0.02] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contract.signature_data}
                alt="Firma del cliente"
                className="h-24 w-auto"
              />
            </div>
            {contract.signed_at && (
              <p className="mt-2 text-[11px] text-[#5A5A72]">
                Firmado el {new Date(contract.signed_at).toLocaleString("es-ES")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canSend && (
          <button
            onClick={() => onSend(contract.id)}
            className="rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80"
          >
            Enviar al cliente
          </button>
        )}
        {canExpire && (
          <button
            onClick={() => onExpire(contract.id)}
            className="rounded-xl border border-[#FF9100]/30 px-4 py-2.5 text-sm font-medium text-[#FF9100] transition-all hover:bg-[#FF9100]/10"
          >
            Expirar
          </button>
        )}
        {canDelete && (
          <>
            {confirmDeleteId === contract.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#FF1744]">Confirmar eliminacion?</span>
                <button
                  onClick={() => onDelete(contract.id)}
                  className="rounded-lg bg-[#FF1744]/10 px-3 py-1.5 text-xs font-semibold text-[#FF1744] transition-all hover:bg-[#FF1744]/20"
                >
                  Si, eliminar
                </button>
                <button
                  onClick={() => onConfirmDelete(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-[#5A5A72] transition-colors hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => onConfirmDelete(contract.id)}
                className="rounded-xl border border-[#FF1744]/30 px-4 py-2.5 text-sm font-medium text-[#FF1744] transition-all hover:bg-[#FF1744]/10"
              >
                Eliminar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});
