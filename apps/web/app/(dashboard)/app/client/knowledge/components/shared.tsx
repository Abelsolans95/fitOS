"use client";

import { memo } from "react";
import type { KnowledgeCategory } from "./types";
import { KNOWLEDGE_CATEGORIES } from "./types";

const CATEGORY_COLORS: Record<KnowledgeCategory, string> = {
  nutricion: "bg-green-500/10 text-green-400 border-green-500/20",
  rutina: "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20",
  lesion: "bg-red-500/10 text-red-400 border-red-500/20",
  tecnica: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suplementacion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  general: "bg-[#8B8BA3]/10 text-[#8B8BA3] border-[#8B8BA3]/20",
};

export const CategoryBadge = memo(function CategoryBadge({ category }: { category: KnowledgeCategory }) {
  const cat = KNOWLEDGE_CATEGORIES.find((c) => c.value === category);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[category]}`}>
      {cat?.label ?? category}
    </span>
  );
});

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="mb-3 h-12 w-12 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
      <p className="text-sm text-[#5A5A72]">{message}</p>
    </div>
  );
}

export { timeAgo } from "@/lib/utils";
