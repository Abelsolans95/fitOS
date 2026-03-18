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
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";

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

  // Form fields
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
      setWeight("");
      setBodyFat("");
      setMuscleMass("");
      setNotes("");
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
      ? latestWeight.weight_kg - previousWeight.weight_kg
      : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Progreso</Text>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ Medir</Text>
        </TouchableOpacity>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Peso actual</Text>
          <Text style={styles.statValue}>
            {latestWeight?.weight_kg ? `${latestWeight.weight_kg} kg` : "—"}
          </Text>
          {weightDiff !== null && (
            <Text
              style={[
                styles.statTrend,
                { color: weightDiff > 0 ? colors.orange : weightDiff < 0 ? colors.green : colors.muted },
              ]}
            >
              {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)} kg
            </Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Grasa corporal</Text>
          <Text style={styles.statValue}>
            {metrics.find((m) => m.body_fat_pct)?.body_fat_pct
              ? `${metrics.find((m) => m.body_fat_pct)!.body_fat_pct}%`
              : "—"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Masa muscular</Text>
          <Text style={styles.statValue}>
            {metrics.find((m) => m.muscle_mass_kg)?.muscle_mass_kg
              ? `${metrics.find((m) => m.muscle_mass_kg)!.muscle_mass_kg} kg`
              : "—"}
          </Text>
        </View>
      </View>

      {/* New metric form */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nueva medición</Text>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.formInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.muted + "40"}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Grasa (%)</Text>
              <TextInput
                style={styles.formInput}
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.muted + "40"}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Músculo (kg)</Text>
              <TextInput
                style={styles.formInput}
                value={muscleMass}
                onChangeText={setMuscleMass}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.muted + "40"}
              />
            </View>
          </View>
          <TextInput
            style={[styles.formInput, { marginTop: 8 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas (opcional)"
            placeholderTextColor={colors.muted + "40"}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* History */}
      <Text style={styles.sectionTitle}>Historial</Text>
      {metrics.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aún no tienes mediciones</Text>
        </View>
      ) : (
        metrics.map((m) => (
          <View key={m.id} style={styles.historyCard}>
            <Text style={styles.historyDate}>
              {new Date(m.recorded_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
            <View style={styles.historyValues}>
              {m.weight_kg !== null && (
                <Text style={[styles.historyValue, { color: colors.cyan }]}>
                  {m.weight_kg} kg
                </Text>
              )}
              {m.body_fat_pct !== null && (
                <Text style={[styles.historyValue, { color: colors.orange }]}>
                  {m.body_fat_pct}%
                </Text>
              )}
              {m.muscle_mass_kg !== null && (
                <Text style={[styles.historyValue, { color: colors.violet }]}>
                  {m.muscle_mass_kg} kg
                </Text>
              )}
            </View>
            {m.notes && <Text style={styles.historyNotes}>{m.notes}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: colors.white },
  addButton: {
    backgroundColor: colors.cyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { fontSize: 14, fontWeight: "700", color: colors.bg },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statLabel: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.white },
  statTrend: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cyan + "30",
    padding: 16,
    marginBottom: 20,
  },
  formTitle: { fontSize: 14, fontWeight: "600", color: colors.white, marginBottom: 12 },
  formRow: { flexDirection: "row", gap: 8 },
  formField: { flex: 1 },
  formLabel: { fontSize: 11, color: colors.muted, marginBottom: 4 },
  formInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: { fontSize: 15, fontWeight: "700", color: colors.bg },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.white, marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyText: { color: colors.muted, fontSize: 14 },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  historyDate: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  historyValues: { flexDirection: "row", gap: 12 },
  historyValue: { fontSize: 15, fontWeight: "600" },
  historyNotes: { fontSize: 12, color: colors.muted + "80", marginTop: 6, fontStyle: "italic" },
});
