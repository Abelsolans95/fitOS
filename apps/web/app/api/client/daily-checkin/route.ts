import { NextResponse } from "next/server";
import { z } from "zod";
import { handler } from "@/lib/api-handler";
import { sanitizeText } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

/**
 * POST /api/client/daily-checkin
 *
 * Upserts today's wellness check-in for the authenticated client.
 * UNIQUE(client_id, checkin_date) → one row per day, PATCH-style updates.
 *
 * RLS already restricts writes to client_id = auth.uid(); the explicit
 * field below is defensive but the check is in the DB, not here.
 */

const wellnessScore = z.number().int().min(1).max(5).nullable().optional();

const bodySchema = z.object({
  sleep_quality: wellnessScore,
  stress_level: wellnessScore,
  energy_level: wellnessScore,
  pain_level: wellnessScore,
  notes: z.string().max(2000).nullable().optional(),
});

export const POST = handler(
  { auth: "required", role: "client", body: bodySchema },
  async ({ user, supabase, body }) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { data, error } = await supabase
      .from("daily_checkins")
      .upsert(
        {
          client_id: user!.id,
          checkin_date: today,
          sleep_quality: body.sleep_quality ?? null,
          stress_level: body.stress_level ?? null,
          energy_level: body.energy_level ?? null,
          pain_level: body.pain_level ?? null,
          notes: body.notes ? sanitizeText(body.notes, 2000) : null,
        },
        { onConflict: "client_id,checkin_date" }
      )
      .select(
        "id, client_id, checkin_date, sleep_quality, stress_level, energy_level, pain_level, notes, created_at, updated_at"
      )
      .single();

    if (error) {
      logger.error("[client/daily-checkin] upsert failed");
      return NextResponse.json({ error: "No se pudo guardar el check-in" }, { status: 500 });
    }

    return NextResponse.json({ checkin: data });
  }
);

/**
 * GET /api/client/daily-checkin
 *
 * Returns today's check-in if it exists. Used by "Mi día" screen to pre-fill
 * form state on mount.
 */
export const GET = handler(
  { auth: "required", role: "client" },
  async ({ user, supabase }) => {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("daily_checkins")
      .select(
        "id, client_id, checkin_date, sleep_quality, stress_level, energy_level, pain_level, notes, created_at, updated_at"
      )
      .eq("client_id", user!.id)
      .eq("checkin_date", today)
      .maybeSingle();

    if (error) {
      logger.error("[client/daily-checkin] fetch failed");
      return NextResponse.json({ error: "No se pudo cargar el check-in" }, { status: 500 });
    }

    return NextResponse.json({ checkin: data ?? null });
  }
);
