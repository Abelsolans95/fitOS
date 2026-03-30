"use client";

interface FoodItem {
  name: string;
  portion_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodLogEntry {
  id: string;
  logged_at: string;
  meal_type: string;
  foods: FoodItem[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  source: string;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

interface FoodLogListProps {
  entries: FoodLogEntry[];
}

export function FoodLogList({ entries }: FoodLogListProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-white">Registro de hoy</h2>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
            <svg className="h-6 w-6 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-sm text-[#8B8BA3]">Aun no has registrado ninguna comida hoy</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${entry.source === "ai_vision" ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "bg-[#8B8BA3]/10 text-[#8B8BA3]"}`}>
                  {entry.source === "ai_vision" ? "IA" : "Manual"}
                </span>
                <span className="text-sm font-medium text-white">
                  {MEAL_TYPE_LABELS[entry.meal_type] || entry.meal_type}
                </span>
              </div>
              <span className="text-sm font-bold text-[#00E5FF]">
                {Math.round(Number(entry.total_kcal))} kcal
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {(entry.foods as FoodItem[]).map((food, i) => (
                <p key={i} className="text-xs text-[#8B8BA3]">
                  {food.name} - {food.portion_g}g
                </p>
              ))}
            </div>
            <div className="mt-2 flex gap-3 text-[10px] text-[#8B8BA3]">
              <span>P: {Math.round(Number(entry.total_protein))}g</span>
              <span>C: {Math.round(Number(entry.total_carbs))}g</span>
              <span>G: {Math.round(Number(entry.total_fat))}g</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
