// ── Leagues & Gamification types ─────────────────────────────────────────────

export type LeagueMetric = "consistency" | "volume" | "steps" | "sessions" | "custom";
export type LeagueStatus = "upcoming" | "active" | "completed";

export interface League {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  metric: LeagueMetric;
  custom_metric_name: string | null;
  starts_at: string;
  ends_at: string;
  prize: string | null;
  status: LeagueStatus;
  created_at: string;
  /** Enriched: number of participants */
  participants_count?: number;
}

export interface LeagueParticipant {
  id: string;
  league_id: string;
  client_id: string;
  score: number;
  rank: number | null;
  joined_at: string;
  /** Enriched from profiles join */
  client_name?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  /** Enriched from badges join */
  badge?: Badge;
}

export const LEAGUE_METRICS: { value: LeagueMetric; label: string }[] = [
  { value: "consistency", label: "Consistencia" },
  { value: "volume", label: "Volumen" },
  { value: "steps", label: "Pasos" },
  { value: "sessions", label: "Sesiones" },
  { value: "custom", label: "Personalizada" },
];

export const LEAGUE_STATUSES: { value: LeagueStatus; label: string }[] = [
  { value: "upcoming", label: "Proxima" },
  { value: "active", label: "Activa" },
  { value: "completed", label: "Completada" },
];

export const BADGE_ICONS: Record<string, string> = {
  flame: "🔥",
  fire: "🔥",
  trophy: "🏆",
  medal: "🥇",
  crown: "👑",
  check: "✅",
  shield: "🛡️",
  zap: "⚡",
};
