"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

import { TabKey, ClientProfile, TrainerClientRow, BodyMetric, UserRoutine, MealPlan, OnboardingResponse } from "./components/types";
import { TABS, GOAL_LABELS, getInitials, formatDate, StatusBadge } from "./components/shared";
import { TabPerfil } from "./components/TabPerfil";
import { TabProgreso } from "./components/TabProgreso";
import { TabRutina } from "./components/TabRutina";
import { TabMenu } from "./components/TabMenu";
import { TabFormulario } from "./components/TabFormulario";
import { TabChat } from "./components/TabChat";
import { TabSalud } from "./components/TabSalud";

function ClientDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.id as string;

  const fromChat = searchParams.get("from") === "chat";
  const initialTab = (searchParams.get("tab") as TabKey) ?? "perfil";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [clientRelation, setClientRelation] = useState<TrainerClientRow | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [routine, setRoutine] = useState<UserRoutine | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [formResponses, setFormResponses] = useState<OnboardingResponse[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);

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
          console.error("[ClientDetail] Error cargando perfil:", profileRes.error);
          setError("No se encontró el perfil del cliente.");
          setLoading(false);
          return;
        }

        if (relationRes.error || !relationRes.data) {
          console.error("[ClientDetail] Error cargando relación:", relationRes.error);
          setError("Este cliente no está asociado a tu cuenta.");
          setLoading(false);
          return;
        }

        // Non-critical query errors — log but don't block
        if (metricsRes.error) console.error("[ClientDetail] Error métricas:", metricsRes.error);
        if (routineRes.error) console.error("[ClientDetail] Error rutina:", routineRes.error);
        if (mealPlanRes.error) console.error("[ClientDetail] Error plan nutricional:", mealPlanRes.error);
        if (formRes.error) console.error("[ClientDetail] Error formulario:", formRes.error);

        setTrainerId(user.id);
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

  const backHref = fromChat ? "/app/trainer/chat" : "/app/trainer/clients";
  const backLabel = fromChat ? "Volver a chats" : "Volver a clientes";

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
        <button type="button" onClick={() => router.push(backHref)} className="text-sm text-[#00E5FF] transition-colors hover:underline">
          {backLabel}
        </button>
      </div>
    );
  }

  if (!profile || !clientRelation) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="flex items-center gap-2 text-sm text-[#8B8BA3] transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        {backLabel}
      </button>

      {/* Client header */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6">
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
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "text-[#8B8BA3] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "perfil" && <TabPerfil profile={profile} />}
        {activeTab === "progreso" && <TabProgreso metrics={metrics} />}
        {activeTab === "rutina" && <TabRutina routine={routine} clientId={clientId} />}
        {activeTab === "menu" && <TabMenu mealPlan={mealPlan} clientId={clientId} />}
        {activeTab === "formulario" && <TabFormulario responses={formResponses} />}
        {activeTab === "comunicacion" && trainerId && (
          <TabChat trainerId={trainerId} clientId={clientId} clientName={profile.full_name} />
        )}
        {activeTab === "salud" && trainerId && (
          <TabSalud trainerId={trainerId} clientId={clientId} />
        )}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      }
    >
      <ClientDetailPageInner />
    </Suspense>
  );
}
