import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";

/**
 * GET /api/leagues/[id]/leaderboard
 * Returns participants ranked by score for a league.
 * Both trainers (who own the league) and clients (who participate) can view.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas peticiones" },
        { status: 429 }
      );
    }

    const { id: leagueId } = await params;

    if (!leagueId || typeof leagueId !== "string") {
      return NextResponse.json(
        { error: "ID de liga es obligatorio" },
        { status: 400 }
      );
    }

    // RLS handles access — trainer sees their leagues, clients see leagues they participate in
    const { data: league, error: leagueErr } = await supabase
      .from("leagues")
      .select("id, title, status, trainer_id")
      .eq("id", leagueId)
      .single();

    if (leagueErr || !league) {
      return NextResponse.json(
        { error: "Liga no encontrada" },
        { status: 404 }
      );
    }

    // Get participants ordered by score
    const { data: participants, error: partErr } = await supabase
      .from("league_participants")
      .select("id, league_id, client_id, score, rank, joined_at")
      .eq("league_id", leagueId)
      .order("score", { ascending: false })
      .limit(200);

    if (partErr) {
      console.error("[leagues/leaderboard] Error al cargar participantes");
      return NextResponse.json(
        { error: "Error al cargar clasificacion" },
        { status: 500 }
      );
    }

    // Enrich with profile names — no FK between trainer_clients and profiles
    const clientIds = (participants ?? []).map((p) => p.client_id);
    let profileMap: Record<string, string> = {};

    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", clientIds);

      (profiles ?? []).forEach((p) => {
        profileMap[p.user_id] = p.full_name ?? "Sin nombre";
      });
    }

    const enriched = (participants ?? []).map((p, idx) => ({
      ...p,
      rank: idx + 1,
      client_name: profileMap[p.client_id] ?? "Sin nombre",
    }));

    return NextResponse.json({ participants: enriched });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
