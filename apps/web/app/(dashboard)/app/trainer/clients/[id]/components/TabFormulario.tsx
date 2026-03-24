"use client";

import { OnboardingResponse, FormField } from "./types";
import { EmptyState, formatDate } from "./shared";

function formatResponseValue(value: unknown, fieldType?: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (fieldType === "scale") return `${value} / 10`;
  return String(value);
}

export function TabFormulario({ responses }: { responses: OnboardingResponse[] }) {
  if (responses.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
        }
        title="Sin formulario completado"
        description="Este cliente aún no ha completado ningún formulario"
      />
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((resp) => {
        const fieldMap: Record<string, FormField> = {};
        for (const f of resp.form?.fields ?? []) {
          fieldMap[f.id] = f;
        }

        const entries = Object.entries(resp.responses ?? {});

        return (
          <div key={resp.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                {resp.form?.title ?? "Formulario de onboarding"}
              </h4>
              <p className="text-xs text-[#8B8BA3]">{formatDate(resp.created_at)}</p>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-[#8B8BA3]">Sin respuestas registradas</p>
            ) : (
              <div className="space-y-3">
                {entries.map(([fieldId, value]) => {
                  const field = fieldMap[fieldId];
                  return (
                    <div key={fieldId} className="flex flex-col gap-0.5">
                      <p className="text-xs font-medium text-[#8B8BA3]">{field?.label ?? fieldId}</p>
                      {field?.type === "multiselect" && Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(value as string[]).map((v) => (
                            <span
                              key={v}
                              className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED]"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#E8E8ED]">
                          {formatResponseValue(value, field?.type)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {resp.ai_analysis ? (
              <div className="mt-4 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
                <p className="mb-1 text-xs font-semibold text-[#7C3AED]">Análisis IA</p>
                <p className="text-sm leading-relaxed text-[#E8E8ED]">{resp.ai_analysis}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.04] px-4 py-3">
                <p className="text-xs text-[#8B8BA3]">Análisis IA pendiente</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
