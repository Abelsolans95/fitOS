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
  const [description, setDescription] = useState("Ayúdame a conocerte mejor para diseñar tu plan personalizado");
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadForm = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("onboarding_forms").select("*").eq("trainer_id", user.id)
        .eq("is_active", true).order("created_at", { ascending: false }).limit(1).single();
      if (data) { setFormId(data.id); setTitle(data.title); setDescription(data.description || ""); setFields(data.fields as FormField[]); }
      setLoading(false);
    };
    loadForm();
  }, []);

  const saveForm = useCallback(async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const formData = { trainer_id: user.id, title, description, fields: fields as unknown as Record<string, unknown>[], is_active: true };
    if (formId) {
      await supabase.from("onboarding_forms").update({ ...formData, updated_at: new Date().toISOString() }).eq("id", formId);
    } else {
      await supabase.from("onboarding_forms").update({ is_active: false }).eq("trainer_id", user.id).eq("is_active", true);
      const { data } = await supabase.from("onboarding_forms").insert(formData).select("id").single();
      if (data) setFormId(data.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }, [formId, title, description, fields]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fm-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fm-in { animation: fm-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .fm-1 { animation-delay: 0.04s; } .fm-2 { animation-delay: 0.14s; } .fm-3 { animation-delay: 0.24s; }

        .tab-btn { transition: all 0.2s ease; }
        .save-btn { transition: all 0.25s ease; }
        .save-btn:hover:not(:disabled) {
          box-shadow: 0 0 24px rgba(0,229,255,0.35);
          background: #2BEEFF;
        }
        .form-input { transition: border-color 0.2s ease; }
        .form-input:focus { border-color: rgba(0,229,255,0.4); outline: none; }
      `}</style>

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="fm-in fm-1 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Onboarding</p>
            <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em] text-white">Editor de Formulario</h1>
            <p className="mt-1 text-[13px] text-[#8B8BA3]">Diseña el formulario que rellenarán tus nuevos clientes</p>
          </div>

          <button
            type="button"
            onClick={saveForm}
            disabled={saving}
            className="save-btn flex-shrink-0 flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0F] disabled:opacity-50"
          >
            {saving ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />Guardando...</>
            ) : saved ? (
              <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>¡Guardado!</>
            ) : (
              "Guardar formulario"
            )}
          </button>
        </div>

        {/* ── Tab switcher ── */}
        <div className="fm-in fm-2 flex gap-1 rounded-[14px] border border-white/[0.06] bg-[#12121A] p-1">
          {(["editor", "preview"] as Tab[]).map(t => {
            const active = tab === t;
            const color = t === "editor" ? "#00E5FF" : "#7C3AED";
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="tab-btn flex-1 flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold"
                style={active ? { background: `${color}12`, color } : { color: "#8B8BA3" }}
              >
                {t === "editor" ? (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>Editor</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>Vista previa</>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="fm-in fm-3 rounded-[18px] border border-white/[0.06] bg-[#12121A] p-6">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[18px]"
            style={{ background: tab === "editor" ? "linear-gradient(90deg, #00E5FF, transparent)" : "linear-gradient(90deg, #7C3AED, transparent)" }} />

          {tab === "editor" ? (
            <div className="space-y-6">
              {/* Title & description */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Título del formulario</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} className="form-input border-white/[0.08] bg-[#0A0A0F] text-white focus:border-[#00E5FF]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Descripción (opcional)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} className="form-input border-white/[0.08] bg-[#0A0A0F] text-white focus:border-[#00E5FF]" />
                </div>
              </div>

              {/* Fields count */}
              <div className="flex items-center gap-2">
                <span className="flex h-6 min-w-[28px] items-center justify-center rounded-md bg-[#00E5FF]/10 px-2 text-[11px] font-bold text-[#00E5FF]">
                  {fields.length}
                </span>
                <span className="text-[13px] text-[#8B8BA3]">campos en tu formulario</span>
              </div>

              <FormFieldEditor fields={fields} onFieldsChange={setFields} />
            </div>
          ) : (
            <FormPreview title={title} description={description} fields={fields} />
          )}
        </div>
      </div>
    </>
  );
}
