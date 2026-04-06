"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalTrainers: number;
  totalClients: number;
  activeClients: number;
  sessionsLast30d: number;
  openTickets: number;
  activeRoutines: number;
  activeMealPlans: number;
  newTrainersWeek: number;
  newClientsWeek: number;
}

function StatCard({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  accent: string;
  href?: string;
}) {
  const content = (
    <div className="group rounded-2xl border border-white/[0.06] bg-[#12121A] p-5 transition-colors hover:border-white/[0.1]">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: accent }}>
        {value.toLocaleString()}
      </p>
      {sub && <p className="mt-1 text-xs text-[#8B8BA3]">{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#8B8BA3]">Error al cargar estadísticas</p>
      </div>
    );
  }

  const retentionRate = stats.totalClients > 0
    ? Math.round((stats.activeClients / stats.totalClients) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Panel de Administración
        </h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Vista general de la plataforma FitOS
        </p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Entrenadores"
          value={stats.totalTrainers}
          sub={stats.newTrainersWeek > 0 ? `+${stats.newTrainersWeek} esta semana` : undefined}
          accent="#7C3AED"
          href="/app/admin/users?role=trainer"
        />
        <StatCard
          label="Clientes"
          value={stats.totalClients}
          sub={stats.newClientsWeek > 0 ? `+${stats.newClientsWeek} esta semana` : undefined}
          accent="#00E5FF"
          href="/app/admin/users?role=client"
        />
        <StatCard
          label="Clientes activos"
          value={stats.activeClients}
          sub={`${retentionRate}% retención`}
          accent="#00C853"
        />
        <StatCard
          label="Sesiones (30d)"
          value={stats.sessionsLast30d}
          accent="#FF9100"
        />
        <StatCard
          label="Tickets abiertos"
          value={stats.openTickets}
          accent={stats.openTickets > 10 ? "#FF1744" : "#8B8BA3"}
          href="/app/admin/tickets"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Rutinas activas"
          value={stats.activeRoutines}
          accent="#00E5FF"
        />
        <StatCard
          label="Menús activos"
          value={stats.activeMealPlans}
          accent="#00E5FF"
        />
        <StatCard
          label="Ratio clientes/trainer"
          value={stats.totalTrainers > 0 ? Math.round(stats.activeClients / stats.totalTrainers) : 0}
          sub="media"
          accent="#7C3AED"
        />
        <StatCard
          label="Total usuarios"
          value={stats.totalTrainers + stats.totalClients}
          accent="#8B8BA3"
          href="/app/admin/users"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/app/admin/users/create"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 transition-colors hover:border-[#7C3AED]/30 hover:bg-[#7C3AED]/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/10">
              <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Crear usuario</span>
          </Link>

          <Link
            href="/app/admin/users?role=trainer"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 transition-colors hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/10">
              <svg className="h-4 w-4 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Ver entrenadores</span>
          </Link>

          <Link
            href="/app/admin/users?role=client"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 transition-colors hover:border-[#00C853]/30 hover:bg-[#00C853]/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C853]/10">
              <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Ver clientes</span>
          </Link>

          <Link
            href="/app/admin/audit"
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 transition-colors hover:border-[#FF9100]/30 hover:bg-[#FF9100]/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF9100]/10">
              <svg className="h-4 w-4 text-[#FF9100]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Logs de auditoría</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
