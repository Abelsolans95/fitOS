/**
 * Widget Data Sync — writes today's workout to AsyncStorage
 * so the Android widget (and future iOS widget) can read it.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const WIDGET_DATA_KEY = "@fitos/widget-today-workout";

const DAY_KEYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miércoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sábado: "Sábado",
  domingo: "Domingo",
};

export interface WidgetExercise {
  name: string;
  scheme: string;
  completed: boolean;
}

export interface WidgetData {
  dayName: string;
  dayLabel: string;
  exercises: WidgetExercise[];
  isRestDay: boolean;
  routineTitle: string;
  weekNumber: number;
  totalExercises: number;
  completedExercises: number;
  lastUpdated: string;
}

function getTodayKey(): string {
  const d = new Date().getDay();
  return DAY_KEYS[d === 0 ? 6 : d - 1];
}

function buildScheme(ex: {
  scheme?: string;
  sets: number;
  reps_min: number;
  reps_max: number;
}): string {
  if (ex.scheme) return ex.scheme;
  const reps =
    ex.reps_max !== ex.reps_min
      ? `${ex.reps_min}-${ex.reps_max}`
      : `${ex.reps_min}`;
  return `${ex.sets}×${reps}`;
}

/**
 * Fetch today's workout from Supabase and write to AsyncStorage.
 * Called when the app loads or routine data changes.
 */
export async function syncWidgetData(userId: string): Promise<WidgetData | null> {
  try {
    // 1. Get active routine
    const { data: routine } = await supabase
      .from("user_routines")
      .select("id, title, goal, exercises, days, total_weeks, current_week, training_days")
      .eq("client_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const todayKey = getTodayKey();
    const dayName = DAY_LABELS[todayKey] || todayKey;

    if (!routine) {
      const restData: WidgetData = {
        dayName,
        dayLabel: "Sin rutina",
        exercises: [],
        isRestDay: true,
        routineTitle: "",
        weekNumber: 1,
        totalExercises: 0,
        completedExercises: 0,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(restData));
      return restData;
    }

    // 2. Parse exercises (same logic as RoutineScreen)
    let allExercises: any[] = [];
    if (routine.exercises && Array.isArray(routine.exercises) && routine.exercises.length > 0) {
      allExercises = routine.exercises;
    } else if (routine.days && Array.isArray(routine.days)) {
      allExercises = routine.days.flatMap((d: any) =>
        (d.exercises || []).map((ex: any) => ({
          ...ex,
          day_of_week: ex.day_of_week || d.day,
          day_label: ex.day_label || d.label,
        }))
      );
    }

    const activeWeek = routine.current_week || 1;

    // 3. Filter today's exercises
    const todayExercises = allExercises
      .filter((ex: any) => {
        if (ex.day_of_week !== todayKey) return false;
        if (ex.week_of_month && ex.week_of_month !== activeWeek) return false;
        return true;
      })
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const isRestDay = todayExercises.length === 0;

    // 4. Get day label
    const dayLabel = isRestDay
      ? "Día de descanso"
      : todayExercises[0]?.day_label || dayName;

    // 5. Check completed sessions for today
    let completedCount = 0;
    if (!isRestDay) {
      const { data: doneSessions } = await supabase
        .from("workout_sessions")
        .select("day_label, week_number")
        .eq("client_id", userId)
        .eq("routine_id", routine.id)
        .eq("status", "completed");

      const completedKey = `${dayLabel}::${activeWeek}`;
      const isCompleted = doneSessions?.some(
        (s: any) => `${s.day_label}::${s.week_number}` === completedKey
      );
      completedCount = isCompleted ? todayExercises.length : 0;
    }

    // 6. Build widget data
    const widgetData: WidgetData = {
      dayName,
      dayLabel,
      exercises: todayExercises.map((ex: any) => ({
        name: ex.name,
        scheme: buildScheme(ex),
        completed: completedCount > 0,
      })),
      isRestDay,
      routineTitle: routine.title || routine.goal || "Mi rutina",
      weekNumber: activeWeek,
      totalExercises: todayExercises.length,
      completedExercises: completedCount,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));
    return widgetData;
  } catch (err) {
    console.warn("[Widget] Error syncing widget data:", err);
    return null;
  }
}

/**
 * Read cached widget data from AsyncStorage.
 * Used by the widget task handler (headless JS context).
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WidgetData;
  } catch {
    return null;
  }
}
