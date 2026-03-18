import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";

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
  lunes: "Lun",
  martes: "Mar",
  miércoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sábado: "Sáb",
  domingo: "Dom",
};

export default function RoutineScreen() {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return DAY_LABELS[d === 0 ? 6 : d - 1]; // JS Sunday=0
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💪</Text>
        <Text style={styles.emptyTitle}>Sin rutina asignada</Text>
        <Text style={styles.emptySubtitle}>Tu entrenador aún no te ha asignado una rutina</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Routine header */}
      <Text style={styles.title}>{routine.title}</Text>
      <View style={styles.goalBadge}>
        <Text style={styles.goalText}>{routine.goal}</Text>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
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
                  !hasExercises && styles.dayPillTextEmpty,
                ]}
              >
                {DAY_SHORT[day] || day}
              </Text>
              {hasExercises && (
                <View style={[styles.dayDot, isActive && styles.dayDotActive]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <View style={styles.restDay}>
          <Text style={styles.restIcon}>🧘</Text>
          <Text style={styles.restText}>Día de descanso</Text>
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
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseIndex}>{index + 1}</Text>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets}×{exercise.reps_min}
                    {exercise.reps_max !== exercise.reps_min ? `-${exercise.reps_max}` : ""} reps
                    {exercise.weight_kg ? ` · ${exercise.weight_kg}kg` : ""}
                    {exercise.rir > 0 ? ` · RIR ${exercise.rir}` : ""}
                  </Text>
                </View>
                <Text style={styles.exerciseRest}>{exercise.rest_s}s</Text>
              </View>

              {/* Set tracker */}
              <View style={styles.setsRow}>
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
                      ]}
                    >
                      {i < completed ? "✓" : i + 1}
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
  content: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.white, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.white },
  goalBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.cyan + "15",
    borderWidth: 1,
    borderColor: colors.cyan + "30",
    marginTop: 8,
    marginBottom: 20,
  },
  goalText: { fontSize: 12, fontWeight: "600", color: colors.cyan },
  dayScroll: { marginBottom: 20 },
  dayPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    alignItems: "center",
  },
  dayPillActive: {
    backgroundColor: colors.cyan + "15",
    borderColor: colors.cyan + "40",
  },
  dayPillEmpty: { opacity: 0.5 },
  dayPillText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  dayPillTextActive: { color: colors.cyan },
  dayPillTextEmpty: { color: colors.muted + "60" },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.muted, marginTop: 4 },
  dayDotActive: { backgroundColor: colors.cyan },
  restDay: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restIcon: { fontSize: 40, marginBottom: 12 },
  restText: { fontSize: 16, color: colors.muted },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  exerciseCardDone: {
    borderColor: colors.green + "40",
    backgroundColor: colors.green + "08",
  },
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.cyan + "15",
    color: colors.cyan,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
    overflow: "hidden",
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "700", color: colors.white },
  exerciseDetails: { fontSize: 12, color: colors.muted, marginTop: 2 },
  exerciseRest: { fontSize: 12, color: colors.muted },
  setsRow: { flexDirection: "row", gap: 8 },
  setCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  setCircleDone: {
    borderColor: colors.green,
    backgroundColor: colors.green + "20",
  },
  setCircleCurrent: {
    borderColor: colors.cyan,
  },
  setCircleText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  setCircleTextDone: { color: colors.green },
});
