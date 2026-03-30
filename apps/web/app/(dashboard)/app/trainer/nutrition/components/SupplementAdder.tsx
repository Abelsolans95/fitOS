"use client";

import { useState } from "react";
import type { Supplement } from "../useNutritionPage";

export function SupplementAdder({ onAdd }: { onAdd: (s: Supplement) => void }) {
  const [name, setName] = useState("");
  const [timing, setTiming] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), timing: timing.trim() || undefined });
    setName(""); setTiming("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="Suplemento (ej: Creatina)"
        className="h-8 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-[12px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#FF9100]/40 transition-colors"
      />
      <input
        type="text"
        value={timing}
        onChange={(e) => setTiming(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="Momento (opcional)"
        className="h-8 w-32 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-[12px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#FF9100]/40 transition-colors"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#FF9100]/30 bg-[#FF9100]/10 text-[#FF9100] transition-all hover:bg-[#FF9100]/20"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
