import { memo } from "react";

const stimulusLabels: Record<number, string> = {
  1: "Nada",
  2: "Poco",
  3: "Moderado",
  4: "Bueno",
  5: "Excelente",
};

const fatigueLabels: Record<number, string> = {
  1: "Mínima",
  2: "Baja",
  3: "Moderada",
  4: "Alta",
  5: "Extrema",
};

interface SFRSelectorProps {
  exerciseName: string;
  stimulus: number;
  fatigue: number;
  onStimulusChange: (value: number) => void;
  onFatigueChange: (value: number) => void;
  onConfirm: () => void;
}

export const SFRSelector = memo(function SFRSelector({
  exerciseName,
  stimulus,
  fatigue,
  onStimulusChange,
  onFatigueChange,
  onConfirm,
}: SFRSelectorProps) {
  const sfr = fatigue > 0 ? Math.round((stimulus / fatigue) * 100) / 100 : 0;
  const sfrColor = sfr >= 1.5 ? "#00C853" : sfr >= 1 ? "#FF9100" : "#FF1744";

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
          Ejercicio completado
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
          {exerciseName}
        </h2>
      </div>

      {/* Stimulus rating */}
      <div className="w-full max-w-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7C3AED]">
            Estímulo muscular
          </p>
          <span className="text-xs text-[#5A5A72]">
            ¿Cuánto notaste el músculo?
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => onStimulusChange(v)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-sm font-bold transition-all ${
                stimulus === v
                  ? "bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  : "border border-white/[0.06] bg-white/[0.02] text-[#8B8BA3] hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-lg">{v}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-70">
                {stimulusLabels[v]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Fatigue rating */}
      <div className="w-full max-w-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#FF9100]">
            Fatiga generada
          </p>
          <span className="text-xs text-[#5A5A72]">
            ¿Cuánta fatiga te dejó?
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => onFatigueChange(v)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-sm font-bold transition-all ${
                fatigue === v
                  ? "bg-[#FF9100] text-[#0A0A0F] shadow-[0_0_20px_rgba(255,145,0,0.3)]"
                  : "border border-white/[0.06] bg-white/[0.02] text-[#8B8BA3] hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-lg">{v}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-70">
                {fatigueLabels[v]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SFR preview */}
      {stimulus > 0 && fatigue > 0 && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A72]">
            Ratio Estímulo / Fatiga
          </span>
          <span
            className="text-4xl font-black tabular-nums"
            style={{ color: sfrColor }}
          >
            {sfr.toFixed(2)}
          </span>
          <span className="text-xs text-[#5A5A72]">
            {sfr >= 1.5
              ? "Excelente relación"
              : sfr >= 1
                ? "Aceptable"
                : "Más fatiga que estímulo"}
          </span>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={onConfirm}
        className="rounded-2xl bg-[#00E5FF] px-10 py-4 text-base font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.3)]"
      >
        Continuar
      </button>
    </div>
  );
});
