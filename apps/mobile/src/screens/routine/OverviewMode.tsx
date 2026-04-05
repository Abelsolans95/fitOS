import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../../theme";
import { DAY_KEYS, DAY_SHORT, getScheme } from "./constants";
import { CheckIcon, PlayIcon, PlusIcon, VideoIcon } from "./icons";
import { st } from "./styles";
import type { ExerciseData, InProgressSession, RoutineRaw } from "./types";

interface Props {
  routine: RoutineRaw;
  selectedDay: string;
  activeWeek: number;
  weekCount: number;
  trainingDays: string[];
  dayExercises: ExerciseData[];
  inProgressSession: InProgressSession | null;
  isSessionCompleted: boolean;
  getDayLabel: (day: string) => string;
  formatPrevious: (name: string) => string;
  onDaySelect: (day: string) => void;
  onWeekSelect: (week: number) => void;
  onStartRegistration: () => void;
  onStartActive: () => void;
  onResumeSession: () => void;
}

export function OverviewMode({
  routine, selectedDay, activeWeek, weekCount, trainingDays, dayExercises,
  inProgressSession, isSessionCompleted, getDayLabel, formatPrevious,
  onDaySelect, onWeekSelect, onStartRegistration, onStartActive, onResumeSession,
}: Props) {
  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Header */}
      <Text style={st.pageLabel}>MI RUTINA</Text>
      <Text style={st.title}>{routine.title}</Text>
      <View style={st.headerMeta}>
        <View style={st.goalBadge}>
          <Text style={st.goalText}>{routine.goal === "fuerza" ? "FUERZA" : "HIPERTROFIA"}</Text>
        </View>
        <Text style={st.durationText}>
          {routine.duration_months} mes{(routine.duration_months || 1) > 1 ? "es" : ""}
        </Text>
      </View>

      {/* Week selector */}
      {weekCount > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.weekScroll} contentContainerStyle={st.weekScrollContent}>
          {Array.from({ length: Math.min(weekCount, 12) }, (_, i) => i + 1).map((w) => (
            <TouchableOpacity key={w} onPress={() => onWeekSelect(w)}
              style={[st.weekPill, activeWeek === w && st.weekPillActive]} activeOpacity={0.7}
            >
              <Text style={[st.weekPillText, activeWeek === w && st.weekPillTextActive]}>Sem {w}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Day selector */}
      <View style={st.dayRow}>
        {DAY_KEYS.map((day) => {
          const isActive = selectedDay === day;
          const hasEx = trainingDays.includes(day);
          return (
            <TouchableOpacity key={day} onPress={() => onDaySelect(day)}
              style={[st.dayPill, isActive && st.dayPillActive, !hasEx && st.dayPillEmpty]} activeOpacity={0.7}
            >
              <Text style={[st.dayPillText, isActive && st.dayPillTextActive, !hasEx && { color: colors.dimmed }]}>
                {DAY_SHORT[day]}
              </Text>
              {hasEx && <View style={[st.dayDot, isActive && st.dayDotActive]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day label */}
      {trainingDays.includes(selectedDay) && (
        <View style={st.dayLabelRow}>
          <Text style={st.dayLabelText}>{getDayLabel(selectedDay)}</Text>
          <Text style={st.dayLabelMeta}>Sem {activeWeek}</Text>
        </View>
      )}

      {/* Exercise list or rest day */}
      {dayExercises.length === 0 ? (
        <View style={st.restDayCard}>
          <Text style={st.restTitle}>Día de descanso</Text>
          <Text style={st.restSubtitle}>Recupera y vuelve más fuerte</Text>
        </View>
      ) : (
        <>
          {dayExercises.map((exercise, index) => {
            const prevStr = formatPrevious(exercise.name);
            const notes = exercise.coach_notes || exercise.trainer_notes || exercise.technique_notes || "";
            const progressionRule = exercise.progression_rule || "";

            return (
              <View key={exercise.exercise_id + index} style={st.exerciseCard}>
                <View style={st.exerciseTop}>
                  <View style={st.exerciseIndex}>
                    <Text style={st.exerciseIndexText}>{index + 1}</Text>
                  </View>
                  <View style={st.exerciseInfo}>
                    <Text style={st.exerciseName}>{exercise.name}</Text>
                    <View style={st.exerciseMetaRow}>
                      <View style={st.metaChip}><Text style={st.metaChipText}>{getScheme(exercise)}</Text></View>
                      {(exercise.target_weight || exercise.weight_kg) ? (
                        <View style={st.metaChip}>
                          <Text style={st.metaChipText}>{exercise.target_weight || exercise.weight_kg}kg</Text>
                        </View>
                      ) : null}
                      {exercise.rir > 0 && <View style={st.metaChip}><Text style={st.metaChipText}>RIR {exercise.rir}</Text></View>}
                      <View style={[st.metaChip, { borderColor: colors.orangeDim }]}>
                        <Text style={[st.metaChipText, { color: colors.orange }]}>{exercise.rest_s}s</Text>
                      </View>
                    </View>
                    {prevStr ? <Text style={st.anteriorInline}>Anterior: {prevStr}</Text> : null}
                    {progressionRule ? <Text style={st.progressionInline}>{progressionRule}</Text> : null}
                    {notes ? <Text style={st.notesInline}>{notes}</Text> : null}
                    {exercise.video_url && /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/.test(exercise.video_url) ? (
                      <TouchableOpacity style={st.videoLink} activeOpacity={0.7}
                        onPress={() => Linking.openURL(exercise.video_url!)}
                      >
                        <VideoIcon />
                        <Text style={st.videoLinkText}>Ver vídeo</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}

          {inProgressSession && (
            <TouchableOpacity style={st.resumeBtn} activeOpacity={0.8} onPress={onResumeSession}>
              <LinearGradient
                colors={[colors.orange, "#E65100"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.resumeBtnGradient}
              >
                <PlayIcon color={colors.bg} />
                <Text style={st.resumeBtnText}>Completar rutina en curso</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isSessionCompleted ? (
            <View style={st.isSessionCompletedBadge}>
              <CheckIcon size={16} color={colors.green} />
              <Text style={st.isSessionCompletedText}>Sesión completada hoy</Text>
            </View>
          ) : (
            <View style={st.actionRow}>
              <TouchableOpacity style={st.secondaryBtn} activeOpacity={0.7} onPress={onStartRegistration}>
                <PlusIcon />
                <Text style={st.secondaryBtnText}>Registrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.primaryBtnGlow} activeOpacity={0.8} onPress={onStartActive}>
                <LinearGradient
                  colors={[colors.cyan, "#00B8D4"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={st.primaryBtnGradient}
                >
                  <PlayIcon />
                  <Text style={st.primaryBtnText}>Entrenar en activo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
