/**
 * Widget Sync — triggers widget updates after data changes.
 *
 * Android: calls requestWidgetUpdate to re-render the widget.
 * iOS: writes to App Group UserDefaults (requires native module, TBD).
 */
import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import React from "react";
import { TodayWorkoutWidget } from "../widgets/TodayWorkoutWidget";
import { syncWidgetData, getWidgetData } from "./widget-data";

/**
 * Sync widget data and trigger Android widget re-render.
 * Call this when:
 * - App starts (DashboardScreen mounts)
 * - Routine data loads/changes
 * - Workout session completes
 */
export async function updateWidget(userId: string): Promise<void> {
  try {
    // 1. Fetch fresh data and cache to AsyncStorage
    const data = await syncWidgetData(userId);
    if (!data) return;

    // 2. Request Android widget update
    if (Platform.OS === "android") {
      await requestWidgetUpdate({
        widgetName: "TodayWorkout",
        renderWidget: () =>
          React.createElement(TodayWorkoutWidget, {
            dayName: data.dayName,
            dayLabel: data.dayLabel,
            exercises: data.exercises,
            isRestDay: data.isRestDay,
            routineTitle: data.routineTitle,
            totalExercises: data.totalExercises,
            completedExercises: data.completedExercises,
          }),
        widgetNotFound: () => {
          // No widget on home screen — that's fine
        },
      });
    }

    // iOS: WidgetKit.reloadTimelines would be called here
    // via a native module once the widget extension is set up.
    // For now, iOS widget reads from UserDefaults on its own timeline.
  } catch (err) {
    console.warn("[WidgetSync] Error updating widget:", err);
  }
}

/**
 * Quick update using cached data (no network).
 * Useful for immediate UI refresh after local state changes.
 */
export async function refreshWidgetFromCache(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    const data = await getWidgetData();
    if (!data) return;

    await requestWidgetUpdate({
      widgetName: "TodayWorkout",
      renderWidget: () =>
        React.createElement(TodayWorkoutWidget, {
          dayName: data.dayName,
          dayLabel: data.dayLabel,
          exercises: data.exercises,
          isRestDay: data.isRestDay,
          routineTitle: data.routineTitle,
          totalExercises: data.totalExercises,
          completedExercises: data.completedExercises,
        }),
      widgetNotFound: () => {},
    });
  } catch (err) {
    console.warn("[WidgetSync] Error refreshing from cache:", err);
  }
}
