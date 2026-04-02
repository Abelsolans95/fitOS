// ── Knowledge Base / FAQ types ──────────────────────────────────────────────

export type KnowledgeCategory =
  | "nutricion"
  | "rutina"
  | "lesion"
  | "tecnica"
  | "suplementacion"
  | "general";

export interface KnowledgeArticle {
  id: string;
  trainer_id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  image_url: string | null;
  video_url: string | null;
  is_published: boolean;
  view_count: number;
  source_ticket_id: string | null;
  created_at: string;
  updated_at: string;
}

export const KNOWLEDGE_CATEGORIES: { value: KnowledgeCategory; label: string; icon: string }[] = [
  { value: "nutricion", label: "Nutrición", icon: "🍎" },
  { value: "rutina", label: "Rutina", icon: "💪" },
  { value: "lesion", label: "Lesión", icon: "🩹" },
  { value: "tecnica", label: "Técnica", icon: "🎯" },
  { value: "suplementacion", label: "Suplementación", icon: "💊" },
  { value: "general", label: "General", icon: "📋" },
];
