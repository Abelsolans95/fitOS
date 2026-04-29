import { NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import type {
  TodayAlert,
  TodayAlertKind,
  TodayPanel,
  NoWorkoutAlert,
  NoCheckinAlert,
  NewInjuryAlert,
  PendingTicketAlert,
  HighStressAlert,
  HighPainAlert,
} from "@kuvox/shared";

/**
 * GET /api/trainer/today
 *
 * Aggregates "needs attention today" signals for a trainer:
 *  - no_workout       — clients without a completed workout in 3+ days
 *  - no_checkin       — clients without a daily_checkin in 48h
 *  - new_injury       — health_logs reported in last 7 days
 *  - pending_ticket   — support_tickets open or in_progress
 *  - high_stress      — daily_checkins.stress_level >= 4 in last 2 days
 *  - high_pain        — daily_checkins.pain_level >= 4 in last 2 days
 *
 * Pure read endpoint — uses the trainer's session (RLS applies).
 * No service_role used anywhere here; if a signal isn't readable under RLS,
 * it's intentionally invisible.
 */

const DAYS_NO_WORKOUT_THRESHOLD = 3;
const HOURS_NO_CHECKIN_THRESHOLD = 48;
const INJURY_WINDOW_DAYS = 7;
const WELLNESS_WINDOW_DAYS = 2;
const HIGH_THRESHOLD = 4;

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursBetween(from: string, to: Date = new Date()): number {
  return Math.floor((to.getTime() - new Date(from).getTime()) / (1000 * 60 * 60));
}

export const GET = handler(
  { auth: "required", role: "trainer" },
  async ({ user, supabase }) => {
    // 1. Get the trainer's active clients (+ profile names in a second hop since
    //    trainer_clients has no FK to profiles — gotcha #1).
    const { data: relations, error: relErr } = await supabase
      .from("trainer_clients")
      .select("client_id")
      .eq("trainer_id", user!.id)
      .eq("status", "active")
      .limit(500);

    if (relErr) {
      logger.error("[trainer/today] Error loading trainer_clients");
      return NextResponse.json({ error: "No se pudieron cargar los clientes" }, { status: 500 });
    }

    const clientIds = (relations ?? []).map((r) => r.client_id);
    const empty: TodayPanel = {
      generated_at: new Date().toISOString(),
      total_clients: 0,
      total_alerts: 0,
      alerts_by_kind: {
        no_workout: [],
        no_checkin: [],
        new_injury: [],
        pending_ticket: [],
        high_stress: [],
        high_pain: [],
      },
    };
    if (clientIds.length === 0) {
      return NextResponse.json(empty);
    }

    // 2. All the sub-queries run in parallel — nothing depends on anything else.
    const workoutSince = daysAgoISO(DAYS_NO_WORKOUT_THRESHOLD);
    const checkinSince = daysAgoISO(WELLNESS_WINDOW_DAYS);
    const injurySince = daysAgoISO(INJURY_WINDOW_DAYS);

    const [
      profilesRes,
      recentWorkoutsRes,
      recentCheckinsRes,
      injuriesRes,
      ticketsRes,
      wellnessRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", clientIds),
      supabase
        .from("workout_sessions")
        .select("client_id, completed_at")
        .in("client_id", clientIds)
        .gte("completed_at", workoutSince)
        .eq("status", "completed"),
      supabase
        .from("daily_checkins")
        .select("client_id, created_at")
        .in("client_id", clientIds)
        .gte("created_at", checkinSince),
      supabase
        .from("health_logs")
        .select("client_id, muscle_id, severity, reported_at")
        .in("client_id", clientIds)
        .gte("reported_at", injurySince)
        .order("reported_at", { ascending: false }),
      supabase
        .from("support_tickets")
        .select("id, client_id, category, title, status, created_at")
        .in("client_id", clientIds)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("daily_checkins")
        .select("client_id, stress_level, pain_level, checkin_date")
        .in("client_id", clientIds)
        .gte("checkin_date", daysAgoISO(WELLNESS_WINDOW_DAYS).slice(0, 10)),
    ]);

    // Patrón C — surface-level failures don't kill the whole response; just log.
    if (profilesRes.error) logger.error("[trainer/today] profiles query failed");
    if (recentWorkoutsRes.error) logger.error("[trainer/today] workouts query failed");
    if (recentCheckinsRes.error) logger.error("[trainer/today] checkins query failed");
    if (injuriesRes.error) logger.error("[trainer/today] injuries query failed");
    if (ticketsRes.error) logger.error("[trainer/today] tickets query failed");
    if (wellnessRes.error) logger.error("[trainer/today] wellness query failed");

    const nameById = new Map<string, string>();
    for (const p of profilesRes.data ?? []) {
      nameById.set(p.user_id, p.full_name ?? "Sin nombre");
    }
    const name = (id: string) => nameById.get(id) ?? "Sin nombre";

    // ─── no_workout ─────────────────────────────────────────────────────────
    const workedOut = new Set(
      (recentWorkoutsRes.data ?? []).map((w) => w.client_id)
    );
    const noWorkout: NoWorkoutAlert[] = clientIds
      .filter((id) => !workedOut.has(id))
      .map((id) => ({
        kind: "no_workout",
        client_id: id,
        client_name: name(id),
        days_since_last: DAYS_NO_WORKOUT_THRESHOLD,
      }));

    // ─── no_checkin ─────────────────────────────────────────────────────────
    const lastCheckinByClient = new Map<string, string>();
    for (const c of recentCheckinsRes.data ?? []) {
      const existing = lastCheckinByClient.get(c.client_id);
      if (!existing || new Date(c.created_at) > new Date(existing)) {
        lastCheckinByClient.set(c.client_id, c.created_at);
      }
    }
    const noCheckin: NoCheckinAlert[] = clientIds
      .filter((id) => {
        const last = lastCheckinByClient.get(id);
        if (!last) return true;
        return hoursBetween(last) >= HOURS_NO_CHECKIN_THRESHOLD;
      })
      .map((id) => {
        const last = lastCheckinByClient.get(id);
        return {
          kind: "no_checkin",
          client_id: id,
          client_name: name(id),
          hours_since_last: last ? hoursBetween(last) : null,
        };
      });

    // ─── new_injury ─────────────────────────────────────────────────────────
    const newInjury: NewInjuryAlert[] = (injuriesRes.data ?? []).map((row) => ({
      kind: "new_injury",
      client_id: row.client_id,
      client_name: name(row.client_id),
      muscle_id: row.muscle_id,
      severity: row.severity ?? null,
      reported_at: row.reported_at,
    }));

    // ─── pending_ticket ─────────────────────────────────────────────────────
    const pendingTicket: PendingTicketAlert[] = (ticketsRes.data ?? []).map((row) => ({
      kind: "pending_ticket",
      client_id: row.client_id,
      client_name: name(row.client_id),
      ticket_id: row.id,
      category: row.category,
      title: row.title,
      created_at: row.created_at,
    }));

    // ─── high_stress + high_pain ────────────────────────────────────────────
    const highStress: HighStressAlert[] = [];
    const highPain: HighPainAlert[] = [];
    for (const row of wellnessRes.data ?? []) {
      if (row.stress_level != null && row.stress_level >= HIGH_THRESHOLD) {
        highStress.push({
          kind: "high_stress",
          client_id: row.client_id,
          client_name: name(row.client_id),
          stress_level: row.stress_level,
          checkin_date: row.checkin_date,
        });
      }
      if (row.pain_level != null && row.pain_level >= HIGH_THRESHOLD) {
        highPain.push({
          kind: "high_pain",
          client_id: row.client_id,
          client_name: name(row.client_id),
          pain_level: row.pain_level,
          checkin_date: row.checkin_date,
        });
      }
    }

    const alerts_by_kind: Record<TodayAlertKind, TodayAlert[]> = {
      no_workout: noWorkout,
      no_checkin: noCheckin,
      new_injury: newInjury,
      pending_ticket: pendingTicket,
      high_stress: highStress,
      high_pain: highPain,
    };

    const total_alerts =
      noWorkout.length +
      noCheckin.length +
      newInjury.length +
      pendingTicket.length +
      highStress.length +
      highPain.length;

    const panel: TodayPanel = {
      generated_at: new Date().toISOString(),
      total_clients: clientIds.length,
      total_alerts,
      alerts_by_kind,
    };

    return NextResponse.json(panel);
  }
);
