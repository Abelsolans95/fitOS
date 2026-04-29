import { memo } from "react";

const DAYS_ES = ["D", "L", "M", "X", "J", "V", "S"];

interface Props {
  todayDayIndex: number;
  nextWorkout: string | null;
}

export const WeekStrip = memo(function WeekStrip({ todayDayIndex, nextWorkout }: Props) {
  return (
    <div className="flex items-center gap-2">
      {DAYS_ES.map((day, i) => {
        const dayIndex = i === 6 ? 0 : i + 1;
        const isToday = dayIndex === todayDayIndex;
        const isPast = (() => {
          if (dayIndex === todayDayIndex) return false;
          if (todayDayIndex === 0) return dayIndex !== 0;
          return dayIndex < todayDayIndex && dayIndex !== 0;
        })();

        return (
          <div
            key={day}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
              isToday
                ? "bg-[#00E5FF] text-[#0A0A0F]"
                : isPast
                ? "bg-white/[0.06] text-[#8B8BA3]"
                : "border border-white/10 text-[#5A5A72]"
            }`}
          >
            {day}
          </div>
        );
      })}
      <div className="ml-auto text-xs text-[#5A5A72]">
        {nextWorkout && (
          <span>
            Próximo entreno:{" "}
            <span className="font-semibold text-[#7C3AED]">{nextWorkout}</span>
          </span>
        )}
      </div>
    </div>
  );
});
