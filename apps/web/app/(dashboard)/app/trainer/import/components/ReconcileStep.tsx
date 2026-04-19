"use client";

import { type ReconciliationResult, type DecisionMap } from "./types";

interface Props {
  reconciliation: ReconciliationResult[];
  decisions: DecisionMap;
  onDecision: (name: string, decision: DecisionMap[string]) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

export function ReconcileStep({
  reconciliation,
  decisions,
  onDecision,
  onConfirm,
  onBack,
  loading,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-6">
        <h2 className="mb-4 text-lg font-bold text-white">
          Reconciliación de ejercicios
        </h2>
        <p className="mb-6 text-sm text-[#8B8BA3]">
          Revisa las coincidencias encontradas. Los ejercicios con alta
          similitud se enlazan automáticamente.
        </p>

        <div className="space-y-3">
          {reconciliation.map((r) => (
            <div
              key={r.original_name}
              className={`rounded-xl border p-4 ${
                r.status === "auto_matched"
                  ? "border-[#00C853]/20 bg-[#00C853]/[0.03]"
                  : r.status === "review"
                    ? "border-[#FF9100]/20 bg-[#FF9100]/[0.03]"
                    : "border-[#FF1744]/20 bg-[#FF1744]/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {r.original_name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        r.confidence === 1
                          ? "bg-[#00C853]/20 text-[#00C853]"
                          : r.status === "auto_matched"
                            ? "bg-[#00C853]/20 text-[#00C853]"
                            : r.status === "review"
                              ? "bg-[#FF9100]/20 text-[#FF9100]"
                              : "bg-[#FF1744]/20 text-[#FF1744]"
                      }`}
                    >
                      {r.confidence === 1
                        ? "Match 100%"
                        : r.status === "auto_matched"
                          ? `Match ${Math.round(r.confidence * 100)}%`
                          : r.status === "review"
                            ? "Revisar"
                            : "Sin match"}
                    </span>
                    {r.confidence === 1 && r.best_match && (
                      <span className="text-xs text-[#8B8BA3]">
                        → {r.best_match.name}
                      </span>
                    )}
                  </div>

                  {/* Only show match options if NOT 100% */}
                  {r.confidence < 1 && r.matches.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.matches.map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            onDecision(r.original_name, {
                              action: "link",
                              matched_id: m.id,
                            })
                          }
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            decisions[r.original_name]?.matched_id === m.id
                              ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]"
                              : "border-white/10 text-[#8B8BA3] hover:border-white/[0.12]"
                          }`}
                        >
                          {m.name}
                          <span className="ml-1 text-xs opacity-60">
                            {Math.round(m.similarity * 100)}%
                          </span>
                          {m.is_global && (
                            <span className="ml-1 text-xs text-[#7C3AED]">
                              Global
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Only show Crear nuevo / Omitir if NOT 100% */}
                {r.confidence < 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onDecision(r.original_name, {
                          action: "create",
                          custom_name: r.original_name,
                        })
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        decisions[r.original_name]?.action === "create"
                          ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]"
                          : "border-white/10 text-[#8B8BA3] hover:border-white/[0.12]"
                      }`}
                    >
                      Crear nuevo
                    </button>
                    <button
                      onClick={() =>
                        onDecision(r.original_name, { action: "skip" })
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        decisions[r.original_name]?.action === "skip"
                          ? "border-[#FF1744] bg-[#FF1744]/10 text-[#FF1744]"
                          : "border-white/10 text-[#8B8BA3] hover:border-white/[0.12]"
                      }`}
                    >
                      Omitir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl px-6 py-3 font-semibold text-white transition-colors hover:bg-white/[0.04]"
        >
          Volver
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-xl bg-[#00E5FF] px-6 py-3 font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Confirmar y revisar
        </button>
      </div>
    </div>
  );
}
