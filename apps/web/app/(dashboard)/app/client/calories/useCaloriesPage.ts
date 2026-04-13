"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { MealSuggestion } from "./components/MealSuggestionCard";

export type CaloriesTab = "analizar" | "nevera" | "buffet";

export interface FoodItem {
  name: string; portion_g: number;
  kcal: number; protein: number; carbs: number; fat: number;
  fiber?: number; confidence?: number;
}

export interface FoodLogEntry {
  id: string; logged_at: string; meal_type: string;
  foods: FoodItem[]; total_kcal: number; total_protein: number;
  total_carbs: number; total_fat: number; source: string;
}

interface TargetMacros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function useCaloriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CaloriesTab>("analizar");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analyzedFoods, setAnalyzedFoods] = useState<FoodItem[]>([]);
  const [aiRawResponse, setAiRawResponse] = useState<Record<string, unknown> | null>(null);
  const [selectedMealType, setSelectedMealType] = useState("comida");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingSuggestion, setSavingSuggestion] = useState(false);

  const [todayLog, setTodayLog] = useState<FoodLogEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const [targetMacros, setTargetMacros] = useState<TargetMacros>({ kcal: 2000, protein: 150, carbs: 250, fat: 65 });

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

  const loadTargetMacros = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data, error: mpError } = await supabase.from("meal_plans")
      .select("target_kcal, days")
      .eq("client_id", uid)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (mpError) { console.error("[useCaloriesPage] meal_plans:", mpError); return; }

    if (data?.target_kcal) {
      // Estimate macro split from target_kcal: 30% protein, 40% carbs, 30% fat
      const kcal = data.target_kcal;
      setTargetMacros({
        kcal,
        protein: Math.round((kcal * 0.3) / 4),
        carbs: Math.round((kcal * 0.4) / 4),
        fat: Math.round((kcal * 0.3) / 9),
      });
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
        await Promise.all([loadTodayLog(user.id), loadTargetMacros(user.id)]);
      } catch { setError("Error al cargar los datos."); }
      finally { setLoading(false); }
    };
    init();
  }, [loadTodayLog, loadTargetMacros]);

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
    try {
      const supabase = createClient();

      // Convert File to base64
      const buffer = await selectedImage.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const image_base64 = btoa(binary);

      const { data, error: fnError } = await supabase.functions.invoke("analyze-food-image", {
        body: { image_base64, meal_type: selectedMealType },
      });

      if (fnError) {
        toast.error("Error al analizar la imagen con IA");
        console.error("[useCaloriesPage] analyze-food-image:", fnError);
        return;
      }

      if (!data?.foods || !Array.isArray(data.foods) || data.foods.length === 0) {
        toast.error("No se detectaron alimentos en la imagen");
        return;
      }

      setAiRawResponse(data);
      setAnalyzedFoods(data.foods as FoodItem[]);
    } catch {
      toast.error("Error inesperado al analizar la imagen");
    } finally {
      setAnalyzing(false);
    }
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
        total_kcal: totalKcal, total_protein: totalProtein, total_carbs: totalCarbs, total_fat: totalFat,
        source: "ai_vision", ai_raw: aiRawResponse,
      });
      if (insertError) { toast.error("Error al guardar el registro de comida"); console.error("[useCaloriesPage] food_log insert:", insertError); setSaving(false); return; }

      setSaveSuccess(true);
      setAnalyzedFoods([]);
      setAiRawResponse(null);
      setSelectedImage(null);
      setImagePreview(null);
      await loadTodayLog(userId);
    } catch { toast.error("Error inesperado al guardar el registro"); }
    finally { setSaving(false); }
  };

  const clearImage = () => { setSelectedImage(null); setImagePreview(null); setAnalyzedFoods([]); setAiRawResponse(null); };

  // Remaining macros: target - already eaten
  const remainingMacros = {
    kcal: Math.max(0, targetMacros.kcal - dailyTotals.kcal),
    protein: Math.max(0, targetMacros.protein - dailyTotals.protein),
    carbs: Math.max(0, targetMacros.carbs - dailyTotals.carbs),
    fat: Math.max(0, targetMacros.fat - dailyTotals.fat),
  };

  // Names of foods already eaten today for context
  const alreadyEatenToday = todayLog.flatMap(
    (entry) => (entry.foods as FoodItem[]).map((f) => f.name)
  );

  const invokeSuggestMeal = useCallback(async (params: {
    image_base64: string;
    remaining_macros: { kcal: number; protein: number; carbs: number; fat: number };
    dietary_preferences?: string;
    already_eaten_today?: string[];
  }): Promise<{ suggestions: MealSuggestion[]; identified_items: string[]; context: string } | null> => {
    const supabase = createClient();
    const { data, error: fnError } = await supabase.functions.invoke("suggest-meal-from-image", {
      body: params,
    });

    if (fnError) {
      toast.error("Error al comunicarse con el servicio de IA");
      console.error("[useCaloriesPage] suggest-meal-from-image:", fnError);
      return null;
    }

    if (data?.error) {
      toast.error(data.error);
      return null;
    }

    return data as { suggestions: MealSuggestion[]; identified_items: string[]; context: string };
  }, []);

  const handleSaveSuggestion = useCallback(async (suggestion: MealSuggestion) => {
    if (!userId) return;
    setSavingSuggestion(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("food_log").insert({
        client_id: userId,
        meal_type: selectedMealType,
        foods: [{
          name: suggestion.name,
          portion_g: 0,
          kcal: suggestion.estimated_macros.kcal,
          protein: suggestion.estimated_macros.protein,
          carbs: suggestion.estimated_macros.carbs,
          fat: suggestion.estimated_macros.fat,
        }],
        total_kcal: suggestion.estimated_macros.kcal,
        total_protein: suggestion.estimated_macros.protein,
        total_carbs: suggestion.estimated_macros.carbs,
        total_fat: suggestion.estimated_macros.fat,
        source: "ai_suggestion",
      });

      if (insertError) {
        toast.error("Error al guardar la sugerencia en el registro");
        console.error("[useCaloriesPage] suggestion save:", insertError);
        return;
      }

      toast.success("Comida guardada en el registro");
      await loadTodayLog(userId);
    } catch {
      toast.error("Error inesperado al guardar la sugerencia");
    } finally {
      setSavingSuggestion(false);
    }
  }, [userId, selectedMealType, loadTodayLog]);

  return {
    loading, error, setError,
    activeTab, setActiveTab,
    selectedImage, imagePreview, analyzing, dragOver, setDragOver, fileInputRef,
    analyzedFoods, selectedMealType, setSelectedMealType, saving, saveSuccess,
    savingSuggestion,
    todayLog, dailyTotals,
    remainingMacros, alreadyEatenToday,
    handleFileSelect, handleDrop, handleAnalyze, handlePortionChange, handleSave, clearImage,
    invokeSuggestMeal, handleSaveSuggestion,
  };
}
