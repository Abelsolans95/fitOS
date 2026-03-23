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

/* ── Icons ── */
const IcUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcFood = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5"/>
  </svg>
);
const IcForms = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
  </svg>
);
const IcArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const IcPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5v15m7.5-7.5h-15"/>
  </svg>
);
const IcClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 6v6h4.5"/>
  </svg>
);
const IcSpark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

/* ── Greeting helper ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 14) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

/* ── Loading skeleton ── */
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />;
}

/* ══════════════════════════════════════════ */
export default function TrainerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { trainerName, kpis, loading: dataLoading, error } = useTrainerDashboard(user);
  const loading = userLoading || (!!user && dataLoading);

  const firstName = trainerName.split(" ")[0] || "Entrenador";

  const kpiCards = [
    {
      label: "Clientes activos",
      value: kpis.activeClients,
      color: "#00E5FF",
      bg: "rgba(0,229,255,0.06)",
      border: "rgba(0,229,255,0.14)",
      icon: <IcUsers />,
      href: "/app/trainer/clients",
      hint: "Ver todos",
    },
    {
      label: "Formularios",
      value: kpis.pendingForms,
      color: "#FF9100",
      bg: "rgba(255,145,0,0.06)",
      border: "rgba(255,145,0,0.14)",
      icon: <IcForms />,
      href: "/app/trainer/forms",
      hint: "Ver todos",
    },
    {
      label: "Rutinas activas",
      value: kpis.activeRoutines,
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.06)",
      border: "rgba(124,58,237,0.14)",
      icon: <IcZap />,
      href: "/app/trainer/routines",
      hint: "Gestionar",
    },
    {
      label: "Menús activos",
      value: kpis.activeMealPlans,
      color: "#00C853",
      bg: "rgba(0,200,83,0.06)",
      border: "rgba(0,200,83,0.14)",
      icon: <IcFood />,
      href: "/app/trainer/nutrition",
      hint: "Gestionar",
    },
  ];

  const quickActions = [
    {
      label: "Nueva rutina con IA",
      sub: "Genera en segundos",
      href: "/app/trainer/routines",
      color: "#7C3AED",
      icon: <IcZap />,
      primary: true,
    },
    {
      label: "Nuevo menú",
      sub: "Plan nutricional",
      href: "/app/trainer/nutrition",
      color: "#00C853",
      icon: <IcFood />,
      primary: false,
    },
    {
      label: "Añadir cliente",
      sub: "Onboarding rápido",
      href: "/app/trainer/clients",
      color: "#00E5FF",
      icon: <IcUsers />,
      primary: false,
    },
    {
      label: "Crear formulario",
      sub: "Personalizar preguntas",
      href: "/app/trainer/forms",
      color: "#FF9100",
      icon: <IcForms />,
      primary: false,
    },
  ];

  /* ── Tip cards ── */
  const tips = [
    { text: "Usa la IA para generar rutinas de hipertrofia en menos de 10 segundos.", accent: "#00E5FF" },
    { text: "El Vision Calorie Tracker permite a tus clientes registrar comidas con una foto.", accent: "#7C3AED" },
    { text: "Asigna formularios de onboarding antes de crear la primera rutina.", accent: "#FF9100" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
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
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/05 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes dash-fade {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(30px,-20px) scale(1.06); }
        }
        @keyframes kpi-glow {
          0%,100% { opacity: 0.06; }
          50%     { opacity: 0.12; }
        }
        @keyframes pulse-dot {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,200,83,0.5); }
          50%     { box-shadow: 0 0 0 5px rgba(0,200,83,0); }
        }
        @keyframes shimmer-bar {
          from { background-position: -200% 0; }
          to   { background-position: 200% 0; }
        }

        .dash-in { animation: dash-fade 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .d1 { animation-delay: 0.04s; }
        .d2 { animation-delay: 0.12s; }
        .d3 { animation-delay: 0.22s; }
        .d4 { animation-delay: 0.34s; }
        .d5 { animation-delay: 0.46s; }
        .d6 { animation-delay: 0.58s; }

        .kpi-card {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background: rgba(14, 14, 24, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.35s ease, transform 0.3s ease, box-shadow 0.35s ease, background 0.3s ease;
          cursor: pointer;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          background: rgba(20, 20, 34, 0.7);
        }

        .kpi-orb {
          position: absolute;
          top: -30px; right: -30px;
          width: 100px; height: 100px;
          border-radius: 50%;
          filter: blur(40px);
          animation: kpi-glow 4s ease-in-out infinite;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(14, 14, 24, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 14px 16px;
          transition: all 0.25s ease;
          text-decoration: none;
        }
        .action-card:hover {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.12);
          transform: translateX(3px);
        }
        .action-card-primary {
          border-color: rgba(124,58,237,0.2);
          background: rgba(124,58,237,0.08);
        }
        .action-card-primary:hover {
          border-color: rgba(124,58,237,0.35);
          background: rgba(124,58,237,0.15);
          box-shadow: 0 0 30px -10px rgba(124,58,237,0.3);
        }

        .shimmer-num {
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.6) 50%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .live-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .tip-bar {
          background: linear-gradient(90deg, var(--tip-color, #00E5FF) 0%, transparent 100%);
          background-size: 200% auto;
          animation: shimmer-bar 3s linear infinite;
        }

        .section-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #5A5A72;
          margin-bottom: 12px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 48px 24px;
          color: #5A5A72;
        }

        @media (prefers-reduced-motion: reduce) {
          .dash-in, .kpi-orb, .shimmer-num, .live-dot, .tip-bar { animation: none !important; }
        }
      `}</style>

      <div className="space-y-7">

        {/* ── Header ── */}
        <div className="dash-in d1 flex items-start justify-between">
          <div>
            <p className="section-label mb-1">{getGreeting()}</p>
            <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-white">
              {firstName}
              <span className="text-[#00E5FF]">.</span>
            </h1>
            <p className="mt-1 text-[13px] text-[#8B8BA3]">
              Aquí está tu resumen de hoy
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-md px-3.5 py-2 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
            <span className="live-dot h-2 w-2 rounded-full bg-[#00C853] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-[#8B8BA3]">En vivo</span>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="dash-in d2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Link href={card.href} key={card.label} className="kpi-card group" style={{ "--card-color": card.color } as React.CSSProperties}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = card.border;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 50px -12px ${card.color}20`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div className="kpi-orb" style={{ background: card.color }} />
              <div className="relative p-5">
                {/* Icon */}
                <div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                {/* Value */}
                <p className="shimmer-num text-[42px] font-extrabold leading-none tracking-[-0.04em]">
                  {card.value}
                </p>
                {/* Label */}
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: card.color === "#00E5FF" ? "#5A5A72" : "#5A5A72" }}>
                  {card.label}
                </p>
                {/* Hint */}
                <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="text-[10px]" style={{ color: card.color }}>{card.hint}</span>
                  <IcArrow />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Two-column: Activity + Actions ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* Activity feed */}
          <div className="dash-in d3 lg:col-span-3">
            <p className="section-label">Actividad reciente</p>
            <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
                <div className="flex items-center gap-2">
                  <IcClock />
                  <span className="text-[13px] font-semibold text-[#8B8BA3]">Últimas acciones</span>
                </div>
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-[#5A5A72]">
                  Hoy
                </span>
              </div>

              {/* Empty state */}
              <div className="empty-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
                  <IcClock />
                </div>
                <p className="text-[13px] text-[#5A5A72]">No hay actividad reciente</p>
                <p className="text-[11px] text-[#3A3A52] text-center max-w-[200px]">
                  Las acciones de tus clientes aparecerán aquí
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="dash-in d4 lg:col-span-2">
            <p className="section-label">Acciones rápidas</p>
            <div className="flex flex-col gap-2">
              {quickActions.map((action, i) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`action-card ${action.primary ? "action-card-primary" : ""}`}
                >
                  {/* Icon */}
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${action.color}12`, color: action.color }}
                  >
                    {action.primary ? <IcSpark /> : action.icon}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white leading-tight">{action.label}</p>
                    <p className="text-[11px] text-[#5A5A72]">{action.sub}</p>
                  </div>

                  {/* Arrow */}
                  <span className="flex-shrink-0 text-[#3A3A52] transition-colors group-hover:text-[#8B8BA3]">
                    <IcArrow />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tip cards ── */}
        <div className="dash-in d5">
          <p className="section-label">Consejos para sacarle partido a FitOS</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5 transition-colors hover:bg-white/[0.04]"
              >
                {/* Accent bar top */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${tip.accent}, transparent)` }}
                />
                {/* Glow */}
                <div
                  className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.06] blur-[40px]"
                  style={{ background: tip.accent }}
                />
                <div className="relative">
                  <div className="mb-3 inline-flex items-center gap-1.5" style={{ color: tip.accent }}>
                    <IcSpark />
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Tip</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-[#8B8BA3]">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA strip ── */}
        <div className="dash-in d6">
          <div className="relative overflow-hidden rounded-[18px] border border-[#00E5FF]/12 bg-[#00E5FF]/[0.03] p-6">
            {/* Orbs */}
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#00E5FF] opacity-[0.04] blur-[60px]" />
            <div className="pointer-events-none absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-[#7C3AED] opacity-[0.05] blur-[50px]" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                  <IcZap />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white">Genera una rutina con IA ahora</p>
                  <p className="text-[12px] text-[#8B8BA3]">Especifica objetivo, nivel y equipamiento — lista en segundos</p>
                </div>
              </div>
              <Link
                href="/app/trainer/routines"
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0F] transition-all hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)]"
              >
                Crear rutina <IcPlus />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
