/**
 * Widget Task Handler — runs in headless JS context
 * Handles widget lifecycle events (added, update, resize, click, delete).
 * Reads cached workout data from AsyncStorage.
 */
import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { TodayWorkoutWidget } from "./TodayWorkoutWidget";
import { getWidgetData } from "../lib/widget-data";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;

  // Only handle our workout widget
  if (widgetInfo.widgetName !== "TodayWorkout") return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const data = await getWidgetData();
      if (data) {
        props.renderWidget(
          <TodayWorkoutWidget
            dayName={data.dayName}
            dayLabel={data.dayLabel}
            exercises={data.exercises}
            isRestDay={data.isRestDay}
            routineTitle={data.routineTitle}
            totalExercises={data.totalExercises}
            completedExercises={data.completedExercises}
          />
        );
      } else {
        // No cached data — show placeholder
        props.renderWidget(
          <TodayWorkoutWidget
            dayName="Hoy"
            dayLabel="Abre FitOS para sincronizar"
            isRestDay={true}
          />
        );
      }
      break;
    }

    case "WIDGET_DELETED":
      // Nothing to clean up
      break;

    case "WIDGET_CLICK":
      if (props.clickAction === "OPEN_APP") {
        // Default behavior: opens the app
      }
      break;

    default:
      break;
  }
}
