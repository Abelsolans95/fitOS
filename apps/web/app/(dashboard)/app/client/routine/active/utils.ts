const DAY_OF_WEEK_MAP: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 0,
};

export function getDateForDay(
  sentAt: string | null,
  weekNumber: number,
  dayKey: string
): string {
  if (!sentAt) return "";
  const start = new Date(sentAt);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7);
  const targetDow = DAY_OF_WEEK_MAP[dayKey] ?? 1;
  const currentDow = weekStart.getDay();
  let diff = targetDow - currentDow;
  if (diff < 0) diff += 7;
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + diff);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function calculateProgressLabel(
  currentData: { weight: number; reps: number }[],
  prevData: { weight: number; reps: number }[]
): string {
  if (prevData.length === 0 || currentData.length === 0) return "";
  const currentVolume = currentData.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const prevVolume = prevData.reduce((sum, s) => sum + s.weight * s.reps, 0);
  if (prevVolume === 0) return "";
  const delta = ((currentVolume - prevVolume) / prevVolume) * 100;
  if (delta > 2) return "↑ Progreso";
  if (delta < -2) return "↓ Bajada";
  return "= Igual";
}

export function getProgressColor(progress: string): string {
  if (progress.startsWith("↑")) return "text-[#00C853]";
  if (progress.startsWith("↓")) return "text-[#FF1744]";
  return "text-[#5A5A72]";
}
