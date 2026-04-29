"use client";

import { DarkSelect } from "@/components/ui/DarkSelect";
import type { InferredColumnType } from "@/lib/excel-parser";
import { type ParsedSheet, COLUMN_TYPE_LABELS, ALL_COLUMN_TYPES } from "./types";

interface Props {
  sheets: ParsedSheet[];
  activeSheet: number;
  fileName: string;
  columnMapping: Record<number, InferredColumnType>;
  onSheetChange: (i: number) => void;
  onColumnTypeChange: (colIndex: number, type: InferredColumnType) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

export function MappingStep({
  sheets,
  activeSheet,
  fileName,
  columnMapping,
  onSheetChange,
  onColumnTypeChange,
  onConfirm,
  onBack,
  loading,
}: Props) {
  const currentSheet = sheets[activeSheet];
  if (!currentSheet) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Mapeo de columnas</h2>
            <p className="text-sm text-[#8B8BA3]">
              {fileName} — {currentSheet.row_count} filas
            </p>
          </div>
          {sheets.length > 1 && (
            <DarkSelect
              value={String(activeSheet)}
              onChange={(val) => onSheetChange(parseInt(val))}
              options={sheets.map((s, i) => ({ value: String(i), label: s.name }))}
            />
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Columna
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Tipo detectado
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Confianza
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Ejemplos
                </th>
              </tr>
            </thead>
            <tbody>
              {currentSheet.columns.map((col) => (
                <tr key={col.index} className="border-b border-white/[0.03]">
                  <td className="px-3 py-3 font-medium text-white">
                    {col.header || `Col ${col.index + 1}`}
                  </td>
                  <td className="px-3 py-3">
                    <DarkSelect
                      value={columnMapping[col.index] || "unknown"}
                      onChange={(val) =>
                        onColumnTypeChange(col.index, val as InferredColumnType)
                      }
                      options={ALL_COLUMN_TYPES.map((type) => ({
                        value: type,
                        label: COLUMN_TYPE_LABELS[type],
                      }))}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full ${
                            col.confidence >= 0.9
                              ? "bg-[#00C853]"
                              : col.confidence >= 0.7
                                ? "bg-[#FF9100]"
                                : "bg-[#FF1744]"
                          }`}
                          style={{ width: `${col.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#8B8BA3]">
                        {Math.round(col.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[#8B8BA3]">
                    <div className="flex flex-wrap gap-1">
                      {col.sample_values
                        .filter((v) => v !== null)
                        .slice(0, 3)
                        .map((v, i) => (
                          <span
                            key={i}
                            className="rounded bg-white/[0.04] px-2 py-0.5 text-xs"
                          >
                            {String(v).slice(0, 20)}
                          </span>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Data preview */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Vista previa (5 primeras filas)
          </p>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.04]">
                  {currentSheet.columns.map((col) => (
                    <th
                      key={col.index}
                      className="px-3 py-2 text-left font-medium text-[#8B8BA3]"
                    >
                      {col.header || `Col ${col.index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentSheet.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-white/[0.03]">
                    {currentSheet.columns.map((col) => (
                      <td
                        key={col.index}
                        className="px-3 py-1.5 text-white/70"
                      >
                        {String(
                          row[col.header || `col_${col.index}`] ?? ""
                        ).slice(0, 25)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          {loading ? "Buscando coincidencias..." : "Confirmar y reconciliar"}
        </button>
      </div>
    </div>
  );
}
