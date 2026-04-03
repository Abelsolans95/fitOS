import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, shadows, fonts } from "../theme";
import { AppointmentCard } from "./appointments/AppointmentCard";
import { RequestModal } from "./appointments/RequestModal";
import type { Appointment, TrainerInfo } from "./appointments/types";

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
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setMonth(pastDate.getMonth() - 1);
    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + 3);

    const { data, error: apptErr } = await supabase
      .from("appointments")
      .select("id, trainer_id, client_id, title, session_type, starts_at, ends_at, status, notes, location")
      .eq("client_id", user.id)
      .gte("starts_at", pastDate.toISOString())
      .lte("starts_at", futureDate.toISOString())
      .order("starts_at", { ascending: true })
      .limit(200);

    if (apptErr) {
      console.error("[AppointmentsScreen] Error cargando citas:", apptErr);
      Alert.alert("Error", "No se pudieron cargar las citas");
      return;
    }
    setAppointments((data as Appointment[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setClientId(user.id);

      const [relRes, _] = await Promise.all([
        supabase.from("trainer_clients").select("trainer_id").eq("client_id", user.id).eq("status", "active").single(),
        fetchAppointments(),
      ]);

      const { data: rel, error: relErr } = relRes;
      if (relErr) {
        console.error("[AppointmentsScreen] Error cargando relación trainer:", relErr); // No bloqueante
      }

      if (rel) {
        setTrainerId(rel.trainer_id as string);
        const { data: profile, error: profileErr } = await supabase
          .from("profiles").select("user_id, full_name")
          .eq("user_id", rel.trainer_id).single();
        if (profileErr) {
          console.error("[AppointmentsScreen] Error cargando perfil trainer:", profileErr); // No bloqueante
        }
        setTrainer(profile as TrainerInfo | null);
      }

      setLoading(false);
    };
    init();
  }, [fetchAppointments]);

  // Realtime subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`appointments-mobile-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `client_id=eq.${user.id}` },
          () => fetchAppointments())
        .subscribe();
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchAppointments]);

  const handleCancel = (id: string) => {
    Alert.alert("Cancelar cita", "¿Seguro que quieres cancelar esta cita?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí, cancelar", style: "destructive",
        onPress: async () => {
          setCancelling(id);
          const { error: cancelErr } = await supabase.from("appointments").update({ status: "cancelled", cancelled_by: clientId }).eq("id", id);
          if (cancelErr) {
            console.error("[AppointmentsScreen] Error cancelando cita:", cancelErr);
            Alert.alert("Error", "No se pudo cancelar la cita. Inténtalo de nuevo.");
          } else {
            await fetchAppointments();
          }
          setCancelling(null);
        },
      },
    ]);
  };

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.starts_at) >= now && a.status !== "cancelled");
  const past = appointments.filter((a) => new Date(a.starts_at) < now || a.status === "cancelled");

  if (loading) {
    return (
      <View style={st.centered}>
        <ActivityIndicator color={colors.cyan} size="large" />
      </View>
    );
  }

  return (
    <View style={st.container}>
      <View style={st.header}>
        <View>
          <Text style={st.headerTitle}>Citas</Text>
          <Text style={st.headerSub}>
            {trainer ? `Con ${trainer.full_name ?? "tu entrenador"}` : "Sesiones con tu entrenador"}
          </Text>
        </View>
        {trainerId && (
          <TouchableOpacity onPress={() => setShowModal(true)} style={st.newButton}>
            <Text style={st.newButtonText}>+ Solicitar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        {upcoming.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>PRÓXIMAS ({upcoming.length})</Text>
            {upcoming.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} onCancel={handleCancel} cancelling={cancelling} />
            ))}
          </View>
        )}

        {upcoming.length === 0 && trainerId && (
          <View style={st.emptyState}>
            <View style={st.emptyIcon}><Text style={st.emptyIconText}>📅</Text></View>
            <Text style={st.emptyTitle}>Sin citas próximas</Text>
            <Text style={st.emptySub}>Solicita una sesión con tu entrenador</Text>
            <TouchableOpacity onPress={() => setShowModal(true)} style={st.emptyButton}>
              <Text style={st.emptyButtonText}>Solicitar cita</Text>
            </TouchableOpacity>
          </View>
        )}

        {!trainerId && (
          <View style={[st.emptyState, { borderColor: `${colors.red}30` }]}>
            <Text style={[st.emptyTitle, { color: colors.red }]}>Sin entrenador asignado</Text>
          </View>
        )}

        {past.length > 0 && (
          <View style={st.section}>
            <Text style={st.sectionLabel}>HISTORIAL ({past.length})</Text>
            {past.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} onCancel={handleCancel} cancelling={cancelling} />
            ))}
          </View>
        )}
      </ScrollView>

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

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 56 : 32, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 28, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white },
  headerSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  newButton: { backgroundColor: colors.cyan, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  newButtonText: { color: "#0A0A0F", fontFamily: fonts.extraBold, fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 40, paddingTop: spacing.xl },
  section: { marginBottom: spacing.xxl },
  sectionLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1.5, marginBottom: spacing.md },
  emptyState: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xxxl, alignItems: "center", marginBottom: spacing.xxl },
  emptyIcon: { width: 48, height: 48, borderRadius: radius.xl, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyIconText: { fontSize: 24 },
  emptyTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.white, marginBottom: spacing.xs },
  emptySub: { fontSize: 12, color: colors.dimmed, marginBottom: spacing.lg, textAlign: "center" },
  emptyButton: { backgroundColor: colors.cyanDim, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  emptyButtonText: { color: colors.cyan, fontSize: 13, fontFamily: fonts.bold },
});
