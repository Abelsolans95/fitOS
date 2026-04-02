"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useKnowledgePage } from "./useKnowledgePage";
import { ArticleList } from "./components/ArticleList";
import { ArticleEditor } from "./components/ArticleEditor";
import type { KnowledgeCategory } from "./components/types";

const VALID_CATEGORIES = ["nutricion", "rutina", "lesion", "tecnica", "suplementacion", "general"];

function KnowledgePageInner() {
  const searchParams = useSearchParams();
  const initRef = useRef(false);
  const {
    state,
    dispatch,
    filteredArticles,
    handleSave,
    handleDelete,
    handleTogglePublish,
  } = useKnowledgePage();

  // Handle ticket-to-article conversion via query params
  useEffect(() => {
    if (initRef.current || state.loading) return;
    const fromTicket = searchParams.get("from_ticket");
    if (!fromTicket) return;
    initRef.current = true;

    const title = searchParams.get("title") ?? "";
    const category = searchParams.get("category") ?? "general";

    // Fetch ticket description + replies to compose article content
    const supabase = createClient();
    (async () => {
      const [ticketRes, repliesRes] = await Promise.all([
        supabase
          .from("support_tickets")
          .select("description, trainer_id")
          .eq("id", fromTicket)
          .single(),
        supabase
          .from("ticket_replies")
          .select("content, sender_id")
          .eq("ticket_id", fromTicket)
          .order("created_at", { ascending: true })
          .limit(50),
      ]);

      // Build content from ticket description + trainer replies
      const trainerId = ticketRes.data?.trainer_id;
      let content = "";
      if (ticketRes.data?.description) {
        content += `Pregunta del cliente:\n${ticketRes.data.description}\n`;
      }

      const trainerReplies = (repliesRes.data ?? []).filter(
        (r) => r.sender_id === trainerId
      );
      if (trainerReplies.length > 0) {
        content += "\nRespuesta:\n";
        content += trainerReplies.map((r) => r.content).join("\n\n");
      }

      dispatch({
        type: "SET_EDITING",
        payload: {
          title,
          content: content.trim(),
          category: (VALID_CATEGORIES.includes(category) ? category : "general") as KnowledgeCategory,
          source_ticket_id: fromTicket,
          is_published: false,
        },
      });
    })();
  }, [state.loading, searchParams, dispatch]);

  if (state.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Base de Conocimiento</h1>
          <p className="mt-1 text-sm text-[#5A5A72]">
            Crea artículos con respuestas a dudas frecuentes. Tus clientes los ven antes de preguntar.
          </p>
        </div>
        {!state.editingArticle && (
          <button
            onClick={() =>
              dispatch({
                type: "SET_EDITING",
                payload: { title: "", content: "", category: "general", is_published: false },
              })
            }
            className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo artículo
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">Total</p>
          <p className="mt-1 text-2xl font-black text-white">{state.articles.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">Publicados</p>
          <p className="mt-1 text-2xl font-black text-green-400">
            {state.articles.filter((a) => a.is_published).length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72]">Visualizaciones</p>
          <p className="mt-1 text-2xl font-black text-[#00E5FF]">
            {state.articles.reduce((sum, a) => sum + a.view_count, 0)}
          </p>
        </div>
      </div>

      {/* Editor or List */}
      {state.editingArticle ? (
        <ArticleEditor
          article={state.editingArticle}
          saving={state.saving}
          onUpdateField={(fields) => dispatch({ type: "UPDATE_EDITING_FIELD", payload: fields })}
          onSave={handleSave}
          onCancel={() => dispatch({ type: "SET_EDITING", payload: null })}
        />
      ) : (
        <ArticleList
          articles={filteredArticles}
          filterCategory={state.filterCategory}
          filterPublished={state.filterPublished}
          searchQuery={state.searchQuery}
          onEdit={(article) => dispatch({ type: "SET_EDITING", payload: article })}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
          onSetCategory={(cat) => dispatch({ type: "SET_FILTER_CATEGORY", payload: cat })}
          onSetPublished={(f) => dispatch({ type: "SET_FILTER_PUBLISHED", payload: f })}
          onSetSearch={(q) => dispatch({ type: "SET_SEARCH", payload: q })}
        />
      )}
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      }
    >
      <KnowledgePageInner />
    </Suspense>
  );
}
