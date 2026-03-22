"use client";

import { useState, useEffect, useCallback } from "react";
import { FormFieldEditor, type FormField } from "@/components/onboarding/FormFieldEditor";
import { FormPreview } from "@/components/onboarding/FormPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

type Tab = "editor" | "preview";

export default function TrainerFormsPage() {
  const [tab, setTab] = useState<Tab>("editor");
  const [title, setTitle] = useState("Formulario de Onboarding");
  const [description, setDescription] = useState(
    "Ayúdame a conocerte mejor para diseñar tu plan personalizado"
  );
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing form
  useEffect(() => {
    const loadForm = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("onboarding_forms")
        .select("*")
        .eq("trainer_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setFormId(data.id);
        setTitle(data.title);
        setDescription(data.description || "");
        setFields(data.fields as FormField[]);
      }
      setLoading(false);
    };

    loadForm();
  }, []);

  // Auto-save debounced (2s after last change)
  const saveForm = useCallback(async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const formData = {
      trainer_id: user.id,
      title,
      description,
      fields: fields as unknown as Record<string, unknown>[],
      is_active: true,
    };

    if (formId) {
      await supabase
        .from("onboarding_forms")
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq("id", formId);
    } else {
      // Deactivate any previous active forms first
      await supabase
        .from("onboarding_forms")
        .update({ is_active: false })
        .eq("trainer_id", user.id)
        .eq("is_active", true);

      const { data } = await supabase
        .from("onboarding_forms")
        .insert(formData)
        .select("id")
        .single();
      if (data) setFormId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [formId, title, description, fields]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Editor de Formulario</h2>
          <p className="mt-1 text-sm text-[#8B8BA3]">
            Diseña el formulario que rellenarán tus nuevos clientes
          </p>
        </div>
        <button
          type="button"
          onClick={saveForm}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Guardando...
            </>
          ) : saved ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              ¡Guardado!
            </>
          ) : (
            "Guardar formulario"
          )}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-[#12121A] p-1">
        <button
          type="button"
          onClick={() => setTab("editor")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            tab === "editor"
              ? "bg-[#00E5FF]/10 text-[#00E5FF]"
              : "text-[#8B8BA3] hover:text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editor
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            tab === "preview"
              ? "bg-[#7C3AED]/10 text-[#7C3AED]"
              : "text-[#8B8BA3] hover:text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Vista previa
          </span>
        </button>
      </div>

      {/* Content area */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
        {tab === "editor" ? (
          <div className="space-y-6">
            {/* Form title & description */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-[#8B8BA3]">Título del formulario</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-white/[0.08] bg-[#0A0A0F] text-white focus:border-[#00E5FF]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#8B8BA3]">Descripción (opcional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-white/[0.08] bg-[#0A0A0F] text-white focus:border-[#00E5FF]"
                />
              </div>
            </div>

            {/* Fields count */}
            <div className="flex items-center gap-2 text-sm text-[#8B8BA3]">
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-md bg-[#00E5FF]/10 px-1.5 text-xs font-bold text-[#00E5FF]">
                {fields.length}
              </span>
              campos en tu formulario
            </div>

            {/* Field editor */}
            <FormFieldEditor fields={fields} onFieldsChange={setFields} />
          </div>
        ) : (
          <FormPreview title={title} description={description} fields={fields} />
        )}
      </div>
    </div>
  );
}
