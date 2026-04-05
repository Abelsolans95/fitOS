"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export interface FoodItem {
  name: string; portion_g: number;
  kcal: number; protein: number; carbs: number; fat: number;
}

export interface FoodLogEntry {
  id: string; logged_at: string; meal_type: string;
  foods: FoodItem[]; total_kcal: number; total_protein: number;
  total_carbs: number; total_fat: number; source: string;
}

export function useCaloriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analyzedFoods, setAnalyzedFoods] = useState<FoodItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState("comida");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [todayLog, setTodayLog] = useState<FoodLogEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const loadTodayLog = useCallback(async (uid: string) => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data, error: logError } = await supabase.from("food_log")
      .select("id, logged_at, meal_type, foods, total_kcal, total_protein, total_carbs, total_fat, source")
      .eq("client_id", uid)
      .gte("logged_at", today + "T00:00:00").lte("logged_at", today + "T23:59:59")
      .order("logged_at", { ascending: false });

    if (logError) { toast.error("Error al cargar el registro de comidas de hoy"); console.error("[useCaloriesPage] food_log:", logError); return; }

    if (data) {
      const entries = data as FoodLogEntry[];
      setTodayLog(entries);
      setDailyTotals(entries.reduce(
        (acc, e) => ({ kcal: acc.kcal + Number(e.total_kcal), protein: acc.protein + Number(e.total_protein), carbs: acc.carbs + Number(e.total_carbs), fat: acc.fat + Number(e.total_fat) }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      ));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.user) { setError("No se pudo obtener la sesion del usuario."); setLoading(false); return; }
        const user = session.user;
        setUserId(user.id);
        await loadTodayLog(user.id);
      } catch { setError("Error al cargar los datos."); }
      finally { setLoading(false); }
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
    // Mock — production calls analyze-food-image Edge Function
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAnalyzedFoods([
      { name: "Pechuga de pollo a la plancha", portion_g: 150, kcal: 248, protein: 46.5, carbs: 0, fat: 5.4 },
      { name: "Arroz integral", portion_g: 200, kcal: 232, protein: 4.8, carbs: 48.6, fat: 1.8 },
      { name: "Ensalada mixta", portion_g: 120, kcal: 24, protein: 1.4, carbs: 4.2, fat: 0.3 },
    ]);
    setAnalyzing(false);
  };

  const handlePortionChange = (index: number, newPortion: number) => {
    setAnalyzedFoods((prev) => prev.map((food, i) => {
      if (i !== index) return food;
      const ratio = newPortion / food.portion_g;
      return { ...food, portion_g: newPortion, kcal: Math.round(food.kcal * ratio), protein: Math.round(food.protein * ratio * 10) / 10, carbs: Math.round(food.carbs * ratio * 10) / 10, fat: Math.round(food.fat * ratio * 10) / 10 };
    }));
  };

  const handleSave = async () => {
    if (!userId || analyzedFoods.length === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const totalKcal = analyzedFoods.reduce((s, f) => s + f.kcal, 0);
      const totalProtein = analyzedFoods.reduce((s, f) => s + f.protein, 0);
      const totalCarbs = analyzedFoods.reduce((s, f) => s + f.carbs, 0);
      const totalFat = analyzedFoods.reduce((s, f) => s + f.fat, 0);

      const { error: insertError } = await supabase.from("food_log").insert({
        client_id: userId, meal_type: selectedMealType, foods: analyzedFoods,
        total_kcal: totalKcal, total_protein: totalProtein, total_carbs: totalCarbs, total_fat: totalFat, source: "ai_vision",
      });
      if (insertError) { setError("Error al guardar el registro."); setSaving(false); return; }

      setSaveSuccess(true);
      setAnalyzedFoods([]);
      setSelectedImage(null);
      setImagePreview(null);
      await loadTodayLog(userId);
    } catch { setError("Error inesperado al guardar."); }
    finally { setSaving(false); }
  };

  const clearImage = () => { setSelectedImage(null); setImagePreview(null); setAnalyzedFoods([]); };

  return {
    loading, error, setError,
    selectedImage, imagePreview, analyzing, dragOver, setDragOver, fileInputRef,
    analyzedFoods, selectedMealType, setSelectedMealType, saving, saveSuccess,
    todayLog, dailyTotals,
    handleFileSelect, handleDrop, handleAnalyze, handlePortionChange, handleSave, clearImage,
  };
}
