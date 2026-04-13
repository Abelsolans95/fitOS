import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

/**
 * POST /api/leagues/[id]/join
 * Client joins a league. RLS ensures they can only add themselves.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    if (user.user_metadata?.role !== "client") {
      return NextResponse.json(
        { error: "Solo clientes pueden unirse a ligas" },
        { status: 403 }
      );
    }

    const { id: leagueId } = await params;

    if (!leagueId || typeof leagueId !== "string") {
      return NextResponse.json(
        { error: "ID de liga es obligatorio" },
        { status: 400 }
      );
    }

    // Verify the league exists and is not completed
    const { data: league, error: leagueErr } = await supabase
      .from("leagues")
      .select("id, status, trainer_id")
      .eq("id", leagueId)
      .single();

    if (leagueErr || !league) {
      return NextResponse.json(
        { error: "Liga no encontrada" },
        { status: 404 }
      );
    }

    if (league.status === "completed") {
      return NextResponse.json(
        { error: "No se puede unir a una liga completada" },
        { status: 400 }
      );
    }

    // Verify client belongs to this trainer
    const { data: rel, error: relErr } = await supabase
      .from("trainer_clients")
      .select("trainer_id")
      .eq("client_id", user.id)
      .eq("trainer_id", league.trainer_id)
      .eq("status", "active")
      .single();

    if (relErr || !rel) {
      return NextResponse.json(
        { error: "No tienes acceso a esta liga" },
        { status: 403 }
      );
    }

    // Insert participant — unique constraint prevents duplicates
    const { data, error } = await supabase
      .from("league_participants")
      .insert({
        league_id: leagueId,
        client_id: user.id,
        score: 0,
      })
      .select("id, league_id, client_id, score, rank, joined_at")
      .single();

    if (error) {
      // Unique violation = already joined
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ya participas en esta liga" },
          { status: 409 }
        );
      }
      console.error("[leagues/join] Error al unirse a liga");
      return NextResponse.json(
        { error: "Error al unirse a la liga" },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
