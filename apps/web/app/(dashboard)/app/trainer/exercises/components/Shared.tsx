"use client";

export function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <span className="inline-flex items-center rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#00E5FF] uppercase tracking-[0.15em]">
      {label}
    </span>
  );
}

export function OwnershipBadge({ isGlobal }: { isGlobal: boolean }) {
  return isGlobal ? (
    <span className="inline-flex items-center rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#00E5FF] uppercase tracking-[0.15em]">
      Global
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#7C3AED] uppercase tracking-[0.15em]">
      Propio
    </span>
  );
}

export function PillFilter<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              active
                ? "rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/25 text-[#00E5FF] text-[11px] font-bold px-3 py-1 transition-all"
                : "rounded-full border border-white/[0.08] text-[#8B8BA3] text-[11px] px-3 py-1 hover:border-white/[0.16] hover:text-white transition-all"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
