import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import FridgeAnalysis from "./calories/FridgeAnalysis";
import BuffetAnalysis from "./calories/BuffetAnalysis";
import { HeroCard } from "./calories/HeroCard";
import { CaptureRow } from "./calories/CaptureRow";
import { TodayLog } from "./calories/TodayLog";
import { useCaloriesData } from "./calories/useCaloriesData";
import { useAnalyzeImage } from "./calories/useAnalyzeImage";
import type { CaloriesMode } from "./calories/types";
import { MEAL_LABELS, MODE_TABS } from "./calories/types";
import { styles } from "./calories/styles";

export default function CaloriesScreen() {
  const { user } = useAuth();
  const [selectedMealType, setSelectedMealType] = useState("comida");
  const [activeMode, setActiveMode] = useState<CaloriesMode>("analizar");

  const {
    todayLogs,
    loading,
    totals,
    remainingMacros,
    alreadyEatenToday,
    loadTodayLogs,
  } = useCaloriesData(user?.id);

  const { analyzing, takePhoto, pickImage } = useAnalyzeImage({
    userId: user?.id,
    mealType: selectedMealType,
    onAnalyzed: loadTodayLogs,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <HeroCard
        totalKcal={totals.kcal}
        totalProtein={totals.protein}
        totalCarbs={totals.carbs}
        totalFat={totals.fat}
      />

      <View style={styles.modeTabContainer}>
        {MODE_TABS.map((tab) => {
          const active = activeMode === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveMode(tab.key)}
              style={[styles.modeTab, active && styles.modeTabActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.modeTabText, active && styles.modeTabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>TIPO DE COMIDA</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
      >
        {Object.entries(MEAL_LABELS).map(([key, label]) => {
          const active = selectedMealType === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedMealType(key)}
              style={[styles.pill, active && styles.pillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeMode === "analizar" && (
        <CaptureRow
          analyzing={analyzing}
          onTakePhoto={takePhoto}
          onPickImage={pickImage}
        />
      )}

      {activeMode === "nevera" && user && (
        <FridgeAnalysis
          userId={user.id}
          remainingMacros={remainingMacros}
          alreadyEatenToday={alreadyEatenToday}
          selectedMealType={selectedMealType}
          onSaved={loadTodayLogs}
        />
      )}

      {activeMode === "buffet" && user && (
        <BuffetAnalysis
          userId={user.id}
          remainingMacros={remainingMacros}
          alreadyEatenToday={alreadyEatenToday}
          selectedMealType={selectedMealType}
          onSaved={loadTodayLogs}
        />
      )}

      <TodayLog loading={loading} logs={todayLogs} />
    </ScrollView>
  );
}
