"use client";

import { useState, useMemo } from "react";
import { type ExerciseItem } from "../types";

interface ExerciseSelectorProps {
  exercises: ExerciseItem[];
  onSelect: (exercise: ExerciseItem) => void;
  onClose: () => void;
}

export default function ExerciseSelector({
  exercises,
  onSelect,
  onClose,
}: ExerciseSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return exercises.slice(0, 30);
    const q = query.toLowerCase();
    return exercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.muscle_group?.toLowerCase().includes(q) ?? false) ||
          (e.category?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 30);
  }, [exercises, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-[13px] font-semibold text-white">Añadir ejercicio</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8BA3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o grupo muscular..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto px-3 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <p className="text-[13px] text-[#8B8BA3]">No se encontraron ejercicios</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    onSelect(exercise);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-white">{exercise.name}</p>
                    <p className="text-[11px] text-[#8B8BA3]">
                      {[exercise.muscle_group, exercise.category].filter(Boolean).join(" · ") || "Sin categoría"}
                    </p>
                  </div>
                  <svg className="ml-2 h-4 w-4 shrink-0 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
