import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";
import { useMyDay } from "./myday/useMyDay";
import { WellnessSliders } from "./myday/WellnessSliders";
import { styles } from "./myday/styles";

type Score = 1 | 2 | 3 | 4 | 5 | null;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function MyDayScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { state, update, save } = useMyDay(user?.id);

  if (state.loading) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator color={colors.cyan} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.title}>¿Cómo fue hoy?</Text>
        <Text style={styles.subtitle}>
          30 segundos — así tu entrenador sabe cómo ajustar
        </Text>
      </View>

      {/* Entreno */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ENTRENO</Text>
          {state.workoutDone && <Text style={styles.sectionStatus}>✓ Hecho</Text>}
        </View>

        <View style={styles.workoutRow}>
          <View style={styles.workoutToggle}>
            {[
              { k: true, label: "Entrené" },
              { k: false, label: "No entrené" },
            ].map((opt) => {
              const active = state.workoutDone === opt.k;
              return (
                <TouchableOpacity
                  key={String(opt.k)}
                  style={[styles.workoutPill, active && styles.workoutPillActive]}
                  onPress={() => update({ workoutDone: opt.k })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.workoutPillText,
                      active && styles.workoutPillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Comidas — link-out para no duplicar UX */}
      <TouchableOpacity
        style={styles.section}
        activeOpacity={0.8}
        onPress={() => {
          // Jump to Calorías tab — name has to match the tab label in AppNavigator.
          const nav = navigation as unknown as { navigate: (name: string) => void };
          nav.navigate("Calorías");
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>COMIDAS</Text>
        </View>
        <View style={styles.linkRow}>
          <Text style={styles.linkLabel}>Registrar comida (foto / nevera)</Text>
          <Text style={styles.linkHint}>Ir →</Text>
        </View>
      </TouchableOpacity>

      {/* Peso */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PESO (opcional)</Text>
        </View>
        <TextInput
          style={styles.weightInput}
          keyboardType="decimal-pad"
          placeholder="72.4 kg"
          placeholderTextColor={colors.dimmed}
          value={state.weightKg}
          onChangeText={(v) => update({ weightKg: v })}
          maxLength={6}
        />
      </View>

      {/* Wellness */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CÓMO ME SIENTO</Text>
        </View>
        <WellnessSliders
          sleepQuality={state.sleepQuality}
          stressLevel={state.stressLevel}
          energyLevel={state.energyLevel}
          painLevel={state.painLevel}
          onChange={(field, value) => update({ [field]: value } as Partial<typeof state>)}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NOTAS (opcional)</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          placeholder="Algo que tu entrenador debería saber…"
          placeholderTextColor={colors.dimmed}
          value={state.notes}
          onChangeText={(v) => update({ notes: v })}
          multiline
          maxLength={1000}
        />
      </View>

      {/* Save */}
      <View style={styles.saveBtnWrap}>
        <LinearGradient
          colors={["#00E5FF", "#00B8D4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveBtn}
        >
          <TouchableOpacity
            onPress={save}
            disabled={state.saving}
            style={{ width: "100%", alignItems: "center" }}
            activeOpacity={0.85}
          >
            {state.saving ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.saveBtnText}>Guardar check-in</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

// Silence unused-warning — Score is exported for external files that import from ./useMyDay
export type { Score };
