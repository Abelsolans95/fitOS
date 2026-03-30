"use client";

interface FoodItem {
  name: string;
  portion_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MEAL_TYPES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "snack", label: "Snack" },
] as const;

interface AddFoodModalProps {
  analyzedFoods: FoodItem[];
  selectedMealType: string;
  saving: boolean;
  onMealTypeChange: (type: string) => void;
  onPortionChange: (index: number, portion: number) => void;
  onSave: () => void;
}

export function AddFoodModal({
  analyzedFoods,
  selectedMealType,
  saving,
  onMealTypeChange,
  onPortionChange,
  onSave,
}: AddFoodModalProps) {
  if (analyzedFoods.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-white">Alimentos detectados</h2>

      {analyzedFoods.map((food, index) => (
        <div key={index} className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white">{food.name}</p>
              <p className="mt-0.5 text-xs text-[#8B8BA3]">{food.portion_g}g</p>
            </div>
            <span className="text-lg font-bold text-[#00E5FF]">
              {food.kcal}
              <span className="text-xs font-normal text-[#8B8BA3]"> kcal</span>
            </span>
          </div>

          <div className="mt-3 flex gap-4">
            <div className="flex-1 rounded-lg bg-white/[0.02] px-3 py-2 text-center">
              <p className="text-xs font-bold text-[#00E5FF]">{food.protein}g</p>
              <p className="text-[10px] text-[#8B8BA3]">Proteina</p>
            </div>
            <div className="flex-1 rounded-lg bg-white/[0.02] px-3 py-2 text-center">
              <p className="text-xs font-bold text-[#FF9100]">{food.carbs}g</p>
              <p className="text-[10px] text-[#8B8BA3]">Carbos</p>
            </div>
            <div className="flex-1 rounded-lg bg-white/[0.02] px-3 py-2 text-center">
              <p className="text-xs font-bold text-[#7C3AED]">{food.fat}g</p>
              <p className="text-[10px] text-[#8B8BA3]">Grasa</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#8B8BA3]">Porcion</label>
              <span className="text-xs font-medium text-white">{food.portion_g}g</span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={food.portion_g}
              onChange={(e) => onPortionChange(index, Number(e.target.value))}
              className="mt-1 w-full accent-[#00E5FF]"
            />
          </div>
        </div>
      ))}

      {/* Meal type selector */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-4">
        <p className="mb-3 text-sm font-medium text-white">Tipo de comida</p>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.value}
              type="button"
              onClick={() => onMealTypeChange(mt.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                selectedMealType === mt.value
                  ? "bg-[#00E5FF] text-[#0A0A0F]"
                  : "bg-white/[0.04] text-[#8B8BA3] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {mt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] py-3.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-60"
      >
        {saving ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
            Guardando...
          </>
        ) : (
          "Guardar en registro"
        )}
      </button>
    </div>
  );
}
