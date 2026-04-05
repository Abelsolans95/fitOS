"use client";

import { useReducer, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { QUERY_LIMITS } from "@/lib/constants";
import { toast } from "sonner";
import type { KnowledgeArticle, KnowledgeCategory } from "./components/types";

// ── State ──

interface State {
  loading: boolean;
  trainerId: string | null;
  articles: KnowledgeArticle[];
  // Filters
  filterCategory: KnowledgeCategory | "all";
  filterPublished: "all" | "published" | "draft";
  searchQuery: string;
  // Editor
  editingArticle: Partial<KnowledgeArticle> | null;
  saving: boolean;
}

const initialState: State = {
  loading: true,
  trainerId: null,
  articles: [],
  filterCategory: "all",
  filterPublished: "all",
  searchQuery: "",
  editingArticle: null,
  saving: false,
};

// ── Actions ──

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TRAINER_ID"; payload: string }
  | { type: "SET_ARTICLES"; payload: KnowledgeArticle[] }
  | { type: "SET_FILTER_CATEGORY"; payload: KnowledgeCategory | "all" }
  | { type: "SET_FILTER_PUBLISHED"; payload: "all" | "published" | "draft" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_EDITING"; payload: Partial<KnowledgeArticle> | null }
  | { type: "UPDATE_EDITING_FIELD"; payload: Partial<KnowledgeArticle> }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "ADD_ARTICLE"; payload: KnowledgeArticle }
  | { type: "UPDATE_ARTICLE"; payload: KnowledgeArticle }
  | { type: "REMOVE_ARTICLE"; payload: string }
  | { type: "TOGGLE_PUBLISH"; payload: { id: string; is_published: boolean } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_TRAINER_ID":
      return { ...state, trainerId: action.payload };
    case "SET_ARTICLES":
      return { ...state, articles: action.payload, loading: false };
    case "SET_FILTER_CATEGORY":
      return { ...state, filterCategory: action.payload };
    case "SET_FILTER_PUBLISHED":
      return { ...state, filterPublished: action.payload };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_EDITING":
      return { ...state, editingArticle: action.payload };
    case "UPDATE_EDITING_FIELD":
      return { ...state, editingArticle: state.editingArticle ? { ...state.editingArticle, ...action.payload } : null };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "ADD_ARTICLE":
      return { ...state, articles: [action.payload, ...state.articles], editingArticle: null, saving: false };
    case "UPDATE_ARTICLE":
      return {
        ...state,
        articles: state.articles.map((a) => (a.id === action.payload.id ? action.payload : a)),
        editingArticle: null,
        saving: false,
      };
    case "REMOVE_ARTICLE":
      return { ...state, articles: state.articles.filter((a) => a.id !== action.payload) };
    case "TOGGLE_PUBLISH":
      return {
        ...state,
        articles: state.articles.map((a) =>
          a.id === action.payload.id ? { ...a, is_published: action.payload.is_published } : a
        ),
      };
    default:
      return state;
  }
}

// ── Hook ──

export function useKnowledgePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();

  // ── Load articles ──
  const loadArticles = useCallback(async (trainerId: string) => {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("id, trainer_id, title, content, category, image_url, video_url, is_published, view_count, source_ticket_id, created_at, updated_at")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.KNOWLEDGE_ARTICLES);

    if (error) {
      toast.error("Error al cargar artículos");
      console.error("[useKnowledgePage] Error loading articles:", error);
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    dispatch({ type: "SET_ARTICLES", payload: data ?? [] });
  }, [supabase]);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      dispatch({ type: "SET_TRAINER_ID", payload: user.id });
      await loadArticles(user.id);
    };
    init();
  }, []);

  // ── Save article (create or update) ──
  const handleSave = useCallback(async () => {
    const article = state.editingArticle;
    if (!article || !state.trainerId) return;
    if (!article.title?.trim() || !article.content?.trim() || !article.category) {
      toast.error("Completa título, contenido y categoría");
      return;
    }

    dispatch({ type: "SET_SAVING", payload: true });

    const payload = {
      trainer_id: state.trainerId,
      title: article.title.trim(),
      content: article.content.trim(),
      category: article.category,
      image_url: article.image_url ?? null,
      video_url: article.video_url ?? null,
      is_published: article.is_published ?? false,
    };

    if (article.id) {
      // Update
      const { data, error } = await supabase
        .from("knowledge_articles")
        .update(payload)
        .eq("id", article.id)
        .select()
        .single();

      if (error) {
        toast.error("Error al actualizar artículo");
        console.error("[useKnowledgePage] Error updating:", error);
        dispatch({ type: "SET_SAVING", payload: false });
        return;
      }
      dispatch({ type: "UPDATE_ARTICLE", payload: data });
      toast.success("Artículo actualizado");
    } else {
      // Create
      const { data, error } = await supabase
        .from("knowledge_articles")
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast.error("Error al crear artículo");
        console.error("[useKnowledgePage] Error creating:", error);
        dispatch({ type: "SET_SAVING", payload: false });
        return;
      }
      dispatch({ type: "ADD_ARTICLE", payload: data });
      toast.success("Artículo creado");
    }
  }, [supabase, state.editingArticle, state.trainerId]);

  // ── Delete article ──
  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("knowledge_articles")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar artículo");
      console.error("[useKnowledgePage] Error deleting:", error);
      return;
    }
    dispatch({ type: "REMOVE_ARTICLE", payload: id });
    toast.success("Artículo eliminado");
  }, [supabase]);

  // ── Toggle publish ──
  const handleTogglePublish = useCallback(async (id: string, currentPublished: boolean) => {
    const newPublished = !currentPublished;
    const { error } = await supabase
      .from("knowledge_articles")
      .update({ is_published: newPublished })
      .eq("id", id);

    if (error) {
      toast.error("Error al cambiar estado");
      console.error("[useKnowledgePage] Error toggling publish:", error);
      return;
    }
    dispatch({ type: "TOGGLE_PUBLISH", payload: { id, is_published: newPublished } });
    toast.success(newPublished ? "Artículo publicado" : "Artículo despublicado");
  }, [supabase]);

  // ── Create from ticket ──
  const handleCreateFromTicket = useCallback((ticket: { subject: string; description: string; category: string; id: string }) => {
    dispatch({
      type: "SET_EDITING",
      payload: {
        title: ticket.subject,
        content: ticket.description,
        category: (["nutricion", "rutina", "lesion", "general"].includes(ticket.category)
          ? ticket.category
          : "general") as KnowledgeCategory,
        source_ticket_id: ticket.id,
        is_published: false,
      },
    });
  }, []);

  // ── Filtered articles ──
  const filteredArticles = state.articles.filter((a) => {
    if (state.filterCategory !== "all" && a.category !== state.filterCategory) return false;
    if (state.filterPublished === "published" && !a.is_published) return false;
    if (state.filterPublished === "draft" && a.is_published) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    }
    return true;
  });

  return {
    state,
    dispatch,
    filteredArticles,
    handleSave,
    handleDelete,
    handleTogglePublish,
    handleCreateFromTicket,
  };
}
