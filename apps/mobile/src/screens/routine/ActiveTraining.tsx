import React from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../../theme";
import { formatTime, getScheme } from "./constants";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from "./icons";
import { st } from "./styles";
import type { ExerciseData, SetEntry, PreviousSet } from "./types";

interface Props {
  currentEx: ExerciseData;
  currentExIdx: number;
  totalExercises: number;
  elapsed: number;
  sets: SetEntry[];
  prevSets: PreviousSet[];
  activeWeek: number;
  currentSetIdx: number;
  allCurrentDone: boolean;
  savedExercises: Set<number>;
  exerciseRpe: Record<number, string>;
  onSetChange: (setIdx: number, field: "weight_kg" | "reps_done" | "rir", val: string) => void;
  onCompleteSet: (setIdx: number) => void;
  onSetRpe: (val: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onAbort: () => void;
}

export function ActiveTraining({
  currentEx, currentExIdx, totalExercises, elapsed,
  sets, prevSets, activeWeek, currentSetIdx, allCurrentDone, savedExercises,
  exerciseRpe, onSetChange, onCompleteSet, onSetRpe, onPrev, onNext, onFinish, onAbort,
}: Props) {
  const isLast = currentExIdx >= totalExercises - 1;
  const notes = currentEx.coach_notes || currentEx.trainer_notes || currentEx.technique_notes || "";
  const progressionRule = currentEx.progression_rule || "";

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Top bar */}
      <View style={st.activeTopBar}>
        <TouchableOpacity
          onPress={() => Alert.alert(
            "Abandonar sesión",
            "¿Seguro que quieres salir? Se perderá el progreso no guardado.",
            [{ text: "Cancelar", style: "cancel" }, { text: "Salir", style: "destructive", onPress: onAbort }]
          )}
          activeOpacity={0.7} style={st.backBtn}
        >
          <ChevronLeftIcon />
        </TouchableOpacity>
        <Text style={st.activeCounter}>
          {currentExIdx + 1}
          <Text style={{ color: colors.dimmed }}>/{totalExercises}</Text>
        </Text>
        <View style={st.elapsedBadge}>
          <Text style={st.elapsedText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={st.progressBar}>
        <LinearGradient
          colors={[colors.cyan, colors.violet]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[st.progressFill, { width: `${((currentExIdx + (allCurrentDone ? 1 : 0)) / totalExercises) * 100}%` as any }]}
        />
      </View>

      {/* Exercise header */}
      <View style={st.activeExCard}>
        <Text style={st.activeExLabel}>EJERCICIO {currentExIdx + 1}</Text>
        <Text style={st.activeExName}>{currentEx.name}</Text>
        <View style={st.activeExMeta}>
          <View style={st.schemeBadge}><Text style={st.schemeText}>{getScheme(currentEx)}</Text></View>
          <View style={[st.metaTag, { borderColor: colors.orangeDim }]}>
            <Text style={[st.metaTagText, { color: colors.orange }]}>{currentEx.rest_s}s desc.</Text>
          </View>
        </View>
        {progressionRule ? <View style={st.progressionRow}><Text style={st.progressionText}>{progressionRule}</Text></View> : null}
        {notes ? <View style={st.notesRow}><Text style={st.notesText}>{notes}</Text></View> : null}
      </View>

      {/* ANTERIOR */}
      {prevSets.length > 0 && (
        <View style={st.anteriorRow}>
          <Text style={st.anteriorLabel}>ANTERIOR</Text>
          <View style={st.anteriorValues}>
            {prevSets.map((ps, i) => (
              <View key={i} style={st.anteriorChip}>
                <Text style={st.anteriorValue}>{ps.weight_kg}×{ps.reps_done}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Set inputs */}
      <View style={st.setHeader}>
        <Text style={[st.setHeaderText, { width: 40 }]}>Serie</Text>
        <Text style={[st.setHeaderText, { flex: 1 }]}>Peso (kg)</Text>
        <Text style={[st.setHeaderText, { flex: 1 }]}>Reps</Text>
        <Text style={[st.setHeaderText, { width: 48 }]}>RIR</Text>
        <View style={{ width: 44 }} />
      </View>

      {sets.map((set, setIdx) => {
        const isCurrent = setIdx === currentSetIdx;
        const prevSet = prevSets[setIdx];
        const isRP = set.type === "rest_pause";
        const wk = currentEx.weekly_config?.[activeWeek];
        const isDiff = currentEx.mode === "different";
        const cfgDetail = isDiff ? (wk?.sets_detail ?? currentEx.sets_config ?? []) : [];
        const cfg = isDiff && cfgDetail[setIdx]
          ? cfgDetail[setIdx]
          : {
              reps_min: wk?.reps_min ?? currentEx.reps_min,
              reps_max: wk?.reps_max ?? currentEx.reps_max,
              rir: wk?.rir ?? currentEx.rir,
              target_weight: wk?.target_weight ?? currentEx.target_weight ?? null,
              rest_s: wk?.rest_s ?? currentEx.rest_s,
            };

        return (
          <View key={setIdx} style={[st.setRow, set.completed && st.setRowDone, isCurrent && st.setRowCurrent]}>
            <View style={[st.setNum, isRP && { backgroundColor: colors.orangeDim }]}>
              {set.completed
                ? <CheckIcon size={14} color={colors.green} />
                : <Text style={[st.setNumText, isRP && { color: colors.orange }]}>{isRP ? "RP" : setIdx + 1}</Text>}
            </View>

            <TextInput
              style={[st.setInput, isCurrent && st.setInputActive]}
              keyboardType="decimal-pad" value={set.weight_kg}
              onChangeText={(val) => onSetChange(setIdx, "weight_kg", val)}
              editable={!set.completed}
              placeholder={prevSet ? String(prevSet.weight_kg) : cfg.target_weight ? String(cfg.target_weight) : "0"}
              placeholderTextColor="rgba(90,90,114,0.4)"
            />
            <TextInput
              style={[st.setInput, isCurrent && st.setInputActive]}
              keyboardType="number-pad" value={set.reps_done}
              onChangeText={(val) => onSetChange(setIdx, "reps_done", val)}
              editable={!set.completed}
              placeholder={prevSet ? String(prevSet.reps_done) : cfg.reps_min === cfg.reps_max ? String(cfg.reps_min) : `${cfg.reps_min}-${cfg.reps_max}`}
              placeholderTextColor="rgba(90,90,114,0.4)"
            />
            <TextInput
              style={[st.setInput, isCurrent && st.setInputActive, { width: 48, flex: 0 }]}
              keyboardType="number-pad" value={set.rir}
              onChangeText={(val) => onSetChange(setIdx, "rir", val)}
              editable={!set.completed}
              placeholder={String(cfg.rir)}
              placeholderTextColor="rgba(90,90,114,0.4)"
            />
            <TouchableOpacity
              style={[st.checkBtn, set.completed && st.checkBtnDone, isCurrent && st.checkBtnActive]}
              activeOpacity={0.7}
              onPress={() => onCompleteSet(setIdx)}
              disabled={set.completed || setIdx !== currentSetIdx}
            >
              <CheckIcon size={18} color={set.completed ? colors.green : isCurrent ? colors.bg : colors.dimmed} />
            </TouchableOpacity>
          </View>
        );
      })}

      {savedExercises.has(currentExIdx) && (
        <View style={st.savedBadge}>
          <CheckIcon size={14} color={colors.green} />
          <Text style={st.savedBadgeText}>Ejercicio guardado</Text>
        </View>
      )}

      {currentEx.target_rpe != null && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,145,0,0.25)", backgroundColor: "rgba(255,145,0,0.05)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: colors.orange, textTransform: "uppercase" }}>RPE del ejercicio</Text>
            <Text style={{ fontSize: 10, color: colors.dimmed, marginTop: 1 }}>Objetivo: {currentEx.target_rpe} · Escala 1-10</Text>
          </View>
          <TextInput
            style={{ width: 52, height: 44, borderWidth: 1, borderColor: "rgba(255,145,0,0.35)", backgroundColor: "rgba(255,145,0,0.1)", borderRadius: 12, textAlign: "center", fontSize: 18, fontWeight: "900", color: colors.orange }}
            keyboardType="number-pad"
            value={exerciseRpe[currentExIdx] || ""}
            onChangeText={onSetRpe}
            placeholder={String(currentEx.target_rpe)}
            placeholderTextColor="rgba(255,145,0,0.3)"
            maxLength={2}
          />
        </View>
      )}

      {/* Navigation */}
      <View style={st.navRow}>
        <TouchableOpacity
          style={[st.navBtn, currentExIdx === 0 && st.navBtnDisabled]}
          activeOpacity={0.7} onPress={onPrev} disabled={currentExIdx === 0}
        >
          <ChevronLeftIcon size={16} color={currentExIdx === 0 ? colors.dimmed : colors.white} />
          <Text style={[st.navBtnText, currentExIdx === 0 && { color: colors.dimmed }]}>Anterior</Text>
        </TouchableOpacity>

        {isLast && allCurrentDone ? (
          <TouchableOpacity style={st.finishBtn} activeOpacity={0.8} onPress={onFinish}>
            <Text style={st.finishBtnText}>Finalizar rutina</Text>
            <CheckIcon size={14} color={colors.bg} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[st.nextBtn, isLast && st.navBtnDisabled]}
            activeOpacity={0.8} onPress={onNext} disabled={isLast}
          >
            <Text style={[st.nextBtnText, isLast && { color: colors.dimmed }]}>Siguiente</Text>
            <ChevronRightIcon size={14} color={isLast ? colors.dimmed : colors.bg} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
