"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";

interface CalendarEvent {
  id: string;
  date: string;
  type: "workout" | "meal" | "metric" | "appointment";
  title: string;
  details?: string;
  completed?: boolean;
}

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  workout: { bg: "bg-[#00E5FF]/10", text: "text-[#00E5FF]", border: "border-[#00E5FF]/30" },
  meal: { bg: "bg-[#FF9100]/10", text: "text-[#FF9100]", border: "border-[#FF9100]/30" },
  metric: { bg: "bg-[#7C3AED]/10", text: "text-[#7C3AED]", border: "border-[#7C3AED]/30" },
  appointment: { bg: "bg-[#00C853]/10", text: "text-[#00C853]", border: "border-[#00C853]/30" },
};

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
        const endDay = getDaysInMonth(currentYear, currentMonth);
        const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

        const calendarEvents: CalendarEvent[] = [];

        // Load workout logs
        const { data: workoutLogs } = await supabase
          .from("workout_logs")
          .select("id, logged_at, exercises")
          .eq("user_id", user.id)
          .gte("logged_at", startDate)
          .lte("logged_at", endDate + "T23:59:59");

        if (workoutLogs) {
          workoutLogs.forEach((log) => {
            const exerciseCount = Array.isArray(log.exercises) ? log.exercises.length : 0;
            calendarEvents.push({
              id: `w-${log.id}`,
              date: log.logged_at.split("T")[0],
              type: "workout",
              title: "Entrenamiento",
              details: `${exerciseCount} ejercicios`,
              completed: true,
            });
          });
        }

        // Load food logs
        const { data: foodLogs } = await supabase
          .from("food_log")
          .select("id, logged_at, meal_type, total_kcal")
          .eq("user_id", user.id)
          .gte("logged_at", startDate)
          .lte("logged_at", endDate + "T23:59:59");

        if (foodLogs) {
          // Group by date
          const byDate = new Map<string, { count: number; totalKcal: number }>();
          foodLogs.forEach((log) => {
            const date = log.logged_at.split("T")[0];
            const existing = byDate.get(date) || { count: 0, totalKcal: 0 };
            existing.count++;
            existing.totalKcal += log.total_kcal || 0;
            byDate.set(date, existing);
          });
          byDate.forEach((val, date) => {
            calendarEvents.push({
              id: `m-${date}`,
              date,
              type: "meal",
              title: "Comidas registradas",
              details: `${val.count} comidas · ${Math.round(val.totalKcal)} kcal`,
              completed: true,
            });
          });
        }

        // Load body metrics
        const { data: metrics } = await supabase
          .from("body_metrics")
          .select("id, recorded_at, weight_kg, body_fat_pct")
          .eq("user_id", user.id)
          .gte("recorded_at", startDate)
          .lte("recorded_at", endDate + "T23:59:59");

        if (metrics) {
          metrics.forEach((m) => {
            const parts: string[] = [];
            if (m.weight_kg) parts.push(`${m.weight_kg} kg`);
            if (m.body_fat_pct) parts.push(`${m.body_fat_pct}% grasa`);
            calendarEvents.push({
              id: `bm-${m.id}`,
              date: m.recorded_at.split("T")[0],
              type: "metric",
              title: "Medición",
              details: parts.join(" · ") || "Datos registrados",
            });
          });
        }

        setEvents(calendarEvents);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => e.date === selectedDate);
  }, [selectedDate, events]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const existing = map.get(e.date) || [];
      existing.push(e);
      map.set(e.date, existing);
    });
    return map;
  }, [events]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Calendario</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">Tu actividad mes a mes</p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#12121A] px-5 py-4">
        <button type="button" onClick={prevMonth} className="rounded-lg p-2 text-[#8B8BA3] transition-colors hover:bg-white/[0.05] hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold capitalize text-white">{monthName}</h2>
        <button type="button" onClick={nextMonth} className="rounded-lg p-2 text-[#8B8BA3] transition-colors hover:bg-white/[0.05] hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-[#8B8BA3]">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayEvents = eventsByDate.get(dateStr) || [];
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all ${
                      isSelected
                        ? "bg-[#00E5FF]/15 text-[#00E5FF] ring-1 ring-[#00E5FF]/40"
                        : isToday
                        ? "bg-[#00E5FF]/5 font-bold text-[#00E5FF]"
                        : hasEvents
                        ? "text-white hover:bg-white/[0.05]"
                        : "text-[#8B8BA3]/60 hover:bg-white/[0.03]"
                    }`}
                  >
                    {day}
                    {hasEvents && (
                      <div className="mt-0.5 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className={`h-1 w-1 rounded-full ${
                              e.type === "workout"
                                ? "bg-[#00E5FF]"
                                : e.type === "meal"
                                ? "bg-[#FF9100]"
                                : e.type === "metric"
                                ? "bg-[#7C3AED]"
                                : "bg-[#00C853]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {[
          { type: "workout", label: "Entreno", color: "bg-[#00E5FF]" },
          { type: "meal", label: "Comidas", color: "bg-[#FF9100]" },
          { type: "metric", label: "Medición", color: "bg-[#7C3AED]" },
          { type: "appointment", label: "Cita", color: "bg-[#00C853]" },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${item.color}`} />
            <span className="text-xs text-[#8B8BA3]">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#8B8BA3]">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>

          {eventsForSelectedDate.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center">
              <p className="text-sm text-[#8B8BA3]">Sin actividad este día</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventsForSelectedDate.map((event) => {
                const colors = EVENT_COLORS[event.type];
                return (
                  <div
                    key={event.id}
                    className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${colors.text}`}>{event.title}</h4>
                      {event.completed && (
                        <svg className="h-4 w-4 text-[#00C853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {event.details && (
                      <p className="mt-1 text-xs text-[#8B8BA3]">{event.details}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
