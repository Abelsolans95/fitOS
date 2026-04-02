"use client";

import { Label } from "@/components/ui/label";
import { DynamicField } from "./DynamicField";
import { Spinner } from "./Shared";
import type { OnboardingForm, TrainerInfo, Responses, FormField } from "./types";
import type { SectionGroup } from "@fitos/shared";

interface StepDynamicFormProps {
  trainer: TrainerInfo | null;
  form: OnboardingForm | null;
  responses: Responses;
  errors: Record<string, string>;
  pageError: string | null;
  submitting: boolean;
  onUpdateResponse: (fieldId: string, val: string | number | boolean | string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  /** If provided, render only this section's fields */
  sectionGroup?: SectionGroup;
  /** Whether this is the first step (hides back button) */
  isFirstStep?: boolean;
}

export function StepDynamicForm({
  trainer,
  form,
  responses,
  errors,
  pageError,
  submitting,
  onUpdateResponse,
  onNext,
  onBack,
  sectionGroup,
  isFirstStep,
}: StepDynamicFormProps) {
  // Determine which fields to render
  const fields: FormField[] = sectionGroup
    ? (sectionGroup.fields as FormField[])
    : form?.fields.filter((f) => f.type !== "section") ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      {sectionGroup?.section ? (
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#7C3AED]">
            {sectionGroup.section.label}
          </h2>
          {sectionGroup.section.description && (
            <p className="mt-1 text-xs text-[#8B8BA3]">
              {sectionGroup.section.description}
            </p>
          )}
        </div>
      ) : trainer ? (
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">
            Formulario de{" "}
            <span className="text-[#00E5FF]">{trainer.full_name}</span>
          </h2>
          <p className="mt-1 text-xs text-[#8B8BA3]">
            Tu entrenador necesita esta informacion para personalizar tu plan.
          </p>
        </div>
      ) : null}

      {/* No form case */}
      {!form && !sectionGroup && (
        <div className="rounded-xl border border-white/[0.08] bg-[#1A1A2E]/50 p-6 text-center">
          <div className="mb-3 flex justify-center">
            <svg
              className="h-10 w-10 text-[#8B8BA3]/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <p className="text-sm text-[#8B8BA3]">
            Tu entrenador aun no ha configurado un formulario de onboarding.
          </p>
          <p className="mt-1 text-xs text-[#8B8BA3]/60">
            Puedes continuar al siguiente paso.
          </p>
        </div>
      )}

      {/* Dynamic fields */}
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label className="text-[#8B8BA3]">
            {field.label}
            {field.required && (
              <span className="ml-1 text-[#FF1744]">*</span>
            )}
          </Label>
          <DynamicField
            field={field}
            value={responses[field.id]}
            onChange={(val) => onUpdateResponse(field.id, val)}
            error={errors[field.id]}
          />
          {errors[field.id] && (
            <p className="text-xs text-[#FF1744]">{errors[field.id]}</p>
          )}
        </div>
      ))}

      {/* Error banner */}
      {pageError && (
        <div className="rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
          {pageError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {onBack && !isFirstStep ? (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-[#8B8BA3] transition-all duration-200 hover:border-white/20 hover:bg-[#1A1A2E] hover:text-white disabled:opacity-40"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            Anterior
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-3 text-sm font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Spinner />
              Guardando...
            </>
          ) : (
            <>
              Siguiente
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
