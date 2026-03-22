"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type TabKey = "perfil" | "progreso" | "rutina" | "menu" | "formulario";

interface ClientProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  goal: string | null;
  bio: string | null;
  height: number | null;
  weight: number | null;
  food_preferences: FoodPreferences | null;
  avatar_url: string | null;
}

interface FoodPreferences {
  dietary_restrictions?: string[];
  allergies?: string;
  disliked_foods?: string;
}

interface TrainerClientRow {
  id: string;
  status: string;
  joined_at: string;
}

interface BodyMetric {
  id: string;
  body_weight_kg: number | null;
  body_fat_pct: number | null;
  recorded_at: string;
}

interface UserRoutine {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface MealPlan {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface WorkoutSession {
  id: string;
  routine_id: string;
  mode: string;
  status: string;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  total_sets: number | null;
  total_exercises: number | null;
  rpe_session: number | null;
  completed_at: string | null;
  created_at: string;
}

interface WeightLogEntry {
  id: string;
  exercise_name: string;
  sets_data: { set_number: number; weight_kg: number; reps_done: number; type: string }[];
  total_volume_kg: number | null;
  client_notes: string | null;
  session_id: string;
}

interface FoodLogEntry {
  id: string;
  meal_type: string;
  foods: { name: string; portion_g?: number; kcal?: number; protein?: number; carbs?: number; fat?: number }[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  photo_url: string | null;
  source: string;
  notes: string | null;
  logged_at: string;
}

interface FormField {
  id: string;
  label: string;
  type: string;
}

interface OnboardingResponse {
  id: string;
  responses: Record<string, unknown>;
  ai_analysis: string | null;
  created_at: string;
  form: {
    title: string;
    fields: FormField[];
  } | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const GOAL_LABELS: Record<string, string> = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  perdida_peso: "Pérdida de peso",
  mantenimiento: "Mantenimiento",
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-[#00C853]/10", text: "text-[#00C853]", label: "Activo" },
    inactive: { bg: "bg-[#8B8BA3]/10", text: "text-[#8B8BA3]", label: "Inactivo" },
    pending: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]", label: "Confirmar email" },
  };
  const style = config[status] ?? config.inactive;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "perfil", label: "Perfil" },
  { key: "progreso", label: "Progreso" },
  { key: "rutina", label: "Rutina" },
  { key: "menu", label: "Menú" },
  { key: "formulario", label: "Formulario" },
];

/* ─── Food Preferences Component ─── */

function FoodPreferencesDisplay({ prefs }: { prefs: FoodPreferences | null }) {
  if (!prefs) return <p className="text-sm text-[#8B8BA3]">No especificado</p>;

  const restrictions = prefs.dietary_restrictions ?? [];
  const allergies = prefs.allergies?.trim();
  const disliked = prefs.disliked_foods?.trim();

  const hasContent = restrictions.length > 0 || allergies || disliked;
  if (!hasContent) return <p className="text-sm text-[#8B8BA3]">Sin restricciones</p>;

  return (
    <div className="space-y-3">
      {restrictions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-[#8B8BA3]">Restricciones</p>
          <div className="flex flex-wrap gap-1.5">
            {restrictions.map((r) => (
              <span key={r} className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED]">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
      {allergies && (
        <div>
          <p className="text-xs text-[#8B8BA3]">Alergias</p>
          <p className="mt-0.5 text-sm text-[#E8E8ED]">{allergies}</p>
        </div>
      )}
      {disliked && (
        <div>
          <p className="text-xs text-[#8B8BA3]">Alimentos que no le gustan</p>
          <p className="mt-0.5 text-sm text-[#E8E8ED]">{disliked}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Tab Content Components ─── */

function ProfileTab({ profile }: { profile: ClientProfile }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "Altura", value: profile.height ? `${profile.height} cm` : null },
          { label: "Peso", value: profile.weight ? `${profile.weight} kg` : null },
          { label: "Objetivo", value: profile.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : null },
          { label: "Bio", value: profile.bio },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">{f.label}</p>
            <p className="mt-1 text-sm text-[#E8E8ED]">{f.value ?? "No especificado"}</p>
          </div>
        ))}
      </div>

      {/* Food preferences — full width */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
          Preferencias alimentarias
        </p>
        <FoodPreferencesDisplay prefs={profile.food_preferences} />
      </div>
    </div>
  );
}

function ProgressTab({ metrics }: { metrics: BodyMetric[] }) {
  if (metrics.length === 0) {
    return (
      <EmptyState
        icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>}
        title="Sin datos de progreso"
        description="Aún no hay métricas corporales registradas"
      />
    );
  }

  return (
    <div className="space-y-2">
      {metrics.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3">
          <div className="flex items-center gap-4">
            {m.body_weight_kg != null && (
              <div>
                <p className="text-xs text-[#8B8BA3]">Peso</p>
                <p className="text-sm font-medium text-white">{m.body_weight_kg} kg</p>
              </div>
            )}
            {m.body_fat_pct != null && (
              <div>
                <p className="text-xs text-[#8B8BA3]">Grasa corporal</p>
                <p className="text-sm font-medium text-white">{m.body_fat_pct}%</p>
              </div>
            )}
          </div>
          <p className="text-xs text-[#8B8BA3]">{formatDate(m.recorded_at)}</p>
        </div>
      ))}
    </div>
  );
}

function RoutineTab({ routine, clientId }: { routine: UserRoutine | null; clientId: string }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [sessRes, logsRes] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("*")
          .eq("client_id", clientId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(20),
        supabase
          .from("weight_log")
          .select("id, exercise_name, sets_data, total_volume_kg, client_notes, session_id")
          .eq("client_id", clientId)
          .order("session_date", { ascending: false })
          .limit(200),
      ]);
      setSessions((sessRes.data ?? []) as WorkoutSession[]);
      setWeightLogs((logsRes.data ?? []) as WeightLogEntry[]);
      setLoadingSessions(false);
    };
    load();
  }, [clientId]);

  const getLogsForSession = useCallback(
    (sessionId: string) => weightLogs.filter((l) => l.session_id === sessionId),
    [weightLogs]
  );

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  if (!routine) {
    return (
      <EmptyState
        icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0L22 16.5l-9.75 5.25L2.25 16.5l4.179-2.25" /></svg>}
        title="Sin rutina asignada"
        description="Este cliente aún no tiene una rutina de entrenamiento"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Active routine info */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-5">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-semibold text-white">{routine.title}</h4>
          <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED]">Activa</span>
        </div>
        <p className="mt-3 text-xs text-[#8B8BA3]">Creada el {formatDate(routine.created_at)}</p>
      </div>

      {/* Session history */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">
          Historial de sesiones
        </h3>

        {loadingSessions ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-5 text-center text-sm text-[#5A5A72]">
            Aún no ha completado ninguna sesión
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const isExpanded = expandedSession === session.id;
              const logs = isExpanded ? getLogsForSession(session.id) : [];

              return (
                <div key={session.id} className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-black text-white">{formatDuration(session.duration_seconds)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Duración</p>
                      </div>
                      <div className="h-8 w-px bg-white/[0.06]" />
                      <div className="text-center">
                        <p className="text-lg font-black text-[#7C3AED]">{Math.round(session.total_volume_kg ?? 0)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Vol (kg)</p>
                      </div>
                      <div className="h-8 w-px bg-white/[0.06]" />
                      <div className="text-center">
                        <p className="text-lg font-black text-[#00E5FF]">{session.total_sets ?? 0}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Series</p>
                      </div>
                      {session.rpe_session && (
                        <>
                          <div className="h-8 w-px bg-white/[0.06]" />
                          <div className="text-center">
                            <p className="text-lg font-black text-[#FF9100]">{session.rpe_session}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">RPE</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#5A5A72]">
                        {session.completed_at ? formatDate(session.completed_at) : formatDate(session.created_at)}
                      </span>
                      <svg
                        className={`h-4 w-4 text-[#5A5A72] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded: exercise details */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 space-y-3">
                      {logs.length === 0 ? (
                        <p className="text-xs text-[#5A5A72]">Sin datos de ejercicios</p>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="rounded-lg border border-white/[0.04] bg-[#12121A] p-3">
                            <p className="text-sm font-semibold text-white">{log.exercise_name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(log.sets_data ?? []).map((set, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-white/[0.04] px-2 py-1 text-xs text-[#8B8BA3]"
                                >
                                  <span className="font-semibold text-white">{set.weight_kg}</span>kg × <span className="font-semibold text-white">{set.reps_done}</span>
                                  {set.type === "rest_pause" && <span className="ml-1 text-[#FF9100]">RP</span>}
                                </span>
                              ))}
                            </div>
                            {log.client_notes && (
                              <p className="mt-2 rounded-md bg-[#7C3AED]/5 px-3 py-2 text-xs text-[#7C3AED]">
                                💬 {log.client_notes}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

const MEAL_ORDER = ["desayuno", "almuerzo", "comida", "merienda", "cena", "snack"];

function MealPlanTab({ mealPlan, clientId }: { mealPlan: MealPlan | null; clientId: string }) {
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  useEffect(() => {
    const load = async () => {
      setLoadingLogs(true);
      const supabase = createClient();
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;
      const { data } = await supabase
        .from("food_log")
        .select("id, meal_type, foods, total_kcal, total_protein, total_carbs, total_fat, photo_url, source, notes, logged_at")
        .eq("client_id", clientId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: true });
      setFoodLogs((data ?? []) as FoodLogEntry[]);
      setLoadingLogs(false);
    };
    load();
  }, [clientId, selectedDate]);

  const dailyTotals = foodLogs.reduce(
    (acc, log) => ({
      kcal: acc.kcal + (log.total_kcal || 0),
      protein: acc.protein + (log.total_protein || 0),
      carbs: acc.carbs + (log.total_carbs || 0),
      fat: acc.fat + (log.total_fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const logsByMeal = MEAL_ORDER.reduce<Record<string, FoodLogEntry[]>>((acc, meal) => {
    const entries = foodLogs.filter((l) => l.meal_type === meal);
    if (entries.length > 0) acc[meal] = entries;
    return acc;
  }, {});

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  if (!mealPlan) {
    return (
      <EmptyState
        icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z" /></svg>}
        title="Sin menú asignado"
        description="Este cliente aún no tiene un plan de alimentación"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan info */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-5">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-semibold text-white">{mealPlan.title}</h4>
          <span className="inline-flex items-center rounded-full bg-[#00C853]/10 px-2.5 py-0.5 text-xs font-medium text-[#00C853]">Activo</span>
        </div>
        <p className="mt-3 text-xs text-[#8B8BA3]">Creado el {formatDate(mealPlan.created_at)}</p>
      </div>

      {/* Date selector */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3">
        <button type="button" onClick={() => changeDate(-1)} className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <span className="text-sm font-semibold text-white">{formatDate(selectedDate)}</span>
        <button type="button" onClick={() => changeDate(1)} className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.04] hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      {/* Daily totals */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Kcal", value: Math.round(dailyTotals.kcal), color: "#00E5FF" },
          { label: "Proteína", value: `${Math.round(dailyTotals.protein)}g`, color: "#FF9100" },
          { label: "Carbos", value: `${Math.round(dailyTotals.carbs)}g`, color: "#7C3AED" },
          { label: "Grasa", value: `${Math.round(dailyTotals.fat)}g`, color: "#00C853" },
        ].map((macro) => (
          <div key={macro.label} className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-3 text-center">
            <p className="text-lg font-black" style={{ color: macro.color }}>{macro.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">{macro.label}</p>
          </div>
        ))}
      </div>

      {/* Meals */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">
          Registro del día
        </h3>

        {loadingLogs ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : foodLogs.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-5 text-center text-sm text-[#5A5A72]">
            Sin registros este día
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(logsByMeal).map(([meal, entries]) => (
              <div key={meal} className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#00E5FF]">
                  {MEAL_LABELS[meal] ?? meal}
                </h4>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-white/[0.04] bg-[#12121A] p-3">
                      {/* Food items */}
                      <div className="space-y-1">
                        {(entry.foods ?? []).map((food, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-[#E8E8ED]">{food.name}</span>
                            <span className="text-[#5A5A72]">{food.portion_g ? `${food.portion_g}g` : ""} {food.kcal ? `· ${Math.round(food.kcal)} kcal` : ""}</span>
                          </div>
                        ))}
                      </div>
                      {/* Totals */}
                      <div className="mt-2 flex items-center gap-3 border-t border-white/[0.04] pt-2 text-[10px] text-[#8B8BA3]">
                        <span><span className="font-semibold text-white">{Math.round(entry.total_kcal)}</span> kcal</span>
                        <span><span className="font-semibold text-[#FF9100]">{Math.round(entry.total_protein)}</span>g P</span>
                        <span><span className="font-semibold text-[#7C3AED]">{Math.round(entry.total_carbs)}</span>g C</span>
                        <span><span className="font-semibold text-[#00C853]">{Math.round(entry.total_fat)}</span>g G</span>
                        {entry.source === "ai_vision" && (
                          <span className="ml-auto rounded-full bg-[#00E5FF]/10 px-2 py-0.5 text-[10px] font-medium text-[#00E5FF]">IA</span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="mt-2 rounded-md bg-[#7C3AED]/5 px-3 py-2 text-xs text-[#7C3AED]">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatResponseValue(value: unknown, fieldType?: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (fieldType === "scale") return `${value} / 10`;
  return String(value);
}

function FormTab({ responses }: { responses: OnboardingResponse[] }) {
  if (responses.length === 0) {
    return (
      <EmptyState
        icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>}
        title="Sin formulario completado"
        description="Este cliente aún no ha completado ningún formulario"
      />
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((resp) => {
        // Build a label map from form fields (current form state)
        const fieldMap: Record<string, FormField> = {};
        for (const f of resp.form?.fields ?? []) {
          fieldMap[f.id] = f;
        }

        const entries = Object.entries(resp.responses ?? {});

        return (
          <div key={resp.id} className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                {resp.form?.title ?? "Formulario de onboarding"}
              </h4>
              <p className="text-xs text-[#8B8BA3]">{formatDate(resp.created_at)}</p>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-[#8B8BA3]">Sin respuestas registradas</p>
            ) : (
              <div className="space-y-3">
                {entries.map(([fieldId, value]) => {
                  const field = fieldMap[fieldId];
                  return (
                    <div key={fieldId} className="flex flex-col gap-0.5">
                      <p className="text-xs font-medium text-[#8B8BA3]">
                        {field?.label ?? fieldId}
                      </p>
                      {field?.type === "multiselect" && Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(value as string[]).map((v) => (
                            <span key={v} className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED]">
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#E8E8ED]">
                          {formatResponseValue(value, field?.type)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Analysis */}
            {resp.ai_analysis ? (
              <div className="mt-4 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
                <p className="mb-1 text-xs font-semibold text-[#7C3AED]">Análisis IA</p>
                <p className="text-sm leading-relaxed text-[#E8E8ED]">{resp.ai_analysis}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-[#8B8BA3]">Análisis IA pendiente</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#0A0A0F] py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-[#8B8BA3]">
        {icon}
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-[#8B8BA3]">{description}</p>
    </div>
  );
}

/* ─── Main Page ─── */

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabKey>("perfil");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [clientRelation, setClientRelation] = useState<TrainerClientRow | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [routine, setRoutine] = useState<UserRoutine | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [formResponses, setFormResponses] = useState<OnboardingResponse[]>([]);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesión del usuario.");
          setLoading(false);
          return;
        }

        const [profileRes, relationRes, metricsRes, routineRes, mealPlanRes, formRes] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("user_id, full_name, email, goal, bio, height, weight, food_preferences, avatar_url")
              .eq("user_id", clientId)
              .single(),
            supabase
              .from("trainer_clients")
              .select("id, status, joined_at")
              .eq("trainer_id", user.id)
              .eq("client_id", clientId)
              .single(),
            supabase
              .from("body_metrics")
              .select("id, body_weight_kg, body_fat_pct, recorded_at")
              .eq("client_id", clientId)
              .order("recorded_at", { ascending: false })
              .limit(20),
            supabase
              .from("user_routines")
              .select("id, title, is_active, created_at")
              .eq("trainer_id", user.id)
              .eq("client_id", clientId)
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("meal_plans")
              .select("id, title, is_active, created_at")
              .eq("trainer_id", user.id)
              .eq("client_id", clientId)
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("onboarding_responses")
              .select(`
                id,
                responses,
                ai_analysis,
                created_at,
                form:onboarding_forms!onboarding_responses_form_id_fkey (
                  title,
                  fields
                )
              `)
              .eq("client_id", clientId)
              .order("created_at", { ascending: false }),
          ]);

        if (profileRes.error || !profileRes.data) {
          setError("No se encontró el perfil del cliente.");
          setLoading(false);
          return;
        }

        if (relationRes.error || !relationRes.data) {
          setError("Este cliente no está asociado a tu cuenta.");
          setLoading(false);
          return;
        }

        setProfile(profileRes.data as ClientProfile);
        setClientRelation(relationRes.data as TrainerClientRow);
        setMetrics((metricsRes.data as BodyMetric[]) ?? []);
        setRoutine((routineRes.data as UserRoutine | null) ?? null);
        setMealPlan((mealPlanRes.data as MealPlan | null) ?? null);

        const normalizedResponses = (formRes.data ?? []).map((row: Record<string, unknown>) => {
          const form = Array.isArray(row.form) ? row.form[0] ?? null : row.form ?? null;
          return { ...row, form } as OnboardingResponse;
        });
        setFormResponses(normalizedResponses);
      } catch {
        setError("Error inesperado al cargar los datos del cliente.");
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
        <button type="button" onClick={() => router.push("/app/trainer/clients")} className="text-sm text-[#00E5FF] transition-colors hover:underline">
          Volver a clientes
        </button>
      </div>
    );
  }

  if (!profile || !clientRelation) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button type="button" onClick={() => router.push("/app/trainer/clients")} className="flex items-center gap-2 text-sm text-[#8B8BA3] transition-colors hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a clientes
      </button>

      {/* Client header */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/10 text-lg font-bold text-[#7C3AED]">
            {getInitials(profile.full_name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-white">{profile.full_name ?? "Sin nombre"}</h1>
              <StatusBadge status={clientRelation.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8B8BA3]">
              <span>{profile.email ?? "Sin email"}</span>
              {profile.goal && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <span>{GOAL_LABELS[profile.goal] ?? profile.goal}</span>
                </>
              )}
              <span className="hidden sm:inline">|</span>
              <span>Desde {formatDate(clientRelation.joined_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#12121A] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "text-[#8B8BA3] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "perfil" && <ProfileTab profile={profile} />}
        {activeTab === "progreso" && <ProgressTab metrics={metrics} />}
        {activeTab === "rutina" && <RoutineTab routine={routine} clientId={clientId} />}
        {activeTab === "menu" && <MealPlanTab mealPlan={mealPlan} clientId={clientId} />}
        {activeTab === "formulario" && <FormTab responses={formResponses} />}
      </div>
    </div>
  );
}
