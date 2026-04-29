import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // All queries in parallel
    const [
      trainersRes,
      clientsRes,
      activeClientsRes,
      sessionsLast30Res,
      sessionsPrev30Res,
      routinesRes,
      mealPlansRes,
      articlesRes,
      ticketsOpenRes,
      ticketsResolvedRes,
      newTrainers7dRes,
      newClients7dRes,
      newTrainers30dRes,
      newClients30dRes,
      topTrainersRes,
      promoCodesRes,
      messagesRes,
    ] = await Promise.all([
      // Totals
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "trainer"),
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "client"),
      supabaseAdmin.from("trainer_clients").select("client_id", { count: "exact", head: true }).eq("status", "active"),

      // Sessions last 30d vs prev 30d
      supabaseAdmin.from("workout_sessions").select("id", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", thirtyDaysAgo),
      supabaseAdmin.from("workout_sessions").select("id", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", sixtyDaysAgo).lt("completed_at", thirtyDaysAgo),

      // Content totals
      supabaseAdmin.from("user_routines").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("meal_plans").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("is_published", true),

      // Tickets
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "resolved"),
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "resolved"),

      // Growth
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "trainer").gte("created_at", sevenDaysAgo),
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "client").gte("created_at", sevenDaysAgo),
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "trainer").gte("created_at", thirtyDaysAgo),
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "client").gte("created_at", thirtyDaysAgo),

      // Top trainers by active clients
      supabaseAdmin.from("trainer_clients").select("trainer_id").eq("status", "active"),

      // Promo codes stats
      supabaseAdmin.from("trainer_promo_codes").select("id, is_active, current_uses", { count: "exact" }),

      // Messages last 30d
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    ]);

    // Compute top trainers
    const trainerCounts = new Map<string, number>();
    (topTrainersRes.data ?? []).forEach((tc: { trainer_id: string }) => {
      trainerCounts.set(tc.trainer_id, (trainerCounts.get(tc.trainer_id) ?? 0) + 1);
    });
    const topTrainerIds = [...trainerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let topTrainers: { trainer_id: string; name: string; active_clients: number }[] = [];
    if (topTrainerIds.length > 0) {
      const { data: trainerProfiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, business_name")
        .in("user_id", topTrainerIds.map(([id]) => id));

      const nameMap = new Map(
        (trainerProfiles ?? []).map((p: { user_id: string; full_name: string; business_name?: string }) => [
          p.user_id,
          p.business_name || p.full_name || "Sin nombre",
        ])
      );

      topTrainers = topTrainerIds.map(([id, count]) => ({
        trainer_id: id,
        name: nameMap.get(id) ?? "Desconocido",
        active_clients: count,
      }));
    }

    // Promo stats
    const promoCodes = promoCodesRes.data ?? [];
    const totalPromoUses = promoCodes.reduce((sum: number, pc: { current_uses: number }) => sum + (pc.current_uses ?? 0), 0);
    const activePromos = promoCodes.filter((pc: { is_active: boolean }) => pc.is_active).length;

    const sessionsLast30 = sessionsLast30Res.count ?? 0;
    const sessionsPrev30 = sessionsPrev30Res.count ?? 0;
    const sessionsGrowth = sessionsPrev30 > 0
      ? Math.round(((sessionsLast30 - sessionsPrev30) / sessionsPrev30) * 100)
      : 0;

    const totalClients = clientsRes.count ?? 0;
    const activeClients = activeClientsRes.count ?? 0;
    const retentionRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

    return NextResponse.json({
      totals: {
        trainers: trainersRes.count ?? 0,
        clients: totalClients,
        activeClients,
        retentionRate,
        routines: routinesRes.count ?? 0,
        mealPlans: mealPlansRes.count ?? 0,
        articles: articlesRes.count ?? 0,
        openTickets: ticketsOpenRes.count ?? 0,
        resolvedTickets: ticketsResolvedRes.count ?? 0,
      },
      activity: {
        sessionsLast30,
        sessionsGrowth,
        messagesLast30: messagesRes.count ?? 0,
      },
      growth: {
        newTrainers7d: newTrainers7dRes.count ?? 0,
        newClients7d: newClients7dRes.count ?? 0,
        newTrainers30d: newTrainers30dRes.count ?? 0,
        newClients30d: newClients30dRes.count ?? 0,
      },
      promo: {
        totalCodes: promoCodesRes.count ?? 0,
        activeCodes: activePromos,
        totalUses: totalPromoUses,
      },
      topTrainers,
    });
  } catch {
    logger.error("[admin/analytics] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
