"use client";

import type { FormField } from "./FormFieldEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FormPreviewProps {
  title: string;
  description?: string;
  fields: FormField[];
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-[#8B8BA3]">
          Tu formulario aparecerá aquí cuando añadas campos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">{title || "Formulario de Onboarding"}</h3>
        {description && (
          <p className="mt-1 text-sm text-[#8B8BA3]">{description}</p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm text-[#E8E8ED]">
              {field.label}
              {field.required && <span className="ml-1 text-[#FF1744]">*</span>}
            </Label>

            {/* text */}
            {field.type === "text" && (
              <Input
                disabled
                placeholder={field.placeholder || "Respuesta de texto..."}
                className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/40"
              />
            )}

            {/* textarea */}
            {field.type === "textarea" && (
              <textarea
                disabled
                rows={3}
                placeholder={field.placeholder || "Respuesta detallada..."}
                className="w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2 text-sm text-white placeholder:text-[#8B8BA3]/40"
              />
            )}

            {/* number */}
            {field.type === "number" && (
              <Input
                disabled
                type="number"
                placeholder={field.placeholder || "0"}
                className="w-32 border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/40"
              />
            )}

            {/* select */}
            {field.type === "select" && (
              <div className="space-y-1">
                {(field.options || []).map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0A0A0F] px-3 py-2 text-sm text-[#8B8BA3]">
                    <div className="h-4 w-4 rounded-full border border-white/20" />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {/* multiselect */}
            {field.type === "multiselect" && (
              <div className="space-y-1">
                {(field.options || []).map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0A0A0F] px-3 py-2 text-sm text-[#8B8BA3]">
                    <div className="h-4 w-4 rounded border border-white/20" />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {/* boolean */}
            {field.type === "boolean" && (
              <div className="flex items-center gap-3">
                <Switch disabled />
                <span className="text-sm text-[#8B8BA3]">Sí / No</span>
              </div>
            )}

            {/* scale */}
            {field.type === "scale" && (
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-xs text-[#8B8BA3] transition-colors hover:border-[#00E5FF]/50 hover:text-white"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}

            {/* date */}
            {field.type === "date" && (
              <Input
                disabled
                type="date"
                className="w-48 border-white/[0.08] bg-[#0A0A0F] text-white"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
