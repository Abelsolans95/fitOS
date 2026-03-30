"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = Math.min(240, options.length * 40 + 16);
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleClose = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const handleScroll = () => { updatePosition(); };
    const handleResize = () => { updatePosition(); };

    document.addEventListener("mousedown", handleClose);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePosition]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="max-h-60 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0E0E18]/95 backdrop-blur-xl shadow-xl"
    >
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
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
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
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
