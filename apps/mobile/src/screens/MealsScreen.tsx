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
  lunes: "Lun", martes: "Mar", miércoles: "Mié", jueves: "Jue",
  viernes: "Vie", sábado: "Sáb", domingo: "Dom",
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyTitle}>Sin menú asignado</Text>
        <Text style={styles.emptySubtitle}>Tu entrenador aún no te ha asignado un plan nutricional</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>{plan.title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>{plan.target_kcal} kcal/día</Text>
        </View>
        <View style={[styles.metaBadge, { backgroundColor: colors.violet + "15", borderColor: colors.violet + "30" }]}>
          <Text style={[styles.metaText, { color: colors.violet }]}>{plan.period}</Text>
        </View>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
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
                {DAY_SHORT[day] || day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
                <Text style={styles.mealLabel}>{meal.label}</Text>
                <Text style={styles.mealKcal}>{Math.round(mealKcal)} kcal</Text>
              </View>
              {meal.foods.map((food, j) => (
                <View key={j} style={styles.foodRow}>
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
  content: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.white, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.white },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 20 },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.orange + "15",
    borderWidth: 1,
    borderColor: colors.orange + "30",
  },
  metaText: { fontSize: 12, fontWeight: "600", color: colors.orange },
  dayScroll: { marginBottom: 20 },
  dayPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  dayPillActive: {
    backgroundColor: colors.orange + "15",
    borderColor: colors.orange + "40",
  },
  dayPillText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  dayPillTextActive: { color: colors.orange },
  noDay: { alignItems: "center", paddingVertical: 40 },
  noDayText: { color: colors.muted, fontSize: 14 },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealLabel: { fontSize: 15, fontWeight: "700", color: colors.white },
  mealKcal: { fontSize: 14, fontWeight: "600", color: colors.orange },
  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, color: colors.white },
  foodPortion: { fontSize: 12, color: colors.muted, marginTop: 2 },
  foodMacros: { flexDirection: "row", gap: 8 },
  foodMacro: { fontSize: 11, fontWeight: "600" },
});
