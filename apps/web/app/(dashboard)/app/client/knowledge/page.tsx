"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useClientKnowledgePage } from "./useClientKnowledgePage";
import { KNOWLEDGE_CATEGORIES } from "./components/types";
import { CategoryBadge, EmptyState, timeAgo } from "./components/shared";
import { ArticleDetail } from "./components/ArticleDetail";

function ClientKnowledgeInner() {
  const searchParams = useSearchParams();
  const initRef = useRef(false);
  const {
    state,
    dispatch,
    filteredArticles,
    selectedArticle,
    handleSelectArticle,
  } = useClientKnowledgePage();

  // Handle deep link from ticket creation: ?article=<id>
  useEffect(() => {
    if (initRef.current || state.loading) return;
    const articleId = searchParams.get("article");
    if (articleId) {
      initRef.current = true;
      handleSelectArticle(articleId);
    }
  }, [state.loading, searchParams, handleSelectArticle]);

  if (state.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  // Detail view
  if (selectedArticle) {
    return (
      <div className="p-6">
        <ArticleDetail
          article={selectedArticle}
          onBack={() => handleSelectArticle(null)}
        />
      </div>
    );
  }

  // Browse view
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Base de Conocimiento</h1>
        <p className="mt-1 text-sm text-[#5A5A72]">
          Artículos y guías de tu entrenador. Busca aquí antes de preguntar.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={state.searchQuery}
        onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
        placeholder="Buscar artículos..."
        className="w-full rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => dispatch({ type: "SET_FILTER_CATEGORY", payload: "all" })}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            state.filterCategory === "all"
              ? "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
              : "border-white/[0.06] text-[#5A5A72] hover:text-white"
          }`}
        >
          Todos
        </button>
        {KNOWLEDGE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => dispatch({ type: "SET_FILTER_CATEGORY", payload: cat.value })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              state.filterCategory === cat.value
                ? "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
                : "border-white/[0.06] text-[#5A5A72] hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      {filteredArticles.length === 0 ? (
        <EmptyState message={state.searchQuery ? "No hay artículos que coincidan con tu búsqueda" : "Tu entrenador aún no ha publicado artículos"} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => handleSelectArticle(article.id)}
              className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4 text-left transition-all hover:border-[#00E5FF]/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.05)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <CategoryBadge category={article.category} />
                {article.video_url && (
                  <span className="rounded-full bg-[#00E5FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00E5FF]">
                    Video
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white">{article.title}</h3>
              <p className="mt-1 line-clamp-3 text-xs text-[#8B8BA3]">{article.content}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-[#5A5A72]">
                <span>{timeAgo(article.created_at)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  {article.view_count}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientKnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      }
    >
      <ClientKnowledgeInner />
    </Suspense>
  );
}
