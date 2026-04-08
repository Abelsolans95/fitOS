"use client";

import { DarkSelect } from "@/components/ui/DarkSelect";
import { MARKETPLACE_CATEGORIES } from "@/app/marketplace/components/types";
import { type RoutineOption, type PublishFormData } from "./types";

interface PublishFormProps {
  form: PublishFormData;
  routines: RoutineOption[];
  saving: boolean;
  onUpdateField: (fields: Partial<PublishFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PublishForm({
  form,
  routines,
  saving,
  onUpdateField,
  onSubmit,
  onCancel,
}: PublishFormProps) {
  const routineOptions = routines.map((r) => ({
    value: r.id,
    label: `${r.title}${r.goal ? ` (${r.goal})` : ""}`,
  }));

  const categoryOptions = MARKETPLACE_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const selectedRoutine = routines.find((r) => r.id === form.routine_id);

  const canSubmit =
    form.routine_id &&
    form.title.trim() &&
    form.description.trim() &&
    form.category &&
    !saving;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6">
      <h2 className="mb-6 text-lg font-bold text-white">
        Publicar rutina en el Marketplace
      </h2>

      <div className="space-y-5">
        {/* Routine selection */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">
            Rutina base
          </label>
          <DarkSelect
            value={form.routine_id}
            onChange={(v) => {
              onUpdateField({ routine_id: v });
              // Auto-fill title from routine
              const routine = routines.find((r) => r.id === v);
              if (routine && !form.title.trim()) {
                onUpdateField({ title: routine.title });
              }
            }}
            options={routineOptions}
            placeholder="Seleccionar rutina..."
          />
          {selectedRoutine && (
            <p className="mt-1.5 text-xs text-[#5A5A72]">
              {selectedRoutine.total_weeks ?? 4} semanas
              {selectedRoutine.training_days
                ? ` - ${selectedRoutine.training_days.length} dias/semana`
                : ""}
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">
            Titulo del producto
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onUpdateField({ title: e.target.value })}
            placeholder="Ej: PPL Hipertrofia 12 Semanas"
            maxLength={200}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">
            Descripcion
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onUpdateField({ description: e.target.value })}
            placeholder="Describe tu rutina: para quien es, que resultados pueden esperar, que incluye..."
            maxLength={5000}
            rows={5}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-[13px] text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">
            Categoria
          </label>
          <DarkSelect
            value={form.category}
            onChange={(v) => onUpdateField({ category: v })}
            options={categoryOptions}
            placeholder="Seleccionar categoria..."
          />
        </div>

        {/* Price */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">
            Precio (EUR)
          </label>
          <div className="relative">
            <input
              type="number"
              value={form.price_cents > 0 ? (form.price_cents / 100).toFixed(2) : ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateField({
                  price_cents: isNaN(val) ? 0 : Math.max(0, Math.round(val * 100)),
                });
              }}
              placeholder="0.00 = Gratis"
              step="0.01"
              min="0"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 pr-10 text-[13px] text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5A5A72]">
              EUR
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5A5A72]">
            Deja en 0 para ofrecer la rutina gratis. Comision Kuvox: 15-20% por venta.
          </p>
        </div>

        {/* Cover image URL */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5A72]">
            URL imagen de portada (opcional)
          </label>
          <input
            type="url"
            value={form.cover_image_url}
            onChange={(e) => onUpdateField({ cover_image_url: e.target.value })}
            placeholder="https://..."
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Publicando..." : "Enviar a revision"}
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/[0.08] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.04]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
