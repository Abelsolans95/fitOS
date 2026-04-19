"use client";

import React from "react";
import { StatusBadge } from "./shared";
import { SignatureCanvas } from "./SignatureCanvas";
import type { Contract, ContractStatus } from "./types";

interface ContractViewProps {
  contract: Contract;
  showSignature: boolean;
  signing: boolean;
  onSign: (dataUrl: string) => void;
  onShowSignature: () => void;
  onCancelSignature: () => void;
  onBack: () => void;
}

export const ContractView = React.memo(function ContractView({
  contract,
  showSignature,
  signing,
  onSign,
  onShowSignature,
  onCancelSignature,
  onBack,
}: ContractViewProps) {
  const canSign = contract.status === "sent" || contract.status === "viewed";
  const isSigned = contract.status === "signed";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-white">{contract.title}</h2>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={contract.status as ContractStatus} />
            {contract.signed_at && (
              <span className="text-xs text-[#5A5A72]">
                Firmado {new Date(contract.signed_at).toLocaleDateString("es-ES")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#0A0A0F] p-6">
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-[#E8E8ED]">
          {contract.content}
        </div>

        {/* Signed signature display */}
        {isSigned && contract.signature_data && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-medium text-[#00C853]">
              <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Contrato firmado
            </p>
            <div className="inline-block rounded-xl border border-white/10 bg-white/[0.02] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contract.signature_data}
                alt="Tu firma"
                className="h-20 w-auto"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions / Signature */}
      <div className="mt-4">
        {canSign && !showSignature && (
          <button
            onClick={onShowSignature}
            className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80"
          >
            Firmar contrato
          </button>
        )}
        {canSign && showSignature && (
          <SignatureCanvas
            onSign={onSign}
            onCancel={onCancelSignature}
            signing={signing}
          />
        )}
      </div>
    </div>
  );
});
