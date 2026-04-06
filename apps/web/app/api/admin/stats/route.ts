import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;

    // Run all stat queries in parallel
    const [
      trainersResult,
      clientsResult,
      activeClientsResult,
      sessionsResult,
      ticketsOpenResult,
      routinesResult,
      mealPlansResult,
      recentTrainersResult,
      recentClientsResult,
    ] = await Promise.all([
      // Total trainers
      supabaseAdmin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "trainer"),
      // Total clients
      supabaseAdmin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "client"),
      // Active clients (status = active in trainer_clients)
      supabaseAdmin
        .from("trainer_clients")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      // Workout sessions completed (last 30 days)
      supabaseAdmin
        .from("workout_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      // Open tickets
      supabaseAdmin
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      // Active routines
      supabaseAdmin
        .from("user_routines")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      // Active meal plans
      supabaseAdmin
        .from("meal_plans")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      // Recent trainer registrations (last 7 days)
      supabaseAdmin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "trainer")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      // Recent client registrations (last 7 days)
      supabaseAdmin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "client")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return NextResponse.json({
      totalTrainers: trainersResult.count ?? 0,
      totalClients: clientsResult.count ?? 0,
      activeClients: activeClientsResult.count ?? 0,
      sessionsLast30d: sessionsResult.count ?? 0,
      openTickets: ticketsOpenResult.count ?? 0,
      activeRoutines: routinesResult.count ?? 0,
      activeMealPlans: mealPlansResult.count ?? 0,
      newTrainersWeek: recentTrainersResult.count ?? 0,
      newClientsWeek: recentClientsResult.count ?? 0,
    });
  } catch {
    console.error("[admin/stats] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
