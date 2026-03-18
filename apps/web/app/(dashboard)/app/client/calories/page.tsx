"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

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

const MEAL_TYPES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "snack", label: "Snack" },
] as const;

const MEAL_TYPE_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

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
  const [dailyTotals, setDailyTotals] = useState({
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const loadTodayLog = useCallback(async (uid: string) => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("food_log")
      .select("*")
      .eq("client_id", uid)
      .gte("logged_at", today + "T00:00:00")
      .lte("logged_at", today + "T23:59:59")
      .order("logged_at", { ascending: false });

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
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesion del usuario.");
          setLoading(false);
          return;
        }

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
      {
        name: "Pechuga de pollo a la plancha",
        portion_g: 150,
        kcal: 248,
        protein: 46.5,
        carbs: 0,
        fat: 5.4,
      },
      {
        name: "Arroz integral",
        portion_g: 200,
        kcal: 232,
        protein: 4.8,
        carbs: 48.6,
        fat: 1.8,
      },
      {
        name: "Ensalada mixta",
        portion_g: 120,
        kcal: 24,
        protein: 1.4,
        carbs: 4.2,
        fat: 0.3,
      },
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
      const totalProtein = analyzedFoods.reduce(
        (sum, f) => sum + f.protein,
        0
      );
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

      if (insertError) {
        setError("Error al guardar el registro.");
        setSaving(false);
        return;
      }

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
        <button
          type="button"
          onClick={() => setError(null)}
          className="text-sm text-[#00E5FF] hover:underline"
        >
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
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Escanea tu comida para registrar las calorias
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
          dragOver
            ? "border-[#00E5FF] bg-[#00E5FF]/5"
            : "border-white/[0.08] bg-[#12121A]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Foto de comida"
              className="h-56 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
                setAnalyzedFoods([]);
              }}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 px-6 py-12"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
              <svg
                className="h-7 w-7 text-[#00E5FF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                Sube una foto de tu comida
              </p>
              <p className="mt-1 text-xs text-[#8B8BA3]">
                Arrastra y suelta o toca para seleccionar
              </p>
            </div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
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
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                />
              </svg>
              Analizar con IA
            </>
          )}
        </button>
      )}

      {/* Analysis results */}
      {analyzedFoods.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">
            Alimentos detectados
          </h2>

          {analyzedFoods.map((food, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{food.name}</p>
                  <p className="mt-0.5 text-xs text-[#8B8BA3]">
                    {food.portion_g}g
                  </p>
                </div>
                <span className="text-lg font-bold text-[#00E5FF]">
                  {food.kcal}
                  <span className="text-xs font-normal text-[#8B8BA3]">
                    {" "}
                    kcal
                  </span>
                </span>
              </div>

              {/* Macros row */}
              <div className="mt-3 flex gap-4">
                <div className="flex-1 rounded-lg bg-[#0A0A0F] px-3 py-2 text-center">
                  <p className="text-xs font-bold text-[#00E5FF]">
                    {food.protein}g
                  </p>
                  <p className="text-[10px] text-[#8B8BA3]">Proteina</p>
                </div>
                <div className="flex-1 rounded-lg bg-[#0A0A0F] px-3 py-2 text-center">
                  <p className="text-xs font-bold text-[#FF9100]">
                    {food.carbs}g
                  </p>
                  <p className="text-[10px] text-[#8B8BA3]">Carbos</p>
                </div>
                <div className="flex-1 rounded-lg bg-[#0A0A0F] px-3 py-2 text-center">
                  <p className="text-xs font-bold text-[#7C3AED]">
                    {food.fat}g
                  </p>
                  <p className="text-[10px] text-[#8B8BA3]">Grasa</p>
                </div>
              </div>

              {/* Portion slider */}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#8B8BA3]">Porcion</label>
                  <span className="text-xs font-medium text-white">
                    {food.portion_g}g
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={food.portion_g}
                  onChange={(e) =>
                    handlePortionChange(index, Number(e.target.value))
                  }
                  className="mt-1 w-full accent-[#00E5FF]"
                />
              </div>
            </div>
          ))}

          {/* Meal type selector */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
            <p className="mb-3 text-sm font-medium text-white">
              Tipo de comida
            </p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setSelectedMealType(mt.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    selectedMealType === mt.value
                      ? "bg-[#00E5FF] text-[#0A0A0F]"
                      : "bg-white/[0.04] text-[#8B8BA3] hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                Guardando...
              </>
            ) : (
              "Guardar en registro"
            )}
          </button>
        </div>
      )}

      {/* Save success */}
      {saveSuccess && (
        <div className="rounded-xl border border-[#00C853]/20 bg-[#00C853]/5 px-4 py-3">
          <p className="text-center text-sm text-[#00C853]">
            Registro guardado correctamente
          </p>
        </div>
      )}

      {/* Daily totals */}
      {todayLog.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-5">
          <h2 className="mb-4 text-base font-semibold text-white">
            Totales del dia
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-white">
                {Math.round(dailyTotals.kcal)}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                kcal
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#00E5FF]">
                {Math.round(dailyTotals.protein)}g
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                Prot
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#FF9100]">
                {Math.round(dailyTotals.carbs)}g
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                Carbs
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#7C3AED]">
                {Math.round(dailyTotals.fat)}g
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">
                Grasa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's log entries */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Registro de hoy</h2>

        {todayLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#12121A] py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
              <svg
                className="h-6 w-6 text-[#8B8BA3]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p className="text-sm text-[#8B8BA3]">
              Aun no has registrado ninguna comida hoy
            </p>
          </div>
        ) : (
          todayLog.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      entry.source === "ai_vision"
                        ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                        : "bg-[#8B8BA3]/10 text-[#8B8BA3]"
                    }`}
                  >
                    {entry.source === "ai_vision" ? "IA" : "Manual"}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {MEAL_TYPE_LABELS[entry.meal_type] || entry.meal_type}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#00E5FF]">
                  {Math.round(Number(entry.total_kcal))} kcal
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {(entry.foods as FoodItem[]).map((food, i) => (
                  <p key={i} className="text-xs text-[#8B8BA3]">
                    {food.name} - {food.portion_g}g
                  </p>
                ))}
              </div>
              <div className="mt-2 flex gap-3 text-[10px] text-[#8B8BA3]">
                <span>P: {Math.round(Number(entry.total_protein))}g</span>
                <span>C: {Math.round(Number(entry.total_carbs))}g</span>
                <span>G: {Math.round(Number(entry.total_fat))}g</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
