import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { supabase } from "../../lib/supabase";
import { colors, spacing, radius, fonts, shadows } from "../../theme";

interface RemainingMacros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealSuggestion {
  name: string;
  description: string;
  ingredients: string[];
  estimated_macros: { kcal: number; protein: number; carbs: number; fat: number };
  prep_time_min: number;
  difficulty: "facil" | "medio" | "avanzado";
}

interface FridgeAnalysisProps {
  userId: string;
  remainingMacros: RemainingMacros;
  alreadyEatenToday: string[];
  selectedMealType: string;
  onSaved: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  facil: "#00C853",
  medio: "#FF9100",
  avanzado: "#FF1744",
};

export default function FridgeAnalysis({
  userId,
  remainingMacros,
  alreadyEatenToday,
  selectedMealType,
  onSaved,
}: FridgeAnalysisProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [identifiedItems, setIdentifiedItems] = useState<string[]>([]);
  const [context, setContext] = useState<string | null>(null);

  const takeFridgePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a la camara para fotografiar tu nevera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setSuggestions([]);
      setIdentifiedItems([]);
      setContext(null);
    }
  }, []);

  const pickFridgeImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setSuggestions([]);
      setIdentifiedItems([]);
      setContext(null);
    }
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-meal-from-image", {
        body: {
          image_base64: imageBase64,
          remaining_macros: remainingMacros,
          already_eaten_today: alreadyEatenToday,
        },
      });

      if (error) {
        Alert.alert("Error", "No se pudo analizar la imagen. Intentalo de nuevo.");
        console.error("[FridgeAnalysis] suggest-meal-from-image:", error);
        return;
      }

      if (data?.error) {
        Alert.alert("Error", data.error);
        return;
      }

      setSuggestions(data.suggestions ?? []);
      setIdentifiedItems(data.identified_items ?? []);
      setContext(data.context ?? null);
    } catch {
      Alert.alert("Error", "Error inesperado al analizar la imagen.");
    } finally {
      setAnalyzing(false);
    }
  }, [imageBase64, remainingMacros, alreadyEatenToday]);

  const saveSuggestion = useCallback(async (suggestion: MealSuggestion) => {
    setSaving(true);
    try {
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
        Alert.alert("Error", "No se pudo guardar en el registro.");
        console.error("[FridgeAnalysis] food_log insert:", insertError);
        return;
      }

      Alert.alert("Guardado", `${suggestion.name} registrado correctamente.`);
      onSaved();
    } catch {
      Alert.alert("Error", "Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  }, [userId, selectedMealType, onSaved]);

  const clearImage = useCallback(() => {
    setImageUri(null);
    setImageBase64(null);
    setSuggestions([]);
    setIdentifiedItems([]);
    setContext(null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Remaining macros */}
      <View style={styles.macroCard}>
        <Text style={styles.macroLabel}>MACROS RESTANTES HOY</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroCell}>
            <Text style={[styles.macroValue, { color: colors.white }]}>{Math.round(remainingMacros.kcal)}</Text>
            <Text style={styles.macroCellLabel}>kcal</Text>
          </View>
          <View style={styles.macroCell}>
            <Text style={[styles.macroValue, { color: colors.cyan }]}>{Math.round(remainingMacros.protein)}g</Text>
            <Text style={styles.macroCellLabel}>Prot</Text>
          </View>
          <View style={styles.macroCell}>
            <Text style={[styles.macroValue, { color: colors.orange }]}>{Math.round(remainingMacros.carbs)}g</Text>
            <Text style={styles.macroCellLabel}>Carbs</Text>
          </View>
          <View style={styles.macroCell}>
            <Text style={[styles.macroValue, { color: colors.violet }]}>{Math.round(remainingMacros.fat)}g</Text>
            <Text style={styles.macroCellLabel}>Grasa</Text>
          </View>
        </View>
      </View>

      {/* Image area */}
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          <TouchableOpacity style={styles.clearButton} onPress={clearImage} activeOpacity={0.8}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M6 18L18 6M6 6l12 12" stroke={colors.white} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.captureMain} onPress={takeFridgePhoto} activeOpacity={0.85}>
            <LinearGradient colors={["#7C3AED", "#00E5FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.captureGradient}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  stroke={colors.white}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.captureMainText}>Foto nevera</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureSecondary} onPress={pickFridgeImage} activeOpacity={0.8}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                stroke={colors.white}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.captureSecondaryText}>Galeria</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analyze button */}
      {imageBase64 && suggestions.length === 0 && (
        <TouchableOpacity
          style={[styles.analyzeButton, analyzing && { opacity: 0.6 }]}
          onPress={analyzeImage}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#7C3AED", "#00E5FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.analyzeGradient}>
            {analyzing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.analyzeText}>Sugerir comidas con IA</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Identified items */}
      {identifiedItems.length > 0 && (
        <View style={styles.identifiedCard}>
          <Text style={styles.sectionLabel}>INGREDIENTES IDENTIFICADOS</Text>
          <View style={styles.chipRow}>
            {identifiedItems.map((item, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
          </View>
          {context ? <Text style={styles.contextText}>{context}</Text> : null}
        </View>
      )}

      {/* Suggestions */}
      {suggestions.map((s, i) => (
        <View key={i} style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.suggestionName}>{s.name}</Text>
              <Text style={styles.suggestionDesc}>{s.description}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.suggestionKcal}>{Math.round(s.estimated_macros.kcal)}</Text>
              <Text style={styles.kcalUnit}>kcal</Text>
            </View>
          </View>

          <View style={styles.suggestionMacros}>
            <View style={styles.suggestionMacroCell}>
              <Text style={[styles.suggestionMacroVal, { color: colors.cyan }]}>{Math.round(s.estimated_macros.protein)}g</Text>
              <Text style={styles.suggestionMacroLbl}>Prot</Text>
            </View>
            <View style={styles.suggestionMacroCell}>
              <Text style={[styles.suggestionMacroVal, { color: colors.orange }]}>{Math.round(s.estimated_macros.carbs)}g</Text>
              <Text style={styles.suggestionMacroLbl}>Carbs</Text>
            </View>
            <View style={styles.suggestionMacroCell}>
              <Text style={[styles.suggestionMacroVal, { color: colors.violet }]}>{Math.round(s.estimated_macros.fat)}g</Text>
              <Text style={styles.suggestionMacroLbl}>Grasa</Text>
            </View>
          </View>

          <Text style={styles.ingredientsLabel}>INGREDIENTES</Text>
          <View style={styles.chipRow}>
            {s.ingredients.map((ing, j) => (
              <View key={j} style={styles.ingredientChip}>
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>

          <View style={styles.suggestionFooter}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={styles.timeText}>{s.prep_time_min} min</Text>
              <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[s.difficulty] ?? colors.muted }]}>
                {s.difficulty === "facil" ? "Facil" : s.difficulty === "medio" ? "Medio" : "Avanzado"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={() => saveSuggestion(s)}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.bg} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  macroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  macroLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.sm },
  macroRow: { flexDirection: "row", justifyContent: "space-around" },
  macroCell: { alignItems: "center" },
  macroValue: { fontSize: 14, fontFamily: fonts.extraBold },
  macroCellLabel: { fontSize: 9, fontFamily: fonts.medium, color: colors.dimmed, letterSpacing: 1, marginTop: 2 },
  captureRow: { flexDirection: "row", gap: spacing.md },
  captureMain: { flex: 2, borderRadius: radius.lg, overflow: "hidden", ...shadows.glow(colors.violet) },
  captureGradient: { paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  captureMainText: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.white },
  captureSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 18,
  },
  captureSecondaryText: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  imageContainer: { borderRadius: radius.xl, overflow: "hidden", position: "relative" },
  image: { width: "100%", height: 200 },
  clearButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzeButton: { borderRadius: radius.lg, overflow: "hidden", ...shadows.glow(colors.violet) },
  analyzeGradient: { paddingVertical: 16, alignItems: "center" },
  analyzeText: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  identifiedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: colors.violetDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11, fontFamily: fonts.medium, color: colors.violet },
  contextText: { fontSize: 12, color: colors.muted, marginTop: spacing.sm, lineHeight: 18 },
  suggestionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  suggestionHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  suggestionName: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  suggestionDesc: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 18 },
  suggestionKcal: { fontSize: 20, fontFamily: fonts.extraBold, color: colors.cyan },
  kcalUnit: { fontSize: 9, color: colors.dimmed, letterSpacing: 1 },
  suggestionMacros: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  suggestionMacroCell: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: "center",
  },
  suggestionMacroVal: { fontSize: 12, fontFamily: fonts.extraBold },
  suggestionMacroLbl: { fontSize: 9, color: colors.dimmed, letterSpacing: 1, marginTop: 2 },
  ingredientsLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginTop: spacing.md, marginBottom: 6 },
  ingredientChip: { backgroundColor: colors.surfaceHover, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  ingredientText: { fontSize: 11, fontFamily: fonts.medium, color: colors.muted },
  suggestionFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg },
  timeText: { fontSize: 12, color: colors.muted, fontFamily: fonts.medium },
  difficultyText: { fontSize: 12, fontFamily: fonts.bold },
  saveButton: {
    backgroundColor: colors.cyan,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  saveButtonText: { fontSize: 12, fontFamily: fonts.bold, color: colors.bg },
});
