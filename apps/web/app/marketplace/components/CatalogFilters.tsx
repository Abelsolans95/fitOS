"use client";

import { MARKETPLACE_CATEGORIES } from "./types";

interface CatalogFiltersProps {
  search: string;
  category: string;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}

export function CatalogFilters({
  search,
  category,
  onSearchChange,
  onCategoryChange,
}: CatalogFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5A72]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar rutinas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 text-[13px] text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange("")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            category === ""
              ? "bg-[#00E5FF] text-[#0A0A0F]"
              : "border border-white/[0.08] text-[#8B8BA3] hover:text-white"
          }`}
        >
          Todas
        </button>
        {MARKETPLACE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(cat.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              category === cat.value
                ? "bg-[#00E5FF] text-[#0A0A0F]"
                : "border border-white/[0.08] text-[#8B8BA3] hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
