"use client";

import { memo } from "react";

export interface MealSuggestion {
  name: string;
  description: string;
  ingredients: string[];
  estimated_macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  prep_time_min: number;
  difficulty: "facil" | "medio" | "avanzado";
}

interface MealSuggestionCardProps {
  suggestion: MealSuggestion;
  saving: boolean;
  onSave: (suggestion: MealSuggestion) => void;
}

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  facil: { label: "Facil", color: "#00C853" },
  medio: { label: "Medio", color: "#FF9100" },
  avanzado: { label: "Avanzado", color: "#FF1744" },
};

export const MealSuggestionCard = memo(function MealSuggestionCard({
  suggestion,
  saving,
  onSave,
}: MealSuggestionCardProps) {
  const diff = DIFFICULTY_LABELS[suggestion.difficulty] ?? DIFFICULTY_LABELS.facil;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{suggestion.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#8B8BA3]">{suggestion.description}</p>
        </div>
        <span className="text-lg font-bold text-[#00E5FF]">
          {Math.round(suggestion.estimated_macros.kcal)}
          <span className="text-[10px] font-normal text-[#8B8BA3]"> kcal</span>
        </span>
      </div>

      {/* Macros */}
      <div className="mt-3 flex gap-3">
        <div className="flex-1 rounded-lg bg-white/[0.02] px-3 py-2 text-center">
          <p className="text-xs font-bold text-[#00E5FF]">{Math.round(suggestion.estimated_macros.protein)}g</p>
          <p className="text-[10px] text-[#8B8BA3]">Proteina</p>
        </div>
        <div className="flex-1 rounded-lg bg-white/[0.02] px-3 py-2 text-center">
          <p className="text-xs font-bold text-[#FF9100]">{Math.round(suggestion.estimated_macros.carbs)}g</p>
          <p className="text-[10px] text-[#8B8BA3]">Carbos</p>
        </div>
        <div className="flex-1 rounded-lg bg-white/[0.02] px-3 py-2 text-center">
          <p className="text-xs font-bold text-[#7C3AED]">{Math.round(suggestion.estimated_macros.fat)}g</p>
          <p className="text-[10px] text-[#8B8BA3]">Grasa</p>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">Ingredientes</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestion.ingredients.map((ing, i) => (
            <span key={i} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#8B8BA3]">
              {ing}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: time + difficulty + save */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-[#8B8BA3]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {suggestion.prep_time_min} min
          </span>
          <span className="text-xs font-medium" style={{ color: diff.color }}>
            {diff.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSave(suggestion)}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_16px_rgba(0,229,255,0.3)] disabled:opacity-60"
        >
          {saving ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
          Guardar
        </button>
      </div>
    </div>
  );
});
