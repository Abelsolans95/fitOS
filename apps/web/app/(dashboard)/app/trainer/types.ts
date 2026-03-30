/* ────────────────────────────────────────────
   Trainer — Shared types used across modules
   (routines, nutrition, appointments)
   ──────────────────────────────────────────── */

export interface ClientOption {
  client_id: string;
  full_name: string | null;
  email: string | null;
  food_preferences?: string | Record<string, unknown> | null;
}
