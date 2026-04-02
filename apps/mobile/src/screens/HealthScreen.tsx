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
  Image,
} from "react-native";
import Svg, { Path, Defs, Filter, FeGaussianBlur, FeColorMatrix, FeMerge, FeMergeNode } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows, fonts } from "../theme";
import { getZonesByView, ZONE_LABELS, ANATOMY_VIEWBOX } from "@fitos/shared";
import type { MuscleZone } from "@fitos/shared";
import { ReportModal } from "./health/ReportModal";
import type { HealthLog } from "@fitos/shared";

type Gender = "male" | "female";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

/* ── Image map ───────────────────────────────────────────── */

const ANATOMY_IMAGES: Record<string, ReturnType<typeof require>> = {
  "male-front": require("../../assets/anatomy/front_male.png"),
  "male-back": require("../../assets/anatomy/back_male.jpg"),
  "female-front": require("../../assets/anatomy/front_female.jpg"),
  "female-back": require("../../assets/anatomy/back_female.jpg"),
};

function getAnatomyImage(gender: Gender, view: "front" | "back") {
  return ANATOMY_IMAGES[`${gender}-${view}`];
}

/* ── Helpers ──────────────────────────────────────────────── */

function getActiveLog(logs: HealthLog[], muscleId: string) {
  return logs.find((l) => l.muscle_id === muscleId && l.status !== "recovered");
}

function getZoneFill(logs: HealthLog[], muscleId: string, isSelected: boolean): string {
  const active = getActiveLog(logs, muscleId);
  if (isSelected) {
    if (!active) return "rgba(0,229,255,0.30)";
    if (active.pain_score >= 6) return "rgba(255,23,68,0.45)";
    return "rgba(255,145,0,0.40)";
  }
  if (!active) return "transparent";
  if (active.pain_score >= 6) return "rgba(255,23,68,0.35)";
  return "rgba(255,145,0,0.30)";
}

function getZoneStroke(logs: HealthLog[], muscleId: string, isSelected: boolean): string {
  const active = getActiveLog(logs, muscleId);
  if (isSelected) {
    if (!active) return "rgba(0,229,255,0.6)";
    if (active.pain_score >= 6) return "rgba(255,23,68,0.7)";
    return "rgba(255,145,0,0.65)";
  }
  if (!active) return "transparent";
  if (active.pain_score >= 6) return "rgba(255,23,68,0.5)";
  return "rgba(255,145,0,0.45)";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/* ── Main Screen ─────────────────────────────────────────── */

export default function HealthScreen() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [gender, setGender] = useState<Gender>("male");

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

      const [relResult, profileResult] = await Promise.all([
        supabase.from("trainer_clients").select("trainer_id").eq("client_id", user.id).eq("status", "active").single(),
        supabase.from("profiles").select("gender").eq("user_id", user.id).single(),
      ]);

      if (relResult.data) setTrainerId(relResult.data.trainer_id as string);
      if (profileResult.data?.gender) setGender(profileResult.data.gender as Gender);

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

  const handleGenderChange = async (newGender: Gender) => {
    setGender(newGender);
    if (!user?.id) return;
    const { error } = await supabase.from("profiles").update({ gender: newGender }).eq("user_id", user.id);
    if (error) console.error("[HealthScreen] gender update:", error); // No bloqueante
  };

  const zones = getZonesByView(view);
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

  const mapWidth = Math.min(SCREEN_WIDTH - spacing.xxxl * 2, 320);
  const mapHeight = mapWidth * (720 / 400); // matches ANATOMY_VIEWBOX aspect ratio

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Mi Salud</Text>
          <Text style={st.subtitle}>Reporta molestias para que tu entrenador las tenga en cuenta</Text>
        </View>
      </View>

      {/* Gender toggle */}
      <View style={st.genderContainer}>
        <TouchableOpacity onPress={() => handleGenderChange("male")} style={[st.genderBtn, gender === "male" && st.genderBtnActive]}>
          <Text style={[st.genderBtnText, gender === "male" && st.genderBtnTextActive]}>HOMBRE</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleGenderChange("female")} style={[st.genderBtn, gender === "female" && st.genderBtnActive]}>
          <Text style={[st.genderBtnText, gender === "female" && st.genderBtnTextActive]}>MUJER</Text>
        </TouchableOpacity>
      </View>

      {/* View toggle */}
      <View style={st.toggleContainer}>
        <TouchableOpacity onPress={() => setView("front")} style={[st.toggleBtn, view === "front" && st.toggleBtnActive]}>
          <Text style={[st.toggleBtnText, view === "front" && st.toggleBtnTextActive]}>FRONTAL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("back")} style={[st.toggleBtn, view === "back" && st.toggleBtnActive]}>
          <Text style={[st.toggleBtnText, view === "back" && st.toggleBtnTextActive]}>POSTERIOR</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
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

      {/* Anatomy map with image + SVG overlay */}
      <View style={[st.mapCard, { width: mapWidth, height: mapHeight }]}>
        <Image
          source={getAnatomyImage(gender, view)}
          style={StyleSheet.absoluteFillObject}
          resizeMode="contain"
        />
        <Svg
          width={mapWidth}
          height={mapHeight}
          viewBox={ANATOMY_VIEWBOX}
          style={StyleSheet.absoluteFillObject}
        >
          {zones.map((zone) => {
            const isSelected = selectedMuscle === zone.id;
            return (
              <Path
                key={zone.id}
                d={zone.path}
                fill={getZoneFill(logs, zone.id, isSelected)}
                stroke={getZoneStroke(logs, zone.id, isSelected)}
                strokeWidth={isSelected ? 1.5 : 0.8}
                strokeLinejoin="round"
                onPress={() => handleMusclePress(zone.id)}
              />
            );
          })}
        </Svg>
      </View>

      {/* View label */}
      <Text style={st.viewLabel}>
        {view === "front" ? "Vista frontal" : "Vista posterior"} — {gender === "male" ? "Hombre" : "Mujer"}
      </Text>

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
              <Text style={st.logMuscle}>{ZONE_LABELS[log.muscle_id] ?? log.muscle_id}</Text>
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
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.section + spacing.xxxl, paddingBottom: spacing.section, alignItems: "center" },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", width: "100%", marginBottom: spacing.lg },
  title: { fontSize: 28, fontFamily: fonts.extraBold, letterSpacing: -1, color: colors.white },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: spacing.xs },
  genderContainer: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xs, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, alignSelf: "center" },
  genderBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
  genderBtnActive: { backgroundColor: "rgba(124,58,237,0.1)" },
  genderBtnText: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted, letterSpacing: 1 },
  genderBtnTextActive: { color: colors.violet },
  toggleContainer: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xs, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, alignSelf: "center" },
  toggleBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
  toggleBtnActive: { backgroundColor: colors.cyanDim },
  toggleBtnText: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted, letterSpacing: 1 },
  toggleBtnTextActive: { color: colors.cyan },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: spacing.lg, marginBottom: spacing.lg },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  mapCard: { alignSelf: "center", borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: spacing.sm, ...shadows.card },
  viewLabel: { fontSize: 9, fontFamily: fonts.bold, color: "rgba(90,90,114,0.4)", textTransform: "uppercase", letterSpacing: 3, textAlign: "center", marginBottom: spacing.lg },
  activeBadge: { alignSelf: "center", backgroundColor: colors.redDim, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.lg },
  activeBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.red },
  sectionTitle: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.md, alignSelf: "flex-start" },
  emptyCard: { alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.section, width: "100%" },
  emptyTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.white },
  emptySubtitle: { fontSize: 12, color: colors.muted },
  logCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, width: "100%" },
  logHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logMuscle: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  logPainScore: { fontSize: 18, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontFamily: fonts.bold },
  logMeta: { marginTop: spacing.xs },
  logMetaText: { fontSize: 11, color: colors.dimmed },
  logNotes: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
});
