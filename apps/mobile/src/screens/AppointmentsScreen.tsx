import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import { colors, spacing, radius, shadows , fonts} from "../theme";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Appointment {
  id: string;
  trainer_id: string;
  client_id: string;
  title: string;
  session_type: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  location: string | null;
  meeting_url: string | null;
}

interface TrainerInfo {
  user_id: string;
  full_name: string | null;
}

const SESSION_TYPES = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "telefonica", label: "Telefónica" },
  { value: "evaluacion", label: "Evaluación inicial" },
  { value: "seguimiento", label: "Seguimiento" },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: colors.orange, bg: colors.orangeDim, label: "Pendiente" },
  confirmed: { color: colors.green,  bg: colors.greenDim,  label: "Confirmada" },
  cancelled: { color: colors.red,    bg: colors.redDim,    label: "Cancelada" },
  completed: { color: colors.violet, bg: colors.violetDim, label: "Completada" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit", minute: "2-digit",
  });
}

function getDurationMinutes(starts: string, ends: string): number {
  return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000);
}

// ── Request appointment modal ─────────────────────────────────────────────

interface RequestModalProps {
  visible: boolean;
  trainerId: string;
  clientId: string;
  onClose: () => void;
  onCreated: () => void;
}

function RequestModal({ visible, trainerId, clientId, onClose, onCreated }: RequestModalProps) {
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState("presencial");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple date: pick from today + 7 days forward
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(0); // offset from today
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const [hour, setHour] = useState(9);
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8am–21pm

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Escribe un título para la cita.");
      return;
    }

    setSaving(true);
    setError(null);

    const selectedDate = days[selectedDay];
    const starts_at = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour, 0, 0
    ).toISOString();
    const ends_at = new Date(new Date(starts_at).getTime() + 60 * 60000).toISOString(); // 1h default

    const { error: insertErr } = await supabase.from("appointments").insert({
      trainer_id: trainerId,
      client_id: clientId,
      title: title.trim(),
      session_type: sessionType,
      starts_at,
      ends_at,
      status: "pending",
      notes: notes.trim() || null,
    });

    setSaving(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setTitle("");
    setNotes("");
    setSelectedDay(0);
    setHour(9);
    onCreated();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Solicitar cita</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={saving}>
            <Text style={[styles.modalSubmit, saving && { opacity: 0.4 }]}>
              {saving ? "…" : "Enviar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text style={styles.fieldLabel}>MOTIVO / TÍTULO *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Revisión de técnica…"
            placeholderTextColor={colors.dimmed}
            style={styles.input}
          />

          {/* Session type */}
          <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>TIPO DE SESIÓN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {SESSION_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setSessionType(t.value)}
                  style={[
                    styles.typeChip,
                    sessionType === t.value && styles.typeChipActive,
                  ]}
                >
                  <Text style={[styles.typeChipText, sessionType === t.value && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Day picker */}
          <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>FECHA *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {days.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedDay(i)}
                  style={[styles.dayChip, selectedDay === i && styles.dayChipActive]}
                >
                  <Text style={[styles.dayChipWeekday, selectedDay === i && { color: colors.cyan }]}>
                    {d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase()}
                  </Text>
                  <Text style={[styles.dayChipDay, selectedDay === i && { color: colors.cyan }]}>
                    {d.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Hour picker */}
          <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>HORA *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setHour(h)}
                  style={[styles.hourChip, hour === h && styles.hourChipActive]}
                >
                  <Text style={[styles.hourChipText, hour === h && { color: colors.cyan }]}>
                    {String(h).padStart(2, "0")}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Notes */}
          <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>MENSAJE (OPCIONAL)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Cuéntale qué quieres trabajar…"
            placeholderTextColor={colors.dimmed}
            multiline
            numberOfLines={3}
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_id", user.id)
      .order("starts_at", { ascending: true });

    setAppointments((data as Appointment[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setClientId(user.id);

      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (rel) {
        setTrainerId(rel.trainer_id as string);
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .eq("user_id", rel.trainer_id)
          .single();
        setTrainer(profile as TrainerInfo | null);
      }

      await fetchAppointments();
      setLoading(false);
    };

    init();
  }, [fetchAppointments]);

  const handleCancel = (id: string) => {
    Alert.alert(
      "Cancelar cita",
      "¿Seguro que quieres cancelar esta cita?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setCancelling(id);
            await supabase
              .from("appointments")
              .update({ status: "cancelled", cancelled_by: clientId })
              .eq("id", id);
            await fetchAppointments();
            setCancelling(null);
          },
        },
      ]
    );
  };

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.starts_at) >= now && a.status !== "cancelled"
  );
  const past = appointments.filter(
    (a) => new Date(a.starts_at) < now || a.status === "cancelled"
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.cyan} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Citas</Text>
          <Text style={styles.headerSub}>
            {trainer ? `Con ${trainer.full_name ?? "tu entrenador"}` : "Sesiones con tu entrenador"}
          </Text>
        </View>
        {trainerId && (
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={styles.newButton}
          >
            <Text style={styles.newButtonText}>+ Solicitar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRÓXIMAS ({upcoming.length})</Text>
            {upcoming.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                onCancel={handleCancel}
                cancelling={cancelling}
              />
            ))}
          </View>
        )}

        {/* Empty */}
        {upcoming.length === 0 && trainerId && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📅</Text>
            </View>
            <Text style={styles.emptyTitle}>Sin citas próximas</Text>
            <Text style={styles.emptySub}>Solicita una sesión con tu entrenador</Text>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Solicitar cita</Text>
            </TouchableOpacity>
          </View>
        )}

        {!trainerId && (
          <View style={[styles.emptyState, { borderColor: `${colors.red}30` }]}>
            <Text style={[styles.emptyTitle, { color: colors.red }]}>Sin entrenador asignado</Text>
          </View>
        )}

        {/* Past */}
        {past.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HISTORIAL ({past.length})</Text>
            {past.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                onCancel={handleCancel}
                cancelling={cancelling}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      {trainerId && clientId && (
        <RequestModal
          visible={showModal}
          trainerId={trainerId}
          clientId={clientId}
          onClose={() => setShowModal(false)}
          onCreated={fetchAppointments}
        />
      )}
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  onCancel,
  cancelling,
}: {
  appt: Appointment;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
  const isPast = new Date(appt.starts_at) < new Date();
  const isCancellable = !isPast && appt.status !== "cancelled" && appt.status !== "completed";
  const typeLabel = SESSION_TYPES.find((t) => t.value === appt.session_type)?.label ?? appt.session_type;
  const durationMin = getDurationMinutes(appt.starts_at, appt.ends_at);

  return (
    <View style={styles.card}>
      {/* Status + type row */}
      <View style={styles.cardTopRow}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Text style={styles.typeText}>{typeLabel}</Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{appt.title}</Text>

      {/* Date + time */}
      <View style={styles.cardDateRow}>
        <Text style={styles.cardDate}>{formatDate(appt.starts_at)}</Text>
        <Text style={styles.cardDot}>·</Text>
        <Text style={styles.cardTime}>{formatTime(appt.starts_at)}</Text>
        <Text style={styles.cardDot}>·</Text>
        <Text style={styles.cardDuration}>{durationMin} min</Text>
      </View>

      {appt.location ? (
        <Text style={styles.cardLocation}>📍 {appt.location}</Text>
      ) : null}

      {appt.notes ? (
        <Text style={styles.cardNotes}>{appt.notes}</Text>
      ) : null}

      {isCancellable && (
        <TouchableOpacity
          onPress={() => onCancel(appt.id)}
          disabled={cancelling === appt.id}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>
            {cancelling === appt.id ? "Cancelando…" : "Cancelar cita"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 56 : 32,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.extraBold, letterSpacing: -0.5,
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  newButton: {
    backgroundColor: colors.cyan,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  newButtonText: {
    color: "#0A0A0F",
    fontFamily: fonts.extraBold, letterSpacing: -0.5,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    paddingTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeText: {
    fontSize: 11,
    color: colors.dimmed,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.extraBold, letterSpacing: -0.5,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardDate: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.cyan,
  },
  cardDot: {
    fontSize: 13,
    color: colors.dimmed,
  },
  cardTime: {
    fontSize: 13,
    color: colors.muted,
  },
  cardDuration: {
    fontSize: 13,
    color: colors.dimmed,
  },
  cardLocation: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  cardNotes: {
    fontSize: 12,
    color: colors.dimmed,
    fontStyle: "italic",
    marginTop: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.redDim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: "flex-start",
  },
  cancelButtonText: {
    color: colors.red,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  emptyState: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxxl,
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: 12,
    color: colors.dimmed,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: colors.cyanDim,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  emptyButtonText: {
    color: colors.cyan,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 16 : 24,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  modalCancel: {
    fontSize: 15,
    color: colors.muted,
  },
  modalSubmit: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.cyan,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.white,
    fontSize: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  typeChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typeChipActive: {
    backgroundColor: colors.cyanDim,
    borderColor: colors.borderActive,
  },
  typeChipText: {
    color: colors.dimmed,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  typeChipTextActive: {
    color: colors.cyan,
  },
  dayChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minWidth: 48,
  },
  dayChipActive: {
    backgroundColor: colors.cyanDim,
    borderColor: colors.borderActive,
  },
  dayChipWeekday: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 0.5,
  },
  dayChipDay: {
    fontSize: 16,
    fontFamily: fonts.extraBold, letterSpacing: -0.5,
    color: colors.muted,
    marginTop: 2,
  },
  hourChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hourChipActive: {
    backgroundColor: colors.cyanDim,
    borderColor: colors.borderActive,
  },
  hourChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    marginTop: spacing.md,
  },
});
