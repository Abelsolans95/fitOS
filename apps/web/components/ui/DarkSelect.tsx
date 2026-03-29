"use client";

import { useState, useEffect, useRef } from "react";

export interface DarkSelectOption {
  value: string;
  label: string;
}

export function DarkSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: DarkSelectOption[];
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

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-left text-[13px] outline-none transition-colors focus:border-[#00E5FF]/40"
      >
        <span className={selectedLabel ? "text-white" : "text-[#5A5A72]"}>
          {selectedLabel ?? placeholder ?? "Seleccionar..."}
        </span>
        <svg className={`h-4 w-4 text-[#5A5A72] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0E0E18]/95 backdrop-blur-xl shadow-xl">
          {placeholder && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="flex w-full px-4 py-2.5 text-left text-[13px] text-[#5A5A72] transition-colors hover:bg-white/[0.04]"
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-white/[0.04] ${
                opt.value === value ? "text-[#00E5FF]" : "text-[#E8E8ED]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
