"use client";

import { type ParsedSheet, type DecisionMap } from "./types";
import type { InferredColumnType } from "@/lib/excel-parser";

interface Props {
  currentSheet: ParsedSheet;
  importId: string | null;
  columnMapping: Record<number, InferredColumnType>;
  decisions: DecisionMap;
  importing: boolean;
  onImport: () => void;
  onBack: () => void;
}

export function ReviewStep({
  currentSheet,
  importId,
  columnMapping,
  decisions,
  importing,
  onImport,
  onBack,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
        <h2 className="mb-4 text-lg font-bold text-white">
          Resumen de importación
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-white/[0.04] p-4 text-center">
            <p className="text-2xl font-black text-[#00E5FF]">
              {currentSheet.row_count}
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Filas
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-4 text-center">
            <p className="text-2xl font-black text-[#00C853]">
              {Object.values(decisions).filter((d) => d.action === "link").length}
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Enlazados
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-4 text-center">
            <p className="text-2xl font-black text-[#7C3AED]">
              {Object.values(decisions).filter((d) => d.action === "create").length}
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Nuevos
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(decisions).map(([name, dec]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-white/[0.03] px-4 py-2"
            >
              <span className="text-sm text-white">{name}</span>
              <span
                className={`text-xs font-bold ${
                  dec.action === "link"
                    ? "text-[#00C853]"
                    : dec.action === "create"
                      ? "text-[#7C3AED]"
                      : "text-[#FF1744]"
                }`}
              >
                {dec.action === "link"
                  ? "→ Enlazado"
                  : dec.action === "create"
                    ? "→ Crear privado"
                    : "→ Omitido"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-6 py-3 font-semibold text-white transition-colors hover:bg-white/[0.04]"
        >
          Volver
        </button>
        <button
          onClick={onImport}
          disabled={importing}
          className="rounded-xl bg-[#00E5FF] px-6 py-3 font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {importing ? "Importando..." : "Importar ejercicios"}
        </button>
      </div>
    </div>
  );
}
