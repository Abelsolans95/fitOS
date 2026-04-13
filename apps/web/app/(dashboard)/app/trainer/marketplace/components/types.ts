export interface TrainerProduct {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  cover_image_url: string | null;
  status: string;
  downloads: number;
  created_at: string;
}

export interface RoutineOption {
  id: string;
  title: string;
  goal: string | null;
  training_days: string[] | null;
  total_weeks: number | null;
}

export interface PublishFormData {
  routine_id: string;
  title: string;
  description: string;
  price_cents: number;
  category: string;
  cover_image_url: string;
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "text-[#8B8BA3]" },
  pending_review: { label: "Pendiente", color: "text-[#FF9100]" },
  published: { label: "Publicado", color: "text-[#00C853]" },
  rejected: { label: "Rechazado", color: "text-[#FF1744]" },
};
