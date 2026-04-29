import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows, fonts } from "../../theme";
import type { Appointment } from "./types";
import { SESSION_TYPES } from "./types";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: colors.orange, bg: colors.orangeDim, label: "Pendiente" },
  confirmed: { color: colors.green,  bg: colors.greenDim,  label: "Confirmada" },
  cancelled: { color: colors.red,    bg: colors.redDim,    label: "Cancelada" },
  completed: { color: colors.violet, bg: colors.violetDim, label: "Completada" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function getDurationMinutes(starts: string, ends: string): number {
  return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000);
}

interface Props {
  appt: Appointment;
  onCancel: (id: string) => void;
  cancelling: string | null;
}

export const AppointmentCard = memo(function AppointmentCard({ appt, onCancel, cancelling }: Props) {
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
  const isPast = new Date(appt.starts_at) < new Date();
  const isCancellable = !isPast && appt.status !== "cancelled" && appt.status !== "completed";
  const typeLabel = SESSION_TYPES.find((t) => t.value === appt.session_type)?.label ?? appt.session_type;
  const durationMin = getDurationMinutes(appt.starts_at, appt.ends_at);

  return (
    <View style={st.card}>
      <View style={st.cardTopRow}>
        <View style={[st.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[st.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Text style={st.typeText}>{typeLabel}</Text>
      </View>

      <Text style={st.cardTitle}>{appt.title}</Text>

      <View style={st.cardDateRow}>
        <Text style={st.cardDate}>{formatDate(appt.starts_at)}</Text>
        <Text style={st.cardDot}>·</Text>
        <Text style={st.cardTime}>{formatTime(appt.starts_at)}</Text>
        <Text style={st.cardDot}>·</Text>
        <Text style={st.cardDuration}>{durationMin} min</Text>
      </View>

      {appt.location ? <Text style={st.cardLocation}>📍 {appt.location}</Text> : null}
      {appt.notes ? <Text style={st.cardNotes}>{appt.notes}</Text> : null}

      {isCancellable && (
        <TouchableOpacity
          onPress={() => onCancel(appt.id)}
          disabled={cancelling === appt.id}
          style={st.cancelButton}
        >
          <Text style={st.cancelButtonText}>
            {cancelling === appt.id ? "Cancelando…" : "Cancelar cita"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontFamily: fonts.bold, textTransform: "uppercase", letterSpacing: 0.5 },
  typeText: { fontSize: 11, color: colors.dimmed },
  cardTitle: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.white, marginBottom: spacing.sm },
  cardDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardDate: { fontSize: 13, fontFamily: fonts.bold, color: colors.cyan },
  cardDot: { fontSize: 13, color: colors.dimmed },
  cardTime: { fontSize: 13, color: colors.muted },
  cardDuration: { fontSize: 13, color: colors.dimmed },
  cardLocation: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
  cardNotes: { fontSize: 12, color: colors.dimmed, fontStyle: "italic", marginTop: spacing.sm, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: radius.sm, padding: spacing.sm },
  cancelButton: { marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.redDim, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignSelf: "flex-start" },
  cancelButtonText: { color: colors.red, fontSize: 12, fontFamily: fonts.bold },
});
