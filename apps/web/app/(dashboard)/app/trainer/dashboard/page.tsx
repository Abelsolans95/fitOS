"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/lib/hooks/useUser";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";

interface KpiData {
  activeClients: number;
  pendingForms: number;
  activeRoutines: number;
  activeMealPlans: number;
}

function useTrainerDashboard(user: User | null) {
  const [trainerName, setTrainerName] = useState("");
  const [kpis, setKpis] = useState<KpiData>({
    activeClients: 0,
    pendingForms: 0,
    activeRoutines: 0,
    activeMealPlans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const supabase = createClient();

        const [profileRes, clientsRes, formsRes, routinesRes, mealsRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
          supabase.from("trainer_clients").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).eq("status", "active"),
          supabase.from("onboarding_responses").select("id", { count: "exact", head: true }).eq("trainer_id", user.id),
          supabase.from("user_routines").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).eq("is_active", true),
          supabase.from("meal_plans").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).eq("is_active", true),
        ]);

        setTrainerName(
          profileRes.data?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Entrenador"
        );
        setKpis({
          activeClients: clientsRes.count ?? 0,
          pendingForms: formsRes.count ?? 0,
          activeRoutines: routinesRes.count ?? 0,
          activeMealPlans: mealsRes.count ?? 0,
        });
      } catch {
        setError("Error al cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  return { trainerName, kpis, loading, error };
}

const ICON_PATHS = {
  users: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  forms: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z",
  routines: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  meals: "M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5",
  plus: "M12 4.5v15m7.5-7.5h-15",
} as const;

export default function TrainerDashboardPage() {
  const { user, loading: userLoading, error: userError } = useUser();
  const { trainerName, kpis, loading: dataLoading, error: dataError } = useTrainerDashboard(user);

  const loading = userLoading || (!!user && dataLoading);
  const error = userError ?? dataError;

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
      </div>
    );
  }

  const kpiCards = [
    { label: "Clientes activos", value: kpis.activeClients, color: "#00E5FF", icon: "users" as const },
    { label: "Formularios", value: kpis.pendingForms, color: "#FF9100", icon: "forms" as const },
    { label: "Rutinas activas", value: kpis.activeRoutines, color: "#7C3AED", icon: "routines" as const },
    { label: "Menús activos", value: kpis.activeMealPlans, color: "#00C853", icon: "meals" as const },
  ];

  const quickActions = [
    { label: "Nueva rutina", href: "/app/trainer/routines", color: "#7C3AED", icon: "plus" as const },
    { label: "Nuevo menú", href: "/app/trainer/nutrition", color: "#00C853", icon: "plus" as const },
    { label: "Ver clientes", href: "/app/trainer/clients", color: "#00E5FF", icon: "users" as const },
    { label: "Formularios", href: "/app/trainer/forms", color: "#FF9100", icon: "forms" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Panel de control</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">
            Hola, {trainerName}
          </h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center border border-[#00E5FF]/30 bg-[#00E5FF]/10">
          <span className="text-sm font-bold text-[#00E5FF]">{trainerName.charAt(0).toUpperCase()}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#12121A] p-5 transition-all duration-300 hover:border-white/[0.12]"
          >
            <div
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]"
              style={{ backgroundColor: card.color }}
            />
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${card.color}10`, color: card.color }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[card.icon]} />
              </svg>
            </div>
            <p className="text-4xl font-black tracking-tight text-white">{card.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column: Activity + Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Actividad reciente</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-8">
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
                <svg className="h-6 w-6 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm text-[#5A5A72]">No hay actividad reciente</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Acciones</h2>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#12121A] p-3.5 transition-all duration-200 hover:border-white/[0.12] hover:bg-[#16162A]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${action.color}10`, color: action.color }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[action.icon]} />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#E8E8ED] transition-colors group-hover:text-white">
                  {action.label}
                </span>
                <svg className="ml-auto h-4 w-4 text-[#5A5A72] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
