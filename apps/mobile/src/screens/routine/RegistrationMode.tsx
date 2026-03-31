import React from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { colors, spacing } from "../../theme";
import { formatTime, getScheme, calculateProgress } from "./constants";
import { ChevronLeftIcon } from "./icons";
import { st } from "./styles";
import type { ExerciseData, SetEntry, PreviousSet } from "./types";

interface Props {
  dayLabel: string;
  activeWeek: number;
  elapsed: number;
  dayExercises: ExerciseData[];
  allSets: Record<number, SetEntry[]>;
  clientNotes: Record<string, string>;
  exerciseRpe: Record<number, string>;
  rpeGlobal: number;
  saving: boolean;
  getPreviousLog: (name: string) => PreviousSet[];
  formatPrevious: (name: string) => string;
  onSetChange: (exIdx: number, setIdx: number, field: "weight_kg" | "reps_done", val: string) => void;
  onClientNoteChange: (name: string, val: string) => void;
  onExerciseRpeChange: (exIdx: number, val: string) => void;
  onRpeChange: (val: number) => void;
  onSave: () => void;
  onBack: () => void;
}

export function RegistrationMode({
  dayLabel, activeWeek, elapsed, dayExercises, allSets, clientNotes,
  exerciseRpe, rpeGlobal, saving, getPreviousLog, formatPrevious,
  onSetChange, onClientNoteChange, onExerciseRpeChange, onRpeChange, onSave, onBack,
}: Props) {
  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <View style={st.activeTopBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={st.backBtn}>
          <ChevronLeftIcon />
        </TouchableOpacity>
        <View style={st.regTitleWrap}>
          <Text style={st.regTitle}>Registrar sesión</Text>
          <Text style={st.regSubtitle}>{dayLabel} · Sem {activeWeek}</Text>
        </View>
        <View style={st.elapsedBadge}>
          <Text style={st.elapsedText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {dayExercises.map((ex, exIdx) => {
        const sets = allSets[exIdx] || [];
        const prevSets = getPreviousLog(ex.name);
        const prevStr = formatPrevious(ex.name);
        const notes = ex.coach_notes || ex.trainer_notes || ex.technique_notes || "";
        const progressionRule = ex.progression_rule || "";
        const currentData = sets.filter((s) => s.reps_done)
          .map((s) => ({ weight: Number(s.weight_kg) || 0, reps: Number(s.reps_done) || 0 }));
        const prevData = prevSets.map((s) => ({ weight: s.weight_kg, reps: s.reps_done }));
        const progress = currentData.length > 0 ? calculateProgress(currentData, prevData) : null;

        return (
          <View key={`${ex.exercise_id}-${exIdx}`} style={st.regExCard}>
            <View style={st.regExHeader}>
              <View style={st.regExIdx}><Text style={st.regExIdxText}>{exIdx + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.regExName} numberOfLines={1}>{ex.name}</Text>
                <View style={st.regExMetaRow}>
                  <Text style={st.regExScheme}>{getScheme(ex)}</Text>
                  {ex.rir > 0 && <Text style={st.regExMeta}>RIR {ex.rir}</Text>}
                  <Text style={[st.regExMeta, { color: colors.orange }]}>{ex.rest_s}s</Text>
                </View>
              </View>
            </View>

            <View style={st.regRefRow}>
              {prevStr ? <Text style={st.regAnterior}>ANTERIOR: {prevStr}</Text> : null}
              {progress && progress.label ? (
                <View style={[st.progressBadge, { backgroundColor: progress.color + "15" }]}>
                  <Text style={[st.progressBadgeText, { color: progress.color }]}>{progress.label}</Text>
                </View>
              ) : null}
            </View>

            {progressionRule ? <Text style={st.progressionInline}>{progressionRule}</Text> : null}
            {notes ? <Text style={st.notesInline}>{notes}</Text> : null}

            <View style={st.regSetHeader}>
              <Text style={[st.regSetHeaderText, { width: 32 }]}>S</Text>
              <Text style={[st.regSetHeaderText, { flex: 1 }]}>Peso (kg)</Text>
              <Text style={[st.regSetHeaderText, { flex: 1 }]}>Reps</Text>
            </View>

            {sets.map((set, setIdx) => {
              const prevSet = prevSets[setIdx];
              const isRP = set.type === "rest_pause";
              return (
                <View key={setIdx} style={st.regSetRow}>
                  <View style={[st.regSetNum, isRP && { backgroundColor: colors.orangeDim }]}>
                    <Text style={[st.regSetNumText, isRP && { color: colors.orange }]}>
                      {isRP ? "RP" : setIdx + 1}
                    </Text>
                  </View>
                  <TextInput
                    style={st.regInput} keyboardType="decimal-pad" value={set.weight_kg}
                    onChangeText={(val) => onSetChange(exIdx, setIdx, "weight_kg", val)}
                    placeholder={prevSet ? String(prevSet.weight_kg) : "0"}
                    placeholderTextColor="rgba(90,90,114,0.4)"
                  />
                  <TextInput
                    style={st.regInput} keyboardType="number-pad" value={set.reps_done}
                    onChangeText={(val) => onSetChange(exIdx, setIdx, "reps_done", val)}
                    placeholder={prevSet ? String(prevSet.reps_done) : `${ex.reps_min}`}
                    placeholderTextColor="rgba(90,90,114,0.4)"
                  />
                </View>
              );
            })}

            {ex.target_rpe != null && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,145,0,0.25)", backgroundColor: "rgba(255,145,0,0.05)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 }}>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: colors.orange, textTransform: "uppercase" }}>RPE del ejercicio</Text>
                  <Text style={{ fontSize: 10, color: colors.dimmed, marginTop: 1 }}>Objetivo: {ex.target_rpe} · Escala 1-10</Text>
                </View>
                <TextInput
                  style={{ width: 52, height: 44, borderWidth: 1, borderColor: "rgba(255,145,0,0.35)", backgroundColor: "rgba(255,145,0,0.1)", borderRadius: 12, textAlign: "center", fontSize: 18, fontWeight: "900", color: colors.orange }}
                  keyboardType="number-pad"
                  value={exerciseRpe[exIdx] || ""}
                  onChangeText={(val) => onExerciseRpeChange(exIdx, val)}
                  placeholder={String(ex.target_rpe)}
                  placeholderTextColor="rgba(255,145,0,0.3)"
                  maxLength={2}
                />
              </View>
            )}

            <TextInput
              style={st.clientNotesInput}
              placeholder="Notas / sensaciones..."
              placeholderTextColor="rgba(90,90,114,0.4)"
              value={clientNotes[ex.name] || ""}
              onChangeText={(val) => onClientNoteChange(ex.name, val)}
            />
          </View>
        );
      })}

      {/* RPE Global */}
      <View style={st.regRpeCard}>
        <View style={st.regRpeHeader}>
          <Text style={st.sectionLabel}>RPE GLOBAL</Text>
          <Text style={[st.regRpeValue, { color: rpeGlobal <= 4 ? colors.green : rpeGlobal <= 7 ? colors.orange : colors.red }]}>
            {rpeGlobal}
          </Text>
        </View>
        <View style={st.rpeSliderRow}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
            const c = val <= 4 ? colors.green : val <= 7 ? colors.orange : colors.red;
            return (
              <TouchableOpacity
                key={val} onPress={() => onRpeChange(val)}
                style={[st.rpeDot, val === rpeGlobal && { backgroundColor: c, borderColor: c }]}
                activeOpacity={0.7}
              >
                <Text style={[st.rpeDotText, val === rpeGlobal && { color: colors.bg }]}>{val}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={st.rpeHints}>
          <Text style={st.rpeHintText}>Fácil</Text>
          <Text style={st.rpeHintText}>Máximo</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[st.primaryBtn, { marginTop: spacing.lg }]}
        activeOpacity={0.8} onPress={onSave} disabled={saving}
      >
        {saving ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={st.primaryBtnText}>Guardar sesión</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
