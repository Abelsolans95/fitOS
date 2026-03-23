"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { InferredColumnType } from "@/lib/excel-parser";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface DetectedColumn {
  index: number;
  header: string | null;
  inferred_type: InferredColumnType;
  confidence: number;
  sample_values: (string | number | null)[];
  reasoning: string;
}

interface ParsedSheet {
  name: string;
  columns: DetectedColumn[];
  rows: Record<string, any>[];
  row_count: number;
}

interface ReconciliationMatch {
  id: string;
  name: string;
  is_global: boolean;
  similarity: number;
}

interface ReconciliationResult {
  original_name: string;
  matches: ReconciliationMatch[];
  best_match: { id: string; name: string; similarity: number } | null;
  confidence: number;
  status: "auto_matched" | "review" | "no_match";
}

type Step = "upload" | "mapping" | "reconcile" | "review";

const COLUMN_TYPE_LABELS: Record<InferredColumnType, string> = {
  exercise_name: "Nombre del ejercicio",
  sets: "Series",
  reps: "Repeticiones",
  weight_kg: "Peso (kg)",
  rir: "RIR",
  rpe: "RPE",
  rest_seconds: "Descanso (seg)",
  day_label: "Día / Sesión",
  week_number: "Semana",
  notes: "Notas",
  scheme: "Esquema (3x8-10)",
  coach_notes: "Notas del coach",
  video_url: "Vídeo",
  date: "Fecha",
  series_weight: "Peso serie",
  series_reps: "Reps serie",
  previous_data: "Datos anteriores",
  exercise_category: "Categoría (texto libre)",
  unknown: "No usar",
};

const ALL_COLUMN_TYPES: InferredColumnType[] = [
  "exercise_name",
  "scheme",
  "sets",
  "reps",
  "weight_kg",
  "series_weight",
  "series_reps",
  "rir",
  "rpe",
  "rest_seconds",
  "day_label",
  "week_number",
  "date",
  "notes",
  "coach_notes",
  "video_url",
  "previous_data",
  "exercise_category",
  "unknown",
];

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importId, setImportId] = useState<string | null>(null);
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [columnMapping, setColumnMapping] = useState<
    Record<number, InferredColumnType>
  >({});
  const [reconciliation, setReconciliation] = useState<ReconciliationResult[]>(
    []
  );
  const [decisions, setDecisions] = useState<
    Record<
      string,
      { action: "link" | "create" | "skip"; matched_id?: string; custom_name?: string }
    >
  >({});
  const [importing, setImporting] = useState(false);

  // ── Upload ──

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setFileName(file.name);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/import/excel", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setImportId(data.import_id);
        setSheets(data.sheets);

        // Initialize mapping from inferred types
        const initialMapping: Record<number, InferredColumnType> = {};
        if (data.sheets[0]) {
          for (const col of data.sheets[0].columns) {
            initialMapping[col.index] = col.inferred_type;
          }
        }
        setColumnMapping(initialMapping);

        toast.success(`Archivo procesado: ${data.sheets[0]?.row_count || 0} filas`);

        if (data.needs_review) {
          setStep("mapping");
        } else {
          setStep("mapping"); // Always show mapping for confirmation
        }
      } catch (err: any) {
        toast.error(err.message || "Error procesando archivo");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Mapping confirmed → Reconcile ──

  const handleMappingConfirmed = useCallback(async () => {
    const sheet = sheets[activeSheet];
    if (!sheet || !importId) return;

    // Extract exercise names from mapped data
    const nameColIndex = Object.entries(columnMapping).find(
      ([, type]) => type === "exercise_name"
    )?.[0];

    if (nameColIndex === undefined) {
      toast.error("Debes asignar una columna como 'Nombre del ejercicio'");
      return;
    }

    const nameHeader =
      sheet.columns[parseInt(nameColIndex)]?.header ||
      `col_${nameColIndex}`;
    const exerciseNames = [
      ...new Set(
        sheet.rows
          .map((row) => row[nameHeader])
          .filter((v): v is string => typeof v === "string" && v.trim() !== "")
          .map((v) => v.trim())
      ),
    ];

    if (exerciseNames.length === 0) {
      toast.error("No se encontraron nombres de ejercicios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/import/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ import_id: importId, exercise_names: exerciseNames }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReconciliation(data.reconciliation);

      // Auto-set decisions for high-confidence matches
      const autoDec: typeof decisions = {};
      for (const r of data.reconciliation) {
        if (r.status === "auto_matched" && r.best_match) {
          autoDec[r.original_name] = {
            action: "link",
            matched_id: r.best_match.id,
          };
        }
      }
      setDecisions(autoDec);

      toast.success(
        `${data.summary.auto_matched} auto-match, ${data.summary.needs_review} para revisar, ${data.summary.no_match} sin match`
      );
      setStep("reconcile");
    } catch (err: any) {
      toast.error(err.message || "Error en reconciliación");
    } finally {
      setLoading(false);
    }
  }, [sheets, activeSheet, columnMapping, importId, decisions]);

  // ── Final review ──

  const handleReconcileConfirmed = useCallback(() => {
    // Check all exercises have a decision
    const pending = reconciliation.filter(
      (r) => r.status !== "auto_matched" && !decisions[r.original_name]
    );
    if (pending.length > 0) {
      toast.error(
        `Faltan ${pending.length} ejercicios por decidir`
      );
      return;
    }
    setStep("review");
  }, [reconciliation, decisions]);

  // ── Render helpers ──

  const currentSheet = sheets[activeSheet];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Importar Excel
        </h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Sube una hoja de cálculo con ejercicios y el sistema detectará
          automáticamente las columnas
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(["upload", "mapping", "reconcile", "review"] as Step[]).map(
          (s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  step === s
                    ? "bg-[#00E5FF] text-[#0A0A0F]"
                    : (["upload", "mapping", "reconcile", "review"] as Step[]).indexOf(step) > i
                      ? "bg-[#00E5FF]/20 text-[#00E5FF]"
                      : "bg-[#0E0E18]/60 backdrop-blur-xl text-[#5A5A72] border border-white/[0.06]"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-[0.15em] ${
                  step === s ? "text-[#00E5FF]" : "text-[#5A5A72]"
                }`}
              >
                {s === "upload"
                  ? "Subir"
                  : s === "mapping"
                    ? "Mapear"
                    : s === "reconcile"
                      ? "Reconciliar"
                      : "Revisar"}
              </span>
              {i < 3 && (
                <div className="mx-2 h-px w-8 bg-white/[0.06]" />
              )}
            </div>
          )
        )}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-8">
          <label className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-white/[0.1] p-12 transition-colors hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/[0.02]">
            <svg
              className="h-12 w-12 text-[#5A5A72]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">
                {loading ? "Procesando..." : "Arrastra o selecciona archivo"}
              </p>
              <p className="mt-1 text-sm text-[#5A5A72]">
                .xlsx, .xls o .csv — máx. 5MB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
      )}

      {/* ── Step 2: Column Mapping ── */}
      {step === "mapping" && currentSheet && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Mapeo de columnas
                </h2>
                <p className="text-sm text-[#8B8BA3]">
                  {fileName} — {currentSheet.row_count} filas
                </p>
              </div>
              {sheets.length > 1 && (
                <select
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white"
                  value={activeSheet}
                  onChange={(e) => setActiveSheet(parseInt(e.target.value))}
                >
                  {sheets.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
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
                    <tr
                      key={col.index}
                      className="border-b border-white/[0.03]"
                    >
                      <td className="px-3 py-3 font-medium text-white">
                        {col.header || `Col ${col.index + 1}`}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-sm text-white"
                          value={columnMapping[col.index] || "unknown"}
                          onChange={(e) =>
                            setColumnMapping((prev) => ({
                              ...prev,
                              [col.index]: e.target
                                .value as InferredColumnType,
                            }))
                          }
                        >
                          {ALL_COLUMN_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {COLUMN_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
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
                              style={{
                                width: `${col.confidence * 100}%`,
                              }}
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
              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
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
                      <tr
                        key={i}
                        className="border-t border-white/[0.03]"
                      >
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
              onClick={() => setStep("upload")}
              className="rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-6 py-3 font-semibold text-white transition-colors hover:bg-white/[0.04]"
            >
              Volver
            </button>
            <button
              onClick={handleMappingConfirmed}
              disabled={loading}
              className="rounded-xl bg-[#00E5FF] px-6 py-3 font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Buscando coincidencias..." : "Confirmar y reconciliar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Entity Reconciliation ── */}
      {step === "reconcile" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
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
                                setDecisions((prev) => ({
                                  ...prev,
                                  [r.original_name]: {
                                    action: "link",
                                    matched_id: m.id,
                                  },
                                }))
                              }
                              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                decisions[r.original_name]?.matched_id ===
                                m.id
                                  ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]"
                                  : "border-white/[0.06] text-[#8B8BA3] hover:border-white/[0.12]"
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
                            setDecisions((prev) => ({
                              ...prev,
                              [r.original_name]: {
                                action: "create",
                                custom_name: r.original_name,
                              },
                            }))
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            decisions[r.original_name]?.action === "create"
                              ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]"
                              : "border-white/[0.06] text-[#8B8BA3] hover:border-white/[0.12]"
                          }`}
                        >
                          Crear nuevo
                        </button>
                        <button
                          onClick={() =>
                            setDecisions((prev) => ({
                              ...prev,
                              [r.original_name]: { action: "skip" },
                            }))
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            decisions[r.original_name]?.action === "skip"
                              ? "border-[#FF1744] bg-[#FF1744]/10 text-[#FF1744]"
                              : "border-white/[0.06] text-[#8B8BA3] hover:border-white/[0.12]"
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
              onClick={() => setStep("mapping")}
              className="rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-6 py-3 font-semibold text-white transition-colors hover:bg-white/[0.04]"
            >
              Volver
            </button>
            <button
              onClick={handleReconcileConfirmed}
              className="rounded-xl bg-[#00E5FF] px-6 py-3 font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90"
            >
              Confirmar y revisar
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Final Review ── */}
      {step === "review" && currentSheet && (
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
                  {
                    Object.values(decisions).filter(
                      (d) => d.action === "link"
                    ).length
                  }
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Enlazados
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.04] p-4 text-center">
                <p className="text-2xl font-black text-[#7C3AED]">
                  {
                    Object.values(decisions).filter(
                      (d) => d.action === "create"
                    ).length
                  }
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
              onClick={() => setStep("reconcile")}
              className="rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-6 py-3 font-semibold text-white transition-colors hover:bg-white/[0.04]"
            >
              Volver
            </button>
            <button
              onClick={async () => {
                if (importing) return;
                setImporting(true);

                try {
                  if (!currentSheet || !importId) throw new Error("Sin datos");

                  // Find category column if mapped
                  const catColIndex = Object.entries(columnMapping).find(
                    ([, type]) => type === "exercise_category"
                  )?.[0];
                  const catHeader = catColIndex !== undefined
                    ? currentSheet.columns[parseInt(catColIndex)]?.header || `col_${catColIndex}`
                    : null;

                  // Find exercise_name column
                  const nameColIndex = Object.entries(columnMapping).find(
                    ([, type]) => type === "exercise_name"
                  )?.[0];
                  const nameHeader = nameColIndex !== undefined
                    ? currentSheet.columns[parseInt(nameColIndex)]?.header || `col_${nameColIndex}`
                    : null;

                  // Build name→category lookup from rows
                  const categoryMap = new Map<string, string>();
                  if (catHeader && nameHeader) {
                    for (const row of currentSheet.rows) {
                      const n = row[nameHeader];
                      const c = row[catHeader];
                      if (n && c) categoryMap.set(String(n).trim().toLowerCase(), String(c).trim());
                    }
                  }

                  // Collect exercises to create
                  const exercisesToCreate = Object.entries(decisions)
                    .filter(([, dec]) => dec.action === "create")
                    .map(([name, dec]) => ({
                      name: dec.custom_name || name,
                      category: categoryMap.get(name.toLowerCase()) || null,
                    }));

                  // Collect linked exercises (to hide globals)
                  const linkedExercises = Object.entries(decisions)
                    .filter(([, dec]) => dec.action === "link" && dec.matched_id)
                    .map(([name, dec]) => ({
                      global_exercise_id: dec.matched_id,
                      trainer_exercise_name: name,
                    }));

                  // Call server API to create new exercises + record linked ones
                  const res = await fetch("/api/import/create-exercises", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      exercises: exercisesToCreate,
                      linked: linkedExercises,
                      import_id: importId,
                      decisions: {
                        columns: columnMapping,
                        entities: decisions,
                      },
                    }),
                  });

                  const result = await res.json();
                  if (!res.ok) throw new Error(result.error);

                  if (result.total_errors > 0) {
                    for (const err of result.errors) {
                      toast.error(`Error: "${err.name}": ${err.error}`);
                    }
                  }

                  toast.success(
                    `${result.total_created} creados, ${result.total_linked} enlazados`
                  );
                  setStep("upload");
                  setSheets([]);
                  setDecisions({});
                  setReconciliation([]);
                } catch (err: any) {
                  toast.error(err.message || "Error importando");
                } finally {
                  setImporting(false);
                }
              }}
              disabled={importing}
              className="rounded-xl bg-[#00E5FF] px-6 py-3 font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {importing ? "Importando..." : "Importar ejercicios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
