import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface RoutineExercise {
  exercise_id: string;
  name: string;
  day_of_week: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  weight_kg: number | null;
  rest_s: number;
}

interface UserRoutine {
  id: string;
  title: string;
  goal: string;
  exercises: RoutineExercise[];
  is_active: boolean;
}

interface RoutineState {
  routine: UserRoutine | null;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  completedSets: Record<string, boolean[]>;
  toggleSet: (exerciseIndex: number, setIndex: number) => void;
  loading: boolean;
  error: string | null;
}

export function useRoutineData(user: User | null): RoutineState {
  const [routine, setRoutine] = useState<UserRoutine | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("user_routines")
      .select("id, title, goal, exercises, is_active")
      .eq("client_id", user.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError("Error al cargar la rutina.");
        else setRoutine(data as UserRoutine | null);
        setLoading(false);
      });
  }, [user]);

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    const key = `${selectedDay}-${exerciseIndex}`;
    setCompletedSets((prev) => {
      const current = prev[key] ?? [];
      const updated = [...current];
      updated[setIndex] = !updated[setIndex];
      return { ...prev, [key]: updated };
    });
  };

  return { routine, selectedDay, setSelectedDay, completedSets, toggleSet, loading, error };
}
