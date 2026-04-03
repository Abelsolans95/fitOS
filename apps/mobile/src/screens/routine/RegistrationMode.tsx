import React, { useMemo } from "react";
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
  rpeGlobal: number;
  saving: boolean;
  getPreviousLog: (name: string) => PreviousSet[];
  formatPrevious: (name: string) => string;
  onSetChange: (exIdx: number, setIdx: number, field: "weight_kg" | "reps_done" | "rir" | "rpe", val: string) => void;
  onClientNoteChange: (name: string, val: string) => void;
  onRpeChange: (val: number) => void;
  onSave: () => void;
  onBack: () => void;
}

function shouldShowRir(ex: ExerciseData): boolean {
  if (ex.rir > 0) return true;
  const sc = ex.sets_config ?? [];
  if (sc.some((c) => c.rir > 0)) return true;
  const wc = ex.weekly_config;
  if (wc) {
    for (const w of Object.values(wc)) {
      if (w.rir > 0) return true;
      if (w.sets_detail?.some((d) => d.rir > 0)) return true;
    }
  }
  return false;
}

function shouldShowRpe(ex: ExerciseData): boolean {
  if (ex.target_rpe != null && ex.target_rpe > 0) return true;
  const sc = ex.sets_config ?? [];
  if (sc.some((c) => (c.target_rpe ?? 0) > 0)) return true;
  const wc = ex.weekly_config;
  if (wc) {
    for (const w of Object.values(wc)) {
      if ((w.target_rpe ?? 0) > 0) return true;
      if (w.sets_detail?.some((d) => (d.target_rpe ?? 0) > 0)) return true;
    }
  }
  return false;
}

export function RegistrationMode({
  dayLabel, activeWeek, elapsed, dayExercises, allSets, clientNotes,
  rpeGlobal, saving, getPreviousLog, formatPrevious,
  onSetChange, onClientNoteChange, onRpeChange, onSave, onBack,
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
        const showRir = shouldShowRir(ex);
        const showRpe = shouldShowRpe(ex);

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

            {/* Dynamic columns header */}
            <View style={st.regSetHeader}>
              <Text style={[st.regSetHeaderText, { width: 32 }]}>S</Text>
              <Text style={[st.regSetHeaderText, { flex: 1 }]}>Peso (kg)</Text>
              <Text style={[st.regSetHeaderText, { flex: 1 }]}>Reps</Text>
              {showRir && <Text style={[st.regSetHeaderText, { width: 40 }]}>RIR</Text>}
              {showRpe && <Text style={[st.regSetHeaderText, { width: 40 }]}>RPE</Text>}
            </View>

            {sets.map((set, setIdx) => {
              const prevSet = prevSets[setIdx];
              const isRP = set.type === "rest_pause";
              const isDS = set.type === "drop_set";
              const isDeriv = isRP || isDS;
              let normalNum = 0;
              if (!isDeriv) {
                for (let k = 0; k <= setIdx; k++) {
                  if (sets[k].type === "main") normalNum++;
                }
              }
              return (
                <View key={setIdx} style={[st.regSetRow, isDeriv && { marginLeft: 20, borderLeftWidth: 2, borderLeftColor: isRP ? "rgba(255,145,0,0.4)" : "rgba(124,58,237,0.4)" }]}>
                  <View style={[st.regSetNum, isRP && { backgroundColor: colors.orangeDim }, isDS && { backgroundColor: "rgba(124,58,237,0.08)" }]}>
                    <Text style={[st.regSetNumText, isRP && { color: colors.orange }, isDS && { color: colors.violet }]}>
                      {isRP ? "RP" : isDS ? "DS" : normalNum}
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
                  {showRir && (
                    <TextInput
                      style={[st.regInput, { width: 40, flex: 0 }]}
                      keyboardType="number-pad" value={set.rir}
                      onChangeText={(val) => onSetChange(exIdx, setIdx, "rir", val)}
                      placeholder={String(ex.rir)}
                      placeholderTextColor="rgba(90,90,114,0.4)"
                    />
                  )}
                  {showRpe && (
                    <TextInput
                      style={[st.regInput, { width: 40, flex: 0 }]}
                      keyboardType="number-pad" value={set.rpe}
                      onChangeText={(val) => onSetChange(exIdx, setIdx, "rpe", val)}
                      placeholder={String(ex.target_rpe)}
                      placeholderTextColor="rgba(255,145,0,0.3)"
                      maxLength={2}
                    />
                  )}
                </View>
              );
            })}

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
