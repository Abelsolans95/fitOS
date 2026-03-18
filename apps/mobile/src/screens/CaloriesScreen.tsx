import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";

interface FoodLogEntry {
  id: string;
  logged_at: string;
  meal_type: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  source: string;
  photo_url: string | null;
}

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

export default function CaloriesScreen() {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("comida");

  const today = new Date().toISOString().split("T")[0];

  const loadTodayLogs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("food_log")
      .select("*")
      .eq("client_id", user.id)
      .gte("logged_at", today)
      .lte("logged_at", today + "T23:59:59")
      .order("logged_at", { ascending: true });

    if (data) setTodayLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTodayLogs();
  }, [user]);

  const totalKcal = todayLogs.reduce((sum, l) => sum + (l.total_kcal || 0), 0);
  const totalProtein = todayLogs.reduce((sum, l) => sum + (l.total_protein || 0), 0);
  const totalCarbs = todayLogs.reduce((sum, l) => sum + (l.total_carbs || 0), 0);
  const totalFat = todayLogs.reduce((sum, l) => sum + (l.total_fat || 0), 0);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a la cámara para analizar tu comida.");
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

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food-image", {
        body: { image_base64: base64, meal_type: selectedMealType },
      });

      if (error) throw error;

      if (data && data.foods) {
        // Save to food_log
        await supabase.from("food_log").insert({
          client_id: user!.id,
          meal_type: selectedMealType,
          foods: data.foods,
          total_kcal: data.total_kcal,
          total_protein: data.total_protein,
          total_carbs: data.total_carbs,
          total_fat: data.total_fat,
          source: "ai_vision",
          ai_raw: data,
        });

        await loadTodayLogs();
        Alert.alert("Analizado", `${data.foods.length} alimentos detectados (${Math.round(data.total_kcal)} kcal)`);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo analizar la imagen. Inténtalo de nuevo.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Today summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Hoy</Text>
        <Text style={styles.summaryKcal}>{Math.round(totalKcal)}</Text>
        <Text style={styles.summaryUnit}>kcal consumidas</Text>

        <View style={styles.macrosRow}>
          {[
            { label: "Proteína", value: totalProtein, color: colors.cyan, unit: "g" },
            { label: "Carbos", value: totalCarbs, color: colors.orange, unit: "g" },
            { label: "Grasa", value: totalFat, color: colors.violet, unit: "g" },
          ].map((m) => (
            <View key={m.label} style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: m.color }]} />
              <Text style={styles.macroValue}>{Math.round(m.value)}{m.unit}</Text>
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Meal type selector */}
      <Text style={styles.sectionTitle}>Tipo de comida</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTypesScroll}>
        {Object.entries(MEAL_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSelectedMealType(key)}
            style={[
              styles.mealTypePill,
              selectedMealType === key && styles.mealTypePillActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.mealTypePillText,
                selectedMealType === key && styles.mealTypePillTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Capture buttons */}
      <View style={styles.captureRow}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePhoto}
          disabled={analyzing}
          activeOpacity={0.8}
        >
          {analyzing ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <>
              <Text style={styles.captureIcon}>📸</Text>
              <Text style={styles.captureText}>Foto</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.captureButton, styles.captureButtonSecondary]}
          onPress={pickImage}
          disabled={analyzing}
          activeOpacity={0.8}
        >
          <Text style={styles.captureIcon}>🖼️</Text>
          <Text style={[styles.captureText, { color: colors.white }]}>Galería</Text>
        </TouchableOpacity>
      </View>

      {/* Today's log */}
      <Text style={styles.sectionTitle}>Registro del día</Text>
      {loading ? (
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 20 }} />
      ) : todayLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>Aún no has registrado comidas hoy</Text>
          <Text style={styles.emptySubtext}>Toma una foto o añade manualmente</Text>
        </View>
      ) : (
        todayLogs.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logMealType}>{MEAL_LABELS[log.meal_type] || log.meal_type}</Text>
              <View style={styles.logSourceBadge}>
                <Text style={styles.logSourceText}>
                  {log.source === "ai_vision" ? "IA" : "Manual"}
                </Text>
              </View>
            </View>
            <View style={styles.logMacros}>
              <Text style={styles.logKcal}>{Math.round(log.total_kcal)} kcal</Text>
              <Text style={styles.logMacro}>P:{Math.round(log.total_protein)}g</Text>
              <Text style={styles.logMacro}>C:{Math.round(log.total_carbs)}g</Text>
              <Text style={styles.logMacro}>G:{Math.round(log.total_fat)}g</Text>
            </View>
            <Text style={styles.logTime}>
              {new Date(log.logged_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 100 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  summaryTitle: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  summaryKcal: { fontSize: 48, fontWeight: "800", color: colors.cyan },
  summaryUnit: { fontSize: 13, color: colors.muted, marginBottom: 20 },
  macrosRow: { flexDirection: "row", gap: 24 },
  macroItem: { alignItems: "center", gap: 4 },
  macroDot: { width: 6, height: 6, borderRadius: 3 },
  macroValue: { fontSize: 16, fontWeight: "700", color: colors.white },
  macroLabel: { fontSize: 11, color: colors.muted },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 12,
  },
  mealTypesScroll: { marginBottom: 20 },
  mealTypePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  mealTypePillActive: {
    backgroundColor: colors.cyan + "20",
    borderColor: colors.cyan + "50",
  },
  mealTypePillText: { fontSize: 13, color: colors.muted },
  mealTypePillTextActive: { color: colors.cyan, fontWeight: "600" },
  captureRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  captureButton: {
    flex: 1,
    backgroundColor: colors.cyan,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  captureButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captureIcon: { fontSize: 20 },
  captureText: { fontSize: 15, fontWeight: "700", color: colors.bg },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.muted },
  emptySubtext: { fontSize: 12, color: colors.muted + "80", marginTop: 4 },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 8,
  },
  logHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  logMealType: { fontSize: 14, fontWeight: "600", color: colors.white },
  logSourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.violet + "20",
  },
  logSourceText: { fontSize: 10, fontWeight: "600", color: colors.violet },
  logMacros: { flexDirection: "row", gap: 12, alignItems: "baseline" },
  logKcal: { fontSize: 18, fontWeight: "700", color: colors.cyan },
  logMacro: { fontSize: 12, color: colors.muted },
  logTime: { fontSize: 11, color: colors.muted + "80", marginTop: 8 },
});
