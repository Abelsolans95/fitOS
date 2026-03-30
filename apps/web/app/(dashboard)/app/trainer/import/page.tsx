"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { InferredColumnType } from "@/lib/excel-parser";
import {
  type ParsedSheet,
  type ReconciliationResult,
  type DecisionMap,
  type Step,
} from "./components/types";
import { UploadStep } from "./components/UploadStep";
import { MappingStep } from "./components/MappingStep";
import { ReconcileStep } from "./components/ReconcileStep";
import { ReviewStep } from "./components/ReviewStep";

const STEPS: Step[] = ["upload", "mapping", "reconcile", "review"];

const STEP_LABELS: Record<Step, string> = {
  upload: "Subir",
  mapping: "Mapear",
  reconcile: "Reconciliar",
  review: "Revisar",
};

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importId, setImportId] = useState<string | null>(null);
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [columnMapping, setColumnMapping] = useState<Record<number, InferredColumnType>>({});
  const [reconciliation, setReconciliation] = useState<ReconciliationResult[]>([]);
  const [decisions, setDecisions] = useState<DecisionMap>({});
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
        setStep("mapping");
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

    const nameColIndex = Object.entries(columnMapping).find(
      ([, type]) => type === "exercise_name"
    )?.[0];

    if (nameColIndex === undefined) {
      toast.error("Debes asignar una columna como 'Nombre del ejercicio'");
      return;
    }

    const nameHeader =
      sheet.columns[parseInt(nameColIndex)]?.header || `col_${nameColIndex}`;
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
      const autoDec: DecisionMap = {};
      for (const r of data.reconciliation) {
        if (r.status === "auto_matched" && r.best_match) {
          autoDec[r.original_name] = { action: "link", matched_id: r.best_match.id };
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
  }, [sheets, activeSheet, columnMapping, importId]);

  // ── Reconcile confirmed → Review ──

  const handleReconcileConfirmed = useCallback(() => {
    const pending = reconciliation.filter(
      (r) => r.status !== "auto_matched" && !decisions[r.original_name]
    );
    if (pending.length > 0) {
      toast.error(`Faltan ${pending.length} ejercicios por decidir`);
      return;
    }
    setStep("review");
  }, [reconciliation, decisions]);

  // ── Final import ──

  const handleImport = useCallback(async () => {
    if (importing) return;
    const currentSheet = sheets[activeSheet];
    if (!currentSheet || !importId) {
      toast.error("Sin datos para importar");
      return;
    }

    setImporting(true);
    try {
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

      const res = await fetch("/api/import/create-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercises: exercisesToCreate,
          linked: linkedExercises,
          import_id: importId,
          decisions: { columns: columnMapping, entities: decisions },
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      if (result.total_errors > 0) {
        for (const err of result.errors) {
          toast.error(`Error: "${err.name}": ${err.error}`);
        }
      }

      toast.success(`${result.total_created} creados, ${result.total_linked} enlazados`);

      // Reset wizard
      setStep("upload");
      setSheets([]);
      setDecisions({});
      setReconciliation([]);
    } catch (err: any) {
      toast.error(err.message || "Error importando");
    } finally {
      setImporting(false);
    }
  }, [importing, sheets, activeSheet, columnMapping, importId, decisions]);

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
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step === s
                  ? "bg-[#00E5FF] text-[#0A0A0F]"
                  : STEPS.indexOf(step) > i
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
              {STEP_LABELS[s]}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-2 h-px w-8 bg-white/[0.06]" />
            )}
          </div>
        ))}
      </div>

      {/* Step panels */}
      {step === "upload" && (
        <UploadStep loading={loading} onUpload={handleFileUpload} />
      )}

      {step === "mapping" && currentSheet && (
        <MappingStep
          sheets={sheets}
          activeSheet={activeSheet}
          fileName={fileName}
          columnMapping={columnMapping}
          onSheetChange={setActiveSheet}
          onColumnTypeChange={(colIndex, type) =>
            setColumnMapping((prev) => ({ ...prev, [colIndex]: type }))
          }
          onConfirm={handleMappingConfirmed}
          onBack={() => setStep("upload")}
          loading={loading}
        />
      )}

      {step === "reconcile" && (
        <ReconcileStep
          reconciliation={reconciliation}
          decisions={decisions}
          onDecision={(name, decision) =>
            setDecisions((prev) => ({ ...prev, [name]: decision }))
          }
          onConfirm={handleReconcileConfirmed}
          onBack={() => setStep("mapping")}
          loading={loading}
        />
      )}

      {step === "review" && currentSheet && (
        <ReviewStep
          currentSheet={currentSheet}
          importId={importId}
          columnMapping={columnMapping}
          decisions={decisions}
          importing={importing}
          onImport={handleImport}
          onBack={() => setStep("reconcile")}
        />
      )}
    </div>
  );
}
