"use client";

import { useClientDashboard } from "./useClientDashboard";
import { WeekStrip } from "./components/WeekStrip";
import { TodayPlan } from "./components/TodayPlan";
import { QuickActions } from "./components/QuickActions";

export default function ClientDashboardPage() {
  const { clientName, todayPlan, weeklyStats, loading, error } = useClientDashboard();

  const today = new Date();
  const todayDayIndex = today.getDay();
  const formattedDate = today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const firstName = clientName.split(" ")[0];

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]">{formattedDate}</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-white">Hola, {firstName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#FF9100]/20 bg-[#FF9100]/[0.06] px-4 py-2">
            <svg className="h-4 w-4 text-[#FF9100]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            </svg>
            <span className="text-sm font-bold text-[#FF9100]">{weeklyStats.streak}</span>
            <span className="text-xs text-[#5A5A72]">racha</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/[0.06] px-4 py-2">
            <svg className="h-4 w-4 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-bold text-[#00E5FF]">{weeklyStats.adherence}%</span>
            <span className="text-xs text-[#5A5A72]">adherencia</span>
          </div>
        </div>
      </div>

      <WeekStrip todayDayIndex={todayDayIndex} nextWorkout={weeklyStats.nextWorkout} />
      <TodayPlan todayPlan={todayPlan} weeklyStats={weeklyStats} />
      <QuickActions />
    </div>
  );
}
