import { formatTime } from "../types";

interface RestTimerProps {
  restTime: number;
  restTotal: number;
  elapsed: number;
  exerciseName: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSkipRest: () => void;
  nextExerciseName?: string;
}

export function RestTimer({
  restTime,
  restTotal,
  elapsed,
  exerciseName,
  notes,
  onNotesChange,
  onSkipRest,
  nextExerciseName,
}: RestTimerProps) {
  const progress = restTotal > 0 ? restTime / restTotal : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4">
      {/* Session elapsed */}
      <div className="absolute right-6 top-6 text-xs text-[#5A5A72]">
        {formatTime(elapsed)}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
        Descanso
      </p>

      {/* Radial timer */}
      <div className="relative flex items-center justify-center">
        <svg width="280" height="280" className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="6"
          />
          {/* Progress arc */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#00E5FF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: "drop-shadow(0 0 12px rgba(0,229,255,0.4))",
            }}
          />
        </svg>

        {/* Center time */}
        <div className="absolute flex flex-col items-center">
          <span
            className="text-6xl font-black tabular-nums tracking-tight text-white"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatTime(restTime)}
          </span>
          <span className="mt-1 text-xs text-[#5A5A72]">
            {exerciseName}
          </span>
        </div>
      </div>

      {/* Notes input */}
      <div className="w-full max-w-xs">
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notas sobre este ejercicio... (opcional)"
          rows={2}
          className="w-full rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-4 py-3 text-sm text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/30 resize-none"
        />
      </div>

      {/* Skip */}
      <button
        onClick={onSkipRest}
        className="rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-8 py-3 text-sm font-semibold text-[#8B8BA3] transition-colors hover:border-[#00E5FF]/20 hover:text-white"
      >
        Saltar descanso
      </button>

      {/* Next exercise preview */}
      {nextExerciseName && (
        <div className="mt-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Siguiente
          </p>
          <p className="mt-1 text-sm text-[#8B8BA3]">
            {nextExerciseName}
          </p>
        </div>
      )}
    </div>
  );
}
