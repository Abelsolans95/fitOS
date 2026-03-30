import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRoutineScreen } from "./routine/useRoutineScreen";
import { RestTimer } from "./routine/RestTimer";
import { RpeScreen } from "./routine/RpeScreen";
import { SummaryScreen } from "./routine/SummaryScreen";
import { ActiveTraining } from "./routine/ActiveTraining";
import { RegistrationMode } from "./routine/RegistrationMode";
import { OverviewMode } from "./routine/OverviewMode";
import { BoltIcon } from "./routine/icons";
import { st } from "./routine/styles";
import { colors } from "../theme";

export default function RoutineScreen() {
  const {
    loading, routine, mode, setMode,
    selectedDay, setSelectedDay, activeWeek, setActiveWeek,
    currentExIdx, allSets, setAllSets,
    clientNotes, setClientNotes, exerciseNotes, setExerciseNotes,
    exerciseRpe, setExerciseRpe, rpeGlobal, setRpeGlobal,
    saving, savedExercises,
    inProgressSession, isSessionCompleted,
    restTime, restTotal, elapsed,
    dayExercises, trainingDays, weekCount,
    currentEx, currentSetIdx, allCurrentDone, summaryData,
    getDayLabel, getPreviousLog, formatPrevious,
    startSession, resumeSession, completeSet,
    saveRegistration, goNextExercise, goPrevExercise, finishRoutine, finishSession,
    skipRest,
  } = useRoutineScreen();

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={st.center}>
        <View style={st.emptyIcon}><BoltIcon /></View>
        <Text style={st.emptyTitle}>Sin rutina asignada</Text>
        <Text style={st.emptySub}>Tu entrenador aún no te ha asignado una rutina</Text>
      </View>
    );
  }

  if (mode === "rest") {
    return (
      <RestTimer
        restTime={restTime}
        restTotal={restTotal}
        currentExName={currentEx?.name}
        nextExName={dayExercises[currentExIdx + 1]?.name}
        exerciseNote={exerciseNotes[currentExIdx] || ""}
        onNoteChange={(val) => setExerciseNotes((prev) => ({ ...prev, [currentExIdx]: val }))}
        onSkip={skipRest}
      />
    );
  }

  if (mode === "rpe") {
    return (
      <RpeScreen
        rpeGlobal={rpeGlobal}
        onRpeChange={setRpeGlobal}
        onFinish={finishSession}
      />
    );
  }

  if (mode === "summary") {
    return (
      <SummaryScreen
        routineTitle={routine.title}
        dayLabel={getDayLabel(selectedDay)}
        activeWeek={activeWeek}
        elapsed={elapsed}
        summaryData={summaryData}
        onBack={() => setMode("overview")}
      />
    );
  }

  if (mode === "active") {
    if (!currentEx) {
      return (
        <View style={st.center}>
          <Text style={st.emptyTitle}>Sin ejercicios</Text>
          <Text style={st.emptySub}>No hay ejercicios para este día</Text>
        </View>
      );
    }
    return (
      <ActiveTraining
        currentEx={currentEx}
        currentExIdx={currentExIdx}
        totalExercises={dayExercises.length}
        elapsed={elapsed}
        sets={allSets[currentExIdx] || []}
        prevSets={getPreviousLog(currentEx.name)}
        activeWeek={activeWeek}
        currentSetIdx={currentSetIdx}
        allCurrentDone={allCurrentDone}
        savedExercises={savedExercises}
        exerciseRpe={exerciseRpe}
        onSetChange={(setIdx, field, val) => {
          setAllSets((prev) => {
            const u = { ...prev };
            const exS = [...(u[currentExIdx] || [])];
            exS[setIdx] = { ...exS[setIdx], [field]: val };
            u[currentExIdx] = exS;
            return u;
          });
        }}
        onCompleteSet={completeSet}
        onSetRpe={(val) => setExerciseRpe((prev) => ({ ...prev, [currentExIdx]: val }))}
        onPrev={goPrevExercise}
        onNext={goNextExercise}
        onFinish={finishRoutine}
        onAbort={() => setMode("overview")}
      />
    );
  }

  if (mode === "registration") {
    return (
      <RegistrationMode
        dayLabel={getDayLabel(selectedDay)}
        activeWeek={activeWeek}
        elapsed={elapsed}
        dayExercises={dayExercises}
        allSets={allSets}
        clientNotes={clientNotes}
        exerciseRpe={exerciseRpe}
        rpeGlobal={rpeGlobal}
        saving={saving}
        getPreviousLog={getPreviousLog}
        formatPrevious={formatPrevious}
        onSetChange={(exIdx, setIdx, field, val) => {
          setAllSets((prev) => {
            const u = { ...prev };
            const exS = [...(u[exIdx] || [])];
            exS[setIdx] = { ...exS[setIdx], [field]: val };
            u[exIdx] = exS;
            return u;
          });
        }}
        onClientNoteChange={(name, val) => setClientNotes((prev) => ({ ...prev, [name]: val }))}
        onExerciseRpeChange={(exIdx, val) => setExerciseRpe((prev) => ({ ...prev, [exIdx]: val }))}
        onRpeChange={setRpeGlobal}
        onSave={saveRegistration}
        onBack={() => setMode("overview")}
      />
    );
  }

  // Overview (default)
  return (
    <OverviewMode
      routine={routine}
      selectedDay={selectedDay}
      activeWeek={activeWeek}
      weekCount={weekCount}
      trainingDays={trainingDays}
      dayExercises={dayExercises}
      inProgressSession={inProgressSession}
      isSessionCompleted={isSessionCompleted}
      getDayLabel={getDayLabel}
      formatPrevious={formatPrevious}
      onDaySelect={setSelectedDay}
      onWeekSelect={setActiveWeek}
      onStartRegistration={() => startSession("registration")}
      onStartActive={() => startSession("active")}
      onResumeSession={resumeSession}
    />
  );
}
