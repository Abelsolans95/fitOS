/* ────────────────────────────────────────────
   NumField — DRY helper for number inputs
   (equal mode has 6 identical-styled inputs)
   ──────────────────────────────────────────── */

import { memo } from "react";

interface NumFieldProps {
  label: string;
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  onChange: (v: number | "") => void;
}

export const NumField = memo(function NumField({
  label,
  value,
  min,
  max,
  step,
  placeholder,
  onChange,
}: NumFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? "" : Number(raw));
        }}
        placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl px-2 text-center text-[11px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40"
      />
    </div>
  );
});
