import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows } from "../theme";

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
      {/* Hero summary card */}
      <View style={styles.heroCard}>
        <LinearGradient
          colors={["rgba(0, 229, 255, 0.08)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.heroLabel}>HOY</Text>
        <Text style={styles.heroKcal}>{Math.round(totalKcal)}</Text>
        <Text style={styles.heroUnit}>kilocalorías</Text>

        {/* Macro bars */}
        <View style={styles.macroGrid}>
          {[
            { label: "PROTEÍNA", value: totalProtein, color: colors.cyan, unit: "g" },
            { label: "CARBOS", value: totalCarbs, color: colors.orange, unit: "g" },
            { label: "GRASA", value: totalFat, color: colors.violet, unit: "g" },
          ].map((m) => (
            <View key={m.label} style={styles.macroCell}>
              <View style={[styles.macroBar, { backgroundColor: m.color }]} />
              <Text style={[styles.macroValue, { color: m.color }]}>
                {Math.round(m.value)}{m.unit}
              </Text>
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Meal type pills */}
      <Text style={styles.sectionLabel}>TIPO DE COMIDA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        {Object.entries(MEAL_LABELS).map(([key, label]) => {
          const active = selectedMealType === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedMealType(key)}
              style={[styles.pill, active && styles.pillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Capture actions */}
      <View style={styles.captureRow}>
        <TouchableOpacity
          style={styles.captureMain}
          onPress={takePhoto}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#00E5FF", "#00B8D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.captureGradient}
          >
            {analyzing ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                    stroke={colors.bg}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.captureMainText}>Escanear</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureSecondary}
          onPress={pickImage}
          disabled={analyzing}
          activeOpacity={0.8}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              stroke={colors.white}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.captureSecondaryText}>Galería</Text>
        </TouchableOpacity>
      </View>

      {/* Today's log */}
      <Text style={styles.sectionLabel}>REGISTRO DEL DÍA</Text>
      {loading ? (
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 20 }} />
      ) : todayLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513"
                stroke={colors.dimmed}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={styles.emptyText}>Sin registros hoy</Text>
          <Text style={styles.emptySubtext}>Escanea tu primera comida</Text>
        </View>
      ) : (
        todayLogs.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logLeft}>
              <View style={styles.logTimeBox}>
                <Text style={styles.logTime}>
                  {new Date(log.logged_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <View>
                <Text style={styles.logMealType}>{MEAL_LABELS[log.meal_type] || log.meal_type}</Text>
                <View style={styles.logMacroRow}>
                  <Text style={[styles.logMacro, { color: colors.cyan }]}>P:{Math.round(log.total_protein)}g</Text>
                  <Text style={[styles.logMacro, { color: colors.orange }]}>C:{Math.round(log.total_carbs)}g</Text>
                  <Text style={[styles.logMacro, { color: colors.violet }]}>G:{Math.round(log.total_fat)}g</Text>
                </View>
              </View>
            </View>
            <View style={styles.logRight}>
              <Text style={styles.logKcal}>{Math.round(log.total_kcal)}</Text>
              <Text style={styles.logKcalUnit}>kcal</Text>
              {log.source === "ai_vision" && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>IA</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderActive,
    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xxl,
    overflow: "hidden",
    ...shadows.card,
  },
  heroLabel: { fontSize: 10, fontWeight: "700", color: colors.dimmed, letterSpacing: 3, marginBottom: 8 },
  heroKcal: { fontSize: 56, fontWeight: "900", color: colors.cyan, letterSpacing: -3 },
  heroUnit: { fontSize: 12, color: colors.muted, letterSpacing: 2, marginBottom: spacing.xl },

  // Macros
  macroGrid: { flexDirection: "row", width: "100%", justifyContent: "space-around" },
  macroCell: { alignItems: "center", gap: 6 },
  macroBar: { width: 3, height: 16, borderRadius: 2 },
  macroValue: { fontSize: 16, fontWeight: "800" },
  macroLabel: { fontSize: 9, fontWeight: "700", color: colors.dimmed, letterSpacing: 1.5 },

  // Section
  sectionLabel: { fontSize: 10, fontWeight: "700", color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.md },

  // Pills
  pillScroll: { marginBottom: spacing.xl },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.cyanDim,
    borderColor: colors.cyanGlow,
  },
  pillText: { fontSize: 13, color: colors.muted, fontWeight: "500" },
  pillTextActive: { color: colors.cyan, fontWeight: "700" },

  // Capture
  captureRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xxl },
  captureMain: {
    flex: 2,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.glow(colors.cyan),
  },
  captureGradient: {
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  captureMainText: { fontSize: 15, fontWeight: "800", color: colors.bg },
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
  captureSecondaryText: { fontSize: 14, fontWeight: "700", color: colors.white },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.section,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  emptySubtext: { fontSize: 12, color: colors.dimmed, marginTop: 4 },

  // Log entries
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  logTimeBox: {
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logTime: { fontSize: 10, fontWeight: "700", color: colors.dimmed, letterSpacing: 0.5 },
  logMealType: { fontSize: 14, fontWeight: "700", color: colors.white },
  logMacroRow: { flexDirection: "row", gap: 8, marginTop: 3 },
  logMacro: { fontSize: 11, fontWeight: "600" },
  logRight: { alignItems: "flex-end" },
  logKcal: { fontSize: 20, fontWeight: "800", color: colors.white },
  logKcalUnit: { fontSize: 10, color: colors.dimmed, letterSpacing: 1 },
  aiBadge: {
    backgroundColor: colors.violetDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  aiBadgeText: { fontSize: 9, fontWeight: "700", color: colors.violet, letterSpacing: 1 },
});
