// ── Lead types — CRM pipeline ────────────────────────────────────────────────

export type LeadSource =
  | "landing"
  | "blog"
  | "instagram_dm"
  | "instagram_ads"
  | "tiktok"
  | "whatsapp"
  | "manual";

export type LeadStatus =
  | "nuevo"
  | "contactado"
  | "interesado"
  | "prueba"
  | "cliente"
  | "descartado";

export interface Lead {
  id: string;
  trainer_id: string;
  name: string;
  email: string;
  phone: string | null;
  goal: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "landing", label: "Landing" },
  { value: "blog", label: "Blog" },
  { value: "instagram_dm", label: "Instagram DM" },
  { value: "instagram_ads", label: "Instagram Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "manual", label: "Manual" },
];

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "nuevo", label: "Nuevo", color: "#00E5FF" },
  { value: "contactado", label: "Contactado", color: "#FF9100" },
  { value: "interesado", label: "Interesado", color: "#7C3AED" },
  { value: "prueba", label: "Prueba", color: "#FFD600" },
  { value: "cliente", label: "Cliente", color: "#00C853" },
  { value: "descartado", label: "Descartado", color: "#FF1744" },
];
