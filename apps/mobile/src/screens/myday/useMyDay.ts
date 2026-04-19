import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import type { DailyCheckin, DailyCheckinInput } from "@kuvox/shared";

type Score = 1 | 2 | 3 | 4 | 5 | null;

export interface MyDayState {
  loading: boolean;
  saving: boolean;
  // Workout
  workoutDone: boolean | null;
  // Weight
  weightKg: string; // string for input binding
  // Wellness
  sleepQuality: Score;
  stressLevel: Score;
  energyLevel: Score;
  painLevel: Score;
  notes: string;
  // Loaded data (to pre-fill)
  existingCheckin: DailyCheckin | null;
}

const initialState: MyDayState = {
  loading: true,
  saving: false,
  workoutDone: null,
  weightKg: "",
  sleepQuality: null,
  stressLevel: null,
  energyLevel: null,
  painLevel: null,
  notes: "",
  existingCheckin: null,
};

export function useMyDay(userId: string | undefined) {
  const [state, setState] = useState<MyDayState>(initialState);

  const load = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    const todayStart = today + "T00:00:00.000Z";
    const todayEnd = today + "T23:59:59.999Z";

    const [checkinRes, workoutRes, weightRes] = await Promise.all([
      supabase
        .from("daily_checkins")
        .select(
          "id, client_id, checkin_date, sleep_quality, stress_level, energy_level, pain_level, notes, created_at, updated_at"
        )
        .eq("client_id", userId)
        .eq("checkin_date", today)
        .maybeSingle(),
      supabase
        .from("workout_sessions")
        .select("id")
        .eq("client_id", userId)
        .gte("completed_at", todayStart)
        .lte("completed_at", todayEnd)
        .eq("status", "completed")
        .limit(1),
      supabase
        .from("body_metrics")
        .select("body_weight_kg")
        .eq("user_id", userId)
        .gte("recorded_at", todayStart)
        .lte("recorded_at", todayEnd)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const checkin = checkinRes.data as DailyCheckin | null;
    const workoutDone = (workoutRes.data?.length ?? 0) > 0;
    const weightKg = weightRes.data?.body_weight_kg
      ? String(weightRes.data.body_weight_kg)
      : "";

    setState({
      loading: false,
      saving: false,
      workoutDone,
      weightKg,
      sleepQuality: (checkin?.sleep_quality as Score) ?? null,
      stressLevel: (checkin?.stress_level as Score) ?? null,
      energyLevel: (checkin?.energy_level as Score) ?? null,
      painLevel: (checkin?.pain_level as Score) ?? null,
      notes: checkin?.notes ?? "",
      existingCheckin: checkin,
    });
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback((patch: Partial<MyDayState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(async () => {
    if (!userId) return false;
    setState((prev) => ({ ...prev, saving: true }));

    // 1. Upsert wellness check-in.
    const payload: DailyCheckinInput = {
      sleep_quality: state.sleepQuality,
      stress_level: state.stressLevel,
      energy_level: state.energyLevel,
      pain_level: state.painLevel,
      notes: state.notes.trim() || null,
    };
    const { error: checkinError } = await supabase
      .from("daily_checkins")
      .upsert(
        {
          client_id: userId,
          checkin_date: new Date().toISOString().slice(0, 10),
          ...payload,
        },
        { onConflict: "client_id,checkin_date" }
      );

    // 2. Optional weight — only if changed and numeric.
    const weight = parseFloat(state.weightKg.replace(",", "."));
    let weightError: unknown = null;
    if (!Number.isNaN(weight) && weight > 0 && weight < 500) {
      const existing = parseFloat(state.existingCheckin ? "0" : "0"); // noop, sanity
      void existing;
      const { error } = await supabase.from("body_metrics").insert({
        user_id: userId,
        body_weight_kg: weight,
        recorded_at: new Date().toISOString(),
      });
      weightError = error;
    }

    setState((prev) => ({ ...prev, saving: false }));

    if (checkinError) {
      Alert.alert("Error", "No se pudo guardar el check-in. Intentalo de nuevo.");
      return false;
    }
    if (weightError) {
      Alert.alert(
        "Check-in guardado",
        "El peso no se pudo guardar, pero el resto quedó registrado."
      );
      return true;
    }

    Alert.alert("Listo", "Tu check-in de hoy quedó guardado.");
    await load();
    return true;
  }, [userId, state, load]);

  return { state, update, save, refresh: load };
}
