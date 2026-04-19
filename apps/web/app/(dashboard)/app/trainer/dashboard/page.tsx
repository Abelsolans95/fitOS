"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Users,
  Zap,
  Salad,
  FileText,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/lib/hooks/useUser";
import { KPICard } from "./components/KPICard";
import { RecentActivity } from "./components/RecentActivity";

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
        const [profileRes, clientsRes, formsRes, routinesRes, mealsRes] =
          await Promise.all([
            supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
            supabase
              .from("trainer_clients")
              .select("id", { count: "exact", head: true })
              .eq("trainer_id", user.id)
              .eq("status", "active"),
            supabase
              .from("onboarding_responses")
              .select("id", { count: "exact", head: true })
              .eq("trainer_id", user.id),
            supabase
              .from("user_routines")
              .select("id", { count: "exact", head: true })
              .eq("trainer_id", user.id)
              .eq("is_active", true),
            supabase
              .from("meal_plans")
              .select("id", { count: "exact", head: true })
              .eq("trainer_id", user.id)
              .eq("is_active", true),
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 14) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />;
}

export default function TrainerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { trainerName, kpis, loading: dataLoading, error } = useTrainerDashboard(user);
  const loading = userLoading || (!!user && dataLoading);

  const firstName = trainerName.split(" ")[0] || "Entrenador";

  const kpiCards = useMemo(
    () => [
      {
        label: "Clientes activos",
        value: kpis.activeClients,
        icon: <Users className="h-[18px] w-[18px]" />,
        href: "/app/trainer/clients",
        hint: "Ver todos",
      },
      {
        label: "Formularios",
        value: kpis.pendingForms,
        icon: <FileText className="h-[18px] w-[18px]" />,
        href: "/app/trainer/forms",
        hint: "Ver todos",
      },
      {
        label: "Rutinas activas",
        value: kpis.activeRoutines,
        icon: <Zap className="h-[18px] w-[18px]" />,
        href: "/app/trainer/routines",
        hint: "Gestionar",
      },
      {
        label: "Menús activos",
        value: kpis.activeMealPlans,
        icon: <Salad className="h-[18px] w-[18px]" />,
        href: "/app/trainer/nutrition",
        hint: "Gestionar",
      },
    ],
    [kpis.activeClients, kpis.pendingForms, kpis.activeRoutines, kpis.activeMealPlans]
  );

  const quickActions = useMemo(
    () => [
      {
        label: "Nueva rutina con IA",
        sub: "Genera en segundos",
        href: "/app/trainer/routines",
        icon: <Sparkles className="h-4 w-4" />,
        primary: true,
      },
      {
        label: "Nuevo menú",
        sub: "Plan nutricional",
        href: "/app/trainer/nutrition",
        icon: <Salad className="h-4 w-4" />,
        primary: false,
      },
      {
        label: "Añadir cliente",
        sub: "Onboarding rápido",
        href: "/app/trainer/clients",
        icon: <Users className="h-4 w-4" />,
        primary: false,
      },
      {
        label: "Crear formulario",
        sub: "Personalizar preguntas",
        href: "/app/trainer/forms",
        icon: <FileText className="h-4 w-4" />,
        primary: false,
      },
    ],
    []
  );

  const tips = [
    "Usa la IA para generar rutinas de hipertrofia en menos de 10 segundos.",
    "El Vision Calorie Tracker permite a tus clientes registrar comidas con una foto.",
    "Asigna formularios de onboarding antes de crear la primera rutina.",
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Skeleton className="h-64 lg:col-span-3" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="dash-in dash-d1 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            {getGreeting()}
          </p>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-white">
            {firstName}
            <span className="text-[#00E5FF]">.</span>
          </h1>
          <p className="mt-1 text-[13px] text-[#8B8BA3]">Aquí está tu resumen de hoy</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 backdrop-blur-md">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#00C853]" />
          <span className="text-[11px] font-semibold text-[#8B8BA3]">En vivo</span>
        </div>
      </div>

      {/* KPI grid — now uniform grayscale with cyan accent on hover */}
      <div className="dash-in dash-d2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Activity + Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="dash-in dash-d3 lg:col-span-3">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Actividad reciente
          </p>
          <RecentActivity />
        </div>

        <div className="dash-in dash-d4 lg:col-span-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Acciones rápidas
          </p>
          <div className="flex flex-col gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 backdrop-blur-md transition-all duration-200 hover:translate-x-0.5 ${
                  action.primary
                    ? "border-[#00E5FF]/25 bg-[#00E5FF]/[0.05] hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/[0.1]"
                    : "border-white/10 bg-[#0E0E18]/60 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    action.primary
                      ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                      : "bg-white/5 text-[#8B8BA3]"
                  }`}
                >
                  {action.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight text-white">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-[#5A5A72]">{action.sub}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#3A3A52]" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Tips — single accent, clean */}
      <div className="dash-in dash-d5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
          Consejos para sacarle partido a Kuvox
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 p-5 backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="mb-3 inline-flex items-center gap-1.5 text-[#00E5FF]">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Tip</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#8B8BA3]">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="dash-in dash-d5">
        <div className="relative overflow-hidden rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/[0.03] p-6">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#00E5FF] opacity-[0.04] blur-[60px]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white">
                  Genera una rutina con IA ahora
                </p>
                <p className="text-[12px] text-[#8B8BA3]">
                  Especifica objetivo, nivel y equipamiento — lista en segundos
                </p>
              </div>
            </div>
            <Link
              href="/app/trainer/routines"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0F] transition-all hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)]"
            >
              Crear rutina <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
