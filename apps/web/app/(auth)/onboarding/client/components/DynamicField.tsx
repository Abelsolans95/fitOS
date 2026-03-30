"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { FormField } from "./types";

export function DynamicField({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: string | number | boolean | string[] | undefined;
  onChange: (val: string | number | boolean | string[]) => void;
  error?: string;
}) {
  const inputClasses =
    "border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20";

  switch (field.type) {
    case "text":
      return (
        <Input
          type="text"
          placeholder={field.placeholder || ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
        />
      );

    case "textarea":
      return (
        <textarea
          placeholder={field.placeholder || ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2 text-sm text-white placeholder:text-[#8B8BA3]/50 outline-none transition-colors focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 resize-none`}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder || ""}
          value={value !== undefined && value !== "" ? String(value) : ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : Number(v));
          }}
          className={inputClasses}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClasses} [color-scheme:dark]`}
        />
      );

    case "select":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl border p-3 text-left text-sm transition-all duration-200 ${
                value === option
                  ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                  : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    value === option
                      ? "border-[#00E5FF] bg-[#00E5FF]"
                      : "border-white/20"
                  }`}
                >
                  {value === option && (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#0A0A0F]" />
                  )}
                </div>
                {option}
              </div>
            </button>
          ))}
        </div>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange(
                    isSelected
                      ? selected.filter((s) => s !== option)
                      : [...selected, option]
                  )
                }
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
                  isSelected
                    ? "border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED]"
                    : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    case "boolean":
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={!!value}
            onCheckedChange={(val) => onChange(val)}
            className="data-[state=checked]:bg-[#00E5FF]"
          />
          <span className="text-sm text-[#8B8BA3]">
            {value ? "Si" : "No"}
          </span>
        </div>
      );

    case "scale":
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => {
            const n = i + 1;
            const isSelected = value === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-[#00E5FF] text-[#0A0A0F] shadow-[0_0_12px_rgba(0,229,255,0.25)]"
                    : "border border-white/[0.08] text-[#8B8BA3] hover:border-[#00E5FF]/40 hover:bg-[#1A1A2E]"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}
