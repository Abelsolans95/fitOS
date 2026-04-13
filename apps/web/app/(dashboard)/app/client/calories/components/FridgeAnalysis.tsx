"use client";

import { memo, useState, useRef, useCallback } from "react";
import { MealSuggestionCard, MealSuggestion } from "./MealSuggestionCard";

interface FridgeAnalysisProps {
  remainingMacros: { kcal: number; protein: number; carbs: number; fat: number };
  alreadyEatenToday: string[];
  onSaveSuggestion: (suggestion: MealSuggestion) => void;
  savingSuggestion: boolean;
  invokeSuggestMeal: (params: {
    image_base64: string;
    remaining_macros: { kcal: number; protein: number; carbs: number; fat: number };
    dietary_preferences?: string;
    already_eaten_today?: string[];
  }) => Promise<{
    suggestions: MealSuggestion[];
    identified_items: string[];
    context: string;
  } | null>;
}

export const FridgeAnalysis = memo(function FridgeAnalysis({
  remainingMacros,
  alreadyEatenToday,
  onSaveSuggestion,
  savingSuggestion,
  invokeSuggestMeal,
}: FridgeAnalysisProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [identifiedItems, setIdentifiedItems] = useState<string[]>([]);
  const [context, setContext] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImagePreview(URL.createObjectURL(file));
    setSuggestions([]);
    setIdentifiedItems([]);
    setContext(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await invokeSuggestMeal({
        image_base64: imageBase64,
        remaining_macros: remainingMacros,
        already_eaten_today: alreadyEatenToday,
      });

      if (!result) {
        setErrorMsg("No se pudo analizar la imagen. Intentalo de nuevo.");
        return;
      }

      setSuggestions(result.suggestions ?? []);
      setIdentifiedItems(result.identified_items ?? []);
      setContext(result.context ?? null);
    } catch {
      setErrorMsg("Error inesperado al analizar la imagen");
    } finally {
      setAnalyzing(false);
    }
  }, [imageBase64, remainingMacros, alreadyEatenToday, invokeSuggestMeal]);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setSuggestions([]);
    setIdentifiedItems([]);
    setContext(null);
    setErrorMsg(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Remaining macros display */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">Macros restantes hoy</p>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-sm font-bold text-white">{Math.round(remainingMacros.kcal)}</p>
            <p className="text-[10px] text-[#8B8BA3]">kcal</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#00E5FF]">{Math.round(remainingMacros.protein)}g</p>
            <p className="text-[10px] text-[#8B8BA3]">Prot</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#FF9100]">{Math.round(remainingMacros.carbs)}g</p>
            <p className="text-[10px] text-[#8B8BA3]">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#7C3AED]">{Math.round(remainingMacros.fat)}g</p>
            <p className="text-[10px] text-[#8B8BA3]">Grasa</p>
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
          dragOver ? "border-[#00E5FF] bg-[#00E5FF]/5" : "border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Foto de nevera" className="h-56 w-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 px-6 py-12"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED]/10">
              <svg className="h-7 w-7 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738.145l-.57.428a2.514 2.514 0 01-1.215.409l-2.205.22a2.25 2.25 0 00-1.073.353l-.998.665a2.25 2.25 0 01-1.249.385H6.75" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Sube una foto de tu nevera</p>
              <p className="mt-1 text-xs text-[#8B8BA3]">La IA identificara los ingredientes y te sugerira comidas</p>
            </div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }}
        />
      </div>

      {/* Analyze button */}
      {imageBase64 && suggestions.length === 0 && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#00E5FF] py-3.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.3)] disabled:opacity-60"
        >
          {analyzing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analizando ingredientes...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
              Sugerir comidas con IA
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-3">
          <p className="text-center text-sm text-[#FF1744]">{errorMsg}</p>
        </div>
      )}

      {/* Identified items */}
      {identifiedItems.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">Ingredientes identificados</p>
          <div className="flex flex-wrap gap-1.5">
            {identifiedItems.map((item, i) => (
              <span key={i} className="rounded-full bg-[#7C3AED]/10 px-3 py-1 text-xs text-[#7C3AED]">
                {item}
              </span>
            ))}
          </div>
          {context && (
            <p className="mt-3 text-xs leading-relaxed text-[#8B8BA3]">{context}</p>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Sugerencias de comida</h3>
          {suggestions.map((suggestion, i) => (
            <MealSuggestionCard
              key={i}
              suggestion={suggestion}
              saving={savingSuggestion}
              onSave={onSaveSuggestion}
            />
          ))}
        </div>
      )}
    </div>
  );
});
