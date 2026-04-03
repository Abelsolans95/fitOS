import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, Alert, type DimensionValue } from "react-native";
import Svg, { Path } from "react-native-svg";
import { supabase } from "../../lib/supabase";
import { colors, spacing, radius, fonts } from "../../theme";
import { ZONE_LABELS as MUSCLE_LABELS } from "@fitos/shared";
import type { HealthLog } from "@fitos/shared";

interface Props {
  visible: boolean;
  muscleId: string;
  existing: HealthLog | null;
  trainerId: string;
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}

const INCIDENT_TYPES = [
  { value: "puntual", label: "Puntual" },
  { value: "diagnosticada", label: "Diagnosticada" },
  { value: "cronica", label: "Crónica" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Activa", color: colors.red },
  { value: "recovering", label: "Recuperando", color: colors.orange },
  { value: "recovered", label: "Recuperada", color: colors.green },
] as const;

export function ReportModal({ visible, muscleId, existing, trainerId, clientId, onClose, onSaved }: Props) {
  const [painScore, setPainScore] = useState(existing?.pain_score ?? 5);
  const [incidentType, setIncidentType] = useState<"puntual" | "diagnosticada" | "cronica">(existing?.incident_type ?? "puntual");
  const [status, setStatus] = useState<"active" | "recovering" | "recovered">(existing?.status ?? "active");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setPainScore(existing?.pain_score ?? 5);
      setIncidentType(existing?.incident_type ?? "puntual");
      setStatus(existing?.status ?? "active");
      setNotes(existing?.notes ?? "");
    }
  }, [visible, existing]);

  const handleSave = async () => {
    setSaving(true);
    if (existing) {
      const { error } = await supabase.from("health_logs").update({ pain_score: painScore, incident_type: incidentType, status, notes: notes || null }).eq("id", existing.id);
      if (error) { Alert.alert("Error", "No se pudo actualizar el reporte"); console.error("[HealthScreen] Update error:", error); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("health_logs").insert({ client_id: clientId, trainer_id: trainerId, reported_by: "client", muscle_id: muscleId, pain_score: painScore, incident_type: incidentType, status, notes: notes || null });
      if (error) { Alert.alert("Error", "No se pudo crear el reporte"); console.error("[HealthScreen] Insert error:", error); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const painColor = painScore >= 8 ? colors.red : painScore >= 6 ? "#FF5722" : painScore >= 4 ? colors.orange : "#FFB74D";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={st.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={st.header}>
              <View style={st.muscleIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286z" stroke={colors.red} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View>
                <Text style={st.muscleTitle}>{MUSCLE_LABELS[muscleId] ?? muscleId}</Text>
                <Text style={st.muscleSubtitle}>{existing ? "Actualizar reporte" : "Nuevo reporte"}</Text>
              </View>
            </View>

            <Text style={st.sectionLabel}>NIVEL DE DOLOR</Text>
            <View style={st.painRow}>
              <View style={st.painButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setPainScore(n)}
                    style={[st.painBtn, painScore === n && { backgroundColor: n >= 6 ? colors.redDim : colors.orangeDim, borderColor: n >= 6 ? colors.red : colors.orange }]}>
                    <Text style={[st.painBtnText, painScore === n && { color: n >= 6 ? colors.red : colors.orange, fontFamily: fonts.extraBold }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[st.painValue, { color: painColor }]}>{painScore}</Text>
            </View>

            <Text style={st.sectionLabel}>TIPO DE INCIDENCIA</Text>
            <View style={st.optionsRow}>
              {INCIDENT_TYPES.map((t) => (
                <TouchableOpacity key={t.value} onPress={() => setIncidentType(t.value)}
                  style={[st.optionBtn, incidentType === t.value && st.optionBtnActive]}>
                  <Text style={[st.optionBtnText, incidentType === t.value && st.optionBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.sectionLabel}>ESTADO</Text>
            <View style={st.optionsRow}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity key={s.value} onPress={() => setStatus(s.value)}
                  style={[st.optionBtn, status === s.value && { backgroundColor: `${s.color}15`, borderColor: `${s.color}40` }]}>
                  <Text style={[st.optionBtnText, status === s.value && { color: s.color }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.sectionLabel}>NOTAS</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder="Describe la sensación o diagnóstico..." placeholderTextColor={colors.dimmed} multiline style={st.notesInput} />

            <View style={st.actions}>
              <TouchableOpacity onPress={onClose} style={st.cancelBtn}>
                <Text style={st.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={[st.saveBtn, saving && { opacity: 0.5 }]}>
                <Text style={st.saveBtnText}>{saving ? "Guardando..." : existing ? "Actualizar" : "Reportar"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  container: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl, maxHeight: "85%" as DimensionValue },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  muscleIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.redDim, alignItems: "center", justifyContent: "center" },
  muscleTitle: { fontSize: 16, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white },
  muscleSubtitle: { fontSize: 12, color: colors.muted },
  sectionLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg },
  painRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  painButtons: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  painBtn: { width: 28, height: 28, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  painBtnText: { fontSize: 12, fontFamily: fonts.medium, color: colors.muted },
  painValue: { fontSize: 32, fontFamily: fonts.extraBold, letterSpacing: -1, minWidth: 40, textAlign: "center" },
  optionsRow: { flexDirection: "row", gap: spacing.sm },
  optionBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center" },
  optionBtnActive: { backgroundColor: colors.cyanDim, borderColor: colors.borderActive },
  optionBtnText: { fontSize: 11, fontFamily: fonts.medium, color: colors.muted },
  optionBtnTextActive: { color: colors.cyan },
  notesInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.02)", padding: spacing.md, fontSize: 14, color: colors.white, minHeight: 80, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl, paddingBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.medium, color: colors.muted },
  saveBtn: { flex: 1, backgroundColor: colors.cyan, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center" },
  saveBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.bg },
});
