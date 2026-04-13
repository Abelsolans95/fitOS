import type { Lead, LeadStatus, LeadSource } from "@fitos/shared";

export type { Lead, LeadStatus, LeadSource };

export interface LeadColumn {
  status: LeadStatus;
  label: string;
  color: string;
}

export const COLUMNS: LeadColumn[] = [
  { status: "nuevo", label: "Nuevo", color: "#00E5FF" },
  { status: "contactado", label: "Contactado", color: "#FF9100" },
  { status: "interesado", label: "Interesado", color: "#7C3AED" },
  { status: "prueba", label: "Prueba", color: "#FFD600" },
  { status: "cliente", label: "Cliente", color: "#00C853" },
  { status: "descartado", label: "Descartado", color: "#FF1744" },
];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  landing: "Landing",
  blog: "Blog",
  instagram_dm: "IG DM",
  instagram_ads: "IG Ads",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  manual: "Manual",
};
