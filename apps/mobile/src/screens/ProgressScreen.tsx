import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows , fonts} from "../theme";

interface BodyMetric {
  id: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  notes: string | null;
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("body_metrics")
      .select("id, recorded_at, weight_kg, body_fat_pct, muscle_mass_kg, notes")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(30);
    if (data) setMetrics(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!weight && !bodyFat && !muscleMass) {
      Alert.alert("Error", "Rellena al menos un campo");
      return;
    }
    setSaving(true);

    const payload: Record<string, unknown> = {
      user_id: user.id,
      recorded_at: new Date().toISOString(),
    };
    if (weight) payload.weight_kg = parseFloat(weight);
    if (bodyFat) payload.body_fat_pct = parseFloat(bodyFat);
    if (muscleMass) payload.muscle_mass_kg = parseFloat(muscleMass);
    if (notes) payload.notes = notes;

    const { error } = await supabase.from("body_metrics").insert(payload);
    if (error) {
      Alert.alert("Error", "No se pudo guardar la medición");
    } else {
      setWeight(""); setBodyFat(""); setMuscleMass(""); setNotes("");
      setShowForm(false);
      await loadMetrics();
    }
    setSaving(false);
  };

  // Trends
  const latestWeight = metrics.find((m) => m.weight_kg !== null);
  const previousWeight = metrics.filter((m) => m.weight_kg !== null)[1];
  const weightDiff =
    latestWeight?.weight_kg && previousWeight?.weight_kg
      ? latestWeight.weight_kg - previousWeight.weight_kg : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Progreso</Text>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          style={styles.addButton}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#00E5FF", "#00B8D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12 4.5v15m7.5-7.5h-15" stroke={colors.bg} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.addButtonText}>Medir</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stat cards - bento grid */}
      <View style={styles.statsGrid}>
        {/* Weight - large */}
        <View style={[styles.statCard, styles.statLarge]}>
          <Text style={styles.statLabel}>PESO ACTUAL</Text>
          <Text style={styles.statValue}>
            {latestWeight?.weight_kg ? `${latestWeight.weight_kg}` : "—"}
          </Text>
          {latestWeight?.weight_kg && <Text style={styles.statUnit}>kg</Text>}
          {weightDiff !== null && (
            <View style={[
              styles.trendBadge,
              { backgroundColor: weightDiff > 0 ? colors.orangeDim : weightDiff < 0 ? colors.greenDim : colors.surfaceHover },
            ]}>
              <Text style={[
                styles.trendText,
                { color: weightDiff > 0 ? colors.orange : weightDiff < 0 ? colors.green : colors.muted },
              ]}>
                {weightDiff > 0 ? "↑" : "↓"} {Math.abs(weightDiff).toFixed(1)} kg
              </Text>
            </View>
          )}
        </View>

        {/* Side stats */}
        <View style={styles.statsColumn}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>GRASA</Text>
            <Text style={[styles.statValueSmall, { color: colors.orange }]}>
              {metrics.find((m) => m.body_fat_pct)?.body_fat_pct
                ? `${metrics.find((m) => m.body_fat_pct)!.body_fat_pct}%`
                : "—"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MÚSCULO</Text>
            <Text style={[styles.statValueSmall, { color: colors.violet }]}>
              {metrics.find((m) => m.muscle_mass_kg)?.muscle_mass_kg
                ? `${metrics.find((m) => m.muscle_mass_kg)!.muscle_mass_kg}kg`
                : "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* New metric form */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nueva medición</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>PESO (KG)</Text>
              <TextInput
                style={styles.formInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.dimmed}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>GRASA (%)</Text>
              <TextInput
                style={styles.formInput}
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.dimmed}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>MÚSCULO (KG)</Text>
              <TextInput
                style={styles.formInput}
                value={muscleMass}
                onChangeText={setMuscleMass}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.dimmed}
              />
            </View>
          </View>
          <TextInput
            style={[styles.formInput, { marginTop: 8 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas (opcional)"
            placeholderTextColor={colors.dimmed}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#00E5FF", "#00B8D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              {saving ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* History */}
      <Text style={styles.sectionLabel}>HISTORIAL</Text>
      {metrics.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sin mediciones registradas</Text>
        </View>
      ) : (
        metrics.map((m, index) => (
          <View key={m.id} style={[styles.historyCard, index === 0 && styles.historyCardFirst]}>
            <View style={styles.historyLeft}>
              <View style={styles.historyDateBox}>
                <Text style={styles.historyDay}>
                  {new Date(m.recorded_at).getDate()}
                </Text>
                <Text style={styles.historyMonth}>
                  {new Date(m.recorded_at).toLocaleDateString("es-ES", { month: "short" }).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <View style={styles.historyValues}>
                {m.weight_kg !== null && (
                  <View style={styles.historyMetric}>
                    <View style={[styles.historyDot, { backgroundColor: colors.cyan }]} />
                    <Text style={[styles.historyValue, { color: colors.cyan }]}>{m.weight_kg} kg</Text>
                  </View>
                )}
                {m.body_fat_pct !== null && (
                  <View style={styles.historyMetric}>
                    <View style={[styles.historyDot, { backgroundColor: colors.orange }]} />
                    <Text style={[styles.historyValue, { color: colors.orange }]}>{m.body_fat_pct}%</Text>
                  </View>
                )}
                {m.muscle_mass_kg !== null && (
                  <View style={styles.historyMetric}>
                    <View style={[styles.historyDot, { backgroundColor: colors.violet }]} />
                    <Text style={[styles.historyValue, { color: colors.violet }]}>{m.muscle_mass_kg} kg</Text>
                  </View>
                )}
              </View>
              {m.notes && <Text style={styles.historyNotes}>{m.notes}</Text>}
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
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xxl },
  title: { fontSize: 28, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, letterSpacing: -0.5 },
  addButton: { borderRadius: radius.md, overflow: "hidden", ...shadows.glow(colors.cyan) },
  addButtonGradient: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  addButtonText: { fontSize: 14, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.bg },

  // Stats bento
  statsGrid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xxl },
  statLarge: { flex: 1.2, justifyContent: "center" },
  statsColumn: { flex: 1, gap: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
    ...shadows.subtle,
  },
  statLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: 8 },
  statValue: { fontSize: 36, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, letterSpacing: -1 },
  statUnit: { fontSize: 14, color: colors.muted, fontFamily: fonts.medium, marginTop: -2 },
  statValueSmall: { fontSize: 22, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  trendBadge: {
    alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, marginTop: 8,
  },
  trendText: { fontSize: 12, fontFamily: fonts.bold },

  // Form
  formCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderActive,
    padding: spacing.xl, marginBottom: spacing.xxl,
    ...shadows.card,
  },
  formTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.white, marginBottom: spacing.md },
  formRow: { flexDirection: "row", gap: spacing.sm },
  formField: { flex: 1 },
  formLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1.5, marginBottom: 4 },
  formInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: colors.white,
  },
  saveButton: { borderRadius: radius.md, overflow: "hidden", marginTop: spacing.md },
  saveGradient: { paddingVertical: 14, alignItems: "center" },
  saveButtonText: { fontSize: 15, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.bg },

  // Section
  sectionLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.md },
  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyText: { color: colors.muted, fontSize: 14 },

  // History
  historyCard: {
    flexDirection: "row", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  historyCardFirst: { borderColor: colors.borderActive },
  historyLeft: {},
  historyDateBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.surfaceHover,
    alignItems: "center", justifyContent: "center",
  },
  historyDay: { fontSize: 16, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, lineHeight: 18 },
  historyMonth: { fontSize: 8, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1 },
  historyRight: { flex: 1, justifyContent: "center" },
  historyValues: { flexDirection: "row", gap: 14 },
  historyMetric: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyDot: { width: 4, height: 4, borderRadius: 2 },
  historyValue: { fontSize: 14, fontFamily: fonts.bold },
  historyNotes: { fontSize: 11, color: colors.dimmed, marginTop: 6, fontStyle: "italic" },
});
