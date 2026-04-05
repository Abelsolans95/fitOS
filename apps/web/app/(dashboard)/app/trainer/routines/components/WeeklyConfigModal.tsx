"use client";

import { useState } from "react";
import {
  type SetConfig,
  type RoutineExercise,
  type WeekConfig,
} from "../types";

/* ────────────────────────────────────────────
   Field definitions for the weekly config grid
   ──────────────────────────────────────────── */

type EqualField = {
  key: "sets" | "reps_min" | "reps_max" | "rir" | "target_rpe" | "target_weight" | "rest_s";
  label: string;
  min: number;
  max?: number;
  step?: number;
  nullable?: boolean;
};

type SetField = {
  key: "reps_min" | "reps_max" | "rir" | "target_rpe" | "target_weight" | "rest_s";
  label: string;
  min: number;
  max?: number;
  step?: number;
  nullable?: boolean;
};

const EQUAL_FIELDS: EqualField[] = [
  { key: "sets", label: "Series", min: 1, max: 20 },
  { key: "reps_min", label: "Reps mín", min: 1 },
  { key: "reps_max", label: "Reps máx", min: 1 },
  { key: "rir", label: "RIR", min: 0, max: 5 },
  { key: "target_rpe", label: "RPE", min: 1, max: 10, nullable: true },
  { key: "target_weight", label: "Carga (kg)", min: 0, step: 0.5, nullable: true },
  { key: "rest_s", label: "Desc. (s)", min: 0, step: 15 },
];

const SET_FIELDS: SetField[] = [
  { key: "reps_min", label: "Reps mín", min: 1 },
  { key: "reps_max", label: "Reps máx", min: 1 },
  { key: "rir", label: "RIR", min: 0, max: 5 },
  { key: "target_rpe", label: "RPE", min: 1, max: 10, nullable: true },
  { key: "target_weight", label: "Carga (kg)", min: 0, step: 0.5, nullable: true },
  { key: "rest_s", label: "Desc. (s)", min: 0, step: 15 },
];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function buildDefaultWeek(exercise: RoutineExercise): WeekConfig {
  const base: WeekConfig = {
    sets: exercise.sets,
    reps_min: exercise.reps_min,
    reps_max: exercise.reps_max,
    rir: exercise.rir,
    target_weight: exercise.target_weight,
    rest_s: exercise.rest_s,
    target_rpe: exercise.target_rpe ?? null,
  };
  if (exercise.mode === "different") {
    base.sets_detail = exercise.sets_config.length > 0
      ? exercise.sets_config.map((sc) => ({ ...sc }))
      : Array.from({ length: exercise.sets }, () => ({
          reps_min: exercise.reps_min,
          reps_max: exercise.reps_max,
          rir: exercise.rir,
          target_weight: exercise.target_weight,
          rest_s: exercise.rest_s,
          target_rpe: exercise.target_rpe ?? null,
        }));
  }
  return base;
}

/* ────────────────────────────────────────────
   SetDetailRow — one set row inside the modal
   ──────────────────────────────────────────── */

function SetDetailRow({
  sc,
  setIdx,
  normalNum,
  fields,
  onFieldChange,
  onRemoveDerivative,
  onAddDerivative,
}: {
  sc: SetConfig;
  setIdx: number;
  normalNum: number;
  fields: SetField[];
  onFieldChange: (setIdx: number, field: keyof SetConfig, value: number | null) => void;
  onRemoveDerivative: (setIdx: number) => void;
  onAddDerivative: (afterSetIdx: number, setType: "rest_pause" | "drop_set") => void;
}) {
  const isDeriv = sc.set_type === "rest_pause" || sc.set_type === "drop_set";
  const isRP = sc.set_type === "rest_pause";
  const isDS = sc.set_type === "drop_set";

  return (
    <div
      className={`grid grid-cols-[40px_repeat(6,1fr)_52px] gap-1.5 rounded-lg px-1 py-1.5 ${isDeriv ? "ml-6 border-l-2" : "bg-white/[0.02]"} ${isRP ? "border-[#FF9100]/40 bg-[#FF9100]/[0.04]" : ""} ${isDS ? "border-[#7C3AED]/40 bg-[#7C3AED]/[0.04]" : ""}`}
    >
      <div className="flex items-center justify-center">
        {isDeriv ? (
          <span className={`flex h-5 items-center justify-center rounded px-1.5 text-[9px] font-bold ${isRP ? "bg-[#FF9100]/10 text-[#FF9100]" : "bg-[#7C3AED]/10 text-[#7C3AED]"}`}>
            {isRP ? "RP" : "DS"}
          </span>
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF]">
            {normalNum}
          </span>
        )}
      </div>
      {fields.map((f) => (
        <input
          key={f.key}
          type="number"
          min={f.min} max={f.max} step={f.step}
          value={sc[f.key] ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onFieldChange(setIdx, f.key, f.nullable && raw === "" ? null : Number(raw) || 0);
          }}
          placeholder={f.nullable ? "—" : undefined}
          className={`h-7 w-full rounded border bg-[#0E0E18]/60 px-1 text-center text-[11px] placeholder:text-[#5A5A72] outline-none transition-colors ${f.key === "rir" ? "border-[#00E5FF]/20 text-[#00E5FF] focus:border-[#00E5FF]/40" : f.key === "target_rpe" ? "border-[#FF9100]/20 text-[#FF9100] focus:border-[#FF9100]/40" : "border-white/[0.06] text-white focus:border-[#7C3AED]/40"}`}
        />
      ))}
      <div className="flex items-center gap-0.5">
        {isDeriv ? (
          <button type="button" title="Eliminar"
            onClick={() => onRemoveDerivative(setIdx)}
            className="flex h-5 w-5 items-center justify-center rounded text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        ) : (
          <>
            <button type="button" title="Añadir Rest-Pause"
              onClick={() => onAddDerivative(setIdx, "rest_pause")}
              className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#FF9100] hover:bg-[#FF9100]/10 transition-colors"
            >RP</button>
            <button type="button" title="Añadir Drop Set"
              onClick={() => onAddDerivative(setIdx, "drop_set")}
              className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
            >DS</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Utility: compute normalNum for a set at setIdx
   ──────────────────────────────────────────── */

function computeNormalNum(setsDetail: SetConfig[], setIdx: number): number {
  let count = 0;
  for (let k = 0; k <= setIdx; k++) {
    const t = setsDetail[k]?.set_type;
    if (!t || t === "normal") count++;
  }
  return count;
}

/* ────────────────────────────────────────────
   WeeklyConfigModal — Per-week progression
   ──────────────────────────────────────────── */

interface WeeklyConfigModalProps {
  exercise: RoutineExercise;
  mesocycleWeeks: number;
  onSave: (weeklyConfig: Record<number, WeekConfig>) => void;
  onClose: () => void;
}

export default function WeeklyConfigModal({
  exercise,
  mesocycleWeeks,
  onSave,
  onClose,
}: WeeklyConfigModalProps) {
  const isDifferent = exercise.mode === "different";

  const [weeks, setWeeks] = useState<Record<number, WeekConfig>>(() => {
    const init: Record<number, WeekConfig> = {};
    for (let w = 1; w <= mesocycleWeeks; w++) {
      const existing = exercise.weekly_config?.[w];
      if (existing) {
        // Ensure sets_detail exists for different mode
        if (isDifferent && !existing.sets_detail) {
          init[w] = { ...existing, sets_detail: buildDefaultWeek(exercise).sets_detail };
        } else {
          init[w] = { ...existing };
        }
      } else {
        init[w] = buildDefaultWeek(exercise);
      }
    }
    return init;
  });

  const updateWeekField = (week: number, field: keyof WeekConfig, value: number | string | null) => {
    setWeeks((prev) => ({
      ...prev,
      [week]: { ...prev[week], [field]: value },
    }));
  };

  const updateSetDetail = (week: number, setIdx: number, field: keyof SetConfig, value: number | null) => {
    setWeeks((prev) => {
      const wk = prev[week];
      const detail = [...(wk.sets_detail ?? [])];
      detail[setIdx] = { ...detail[setIdx], [field]: value };
      return { ...prev, [week]: { ...wk, sets_detail: detail } };
    });
  };

  const updateWeekSets = (week: number, newSets: number) => {
    setWeeks((prev) => {
      const wk = prev[week];
      const oldDetail = wk.sets_detail ?? [];
      // Only count normal sets for resize logic
      const normalSets = oldDetail.filter((s) => !s.set_type || s.set_type === "normal");
      const currentNormalCount = normalSets.length;
      let detail: SetConfig[];
      if (newSets > currentNormalCount) {
        // Add new normal sets at the end
        const template = normalSets.length > 0
          ? normalSets[normalSets.length - 1]
          : { reps_min: exercise.reps_min, reps_max: exercise.reps_max, rir: exercise.rir, target_weight: exercise.target_weight, rest_s: exercise.rest_s, target_rpe: exercise.target_rpe ?? null };
        detail = [...oldDetail, ...Array.from({ length: newSets - currentNormalCount }, () => ({ ...template, set_type: undefined }))];
      } else {
        // Remove normal sets from the end (keep derivatives attached to remaining normals)
        let removed = 0;
        detail = [];
        for (const s of oldDetail) {
          const isNormal = !s.set_type || s.set_type === "normal";
          if (isNormal && removed >= newSets) continue; // skip excess normals
          detail.push(s);
          if (isNormal) removed++;
        }
      }
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  const addWeekDerivativeSet = (week: number, afterSetIdx: number, setType: "rest_pause" | "drop_set") => {
    setWeeks((prev) => {
      const wk = prev[week];
      const detail = [...(wk.sets_detail ?? [])];
      const source = detail[afterSetIdx];
      const newSet: SetConfig = {
        reps_min: source.reps_min,
        reps_max: source.reps_max,
        rir: source.rir,
        target_weight: setType === "drop_set" ? (source.target_weight ? Math.round(source.target_weight * 0.8 * 10) / 10 : null) : source.target_weight,
        rest_s: setType === "rest_pause" ? 15 : 0,
        target_rpe: source.target_rpe,
        set_type: setType,
      };
      detail.splice(afterSetIdx + 1, 0, newSet);
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  const removeWeekDerivativeSet = (week: number, setIdx: number) => {
    setWeeks((prev) => {
      const wk = prev[week];
      const detail = (wk.sets_detail ?? []).filter((_, i) => i !== setIdx);
      // If no derivatives remain, collapse back to scalar (equal mode)
      const hasDerivatives = detail.some((s) => s.set_type && s.set_type !== "normal");
      if (!isDifferent && !hasDerivatives) {
        return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: undefined } };
      }
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  /** In equal mode, expand scalar values into sets_detail and add a derivative set */
  const expandEqualAndAddDerivative = (week: number, setType: "rest_pause" | "drop_set") => {
    setWeeks((prev) => {
      const wk = prev[week];
      const count = wk.sets || exercise.sets;
      const normalSet: SetConfig = {
        reps_min: wk.reps_min ?? exercise.reps_min,
        reps_max: wk.reps_max ?? exercise.reps_max,
        rir: wk.rir ?? exercise.rir,
        target_weight: wk.target_weight ?? exercise.target_weight,
        rest_s: wk.rest_s ?? exercise.rest_s,
        target_rpe: wk.target_rpe ?? exercise.target_rpe ?? null,
      };
      // Create N normal sets + 1 derivative after the last one
      const detail: SetConfig[] = Array.from({ length: count }, () => ({ ...normalSet }));
      const derivSet: SetConfig = {
        reps_min: normalSet.reps_min,
        reps_max: normalSet.reps_max,
        rir: normalSet.rir,
        target_weight: setType === "drop_set" ? (normalSet.target_weight ? Math.round(normalSet.target_weight * 0.8 * 10) / 10 : null) : normalSet.target_weight,
        rest_s: setType === "rest_pause" ? 15 : 0,
        target_rpe: normalSet.target_rpe,
        set_type: setType,
      };
      detail.push(derivSet);
      return { ...prev, [week]: { ...wk, sets: detail.length, sets_detail: detail } };
    });
  };

  const replicateFromWeek = (fromWeek: number) => {
    setWeeks((prev) => {
      const source = prev[fromWeek];
      const next = { ...prev };
      for (let w = fromWeek + 1; w <= mesocycleWeeks; w++) {
        next[w] = {
          ...source,
          sets_detail: source.sets_detail?.map((s) => ({ ...s })),
        };
      }
      return next;
    });
  };

  const handleReset = () => {
    const reset: Record<number, WeekConfig> = {};
    for (let w = 1; w <= mesocycleWeeks; w++) {
      reset[w] = buildDefaultWeek(exercise);
    }
    setWeeks(reset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#12121A] shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Progresión semanal</h2>
            <p className="text-[12px] text-[#8B8BA3] mt-0.5">
              {exercise.name} — {mesocycleWeeks} semanas
              {isDifferent && " · series diferentes"}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A5A72] transition-colors hover:bg-white/[0.06] hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto px-6 py-4 flex-1 space-y-0">
          {Array.from({ length: mesocycleWeeks }, (_, i) => i + 1).map((week) => (
            <div key={week}>
              {/* Week separator */}
              <div className="flex items-center gap-3 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[11px] font-bold text-[#7C3AED]">
                  {week}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7C3AED]/70">
                  Semana {week}
                </span>
                <div className="flex-1 h-px bg-[#7C3AED]/20" />
              </div>

              {/* EQUAL MODE — scalar row OR expanded per-set view if has derivatives */}
              {!isDifferent && (() => {
                const weekHasDetail = (weeks[week]?.sets_detail?.length ?? 0) > 0;
                return weekHasDetail ? (
                  /* Expanded per-set view (equal mode with derivatives) */
                  <div className="pb-2 space-y-1">
                    <div className="flex items-center gap-3 mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72] whitespace-nowrap">
                        Series
                      </label>
                      <input
                        type="number" min={1} max={20}
                        value={weeks[week]?.sets_detail?.filter((s) => !s.set_type || s.set_type === "normal").length ?? weeks[week]?.sets ?? exercise.sets}
                        onChange={(e) => updateWeekSets(week, Math.max(1, Number(e.target.value) || 1))}
                        className="h-7 w-14 rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 px-2 text-center text-[11px] text-white outline-none focus:border-[#7C3AED]/40"
                      />
                    </div>
                    {week === 1 && (
                      <div className="grid grid-cols-[40px_repeat(6,1fr)_52px] gap-1.5 px-1 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Serie</span>
                        {SET_FIELDS.map((f) => (
                          <span key={f.key} className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] ${f.key === "rir" ? "text-[#00E5FF]" : f.key === "target_rpe" ? "text-[#FF9100]" : "text-[#5A5A72]"}`}>
                            {f.label}
                          </span>
                        ))}
                        <span />
                      </div>
                    )}
                    {(weeks[week]?.sets_detail ?? []).map((sc, setIdx) => {
                      const isDeriv = sc.set_type === "rest_pause" || sc.set_type === "drop_set";
                      return (
                        <SetDetailRow
                          key={setIdx}
                          sc={sc}
                          setIdx={setIdx}
                          normalNum={isDeriv ? 0 : computeNormalNum(weeks[week]?.sets_detail ?? [], setIdx)}
                          fields={SET_FIELDS}
                          onFieldChange={(si, f, v) => updateSetDetail(week, si, f, v)}
                          onRemoveDerivative={(si) => removeWeekDerivativeSet(week, si)}
                          onAddDerivative={(si, st) => addWeekDerivativeSet(week, si, st)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  /* Scalar view (default equal mode without derivatives) */
                  <div className="pb-2">
                    {week === 1 && (
                      <div className="grid grid-cols-[repeat(7,1fr)_52px] gap-1.5 px-1 mb-1.5">
                        {EQUAL_FIELDS.map((f) => (
                          <span key={f.key} className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] ${f.key === "rir" ? "text-[#00E5FF]" : f.key === "target_rpe" ? "text-[#FF9100]" : "text-[#5A5A72]"}`}>
                            {f.label}
                          </span>
                        ))}
                        <span />
                      </div>
                    )}
                    <div className="grid grid-cols-[repeat(7,1fr)_52px] gap-1.5 rounded-lg bg-white/[0.02] px-1 py-1.5">
                      {EQUAL_FIELDS.map((f) => (
                        <input
                          key={f.key}
                          type="number"
                          min={f.min} max={f.max} step={f.step}
                          value={weeks[week]?.[f.key] ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            updateWeekField(week, f.key, f.nullable && raw === "" ? null : Number(raw) || 0);
                          }}
                          placeholder={f.nullable ? "—" : undefined}
                          className={`h-8 w-full rounded-lg border bg-[#0E0E18]/60 px-2 text-center text-[11px] placeholder:text-[#5A5A72] outline-none transition-colors ${f.key === "rir" ? "border-[#00E5FF]/20 text-[#00E5FF] focus:border-[#00E5FF]/40" : f.key === "target_rpe" ? "border-[#FF9100]/20 text-[#FF9100] focus:border-[#FF9100]/40" : "border-white/[0.08] text-white focus:border-[#7C3AED]/40"}`}
                        />
                      ))}
                      <div className="flex items-center gap-0.5">
                        <button type="button" title="Añadir Rest-Pause"
                          onClick={() => expandEqualAndAddDerivative(week, "rest_pause")}
                          className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#FF9100] hover:bg-[#FF9100]/10 transition-colors"
                        >RP</button>
                        <button type="button" title="Añadir Drop Set"
                          onClick={() => expandEqualAndAddDerivative(week, "drop_set")}
                          className="flex h-5 items-center justify-center rounded px-1 text-[8px] font-bold text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
                        >DS</button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DIFFERENT MODE — one row per set */}
              {isDifferent && (
                <div className="pb-2 space-y-1">
                  {/* Sets count */}
                  <div className="flex items-center gap-3 mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72] whitespace-nowrap">
                      Series
                    </label>
                    <input
                      type="number" min={1} max={20}
                      value={weeks[week]?.sets ?? exercise.sets}
                      onChange={(e) => updateWeekSets(week, Math.max(1, Number(e.target.value) || 1))}
                      className="h-7 w-14 rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 px-2 text-center text-[11px] text-white outline-none focus:border-[#7C3AED]/40"
                    />
                  </div>
                  {/* Column headers on first week only */}
                  {week === 1 && (
                    <div className="grid grid-cols-[40px_repeat(6,1fr)_52px] gap-1.5 px-1 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Serie</span>
                      {SET_FIELDS.map((f) => (
                        <span key={f.key} className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] ${f.key === "rir" ? "text-[#00E5FF]" : f.key === "target_rpe" ? "text-[#FF9100]" : "text-[#5A5A72]"}`}>
                          {f.label}
                        </span>
                      ))}
                      <span />
                    </div>
                  )}
                  {(weeks[week]?.sets_detail ?? []).map((sc, setIdx) => {
                    const isDeriv = sc.set_type === "rest_pause" || sc.set_type === "drop_set";
                    return (
                      <SetDetailRow
                        key={setIdx}
                        sc={sc}
                        setIdx={setIdx}
                        normalNum={isDeriv ? 0 : computeNormalNum(weeks[week]?.sets_detail ?? [], setIdx)}
                        fields={SET_FIELDS}
                        onFieldChange={(si, f, v) => updateSetDetail(week, si, f, v)}
                        onRemoveDerivative={(si) => removeWeekDerivativeSet(week, si)}
                        onAddDerivative={(si, st) => addWeekDerivativeSet(week, si, st)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Coach notes per week (shared across both modes) */}
              <div className="mt-1.5 pb-1">
                <textarea
                  rows={1}
                  value={weeks[week]?.coach_notes ?? ""}
                  onChange={(e) => updateWeekField(week, "coach_notes", e.target.value)}
                  placeholder="Notas del entrenador para esta semana..."
                  className="w-full resize-none rounded-lg border border-white/[0.06] bg-[#0E0E18]/60 px-3 py-1.5 text-[11px] text-white placeholder:text-[#5A5A72]/60 outline-none transition-colors focus:border-[#7C3AED]/40"
                />
              </div>

              {/* Replicate button */}
              {week < mesocycleWeeks && (
                <div className="mt-0.5 mb-1 flex justify-end">
                  <button type="button" onClick={() => replicateFromWeek(week)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/10">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 0 0 2 2h6M8 7V5a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707V15a2 2 0 0 1-2 2h-2" />
                    </svg>
                    Replicar para siguientes semanas
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={handleReset}
            className="rounded-xl border border-white/[0.08] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-colors hover:text-white hover:border-white/[0.15]">
            Restablecer valores base
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-4 py-2 text-[12px] font-medium text-[#8B8BA3] transition-colors hover:text-white">
              Cancelar
            </button>
            <button type="button" onClick={() => onSave(weeks)}
              className="rounded-xl bg-[#7C3AED] px-5 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90">
              Guardar progresión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
