import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, shadows , fonts} from "../theme";

interface MealFood {
  name: string;
  portion_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealSlot {
  label: string;
  foods: MealFood[];
}

interface DayPlan {
  day: string;
  meals: MealSlot[];
}

interface MealPlan {
  id: string;
  title: string;
  target_kcal: number;
  period: string;
  days: DayPlan[];
}

const DAY_SHORT: Record<string, string> = {
  lunes: "L", martes: "M", miércoles: "X", jueves: "J",
  viernes: "V", sábado: "S", domingo: "D",
};

export default function MealsScreen() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    return days[d];
  });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("meal_plans")
        .select("id, title, target_kcal, period, days")
        .eq("client_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setPlan(data as MealPlan);
      setLoading(false);
    };
    load();
  }, [user]);

  const getDayPlan = (): DayPlan | null => {
    if (!plan?.days) return null;
    const days = Array.isArray(plan.days) ? plan.days : [];
    return days.find((d) => d.day === selectedDay) || null;
  };

  const dayPlan = getDayPlan();
  const availableDays = (() => {
    if (!plan?.days) return [];
    const days = Array.isArray(plan.days) ? plan.days : [];
    return days.map((d) => d.day);
  })();

  // Day totals
  const dayTotals = dayPlan?.meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((f) => {
        acc.kcal += f.kcal || 0;
        acc.protein += f.protein || 0;
        acc.carbs += f.carbs || 0;
        acc.fat += f.fat || 0;
      });
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconBox}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513"
              stroke={colors.dimmed}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </Svg>
        </View>
        <Text style={styles.emptyTitle}>Sin menú asignado</Text>
        <Text style={styles.emptySubtitle}>Tu entrenador aún no te ha asignado un plan nutricional</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Plan header */}
      <Text style={styles.planTitle}>{plan.title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>{plan.target_kcal} kcal/día</Text>
        </View>
        <View style={[styles.metaBadge, { backgroundColor: colors.violetDim, borderColor: colors.violetGlow }]}>
          <Text style={[styles.metaText, { color: colors.violet }]}>{plan.period}</Text>
        </View>
      </View>

      {/* Day totals bento */}
      {dayPlan && (
        <View style={styles.totalsBento}>
          <LinearGradient
            colors={["rgba(0, 229, 255, 0.06)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.totalMain}>
            <Text style={styles.totalKcal}>{Math.round(dayTotals.kcal)}</Text>
            <Text style={styles.totalKcalUnit}>kcal totales</Text>
          </View>
          <View style={styles.totalMacros}>
            <View style={styles.totalMacroItem}>
              <Text style={[styles.totalMacroValue, { color: colors.cyan }]}>{Math.round(dayTotals.protein)}g</Text>
              <Text style={styles.totalMacroLabel}>P</Text>
            </View>
            <View style={styles.totalMacroItem}>
              <Text style={[styles.totalMacroValue, { color: colors.orange }]}>{Math.round(dayTotals.carbs)}g</Text>
              <Text style={styles.totalMacroLabel}>C</Text>
            </View>
            <View style={styles.totalMacroItem}>
              <Text style={[styles.totalMacroValue, { color: colors.violet }]}>{Math.round(dayTotals.fat)}g</Text>
              <Text style={styles.totalMacroLabel}>G</Text>
            </View>
          </View>
        </View>
      )}

      {/* Day selector */}
      <View style={styles.dayRow}>
        {availableDays.map((day) => {
          const isActive = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[styles.dayPill, isActive && styles.dayPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>
                {DAY_SHORT[day] || day.substring(0, 1).toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Meals */}
      {!dayPlan ? (
        <View style={styles.noDay}>
          <Text style={styles.noDayText}>No hay plan para este día</Text>
        </View>
      ) : (
        dayPlan.meals.map((meal, i) => {
          const mealKcal = meal.foods.reduce((s, f) => s + (f.kcal || 0), 0);
          return (
            <View key={i} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealLabelRow}>
                  <View style={styles.mealDot} />
                  <Text style={styles.mealLabel}>{meal.label}</Text>
                </View>
                <Text style={styles.mealKcal}>{Math.round(mealKcal)} kcal</Text>
              </View>
              {meal.foods.map((food, j) => (
                <View key={j} style={[styles.foodRow, j < meal.foods.length - 1 && styles.foodRowBorder]}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodPortion}>{food.portion_g}g</Text>
                  </View>
                  <View style={styles.foodMacros}>
                    <Text style={[styles.foodMacro, { color: colors.cyan }]}>{Math.round(food.protein)}P</Text>
                    <Text style={[styles.foodMacro, { color: colors.orange }]}>{Math.round(food.carbs)}C</Text>
                    <Text style={[styles.foodMacro, { color: colors.violet }]}>{Math.round(food.fat)}G</Text>
                  </View>
                </View>
              ))}
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

  emptyIconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },

  // Header
  planTitle: { fontSize: 26, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, letterSpacing: -0.5 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: spacing.xl },
  metaBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: colors.orangeDim, borderWidth: 1, borderColor: "rgba(255, 145, 0, 0.15)",
  },
  metaText: { fontSize: 11, fontFamily: fonts.bold, color: colors.orange, letterSpacing: 0.3 },

  // Totals bento
  totalsBento: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderActive,
    padding: spacing.xl, marginBottom: spacing.xl,
    flexDirection: "row", alignItems: "center",
    overflow: "hidden", ...shadows.subtle,
  },
  totalMain: { flex: 1 },
  totalKcal: { fontSize: 32, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, letterSpacing: -1 },
  totalKcalUnit: { fontSize: 11, color: colors.dimmed, letterSpacing: 1, marginTop: 2 },
  totalMacros: { flexDirection: "row", gap: spacing.lg },
  totalMacroItem: { alignItems: "center" },
  totalMacroValue: { fontSize: 16, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  totalMacroLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1, marginTop: 2 },

  // Day pills
  dayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xxl },
  dayPill: {
    width: 40, height: 40, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  dayPillActive: { backgroundColor: colors.orangeDim, borderColor: "rgba(255, 145, 0, 0.2)" },
  dayPillText: { fontSize: 13, fontFamily: fonts.bold, color: colors.muted },
  dayPillTextActive: { color: colors.orange },
  noDay: { alignItems: "center", paddingVertical: 40 },
  noDayText: { color: colors.muted, fontSize: 14 },

  // Meal cards
  mealCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
    ...shadows.subtle,
  },
  mealHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  mealLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealDot: { width: 4, height: 12, borderRadius: 2, backgroundColor: colors.orange },
  mealLabel: { fontSize: 15, fontFamily: fonts.bold, color: colors.white },
  mealKcal: { fontSize: 14, fontFamily: fonts.bold, color: colors.orange },

  // Food rows
  foodRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  foodRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, color: colors.white, fontFamily: fonts.medium },
  foodPortion: { fontSize: 11, color: colors.dimmed, marginTop: 2 },
  foodMacros: { flexDirection: "row", gap: 10 },
  foodMacro: { fontSize: 11, fontFamily: fonts.bold },
});
