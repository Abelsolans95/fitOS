"use client";

import { memo, useState, useRef, useCallback } from "react";
import { MealSuggestionCard, MealSuggestion } from "./MealSuggestionCard";

interface BuffetAnalysisProps {
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

/**
 * Extract the best frame from a video by sampling 1 frame per second,
 * picking the one with the highest estimated visual complexity (via canvas pixel variance).
 */
async function extractBestFrame(videoFile: File): Promise<{ base64: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("Canvas no disponible")); return; }

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const maxFrames = Math.min(Math.floor(duration), 30); // Max 30 frames (30s)
      if (maxFrames === 0) { reject(new Error("Video demasiado corto")); return; }

      canvas.width = Math.min(video.videoWidth, 1280);
      canvas.height = Math.min(video.videoHeight, 720);

      let bestBase64 = "";
      let bestVariance = -1;
      let bestPreviewUrl = "";

      const seekAndCapture = (time: number): Promise<void> => {
        return new Promise((res) => {
          video.currentTime = time;
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const variance = calculateVariance(imageData.data);

            if (variance > bestVariance) {
              bestVariance = variance;
              bestBase64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
              bestPreviewUrl = canvas.toDataURL("image/jpeg", 0.85);
            }
            res();
          };
        });
      };

      try {
        for (let i = 0; i < maxFrames; i++) {
          const time = (i / maxFrames) * duration;
          await seekAndCapture(time);
        }

        URL.revokeObjectURL(objectUrl);
        if (!bestBase64) { reject(new Error("No se pudieron extraer frames del video")); return; }
        resolve({ base64: bestBase64, previewUrl: bestPreviewUrl });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar el video"));
    };
  });
}

/** Calculate pixel brightness variance as a proxy for visual complexity */
function calculateVariance(data: Uint8ClampedArray): number {
  let sum = 0;
  let sumSq = 0;
  const pixelCount = data.length / 4;
  // Sample every 16th pixel for performance
  const step = 16;
  let count = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += brightness;
    sumSq += brightness * brightness;
    count++;
  }

  const mean = sum / count;
  return (sumSq / count) - (mean * mean);
}

export const BuffetAnalysis = memo(function BuffetAnalysis({
  remainingMacros,
  alreadyEatenToday,
  onSaveSuggestion,
  savingSuggestion,
  invokeSuggestMeal,
}: BuffetAnalysisProps) {
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [frameBase64, setFrameBase64] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [identifiedItems, setIdentifiedItems] = useState<string[]>([]);
  const [context, setContext] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setExtracting(true);
    setErrorMsg(null);
    setSuggestions([]);
    setIdentifiedItems([]);
    setContext(null);
    setProgress("Extrayendo frames del video...");

    try {
      const { base64, previewUrl } = await extractBestFrame(file);
      setFramePreview(previewUrl);
      setFrameBase64(base64);
      setProgress(null);
    } catch {
      setErrorMsg("No se pudo procesar el video. Prueba con otro formato.");
      setProgress(null);
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!frameBase64) return;
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await invokeSuggestMeal({
        image_base64: frameBase64,
        remaining_macros: remainingMacros,
        already_eaten_today: alreadyEatenToday,
      });

      if (!result) {
        setErrorMsg("No se pudo analizar el buffet. Intentalo de nuevo.");
        return;
      }

      setSuggestions(result.suggestions ?? []);
      setIdentifiedItems(result.identified_items ?? []);
      setContext(result.context ?? null);
    } catch {
      setErrorMsg("Error inesperado al analizar el video");
    } finally {
      setAnalyzing(false);
    }
  }, [frameBase64, remainingMacros, alreadyEatenToday, invokeSuggestMeal]);

  const clearVideo = useCallback(() => {
    setFramePreview(null);
    setFrameBase64(null);
    setSuggestions([]);
    setIdentifiedItems([]);
    setContext(null);
    setErrorMsg(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Remaining macros display */}
      <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-4">
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

      {/* Video upload area */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl">
        {framePreview ? (
          <div className="relative">
            <img src={framePreview} alt="Frame del buffet" className="h-56 w-full object-cover" />
            <div className="absolute left-3 top-3 rounded-full bg-[#FF9100]/20 px-2.5 py-1">
              <span className="text-[10px] font-bold text-[#FF9100]">FRAME SELECCIONADO</span>
            </div>
            <button
              type="button"
              onClick={clearVideo}
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
            disabled={extracting}
            className="flex w-full flex-col items-center gap-3 px-6 py-12 disabled:opacity-60"
          >
            {extracting ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF9100] border-t-transparent" />
                <p className="text-sm font-medium text-white">{progress ?? "Procesando..."}</p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF9100]/10">
                  <svg className="h-7 w-7 text-[#FF9100]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Graba o sube un video del buffet</p>
                  <p className="mt-1 text-xs text-[#8B8BA3]">La IA extraera el mejor frame y analizara las opciones</p>
                </div>
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleVideoSelect(file); }}
        />
      </div>

      {/* Analyze button */}
      {frameBase64 && suggestions.length === 0 && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF9100] to-[#FF1744] py-3.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_24px_rgba(255,145,0,0.3)] disabled:opacity-60"
        >
          {analyzing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analizando buffet...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
              Recomendar plato optimo
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
        <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">Opciones identificadas en el buffet</p>
          <div className="flex flex-wrap gap-1.5">
            {identifiedItems.map((item, i) => (
              <span key={i} className="rounded-full bg-[#FF9100]/10 px-3 py-1 text-xs text-[#FF9100]">
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
          <h3 className="text-sm font-semibold text-white">Recomendacion del buffet</h3>
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
