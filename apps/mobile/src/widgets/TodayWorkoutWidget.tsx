/**
 * TodayWorkoutWidget — Android home screen widget
 * Shows today's workout exercises without opening the app.
 *
 * Uses react-native-android-widget primitives (no hooks allowed).
 * Data is passed via props from the widget task handler.
 */
import React from "react";
import { FlexWidget, TextWidget, ListWidget } from "react-native-android-widget";

interface ExerciseItem {
  name: string;
  scheme: string;
  completed: boolean;
}

interface TodayWorkoutWidgetProps {
  dayName?: string;
  dayLabel?: string;
  exercises?: ExerciseItem[];
  isRestDay?: boolean;
  routineTitle?: string;
  totalExercises?: number;
  completedExercises?: number;
}

// Theme colors matching FitOS design system
const C = {
  bg: "#0A0A0F",
  surface: "#12121A",
  cyan: "#00E5FF",
  white: "#E8E8ED",
  muted: "#8B8BA3",
  dimmed: "#5A5A72",
  green: "#00C853",
  border: "rgba(255,255,255,0.06)",
  cyanDim: "rgba(0,229,255,0.08)",
};

export function TodayWorkoutWidget({
  dayName = "Hoy",
  dayLabel = "",
  exercises = [],
  isRestDay = false,
  routineTitle = "",
  totalExercises = 0,
  completedExercises = 0,
}: TodayWorkoutWidgetProps) {
  const allCompleted = completedExercises > 0 && completedExercises >= totalExercises;

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: C.bg,
        borderRadius: 20,
        padding: 16,
        flexDirection: "column",
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space_between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <FlexWidget style={{ flexDirection: "column", flex: 1 }}>
          <TextWidget
            text="FitOS"
            style={{
              fontSize: 11,
              color: C.cyan,
              fontWeight: "700",
              letterSpacing: 2,
            }}
          />
          <TextWidget
            text={dayName}
            style={{
              fontSize: 20,
              color: C.white,
              fontWeight: "900",
              letterSpacing: -0.5,
            }}
          />
        </FlexWidget>
        {!isRestDay && totalExercises > 0 && (
          <FlexWidget
            style={{
              backgroundColor: allCompleted ? C.green : C.cyanDim,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <TextWidget
              text={allCompleted ? "COMPLETADO" : `${totalExercises} ejercicios`}
              style={{
                fontSize: 10,
                color: allCompleted ? C.bg : C.cyan,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            />
          </FlexWidget>
        )}
      </FlexWidget>

      {/* Day label / routine title */}
      {dayLabel !== "" && (
        <TextWidget
          text={dayLabel}
          style={{
            fontSize: 13,
            color: C.muted,
            fontWeight: "600",
            marginBottom: 8,
          }}
        />
      )}

      {/* Rest day state */}
      {isRestDay ? (
        <FlexWidget
          style={{
            flex: 1,
            width: "match_parent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="Día de descanso"
            style={{
              fontSize: 16,
              color: C.dimmed,
              fontWeight: "700",
            }}
          />
          <TextWidget
            text="Recupera y vuelve más fuerte"
            style={{
              fontSize: 11,
              color: C.dimmed,
              marginTop: 4,
            }}
          />
        </FlexWidget>
      ) : exercises.length > 0 ? (
        /* Exercise list */
        <ListWidget
          style={{
            flex: 1,
            width: "match_parent",
          }}
        >
          {exercises.map((ex, i) => (
            <FlexWidget
              key={`ex-${i}`}
              style={{
                width: "match_parent",
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 6,
                paddingHorizontal: 4,
                borderBottomWidth: i < exercises.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}
            >
              {/* Number indicator */}
              <FlexWidget
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: ex.completed ? C.green : C.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10,
                }}
              >
                <TextWidget
                  text={ex.completed ? "✓" : `${i + 1}`}
                  style={{
                    fontSize: 10,
                    color: ex.completed ? C.bg : C.muted,
                    fontWeight: "700",
                  }}
                />
              </FlexWidget>

              {/* Exercise name */}
              <FlexWidget style={{ flex: 1, flexDirection: "column" }}>
                <TextWidget
                  text={ex.name}
                  style={{
                    fontSize: 13,
                    color: ex.completed ? C.dimmed : C.white,
                    fontWeight: "600",
                    truncate: true,
                  }}
                  maxLines={1}
                />
              </FlexWidget>

              {/* Scheme badge */}
              <FlexWidget
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  marginLeft: 6,
                }}
              >
                <TextWidget
                  text={ex.scheme}
                  style={{
                    fontSize: 10,
                    color: C.cyan,
                    fontWeight: "700",
                  }}
                />
              </FlexWidget>
            </FlexWidget>
          ))}
        </ListWidget>
      ) : (
        <FlexWidget
          style={{
            flex: 1,
            width: "match_parent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="Sin ejercicios asignados"
            style={{ fontSize: 13, color: C.dimmed }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
