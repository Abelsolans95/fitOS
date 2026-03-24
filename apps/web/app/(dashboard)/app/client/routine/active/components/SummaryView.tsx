import { formatTime } from "../types";
import type { SummaryData } from "../types";

interface SummaryViewProps {
  summaryData: SummaryData;
  elapsed: number;
  rpeGlobal: number;
  routineTitle: string;
}

export function SummaryView({
  summaryData,
  elapsed,
  rpeGlobal,
  routineTitle,
}: SummaryViewProps) {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {/* Hero stats */}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00C853]">
          Rutina finalizada
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
          {routineTitle}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4 text-center">
          <p className="text-3xl font-black tracking-tight text-[#00E5FF]">
            {formatTime(elapsed)}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Duración
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4 text-center">
          <p className="text-3xl font-black tracking-tight text-[#7C3AED]">
            {Math.round(summaryData.totalVolume).toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Vol (kg)
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4 text-center">
          <p className="text-3xl font-black tracking-tight text-[#FF9100]">
            {summaryData.totalSetsCount}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Series
          </p>
        </div>
      </div>

      {/* Per-exercise results */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
          Resultados por ejercicio
        </p>
        {summaryData.exerciseResults.map((result, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.04] bg-[#0E0E18]/60 backdrop-blur-xl px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-[10px] font-bold text-[#8B8BA3]">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-white">
                  {result.name}
                </span>
              </div>
              <span
                className="text-[10px] font-bold"
                style={{ color: result.progress.color }}
              >
                {result.progress.label}
              </span>
            </div>
            {/* Sets detail */}
            <div className="mt-2 flex flex-wrap gap-2">
              {result.sets
                .filter((s) => s.completed)
                .map((s, j) => (
                  <span
                    key={j}
                    className="rounded-md bg-white/[0.04] px-2 py-1 text-xs text-[#8B8BA3]"
                  >
                    <span className="font-semibold text-white">
                      {s.weight_kg}
                    </span>
                    kg ×{" "}
                    <span className="font-semibold text-white">
                      {s.reps_done}
                    </span>
                  </span>
                ))}
            </div>
            {result.notes && (
              <p className="mt-2 rounded-md bg-[#7C3AED]/5 px-3 py-2 text-xs text-[#7C3AED]">
                {result.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* RPE */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
          RPE Global
        </p>
        <p
          className="mt-1 text-4xl font-black"
          style={{
            color:
              rpeGlobal <= 4
                ? "#00C853"
                : rpeGlobal <= 7
                  ? "#FF9100"
                  : "#FF1744",
          }}
        >
          {rpeGlobal}
        </p>
      </div>

      {/* Back */}
      <button
        onClick={() => window.history.back()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
      >
        Volver a mi rutina
      </button>
    </div>
  );
}
