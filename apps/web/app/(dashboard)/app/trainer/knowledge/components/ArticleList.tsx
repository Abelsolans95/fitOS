"use client";

import { memo, useState } from "react";
import type { KnowledgeArticle, KnowledgeCategory } from "./types";
import { KNOWLEDGE_CATEGORIES } from "./types";
import { CategoryBadge, EmptyState, timeAgo } from "./shared";

interface ArticleListProps {
  articles: KnowledgeArticle[];
  filterCategory: KnowledgeCategory | "all";
  filterPublished: "all" | "published" | "draft";
  searchQuery: string;
  onEdit: (article: KnowledgeArticle) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, current: boolean) => void;
  onSetCategory: (cat: KnowledgeCategory | "all") => void;
  onSetPublished: (filter: "all" | "published" | "draft") => void;
  onSetSearch: (q: string) => void;
}

const PUBLISH_FILTERS: { key: "all" | "published" | "draft"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "draft", label: "Borradores" },
];

export const ArticleList = memo(function ArticleList({
  articles,
  filterCategory,
  filterPublished,
  searchQuery,
  onEdit,
  onDelete,
  onTogglePublish,
  onSetCategory,
  onSetPublished,
  onSetSearch,
}: ArticleListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSetSearch(e.target.value)}
          placeholder="Buscar artículos..."
          className="flex-1 min-w-[200px] rounded-lg border border-white/[0.06] bg-[#12121A] px-3 py-2 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
        />
        <select
          value={filterCategory}
          onChange={(e) => onSetCategory(e.target.value as KnowledgeCategory | "all")}
          className="rounded-lg border border-white/[0.06] bg-[#12121A] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">Categoría</option>
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Publish filter tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-[#12121A] p-1">
        {PUBLISH_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onSetPublished(f.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filterPublished === f.key
                ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                : "text-[#5A5A72] hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {articles.length === 0 ? (
        <EmptyState message="No hay artículos que coincidan" />
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 transition-all hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-white">{article.title}</h3>
                    <CategoryBadge category={article.category} />
                    {article.is_published ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                        Publicado
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#5A5A72]/20 px-2 py-0.5 text-[10px] font-semibold text-[#5A5A72]">
                        Borrador
                      </span>
                    )}
                    {article.source_ticket_id && (
                      <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
                        De consulta
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[#8B8BA3]">{article.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-[#5A5A72]">
                    <span>{timeAgo(article.created_at)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      {article.view_count}
                    </span>
                    {article.video_url && (
                      <>
                        <span>·</span>
                        <span className="text-[#00E5FF]">Video</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onTogglePublish(article.id, article.is_published)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      article.is_published
                        ? "text-green-400 hover:bg-green-500/10"
                        : "text-[#5A5A72] hover:bg-white/5"
                    }`}
                    title={article.is_published ? "Despublicar" : "Publicar"}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit(article)}
                    className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:bg-white/5 hover:text-white"
                    title="Editar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDeleteId === article.id) {
                        onDelete(article.id);
                        setConfirmDeleteId(null);
                      } else {
                        setConfirmDeleteId(article.id);
                      }
                    }}
                    onBlur={() => setConfirmDeleteId(null)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      confirmDeleteId === article.id
                        ? "bg-red-500/10 text-red-400"
                        : "text-[#5A5A72] hover:bg-red-500/10 hover:text-red-400"
                    }`}
                    title={confirmDeleteId === article.id ? "Confirmar eliminación" : "Eliminar"}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
