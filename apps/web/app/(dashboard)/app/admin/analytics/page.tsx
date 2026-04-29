"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Analytics {
  totals: {
    trainers: number;
    clients: number;
    activeClients: number;
    retentionRate: number;
    routines: number;
    mealPlans: number;
    articles: number;
    openTickets: number;
    resolvedTickets: number;
  };
  activity: {
    sessionsLast30: number;
    sessionsGrowth: number;
    messagesLast30: number;
  };
  growth: {
    newTrainers7d: number;
    newClients7d: number;
    newTrainers30d: number;
    newClients30d: number;
  };
  promo: {
    totalCodes: number;
    activeCodes: number;
    totalUses: number;
  };
  topTrainers: { trainer_id: string; name: string; active_clients: number }[];
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: accent }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="mt-1 text-xs text-[#8B8BA3]">{sub}</p>}
    </div>
  );
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-[#5A5A72]">sin cambio</span>;
  return (
    <span className={`text-xs font-semibold ${value > 0 ? "text-[#00C853]" : "text-[#FF1744]"}`}>
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#8B8BA3]">Error al cargar analíticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Analíticas</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">Métricas detalladas de la plataforma</p>
      </div>

      {/* Growth Section */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Crecimiento</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Entrenadores (7d)"
            value={`+${data.growth.newTrainers7d}`}
            sub={`${data.growth.newTrainers30d} último mes`}
            accent="#7C3AED"
          />
          <StatCard
            label="Clientes (7d)"
            value={`+${data.growth.newClients7d}`}
            sub={`${data.growth.newClients30d} último mes`}
            accent="#00E5FF"
          />
          <StatCard
            label="Retención"
            value={`${data.totals.retentionRate}%`}
            sub={`${data.totals.activeClients} de ${data.totals.clients} clientes`}
            accent={data.totals.retentionRate >= 70 ? "#00C853" : data.totals.retentionRate >= 50 ? "#FF9100" : "#FF1744"}
          />
          <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Sesiones (30d)</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#FF9100]">
              {data.activity.sessionsLast30.toLocaleString()}
            </p>
            <div className="mt-1">
              <GrowthBadge value={data.activity.sessionsGrowth} />
              <span className="ml-1 text-xs text-[#5A5A72]">vs mes anterior</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Contenido</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Rutinas" value={data.totals.routines} accent="#00E5FF" />
          <StatCard label="Menús" value={data.totals.mealPlans} accent="#00E5FF" />
          <StatCard label="Artículos" value={data.totals.articles} accent="#7C3AED" />
          <StatCard label="Mensajes (30d)" value={data.activity.messagesLast30} accent="#8B8BA3" />
          <StatCard
            label="Ratio clientes/trainer"
            value={data.totals.trainers > 0 ? Math.round(data.totals.activeClients / data.totals.trainers) : 0}
            sub="media"
            accent="#7C3AED"
          />
        </div>
      </div>

      {/* Tickets & Promo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Consultas</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Abiertas"
              value={data.totals.openTickets}
              accent={data.totals.openTickets > 20 ? "#FF1744" : "#FF9100"}
            />
            <StatCard label="Resueltas" value={data.totals.resolvedTickets} accent="#00C853" />
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Códigos Promo</h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total" value={data.promo.totalCodes} accent="#8B8BA3" />
            <StatCard label="Activos" value={data.promo.activeCodes} accent="#00C853" />
            <StatCard label="Usos" value={data.promo.totalUses} accent="#7C3AED" />
          </div>
        </div>
      </div>

      {/* Top Trainers */}
      {data.topTrainers.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Top Entrenadores por Clientes Activos
          </h2>
          <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5">
            <div className="space-y-3">
              {data.topTrainers.map((t, i) => {
                const maxClients = data.topTrainers[0]?.active_clients ?? 1;
                const pct = Math.round((t.active_clients / maxClients) * 100);
                return (
                  <div key={t.trainer_id} className="flex items-center gap-4">
                    <span className="w-6 text-right text-xs font-bold text-[#5A5A72]">#{i + 1}</span>
                    <Link
                      href={`/app/admin/users/${t.trainer_id}`}
                      className="min-w-[150px] text-sm font-semibold text-white hover:text-[#00E5FF]"
                    >
                      {t.name}
                    </Link>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="min-w-[40px] text-right text-sm font-black text-[#7C3AED]">
                      {t.active_clients}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
