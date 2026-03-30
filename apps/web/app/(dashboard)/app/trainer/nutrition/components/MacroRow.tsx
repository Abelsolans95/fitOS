"use client";

export function MacroRow({
  label, color, actual, target, unit, delta, pctActual, pctTarget,
}: {
  label: string;
  color: string;
  actual: number;
  target: number;
  unit: string;
  delta: number;
  pctActual: number | null;
  pctTarget: number | null;
}) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const isOver = delta < 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color }}>{label}</span>
        <span className="text-[12px] font-bold text-white">
          {actual}{unit} <span className="text-[#5A5A72]">/ {target}{unit}</span>
        </span>
      </div>
      {pctActual !== null && pctTarget !== null && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#8B8BA3]">Obj. {pctTarget}%</span>
          <span className={Math.abs(pctActual - pctTarget) <= 5 ? "text-[#00C853]" : "text-[#FF9100]"}>
            Act. {pctActual}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {target > 0 && (
        <p className={`text-[10px] font-medium ${isOver ? "text-[#FF1744]" : "text-[#5A5A72]"}`}>
          {isOver ? `Excedido ${Math.abs(delta)}${unit}` : `Faltan ${delta}${unit}`}
        </p>
      )}
    </div>
  );
}
