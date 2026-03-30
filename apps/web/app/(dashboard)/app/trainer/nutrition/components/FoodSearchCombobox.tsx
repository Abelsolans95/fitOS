"use client";

import { useState, useMemo } from "react";
import type { FoodItem } from "../useNutritionPage";

export function FoodSearchCombobox({ foods, onSelect }: { foods: FoodItem[]; onSelect: (f: FoodItem) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return foods.slice(0, 20);
    const q = query.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 20);
  }, [foods, query]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar alimento..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0E0E18]/95 backdrop-blur-xl shadow-lg">
          {filtered.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => { onSelect(food); setQuery(""); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-[#E8E8ED] transition-colors hover:bg-white/[0.04]"
            >
              <span className="truncate">{food.name}</span>
              <span className="ml-2 shrink-0 text-[11px] text-[#8B8BA3]">{food.kcal} kcal/100g</span>
            </button>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
