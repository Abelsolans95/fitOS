import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Svg, { Path, Circle as SvgCircle } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows } from "../theme";

interface RoutineExercise {
  exercise_id: string;
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  weight_kg: number | null;
  rest_s: number;
}

interface DayRoutine {
  day: string;
  exercises: RoutineExercise[];
}

interface Routine {
  id: string;
  title: string;
  goal: string;
  days: Record<string, DayRoutine> | DayRoutine[];
}

const DAY_LABELS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DAY_SHORT: Record<string, string> = {
  lunes: "L", martes: "M", miércoles: "X", jueves: "J",
  viernes: "V", sábado: "S", domingo: "D",
};

export default function RoutineScreen() {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return DAY_LABELS[d === 0 ? 6 : d - 1];
  });
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_routines")
        .select("id, title, goal, days")
        .eq("client_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setRoutine(data as Routine);
      setLoading(false);
    };
    load();
  }, [user]);

  const getDayExercises = (): RoutineExercise[] => {
    if (!routine?.days) return [];
    if (Array.isArray(routine.days)) {
      const found = routine.days.find((d) => d.day === selectedDay);
      return found?.exercises || [];
    }
    const dayData = (routine.days as Record<string, { exercises?: RoutineExercise[] }>)[selectedDay];
    return dayData?.exercises || [];
  };

  const exercises = getDayExercises();

  const toggleSet = (exerciseId: string) => {
    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || 0) + 1,
    }));
  };

  // Count total completed
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const doneSets = exercises.reduce((sum, e) => sum + Math.min(completedSets[e.exercise_id] || 0, e.sets), 0);
  const progress = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconBox}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3.75 13.5L14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              stroke={colors.dimmed}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.emptyTitle}>Sin rutina asignada</Text>
        <Text style={styles.emptySubtitle}>Tu entrenador aún no te ha asignado una rutina</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{routine.title}</Text>
          <View style={styles.goalBadge}>
            <Text style={styles.goalText}>{routine.goal}</Text>
          </View>
        </View>
        {/* Progress indicator */}
        {exercises.length > 0 && (
          <View style={styles.progressBox}>
            <Text style={styles.progressValue}>{progress}%</Text>
            <Text style={styles.progressLabel}>completado</Text>
          </View>
        )}
      </View>

      {/* Day selector - compact pills */}
      <View style={styles.dayRow}>
        {DAY_LABELS.map((day) => {
          const isActive = selectedDay === day;
          const dayExercises = (() => {
            if (!routine.days) return [];
            if (Array.isArray(routine.days)) return routine.days.find((d) => d.day === day)?.exercises || [];
            return (routine.days as Record<string, { exercises?: RoutineExercise[] }>)[day]?.exercises || [];
          })();
          const hasExercises = dayExercises.length > 0;

          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayPill,
                isActive && styles.dayPillActive,
                !hasExercises && styles.dayPillEmpty,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayPillText,
                  isActive && styles.dayPillTextActive,
                  !hasExercises && { color: colors.dimmed },
                ]}
              >
                {DAY_SHORT[day]}
              </Text>
              {hasExercises && <View style={[styles.dayDot, isActive && styles.dayDotActive]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <View style={styles.restDayCard}>
          <Text style={styles.restTitle}>Día de descanso</Text>
          <Text style={styles.restSubtitle}>Recupera y vuelve más fuerte</Text>
        </View>
      ) : (
        exercises.map((exercise, index) => {
          const completed = completedSets[exercise.exercise_id] || 0;
          const isComplete = completed >= exercise.sets;

          return (
            <View
              key={exercise.exercise_id + index}
              style={[styles.exerciseCard, isComplete && styles.exerciseCardDone]}
            >
              {/* Exercise number + info */}
              <View style={styles.exerciseTop}>
                <View style={[styles.exerciseIndex, isComplete && styles.exerciseIndexDone]}>
                  {isComplete ? (
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M4.5 12.75l6 6 9-13.5" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  ) : (
                    <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMetaRow}>
                    <View style={styles.exerciseMetaChip}>
                      <Text style={styles.exerciseMetaText}>
                        {exercise.sets}×{exercise.reps_min}
                        {exercise.reps_max !== exercise.reps_min ? `-${exercise.reps_max}` : ""}
                      </Text>
                    </View>
                    {exercise.weight_kg && (
                      <View style={styles.exerciseMetaChip}>
                        <Text style={styles.exerciseMetaText}>{exercise.weight_kg}kg</Text>
                      </View>
                    )}
                    {exercise.rir > 0 && (
                      <View style={styles.exerciseMetaChip}>
                        <Text style={styles.exerciseMetaText}>RIR {exercise.rir}</Text>
                      </View>
                    )}
                    <View style={[styles.exerciseMetaChip, { borderColor: colors.orangeDim }]}>
                      <Text style={[styles.exerciseMetaText, { color: colors.orange }]}>
                        {exercise.rest_s}s
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Set tracker */}
              <View style={styles.setsContainer}>
                {Array.from({ length: exercise.sets }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      if (i === completed) toggleSet(exercise.exercise_id);
                    }}
                    style={[
                      styles.setCircle,
                      i < completed && styles.setCircleDone,
                      i === completed && styles.setCircleCurrent,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.setCircleText,
                        i < completed && styles.setCircleTextDone,
                        i === completed && styles.setCircleTextCurrent,
                      ]}
                    >
                      {i < completed ? "✓" : `S${i + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 40 },

  // Empty state
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.white, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },

  // Header
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.xxl },
  title: { fontSize: 26, fontWeight: "900", color: colors.white, letterSpacing: -0.5 },
  goalBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.cyanDim,
    borderWidth: 1,
    borderColor: colors.cyanGlow,
    marginTop: 8,
  },
  goalText: { fontSize: 11, fontWeight: "700", color: colors.cyan, letterSpacing: 0.5 },
  progressBox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  progressValue: { fontSize: 22, fontWeight: "900", color: colors.cyan },
  progressLabel: { fontSize: 9, color: colors.dimmed, letterSpacing: 1 },

  // Day selector
  dayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xxl },
  dayPill: {
    width: 40,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillActive: {
    backgroundColor: colors.cyanDim,
    borderColor: colors.cyanGlow,
  },
  dayPillEmpty: { opacity: 0.4 },
  dayPillText: { fontSize: 13, fontWeight: "700", color: colors.muted },
  dayPillTextActive: { color: colors.cyan },
  dayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.dimmed, marginTop: 4 },
  dayDotActive: { backgroundColor: colors.cyan },

  // Rest day
  restDayCard: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restTitle: { fontSize: 18, fontWeight: "700", color: colors.muted },
  restSubtitle: { fontSize: 13, color: colors.dimmed, marginTop: 6 },

  // Exercise cards
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  exerciseCardDone: {
    borderColor: "rgba(0, 200, 83, 0.2)",
    backgroundColor: "rgba(0, 200, 83, 0.04)",
  },
  exerciseTop: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  exerciseIndex: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.cyanDim,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseIndexDone: {
    backgroundColor: colors.greenDim,
  },
  exerciseIndexText: { fontSize: 13, fontWeight: "800", color: colors.cyan },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "700", color: colors.white, marginBottom: 6 },
  exerciseMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exerciseMetaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHover,
  },
  exerciseMetaText: { fontSize: 11, fontWeight: "600", color: colors.muted },

  // Sets
  setsContainer: { flexDirection: "row", gap: 8, paddingTop: 4 },
  setCircle: {
    width: 40,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHover,
  },
  setCircleDone: {
    borderColor: "rgba(0, 200, 83, 0.3)",
    backgroundColor: colors.greenDim,
  },
  setCircleCurrent: {
    borderColor: colors.cyan,
    backgroundColor: colors.cyanDim,
  },
  setCircleText: { fontSize: 11, fontWeight: "700", color: colors.dimmed },
  setCircleTextDone: { color: colors.green },
  setCircleTextCurrent: { color: colors.cyan },
});
