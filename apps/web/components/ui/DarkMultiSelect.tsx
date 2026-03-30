"use client";

import { useState, useEffect, useRef } from "react";

export interface DarkMultiSelectOption {
  value: string;
  label: string;
}

export function DarkMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: DarkMultiSelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[40px] w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-left text-[13px] outline-none transition-colors focus:border-[#00E5FF]/40"
      >
        <div className="flex flex-wrap gap-1 pr-2">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label, idx) => (
              <span key={idx} className="inline-flex items-center rounded-md bg-[#00E5FF]/10 px-2 py-0.5 text-[11px] font-medium text-[#00E5FF]">
                {label}
              </span>
            ))
          ) : (
            <span className="text-[#5A5A72]">{placeholder ?? "Seleccionar..."}</span>
          )}
        </div>
        <svg className={`h-4 w-4 shrink-0 text-[#5A5A72] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0E0E18]/95 backdrop-blur-xl shadow-xl">
          {options.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleOption(opt.value);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-white/[0.04] ${
                  isSelected ? "text-[#00E5FF]" : "text-[#E8E8ED]"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg className="h-4 w-4 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
