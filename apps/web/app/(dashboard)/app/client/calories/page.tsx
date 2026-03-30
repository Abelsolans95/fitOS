"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { MacroSummary } from "./components/MacroSummary";
import { FoodLogList } from "./components/FoodLogList";
import { AddFoodModal } from "./components/AddFoodModal";

interface FoodItem {
  name: string;
  portion_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodLogEntry {
  id: string;
  logged_at: string;
  meal_type: string;
  foods: FoodItem[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  source: string;
}

export default function CaloriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis result state
  const [analyzedFoods, setAnalyzedFoods] = useState<FoodItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState("comida");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Today's log
  const [todayLog, setTodayLog] = useState<FoodLogEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const loadTodayLog = useCallback(async (uid: string) => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error: logError } = await supabase
      .from("food_log")
      .select("*")
      .eq("client_id", uid)
      .gte("logged_at", today + "T00:00:00")
      .lte("logged_at", today + "T23:59:59")
      .order("logged_at", { ascending: false });

    if (logError) {
      toast.error("Error al cargar el registro de comidas de hoy");
      console.error("[CaloriesPage] Error cargando food_log:", logError);
      return;
    }

    if (data) {
      const entries = data as FoodLogEntry[];
      setTodayLog(entries);
      const totals = entries.reduce(
        (acc, entry) => ({
          kcal: acc.kcal + Number(entry.total_kcal),
          protein: acc.protein + Number(entry.total_protein),
          carbs: acc.carbs + Number(entry.total_carbs),
          fat: acc.fat + Number(entry.total_fat),
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setDailyTotals(totals);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setError("No se pudo obtener la sesion del usuario."); setLoading(false); return; }
        setUserId(user.id);
        await loadTodayLog(user.id);
      } catch {
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadTodayLog]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalyzedFoods([]);
    setSaveSuccess(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);

    // Mock AI analysis result - in production this calls the analyze-food-image Edge Function
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockFoods: FoodItem[] = [
      { name: "Pechuga de pollo a la plancha", portion_g: 150, kcal: 248, protein: 46.5, carbs: 0, fat: 5.4 },
      { name: "Arroz integral", portion_g: 200, kcal: 232, protein: 4.8, carbs: 48.6, fat: 1.8 },
      { name: "Ensalada mixta", portion_g: 120, kcal: 24, protein: 1.4, carbs: 4.2, fat: 0.3 },
    ];

    setAnalyzedFoods(mockFoods);
    setAnalyzing(false);
  };

  const handlePortionChange = (index: number, newPortion: number) => {
    setAnalyzedFoods((prev) =>
      prev.map((food, i) => {
        if (i !== index) return food;
        const ratio = newPortion / food.portion_g;
        return {
          ...food,
          portion_g: newPortion,
          kcal: Math.round(food.kcal * ratio),
          protein: Math.round(food.protein * ratio * 10) / 10,
          carbs: Math.round(food.carbs * ratio * 10) / 10,
          fat: Math.round(food.fat * ratio * 10) / 10,
        };
      })
    );
  };

  const handleSave = async () => {
    if (!userId || analyzedFoods.length === 0) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const totalKcal = analyzedFoods.reduce((sum, f) => sum + f.kcal, 0);
      const totalProtein = analyzedFoods.reduce((sum, f) => sum + f.protein, 0);
      const totalCarbs = analyzedFoods.reduce((sum, f) => sum + f.carbs, 0);
      const totalFat = analyzedFoods.reduce((sum, f) => sum + f.fat, 0);

      const { error: insertError } = await supabase.from("food_log").insert({
        client_id: userId,
        meal_type: selectedMealType,
        foods: analyzedFoods,
        total_kcal: totalKcal,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        source: "ai_vision",
      });

      if (insertError) { setError("Error al guardar el registro."); setSaving(false); return; }

      setSaveSuccess(true);
      setAnalyzedFoods([]);
      setSelectedImage(null);
      setImagePreview(null);
      await loadTodayLog(userId);
    } catch {
      setError("Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
        <button type="button" onClick={() => setError(null)} className="text-sm text-[#00E5FF] hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Calorias</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">Escanea tu comida para registrar las calorias</p>
      </div>

      {/* Upload area */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${dragOver ? "border-[#00E5FF] bg-[#00E5FF]/5" : "border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Foto de comida" className="h-56 w-full object-cover" />
            <button
              type="button"
              onClick={() => { setSelectedImage(null); setImagePreview(null); setAnalyzedFoods([]); }}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-3 px-6 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
              <svg className="h-7 w-7 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Sube una foto de tu comida</p>
              <p className="mt-1 text-xs text-[#8B8BA3]">Arrastra y suelta o toca para seleccionar</p>
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
      {selectedImage && analyzedFoods.length === 0 && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] py-3.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_24px_rgba(0,229,255,0.3)] disabled:opacity-60"
        >
          {analyzing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analizando con IA...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
              Analizar con IA
            </>
          )}
        </button>
      )}

      {/* Analysis results + save */}
      <AddFoodModal
        analyzedFoods={analyzedFoods}
        selectedMealType={selectedMealType}
        saving={saving}
        onMealTypeChange={setSelectedMealType}
        onPortionChange={handlePortionChange}
        onSave={handleSave}
      />

      {/* Save success */}
      {saveSuccess && (
        <div className="rounded-xl border border-[#00C853]/20 bg-[#00C853]/5 px-4 py-3">
          <p className="text-center text-sm text-[#00C853]">Registro guardado correctamente</p>
        </div>
      )}

      {/* Daily totals */}
      {todayLog.length > 0 && <MacroSummary totals={dailyTotals} />}

      {/* Today's log entries */}
      <FoodLogList entries={todayLog} />
    </div>
  );
}
