/**
 * Shared Zod schemas and runtime validation helpers for API routes.
 *
 * All user input crossing a trust boundary (API routes, webhooks, form submissions)
 * should be validated with one of these helpers before reaching DB or business logic.
 *
 * Replaces ad-hoc regex/typeof checks — gotcha #134 (ILIKE injection) and the
 * case-insensitive UUID regex in /api/leads are the reasons this exists.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

// ─── Primitive schemas ───────────────────────────────────────────────────────

/**
 * Strict UUID v4 validator. Lowercase only — matches Postgres canonical form.
 * Rejects mixed-case UUIDs that `zod.string().uuid()` would accept.
 */
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    "UUID inválido"
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email inválido")
  .max(254);

export const shortTextSchema = z.string().trim().min(1).max(120);
export const longTextSchema = z.string().trim().min(1).max(5000);

// Roles accepted anywhere across the app.
export const roleSchema = z.enum(["trainer", "client", "admin"]);

// Status enum used by /api/leads.
export const leadStatusSchema = z.enum([
  "nuevo",
  "contactado",
  "interesado",
  "prueba",
  "cliente",
  "descartado",
]);

export const goalSchema = z.enum([
  "hipertrofia",
  "fuerza",
  "perdida_peso",
  "mantenimiento",
]);

// ─── ILIKE escaping (gotcha #134) ────────────────────────────────────────────

/**
 * Escape user input before interpolation in a Postgres ILIKE pattern.
 * Without this, `%` and `_` act as wildcards and enable injection of
 * partial-match queries that were not intended.
 *
 * Use: `.ilike('name', `%${escapeLike(search)}%`)`
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => "\\" + m);
}

// ─── Body validation helper ──────────────────────────────────────────────────

/**
 * Validate a parsed JSON body against a Zod schema.
 * Returns the parsed data or a NextResponse with a 400 error listing issues
 * (issue paths only — never echo user values back, avoids PII reflection).
 */
export function validateBody<T extends z.ZodType>(
  schema: T,
  data: unknown
): { data: z.infer<T> } | { response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data };

  const issues = result.error.issues.map((i) => ({
    path: i.path.join("."),
    code: i.code,
  }));
  return {
    response: NextResponse.json(
      { error: "Datos inválidos", issues },
      { status: 400 }
    ),
  };
}
