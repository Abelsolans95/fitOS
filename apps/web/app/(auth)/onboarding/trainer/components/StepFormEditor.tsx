"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldEditor, type FormField } from "@/components/onboarding/FormFieldEditor";
import { FormPreview } from "@/components/onboarding/FormPreview";
import { getOnboardingSectionsTemplate } from "@/lib/onboarding-templates";

interface StepFormEditorProps {
  formTitle: string;
  setFormTitle: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formFields: FormField[];
  setFormFields: (fields: FormField[]) => void;
  formTab: "editor" | "preview";
  setFormTab: (tab: "editor" | "preview") => void;
}

export function StepFormEditor({
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formFields,
  setFormFields,
  formTab,
  setFormTab,
}: StepFormEditorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Formulario de onboarding
        </h2>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Crea el formulario que tus nuevos clientes completaran al registrarse contigo.
        </p>
      </div>

      {/* Form title & description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="formTitle" className="text-[#8B8BA3]">
            Titulo del formulario <span className="text-[#FF1744]">*</span>
          </Label>
          <Input
            id="formTitle"
            type="text"
            placeholder="Ej: Formulario de Bienvenida"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
            className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="formDesc" className="text-[#8B8BA3]">
            Descripcion <span className="text-[#8B8BA3]/50">(opcional)</span>
          </Label>
          <textarea
            id="formDesc"
            rows={2}
            placeholder="Un mensaje de bienvenida para tus clientes..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2.5 text-sm text-white placeholder:text-[#8B8BA3]/50 transition-colors outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 resize-none"
          />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg bg-[#0A0A0F] p-1">
        <button
          type="button"
          onClick={() => setFormTab("editor")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            formTab === "editor"
              ? "bg-[#1A1A2E] text-[#00E5FF] shadow-sm"
              : "text-[#8B8BA3] hover:text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            Editor
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFormTab("preview")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            formTab === "preview"
              ? "bg-[#1A1A2E] text-[#7C3AED] shadow-sm"
              : "text-[#8B8BA3] hover:text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            Vista previa
          </span>
        </button>
      </div>

      {/* Editor or Preview */}
      <div className="min-h-[280px]">
        {formTab === "editor" ? (
          <FormFieldEditor
            fields={formFields}
            onFieldsChange={setFormFields}
          />
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-6">
            <FormPreview
              title={formTitle}
              description={formDescription}
              fields={formFields}
            />
          </div>
        )}
      </div>

      {/* Template loader + field count hint */}
      {formFields.length === 0 && (
        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={() => setFormFields(getOnboardingSectionsTemplate())}
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-5 py-2.5 text-sm font-semibold text-[#7C3AED] transition-all hover:bg-[#7C3AED]/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Cargar plantilla de secciones
          </button>
          <p className="text-xs text-[#8B8BA3]/60">
            5 secciones con preguntas sugeridas — puedes personalizarlas
          </p>
          <p className="text-xs text-[#FF1744]/70">
            O anade campos manualmente (necesitas al menos 1 para continuar)
          </p>
        </div>
      )}
    </div>
  );
}
