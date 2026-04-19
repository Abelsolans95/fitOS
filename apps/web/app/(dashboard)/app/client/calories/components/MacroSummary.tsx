"use client";

interface DailyTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroSummaryProps {
  totals: DailyTotals;
}

export function MacroSummary({ totals }: MacroSummaryProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
      <h2 className="mb-4 text-base font-semibold text-white">Totales del dia</h2>
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{Math.round(totals.kcal)}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#00E5FF]">{Math.round(totals.protein)}g</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">Prot</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#FF9100]">{Math.round(totals.carbs)}g</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">Carbs</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#7C3AED]">{Math.round(totals.fat)}g</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8B8BA3]">Grasa</p>
        </div>
      </div>
    </div>
  );
}
