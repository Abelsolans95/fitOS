import { memo } from "react";
import Link from "next/link";
import type { TodayPlan as TodayPlanType, WeeklyStats } from "../useClientDashboard";

interface Props {
  todayPlan: TodayPlanType;
  weeklyStats: WeeklyStats;
}

export const TodayPlan = memo(function TodayPlan({ todayPlan, weeklyStats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {/* Today's plan — 2 cols */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6 md:col-span-2">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#7C3AED]/[0.06] blur-3xl pointer-events-none" />

        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Plan de hoy</p>
          {todayPlan.workout && (
            <Link
              href="/app/client/routine"
              className="flex items-center gap-1 text-xs font-semibold text-[#7C3AED] transition-colors hover:text-[#7C3AED]/80"
            >
              Ver rutina completa
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {/* Workout row */}
          <div className="flex items-center gap-4 rounded-xl bg-white/[0.02]/60 p-4 ring-1 ring-white/[0.04]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10">
              <svg className="h-5 w-5 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                {todayPlan.workout ? todayPlan.workout.name : "Sin entrenamiento hoy"}
              </p>
              <p className="mt-0.5 text-xs text-[#5A5A72]">
                {todayPlan.workout ? todayPlan.workout.details : "Día de descanso — recarga energías"}
              </p>
            </div>
            <div className={`h-2 w-2 rounded-full ${todayPlan.workout?.details === "Completado" ? "bg-[#00C853]" : "bg-[#5A5A72]"}`} />
          </div>

          {/* Meals row */}
          <div className="flex items-center gap-4 rounded-xl bg-white/[0.02]/60 p-4 ring-1 ring-white/[0.04]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00C853]/10">
              <svg className="h-5 w-5 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {todayPlan.meals ? todayPlan.meals.name : "Sin menú asignado"}
              </p>
              <p className="mt-0.5 text-xs text-[#5A5A72]">
                {todayPlan.meals ? todayPlan.meals.details : "Consulta con tu entrenador"}
              </p>
            </div>
            {todayPlan.meals && (
              <Link
                href="/app/client/meals"
                className="flex h-8 items-center rounded-lg bg-[#00C853]/10 px-3 text-xs font-semibold text-[#00C853] transition-colors hover:bg-[#00C853]/20"
              >
                Ver
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats column — 1 col */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Adherencia</p>
          <p className="text-4xl font-black tracking-tight text-[#00E5FF]">
            {weeklyStats.adherence}<span className="text-2xl">%</span>
          </p>
          <p className="mt-1 text-xs text-[#5A5A72]">esta semana</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] transition-all duration-700"
              style={{ width: `${weeklyStats.adherence}%` }}
            />
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Próximo</p>
          <p className="text-lg font-bold text-[#7C3AED]">{weeklyStats.nextWorkout || "—"}</p>
          <p className="mt-1 text-xs text-[#5A5A72]">próximo entreno</p>
        </div>
      </div>
    </div>
  );
});
