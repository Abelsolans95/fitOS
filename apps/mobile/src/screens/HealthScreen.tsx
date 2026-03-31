import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import Svg, { Path, Text as SvgText, Line } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows, fonts } from "../theme";
import { FRONT_MUSCLES, BACK_MUSCLES, MUSCLE_LABELS, HEAD_OUTLINE, FRONT_BODY_OUTLINE, BACK_BODY_OUTLINE } from "./health/muscleData";
import { ReportModal } from "./health/ReportModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HealthLog {
  id: string;
  client_id: string;
  trainer_id: string;
  reported_by: "coach" | "client";
  muscle_id: string;
  pain_score: number;
  incident_type: "puntual" | "diagnosticada" | "cronica";
  status: "active" | "recovering" | "recovered";
  notes: string | null;
  created_at: string;
}

const INCIDENT_LABELS: Record<string, string> = {
  puntual: "Molestia puntual",
  diagnosticada: "Lesión diagnosticada",
  cronica: "Dolor crónico",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: colors.red, bg: colors.redDim, label: "Activa" },
  recovering: { color: colors.orange, bg: colors.orangeDim, label: "Recuperando" },
  recovered: { color: colors.green, bg: colors.greenDim, label: "Recuperada" },
};

function getActiveLog(logs: HealthLog[], muscleId: string) {
  return logs.find((l) => l.muscle_id === muscleId && l.status !== "recovered");
}

function getMuscleColor(logs: HealthLog[], muscleId: string, isSelected: boolean): string {
  const active = getActiveLog(logs, muscleId);
  if (!active) return isSelected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.035)";
  if (active.pain_score >= 6) return isSelected ? "rgba(255,23,68,0.55)" : "rgba(255,23,68,0.38)";
  return isSelected ? "rgba(255,145,0,0.5)" : "rgba(255,145,0,0.32)";
}

function getMuscleStroke(logs: HealthLog[], muscleId: string, isSelected: boolean): string {
  const active = getActiveLog(logs, muscleId);
  if (!active) return isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)";
  if (active.pain_score >= 6) return isSelected ? "rgba(255,23,68,0.7)" : "rgba(255,23,68,0.5)";
  return isSelected ? "rgba(255,145,0,0.6)" : "rgba(255,145,0,0.4)";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function HealthScreen() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("health_logs")
      .select("id, muscle_id, pain_score, incident_type, status, notes, reported_by, created_at, client_id, trainer_id")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[HealthScreen] Fetch error:", error);
      Alert.alert("Error", "No se pudieron cargar los registros");
      return;
    }
    setLogs((data as HealthLog[]) ?? []);
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;
      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (rel) setTrainerId(rel.trainer_id as string);
      await fetchLogs();
      setLoading(false);
    };
    init();
  }, [user?.id, fetchLogs]);

  useEffect(() => {
    if (!user?.id) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      channel = supabase
        .channel(`health-mobile-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "health_logs", filter: `client_id=eq.${user.id}` }, () => fetchLogs())
        .subscribe();
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user?.id, fetchLogs]);

  const muscles = view === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
  const activeLogs = logs.filter((l) => l.status !== "recovered");
  const existingForMuscle = selectedMuscle
    ? logs.find((l) => l.muscle_id === selectedMuscle && l.status !== "recovered") ?? null
    : null;

  const handleMusclePress = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setShowModal(true);
  };

  if (loading) {
    return (
      <View style={st.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  const svgWidth = Math.min(SCREEN_WIDTH - spacing.xxxl * 2, 300);
  const svgHeight = svgWidth * (330 / 208);

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>Mi Salud</Text>
      <Text style={st.subtitle}>Reporta molestias para que tu entrenador las tenga en cuenta</Text>

      <View style={st.toggleContainer}>
        <TouchableOpacity onPress={() => setView("front")} style={[st.toggleBtn, view === "front" && st.toggleBtnActive]}>
          <Text style={[st.toggleBtnText, view === "front" && st.toggleBtnTextActive]}>FRONTAL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("back")} style={[st.toggleBtn, view === "back" && st.toggleBtnActive]}>
          <Text style={[st.toggleBtnText, view === "back" && st.toggleBtnTextActive]}>POSTERIOR</Text>
        </TouchableOpacity>
      </View>

      <View style={st.legendRow}>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
          <Text style={st.legendText}>Sin molestias</Text>
        </View>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: "rgba(255,145,0,0.5)" }]} />
          <Text style={st.legendText}>Leve (1-5)</Text>
        </View>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: "rgba(255,23,68,0.5)" }]} />
          <Text style={st.legendText}>Grave (6-10)</Text>
        </View>
      </View>

      <View style={st.mapCard}>
        <Svg width={svgWidth} height={svgHeight} viewBox="0 0 208 330">
          <Path d={HEAD_OUTLINE} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} strokeLinejoin="round" />
          <Path d={view === "front" ? FRONT_BODY_OUTLINE : BACK_BODY_OUTLINE} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} strokeLinejoin="round" />
          <Line x1="104" y1="56" x2="104" y2="174" stroke="rgba(255,255,255,0.025)" strokeWidth={0.4} strokeDasharray="2,4" />
          {muscles.map((muscle) => {
            const isSelected = selectedMuscle === muscle.id;
            return (
              <Path
                key={muscle.id}
                d={muscle.path}
                fill={getMuscleColor(logs, muscle.id, isSelected)}
                stroke={getMuscleStroke(logs, muscle.id, isSelected)}
                strokeWidth={isSelected ? 1.2 : 0.6}
                strokeLinejoin="round"
                onPress={() => handleMusclePress(muscle.id)}
              />
            );
          })}
          <SvgText x="104" y="328" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="6" fontWeight="600">
            {view === "front" ? "VISTA FRONTAL" : "VISTA POSTERIOR"}
          </SvgText>
        </Svg>
      </View>

      {activeLogs.length > 0 && (
        <View style={st.activeBadge}>
          <Text style={st.activeBadgeText}>
            {activeLogs.length} incidencia{activeLogs.length !== 1 ? "s" : ""} activa{activeLogs.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <Text style={st.sectionTitle}>INCIDENCIAS ACTIVAS</Text>
      {activeLogs.length === 0 ? (
        <View style={st.emptyCard}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={st.emptyTitle}>Sin molestias activas</Text>
          <Text style={st.emptySubtitle}>Toca un músculo del mapa para reportar</Text>
        </View>
      ) : (
        activeLogs.map((log) => (
          <TouchableOpacity key={log.id} onPress={() => { setSelectedMuscle(log.muscle_id); setShowModal(true); }} style={st.logCard}>
            <View style={st.logHeader}>
              <Text style={st.logMuscle}>{MUSCLE_LABELS[log.muscle_id] ?? log.muscle_id}</Text>
              <Text style={[st.logPainScore, { color: log.pain_score >= 6 ? colors.red : colors.orange }]}>{log.pain_score}</Text>
              <View style={[st.statusBadge, { backgroundColor: STATUS_CONFIG[log.status]?.bg }]}>
                <Text style={[st.statusBadgeText, { color: STATUS_CONFIG[log.status]?.color }]}>{STATUS_CONFIG[log.status]?.label}</Text>
              </View>
            </View>
            <View style={st.logMeta}>
              <Text style={st.logMetaText}>
                {INCIDENT_LABELS[log.incident_type]} · {log.reported_by === "coach" ? "Entrenador" : "Tú"} · {formatDate(log.created_at)}
              </Text>
            </View>
            {log.notes && <Text style={st.logNotes} numberOfLines={2}>{log.notes}</Text>}
          </TouchableOpacity>
        ))
      )}

      {selectedMuscle && trainerId && user?.id && (
        <ReportModal
          visible={showModal}
          muscleId={selectedMuscle}
          existing={existingForMuscle}
          trainerId={trainerId}
          clientId={user.id}
          onClose={() => { setShowModal(false); setSelectedMuscle(null); }}
          onSaved={fetchLogs}
        />
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.section + spacing.xxxl, paddingBottom: spacing.section },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontFamily: fonts.extraBold, letterSpacing: -1, color: colors.white },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.xl },
  toggleContainer: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xs, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
  toggleBtnActive: { backgroundColor: colors.cyanDim },
  toggleBtnText: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted, letterSpacing: 1 },
  toggleBtnTextActive: { color: colors.cyan },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: spacing.lg, marginBottom: spacing.lg },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  mapCard: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xl, marginBottom: spacing.lg, ...shadows.card },
  activeBadge: { alignSelf: "center", backgroundColor: colors.redDim, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.lg },
  activeBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.red },
  sectionTitle: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.md },
  emptyCard: { alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.section },
  emptyTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.white },
  emptySubtitle: { fontSize: 12, color: colors.muted },
  logCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  logHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logMuscle: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  logPainScore: { fontSize: 18, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontFamily: fonts.bold },
  logMeta: { marginTop: spacing.xs },
  logMetaText: { fontSize: 11, color: colors.dimmed },
  logNotes: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
});
