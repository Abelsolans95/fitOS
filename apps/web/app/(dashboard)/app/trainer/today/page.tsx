"use client";

import { useEffect, useState, useCallback } from "react";
import type { TodayPanel } from "@fitos/shared";
import { AlertSection } from "./components/AlertSection";

const SECTIONS: {
  kind: keyof TodayPanel["alerts_by_kind"];
  title: string;
  subtitle: string;
}[] = [
  {
    kind: "pending_ticket",
    title: "Consultas pendientes",
    subtitle: "Clientes esperando respuesta",
  },
  {
    kind: "new_injury",
    title: "Lesiones nuevas",
    subtitle: "Reportadas en los últimos 7 días",
  },
  {
    kind: "high_pain",
    title: "Dolor elevado",
    subtitle: "Check-ins con dolor ≥ 4/5",
  },
  {
    kind: "high_stress",
    title: "Estrés elevado",
    subtitle: "Check-ins con estrés ≥ 4/5",
  },
  {
    kind: "no_workout",
    title: "Sin entrenar",
    subtitle: "Clientes inactivos hace 3+ días",
  },
  {
    kind: "no_checkin",
    title: "Sin check-in",
    subtitle: "Clientes sin reporte en 48h",
  },
];

export default function TodayPage() {
  const [panel, setPanel] = useState<TodayPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/trainer/today", { cache: "no-store" });
      if (!res.ok) {
        setError("No se pudo cargar el panel de hoy.");
        return;
      }
      const data = (await res.json()) as TodayPanel;
      setPanel(data);
    } catch {
      setError("Error de red al cargar el panel.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-32 animate-pulse rounded bg-white/5" />
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-[#FF1744]">{error}</p>
        <button
          onClick={load}
          className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!panel) return null;

  const generated = new Date(panel.generated_at).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 pb-24">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[#00E5FF]">Hoy</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          {panel.total_alerts === 0
            ? "Todo en orden"
            : `${panel.total_alerts} ${
                panel.total_alerts === 1 ? "cliente requiere" : "clientes requieren"
              } atención`}
        </h1>
        <p className="text-sm text-[#8B8BA3]">
          {panel.total_clients}{" "}
          {panel.total_clients === 1 ? "cliente activo" : "clientes activos"} · actualizado{" "}
          {generated}
        </p>
      </header>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={load}
          disabled={refreshing}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {refreshing ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {/* Empty state */}
      {panel.total_alerts === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#12121A] p-10 text-center">
          <p className="text-6xl">✓</p>
          <h2 className="mt-3 text-lg font-bold text-white">
            Ningún cliente necesita atención hoy
          </h2>
          <p className="mt-1 text-sm text-[#8B8BA3]">
            Todos entrenaron, hicieron check-in y no tienen consultas pendientes.
          </p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {SECTIONS.map(({ kind, title, subtitle }) => (
          <AlertSection
            key={kind}
            kind={kind}
            title={title}
            subtitle={subtitle}
            alerts={panel.alerts_by_kind[kind]}
          />
        ))}
      </div>
    </div>
  );
}
