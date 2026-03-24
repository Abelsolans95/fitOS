const rpeLabels: Record<number, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Ligero",
  4: "Moderado-",
  5: "Moderado",
  6: "Moderado+",
  7: "Difícil",
  8: "Muy difícil",
  9: "Casi máximo",
  10: "Máximo",
};

interface RPESelectorProps {
  rpeGlobal: number;
  onRpeChange: (value: number) => void;
  onFinish: () => void;
}

export function RPESelector({
  rpeGlobal,
  onRpeChange,
  onFinish,
}: RPESelectorProps) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
          Esfuerzo percibido
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
          ¿Cómo fue la sesión?
        </h2>
      </div>

      {/* RPE selector */}
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span
            className="text-7xl font-black tabular-nums"
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
          </span>
          <span className="text-sm text-[#8B8BA3]">
            {rpeLabels[rpeGlobal]}
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={10}
          value={rpeGlobal}
          onChange={(e) => onRpeChange(Number(e.target.value))}
          className="w-full accent-[#00E5FF]"
        />
        <div className="mt-2 flex justify-between text-[10px] text-[#5A5A72]">
          <span>Fácil</span>
          <span>Máximo</span>
        </div>
      </div>

      <button
        onClick={onFinish}
        className="rounded-2xl bg-[#00E5FF] px-10 py-4 text-base font-bold text-[#0A0A0F] transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.3)]"
      >
        Finalizar sesión
      </button>
    </div>
  );
}
