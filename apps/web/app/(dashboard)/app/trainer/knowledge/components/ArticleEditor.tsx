"use client";

import { memo } from "react";
import type { KnowledgeArticle, KnowledgeCategory } from "./types";
import { KNOWLEDGE_CATEGORIES } from "./types";

interface ArticleEditorProps {
  article: Partial<KnowledgeArticle>;
  saving: boolean;
  onUpdateField: (fields: Partial<KnowledgeArticle>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ArticleEditor = memo(function ArticleEditor({
  article,
  saving,
  onUpdateField,
  onSave,
  onCancel,
}: ArticleEditorProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
      <h2 className="mb-4 text-lg font-bold text-white">
        {article.id ? "Editar artículo" : "Nuevo artículo"}
      </h2>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">
            Título
          </label>
          <input
            type="text"
            value={article.title ?? ""}
            onChange={(e) => onUpdateField({ title: e.target.value })}
            placeholder="Ej: Cómo hacer peso muerto correctamente"
            maxLength={200}
            className="w-full rounded-lg border border-white/10 bg-[#0A0A0F] px-3 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">
            Categoría
          </label>
          <div className="flex flex-wrap gap-2">
            {KNOWLEDGE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onUpdateField({ category: cat.value })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  article.category === cat.value
                    ? "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
                    : "border-white/10 text-[#5A5A72] hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">
            Contenido
          </label>
          <textarea
            value={article.content ?? ""}
            onChange={(e) => onUpdateField({ content: e.target.value })}
            placeholder="Escribe el contenido del artículo..."
            rows={12}
            className="w-full resize-y rounded-lg border border-white/10 bg-[#0A0A0F] px-3 py-2.5 text-sm leading-relaxed text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
          />
        </div>

        {/* Video URL */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">
            URL de video (opcional)
          </label>
          <input
            type="url"
            value={article.video_url ?? ""}
            onChange={(e) => onUpdateField({ video_url: e.target.value || null })}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-lg border border-white/10 bg-[#0A0A0F] px-3 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
          />
        </div>

        {/* Publish toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdateField({ is_published: !article.is_published })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              article.is_published ? "bg-green-500" : "bg-[#5A5A72]/30"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                article.is_published ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm text-[#8B8BA3]">
            {article.is_published ? "Publicado — visible para clientes" : "Borrador — solo visible para ti"}
          </span>
        </div>

        {/* Source ticket badge */}
        {article.source_ticket_id && (
          <div className="rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-3 py-2 text-xs text-[#7C3AED]">
            Este artículo fue creado a partir de una consulta de cliente
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-[#8B8BA3] transition-colors hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || !article.title?.trim() || !article.content?.trim() || !article.category}
            className="rounded-xl bg-[#00E5FF] px-6 py-2 text-sm font-semibold text-[#0A0A0F] transition-opacity disabled:opacity-50"
          >
            {saving ? "Guardando..." : article.id ? "Actualizar" : "Crear artículo"}
          </button>
        </div>
      </div>
    </div>
  );
});
