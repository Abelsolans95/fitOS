"use client";

import { forwardRef } from "react";
import { MacroRow } from "./MacroRow";

interface MacroInfoPanelProps {
  dailyTotals: { kcal: number; protein: number; carbs: number; fat: number };
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  deltaKcal: number;
  deltaProtein: number;
  deltaCarbs: number;
  deltaFat: number;
  actualProteinPct: number;
  actualCarbsPct: number;
  actualFatPct: number;
  weekTarget: { proteinPct: number; carbsPct: number; fatPct: number };
}

export const MacroInfoPanel = forwardRef<HTMLDivElement, MacroInfoPanelProps>(
  function MacroInfoPanel(
    {
      dailyTotals,
      targetKcal,
      targetProteinG,
      targetCarbsG,
      targetFatG,
      deltaKcal,
      deltaProtein,
      deltaCarbs,
      deltaFat,
      actualProteinPct,
      actualCarbsPct,
      actualFatPct,
      weekTarget,
    },
    ref,
  ) {
    return (
      <div ref={ref} className="hidden lg:block w-72 shrink-0">
        <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5 space-y-4">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#00E5FF]">Info nutricional</h4>

          {/* Kcal */}
          <MacroRow
            label="Calorías / día"
            color="#00E5FF"
            actual={dailyTotals.kcal}
            target={targetKcal}
            unit="kcal"
            delta={deltaKcal}
            pctActual={null}
            pctTarget={null}
          />

          <div className="h-px bg-white/[0.06]" />

          {/* Protein */}
          <MacroRow
            label="Proteína"
            color="#00C853"
            actual={dailyTotals.protein}
            target={targetProteinG}
            unit="g"
            delta={deltaProtein}
            pctActual={actualProteinPct}
            pctTarget={weekTarget.proteinPct}
          />

          {/* Carbs */}
          <MacroRow
            label="Carbohidratos"
            color="#FF9100"
            actual={dailyTotals.carbs}
            target={targetCarbsG}
            unit="g"
            delta={deltaCarbs}
            pctActual={actualCarbsPct}
            pctTarget={weekTarget.carbsPct}
          />

          {/* Fat */}
          <MacroRow
            label="Grasas"
            color="#7C3AED"
            actual={dailyTotals.fat}
            target={targetFatG}
            unit="g"
            delta={deltaFat}
            pctActual={actualFatPct}
            pctTarget={weekTarget.fatPct}
          />
        </div>
      </div>
    );
  },
);
