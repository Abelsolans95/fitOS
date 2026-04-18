/**
 * Daily wellness check-in captured from the client "Mi día" screen.
 * Consumed by the trainer "Hoy" panel (alerts for stale check-ins, high stress, pain).
 */

export interface DailyCheckin {
  id: string;
  client_id: string;
  checkin_date: string; // YYYY-MM-DD
  sleep_quality: number | null; // 1-5
  stress_level: number | null; // 1-5
  energy_level: number | null; // 1-5
  pain_level: number | null; // 1-5
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type DailyCheckinInput = Pick<
  DailyCheckin,
  "sleep_quality" | "stress_level" | "energy_level" | "pain_level" | "notes"
>;

// ─── Trainer "Hoy" panel aggregated alerts ──────────────────────────────────

export type TodayAlertKind =
  | "no_workout"
  | "no_checkin"
  | "new_injury"
  | "pending_ticket"
  | "high_stress"
  | "high_pain";

export interface TodayAlertClient {
  client_id: string;
  client_name: string;
}

export interface NoWorkoutAlert extends TodayAlertClient {
  kind: "no_workout";
  days_since_last: number;
}

export interface NoCheckinAlert extends TodayAlertClient {
  kind: "no_checkin";
  hours_since_last: number | null; // null if never checked in
}

export interface NewInjuryAlert extends TodayAlertClient {
  kind: "new_injury";
  muscle_id: string;
  severity: number | null;
  reported_at: string;
}

export interface PendingTicketAlert extends TodayAlertClient {
  kind: "pending_ticket";
  ticket_id: string;
  category: string;
  title: string;
  created_at: string;
}

export interface HighStressAlert extends TodayAlertClient {
  kind: "high_stress";
  stress_level: number;
  checkin_date: string;
}

export interface HighPainAlert extends TodayAlertClient {
  kind: "high_pain";
  pain_level: number;
  checkin_date: string;
}

export type TodayAlert =
  | NoWorkoutAlert
  | NoCheckinAlert
  | NewInjuryAlert
  | PendingTicketAlert
  | HighStressAlert
  | HighPainAlert;

export interface TodayPanel {
  generated_at: string;
  total_clients: number;
  total_alerts: number;
  alerts_by_kind: Record<TodayAlertKind, TodayAlert[]>;
}
