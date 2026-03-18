"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "boolean"
  | "scale"
  | "date";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

const FIELD_TYPE_CONFIG: Record<
  FieldType,
  { label: string; icon: string; color: string; description: string }
> = {
  text: {
    label: "Texto",
    icon: "Aa",
    color: "#00E5FF",
    description: "Campo de texto libre",
  },
  textarea: {
    label: "Texto largo",
    icon: "¶",
    color: "#00E5FF",
    description: "Texto extenso, múltiples líneas",
  },
  number: {
    label: "Número",
    icon: "#",
    color: "#7C3AED",
    description: "Valor numérico",
  },
  select: {
    label: "Selección única",
    icon: "◉",
    color: "#7C3AED",
    description: "Seleccionar una opción",
  },
  multiselect: {
    label: "Selección múltiple",
    icon: "☑",
    color: "#FF9100",
    description: "Seleccionar varias opciones",
  },
  boolean: {
    label: "Sí / No",
    icon: "⊘",
    color: "#00C853",
    description: "Respuesta binaria",
  },
  scale: {
    label: "Escala 1-10",
    icon: "⬥",
    color: "#FF9100",
    description: "Valoración numérica",
  },
  date: {
    label: "Fecha",
    icon: "📅",
    color: "#FF1744",
    description: "Selector de fecha",
  },
};

interface FormFieldEditorProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export function FormFieldEditor({ fields, onFieldsChange }: FormFieldEditorProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const addField = useCallback(
    (type: FieldType) => {
      const config = FIELD_TYPE_CONFIG[type];
      const newField: FormField = {
        id: generateId(),
        type,
        label: `Nueva pregunta (${config.label})`,
        placeholder: "",
        required: false,
        options: type === "select" || type === "multiselect" ? ["Opción 1", "Opción 2"] : undefined,
      };
      onFieldsChange([...fields, newField]);
      setEditingFieldId(newField.id);
    },
    [fields, onFieldsChange]
  );

  const updateField = useCallback(
    (id: string, updates: Partial<FormField>) => {
      onFieldsChange(
        fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    [fields, onFieldsChange]
  );

  const removeField = useCallback(
    (id: string) => {
      onFieldsChange(fields.filter((f) => f.id !== id));
      if (editingFieldId === id) setEditingFieldId(null);
    },
    [fields, onFieldsChange, editingFieldId]
  );

  const moveField = useCallback(
    (index: number, direction: "up" | "down") => {
      const reordered = Array.from(fields);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= reordered.length) return;
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      onFieldsChange(reordered);
    },
    [fields, onFieldsChange]
  );

  return (
    <div className="space-y-6">
      {/* Add field buttons */}
      <div>
        <Label className="mb-3 block text-sm text-[#8B8BA3]">
          Añadir campo
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.entries(FIELD_TYPE_CONFIG) as [FieldType, typeof FIELD_TYPE_CONFIG[FieldType]][]).map(
            ([type, config]) => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#12121A] px-3 py-2 text-xs text-[#8B8BA3] transition-all hover:border-white/20 hover:bg-[#1A1A2E] hover:text-white"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                  style={{ backgroundColor: config.color + "20", color: config.color }}
                >
                  {config.icon}
                </span>
                {config.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Fields list */}
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-3 h-10 w-10 text-[#8B8BA3]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <p className="text-sm text-[#8B8BA3]">
            Añade campos para construir tu formulario de onboarding
          </p>
          <p className="mt-1 text-xs text-[#8B8BA3]/60">
            Tus nuevos clientes rellenarán este formulario al registrarse
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const config = FIELD_TYPE_CONFIG[field.type];
            const isEditing = editingFieldId === field.id;

            return (
              <div
                key={field.id}
                className="rounded-xl border border-white/[0.06] bg-[#12121A]"
              >
                {/* Field header */}
                <div className="flex items-center gap-3 p-3">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveField(index, "up")}
                      disabled={index === 0}
                      className="rounded p-0.5 text-[#8B8BA3]/40 transition-colors hover:text-[#8B8BA3] disabled:opacity-20 disabled:cursor-not-allowed"
                      aria-label="Mover arriba"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(index, "down")}
                      disabled={index === fields.length - 1}
                      className="rounded p-0.5 text-[#8B8BA3]/40 transition-colors hover:text-[#8B8BA3] disabled:opacity-20 disabled:cursor-not-allowed"
                      aria-label="Mover abajo"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>

                  {/* Type badge */}
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-medium"
                    style={{
                      backgroundColor: config.color + "15",
                      color: config.color,
                      border: `1px solid ${config.color}30`,
                    }}
                  >
                    {config.icon} {config.label}
                  </Badge>

                  {/* Field label */}
                  <span className="flex-1 truncate text-sm text-white">
                    {field.label}
                  </span>

                  {/* Required indicator */}
                  {field.required && (
                    <span className="text-xs text-[#FF1744]">Obligatorio</span>
                  )}

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => setEditingFieldId(isEditing ? null : field.id)}
                    className="rounded-md p-1 text-[#8B8BA3] transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="rounded-md p-1 text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>

                {/* Editing panel */}
                {isEditing && (
                  <div className="border-t border-white/[0.06] p-4 space-y-4">
                    {/* Label */}
                    <div className="space-y-1">
                      <Label className="text-xs text-[#8B8BA3]">Pregunta</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="border-white/[0.08] bg-[#0A0A0F] text-white focus:border-[#00E5FF]"
                        placeholder="Escribe la pregunta..."
                      />
                    </div>

                    {/* Placeholder */}
                    {(field.type === "text" || field.type === "textarea" || field.type === "number") && (
                      <div className="space-y-1">
                        <Label className="text-xs text-[#8B8BA3]">Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="border-white/[0.08] bg-[#0A0A0F] text-white focus:border-[#00E5FF]"
                          placeholder="Texto de ayuda..."
                        />
                      </div>
                    )}

                    {/* Options (select / multiselect) */}
                    {(field.type === "select" || field.type === "multiselect") && (
                      <div className="space-y-2">
                        <Label className="text-xs text-[#8B8BA3]">Opciones</Label>
                        {(field.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])];
                                newOptions[optIdx] = e.target.value;
                                updateField(field.id, { options: newOptions });
                              }}
                              className="border-white/[0.08] bg-[#0A0A0F] text-sm text-white focus:border-[#00E5FF]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = (field.options || []).filter((_, i) => i !== optIdx);
                                updateField(field.id, { options: newOptions });
                              }}
                              className="rounded p-1 text-[#8B8BA3] hover:text-[#FF1744]"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => updateField(field.id, {
                            options: [...(field.options || []), `Opción ${(field.options || []).length + 1}`],
                          })}
                          className="text-xs text-[#00E5FF] hover:text-[#00E5FF]/80"
                        >
                          + Añadir opción
                        </button>
                      </div>
                    )}

                    {/* Required toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-[#8B8BA3]">Campo obligatorio</Label>
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
