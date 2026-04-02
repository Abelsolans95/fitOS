"use client";

import { useReducer, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { KnowledgeArticle, KnowledgeCategory } from "./components/types";

// ── State ──

interface State {
  loading: boolean;
  trainerId: string | null;
  clientId: string | null;
  articles: KnowledgeArticle[];
  filterCategory: KnowledgeCategory | "all";
  searchQuery: string;
  selectedArticleId: string | null;
}

const initialState: State = {
  loading: true,
  trainerId: null,
  clientId: null,
  articles: [],
  filterCategory: "all",
  searchQuery: "",
  selectedArticleId: null,
};

// ── Actions ──

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_IDS"; payload: { trainerId: string; clientId: string } }
  | { type: "SET_ARTICLES"; payload: KnowledgeArticle[] }
  | { type: "SET_FILTER_CATEGORY"; payload: KnowledgeCategory | "all" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SELECT_ARTICLE"; payload: string | null }
  | { type: "INCREMENT_VIEW"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_IDS":
      return { ...state, trainerId: action.payload.trainerId, clientId: action.payload.clientId };
    case "SET_ARTICLES":
      return { ...state, articles: action.payload, loading: false };
    case "SET_FILTER_CATEGORY":
      return { ...state, filterCategory: action.payload };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SELECT_ARTICLE":
      return { ...state, selectedArticleId: action.payload };
    case "INCREMENT_VIEW":
      return {
        ...state,
        articles: state.articles.map((a) =>
          a.id === action.payload ? { ...a, view_count: a.view_count + 1 } : a
        ),
      };
    default:
      return state;
  }
}

// ── Hook ──

export function useClientKnowledgePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get trainer
      const { data: rel, error: relErr } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (relErr || !rel) {
        console.error("[useClientKnowledgePage] No trainer found:", relErr);
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_IDS", payload: { trainerId: rel.trainer_id, clientId: user.id } });

      // Load published articles (RLS ensures only published from own trainer)
      const { data, error } = await supabase
        .from("knowledge_articles")
        .select("id, trainer_id, title, content, category, image_url, video_url, is_published, view_count, source_ticket_id, created_at, updated_at")
        .eq("trainer_id", rel.trainer_id)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        toast.error("Error al cargar artículos");
        console.error("[useClientKnowledgePage] Error loading articles:", error);
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_ARTICLES", payload: data ?? [] });
    };
    init();
  }, []);

  // ── Select article + increment view ──
  const handleSelectArticle = useCallback(async (articleId: string | null) => {
    dispatch({ type: "SELECT_ARTICLE", payload: articleId });

    if (articleId) {
      // Fire-and-forget view increment via SECURITY DEFINER function
      supabase.rpc("increment_article_view", { p_article_id: articleId }).then(({ error }) => {
        if (error) console.error("[Knowledge] Error incrementing view:", error); // No bloqueante
      });
      dispatch({ type: "INCREMENT_VIEW", payload: articleId });
    }
  }, [supabase]);

  // ── Filtered articles ──
  const filteredArticles = state.articles.filter((a) => {
    if (state.filterCategory !== "all" && a.category !== state.filterCategory) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedArticle = state.articles.find((a) => a.id === state.selectedArticleId) ?? null;

  return {
    state,
    dispatch,
    filteredArticles,
    selectedArticle,
    handleSelectArticle,
  };
}
