import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";

interface UseAnalyzeImageArgs {
  userId: string | undefined;
  mealType: string;
  onAnalyzed: () => Promise<void> | void;
}

export function useAnalyzeImage({ userId, mealType, onAnalyzed }: UseAnalyzeImageArgs) {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeImage = async (base64: string) => {
    if (!userId) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food-image", {
        body: { image_base64: base64, meal_type: mealType },
      });
      if (error) throw error;

      if (data?.foods) {
        const { error: insertError } = await supabase.from("food_log").insert({
          client_id: userId,
          meal_type: mealType,
          foods: data.foods,
          total_kcal: data.total_kcal,
          total_protein: data.total_protein,
          total_carbs: data.total_carbs,
          total_fat: data.total_fat,
          source: "ai_vision",
          ai_raw: data,
        });
        if (insertError) {
          Alert.alert("Error", "No se pudo guardar el registro de comida");
          return;
        }

        await onAnalyzed();
        Alert.alert(
          "Analizado",
          `${data.foods.length} alimentos detectados (${Math.round(data.total_kcal)} kcal)`
        );
      }
    } catch {
      Alert.alert("Error", "No se pudo analizar la imagen. Intentalo de nuevo.");
    } finally {
      setAnalyzing(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso necesario",
        "Necesitamos acceso a la camara para analizar tu comida."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      analyzeImage(result.assets[0].base64);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      analyzeImage(result.assets[0].base64);
    }
  };

  return { analyzing, takePhoto, pickImage };
}
