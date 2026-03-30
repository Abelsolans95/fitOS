"use client";

import { FormPreview } from "@/components/onboarding/FormPreview";
import type { FormField } from "@/components/onboarding/FormFieldEditor";

interface StepPreviewProps {
  formTitle: string;
  formDescription: string;
  formFields: FormField[];
}

export function StepPreview({
  formTitle,
  formDescription,
  formFields,
}: StepPreviewProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-6">
      <FormPreview
        title={formTitle}
        description={formDescription}
        fields={formFields}
      />
    </div>
  );
}
