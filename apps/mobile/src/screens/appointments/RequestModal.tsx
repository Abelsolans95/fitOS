import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Platform, StyleSheet,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { colors, spacing, radius, fonts } from "../../theme";
import { SESSION_TYPES } from "./types";

interface Props {
  visible: boolean;
  trainerId: string;
  clientId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function RequestModal({ visible, trainerId, clientId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState("presencial");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const [hour, setHour] = useState(9);
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Escribe un título para la cita."); return; }
    setSaving(true);
    setError(null);

    const selectedDate = days[selectedDay];
    const starts_at = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, 0, 0).toISOString();
    const ends_at = new Date(new Date(starts_at).getTime() + 60 * 60000).toISOString();

    const { error: insertErr } = await supabase.from("appointments").insert({
      trainer_id: trainerId, client_id: clientId,
      title: title.trim(), session_type: sessionType, starts_at, ends_at, status: "pending",
      notes: notes.trim() || null,
    });

    setSaving(false);
    if (insertErr) { setError(insertErr.message); return; }
    setTitle(""); setNotes(""); setSelectedDay(0); setHour(9);
    onCreated(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={st.modalContainer}>
        <View style={st.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={st.modalCancel}>Cancelar</Text></TouchableOpacity>
          <Text style={st.modalTitle}>Solicitar cita</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={saving}>
            <Text style={[st.modalSubmit, saving && { opacity: 0.4 }]}>{saving ? "…" : "Enviar"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={st.modalContent} showsVerticalScrollIndicator={false}>
          <Text style={st.fieldLabel}>MOTIVO / TÍTULO *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Ej: Revisión de técnica…"
            placeholderTextColor={colors.dimmed} style={st.input} />

          <Text style={[st.fieldLabel, { marginTop: spacing.lg }]}>TIPO DE SESIÓN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {SESSION_TYPES.map((t) => (
                <TouchableOpacity key={t.value} onPress={() => setSessionType(t.value)}
                  style={[st.typeChip, sessionType === t.value && st.typeChipActive]}>
                  <Text style={[st.typeChipText, sessionType === t.value && st.typeChipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[st.fieldLabel, { marginTop: spacing.lg }]}>FECHA *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {days.map((d, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedDay(i)}
                  style={[st.dayChip, selectedDay === i && st.dayChipActive]}>
                  <Text style={[st.dayChipWeekday, selectedDay === i && { color: colors.cyan }]}>
                    {d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase()}
                  </Text>
                  <Text style={[st.dayChipDay, selectedDay === i && { color: colors.cyan }]}>{d.getDate()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[st.fieldLabel, { marginTop: spacing.lg }]}>HORA *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {hours.map((h) => (
                <TouchableOpacity key={h} onPress={() => setHour(h)}
                  style={[st.hourChip, hour === h && st.hourChipActive]}>
                  <Text style={[st.hourChipText, hour === h && { color: colors.cyan }]}>
                    {String(h).padStart(2, "0")}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[st.fieldLabel, { marginTop: spacing.lg }]}>MENSAJE (OPCIONAL)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Cuéntale qué quieres trabajar…"
            placeholderTextColor={colors.dimmed} multiline numberOfLines={3}
            style={[st.input, { height: 80, textAlignVertical: "top" }]} />

          {error && <Text style={st.errorText}>{error}</Text>}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 16 : 24, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.white },
  modalCancel: { fontSize: 15, color: colors.muted },
  modalSubmit: { fontSize: 15, fontFamily: fonts.bold, color: colors.cyan },
  modalContent: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  fieldLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1.5, marginBottom: spacing.sm },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, color: colors.white, fontSize: 14, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  typeChip: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  typeChipActive: { backgroundColor: colors.cyanDim, borderColor: colors.borderActive },
  typeChipText: { color: colors.dimmed, fontSize: 13, fontFamily: fonts.medium },
  typeChipTextActive: { color: colors.cyan },
  dayChip: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: "center", minWidth: 48 },
  dayChipActive: { backgroundColor: colors.cyanDim, borderColor: colors.borderActive },
  dayChipWeekday: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 0.5 },
  dayChipDay: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.muted, marginTop: 2 },
  hourChip: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  hourChipActive: { backgroundColor: colors.cyanDim, borderColor: colors.borderActive },
  hourChipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.muted },
  errorText: { color: colors.red, fontSize: 12, marginTop: spacing.md },
});
