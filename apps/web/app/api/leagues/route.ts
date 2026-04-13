import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName, sanitizeText } from "@/lib/sanitize";
import type { LeagueMetric, LeagueStatus } from "@fitos/shared";

const VALID_METRICS: LeagueMetric[] = ["consistency", "volume", "steps", "sessions", "custom"];
const VALID_STATUSES: LeagueStatus[] = ["upcoming", "active", "completed"];

/**
 * GET /api/leagues
 * Trainer: returns all leagues they own.
 * Client: returns leagues they participate in (via RLS).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    const role = user.user_metadata?.role;

    if (role === "trainer") {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, trainer_id, title, description, metric, custom_metric_name, starts_at, ends_at, prize, status, created_at")
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[leagues] Error al cargar ligas");
        return NextResponse.json({ error: "Error al cargar ligas" }, { status: 500 });
      }

      return NextResponse.json({ leagues: data ?? [] });
    }

    if (role === "client") {
      // Client sees leagues they participate in — RLS handles scoping
      const { data, error } = await supabase
        .from("leagues")
        .select("id, trainer_id, title, description, metric, custom_metric_name, starts_at, ends_at, prize, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[leagues] Error al cargar ligas cliente");
        return NextResponse.json({ error: "Error al cargar ligas" }, { status: 500 });
      }

      return NextResponse.json({ leagues: data ?? [] });
    }

    return NextResponse.json({ error: "Rol no permitido" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

/**
 * POST /api/leagues
 * Trainer creates a new league.
 */
export async function POST(request: NextRequest) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json({ error: "Solo entrenadores pueden crear ligas" }, { status: 403 });
    }

    const body = await request.json();
    const title = sanitizeName(body.title ?? "");
    const description = sanitizeText(body.description ?? "");
    const metric = body.metric as string;
    const customMetricName = sanitizeName(body.custom_metric_name ?? "");
    const startsAt = body.starts_at as string;
    const endsAt = body.ends_at as string;
    const prize = sanitizeName(body.prize ?? "");
    const status = (body.status as string) ?? "upcoming";

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "El titulo es obligatorio" }, { status: 400 });
    }
    if (!VALID_METRICS.includes(metric as LeagueMetric)) {
      return NextResponse.json({ error: "Metrica no valida" }, { status: 400 });
    }
    if (!startsAt || !endsAt) {
      return NextResponse.json({ error: "Fechas son obligatorias" }, { status: 400 });
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status as LeagueStatus)) {
      return NextResponse.json({ error: "Estado no valido" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("leagues")
      .insert({
        trainer_id: user.id,
        title,
        description: description || null,
        metric,
        custom_metric_name: metric === "custom" ? customMetricName : null,
        starts_at: startsAt,
        ends_at: endsAt,
        prize: prize || null,
        status,
      })
      .select("id, trainer_id, title, description, metric, custom_metric_name, starts_at, ends_at, prize, status, created_at")
      .single();

    if (error) {
      console.error("[leagues] Error al crear liga");
      return NextResponse.json({ error: "Error al crear la liga" }, { status: 500 });
    }

    return NextResponse.json({ league: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

/**
 * PUT /api/leagues
 * Trainer updates a league (status, title, etc.). Expects { id, ...fields }.
 */
export async function PUT(request: NextRequest) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json({ error: "Solo entrenadores" }, { status: 403 });
    }

    const body = await request.json();
    const leagueId = body.id as string;

    if (!leagueId || typeof leagueId !== "string") {
      return NextResponse.json({ error: "ID de liga es obligatorio" }, { status: 400 });
    }

    // Ownership check via RLS (trainer_id = auth.uid())
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = sanitizeName(body.title);
    if (body.description !== undefined) updates.description = sanitizeText(body.description) || null;
    if (body.prize !== undefined) updates.prize = sanitizeName(body.prize) || null;
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status as LeagueStatus)) {
        return NextResponse.json({ error: "Estado no valido" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("leagues")
      .update(updates)
      .eq("id", leagueId)
      .eq("trainer_id", user.id)
      .select("id, trainer_id, title, description, metric, custom_metric_name, starts_at, ends_at, prize, status, created_at")
      .single();

    if (error) {
      console.error("[leagues] Error al actualizar liga");
      return NextResponse.json({ error: "Error al actualizar la liga" }, { status: 500 });
    }

    return NextResponse.json({ league: data });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

/**
 * DELETE /api/leagues
 * Trainer deletes a league. Expects { id }.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json({ error: "Solo entrenadores" }, { status: 403 });
    }

    const body = await request.json();
    const leagueId = body.id as string;

    if (!leagueId || typeof leagueId !== "string") {
      return NextResponse.json({ error: "ID de liga es obligatorio" }, { status: 400 });
    }

    const { error } = await supabase
      .from("leagues")
      .delete()
      .eq("id", leagueId)
      .eq("trainer_id", user.id);

    if (error) {
      console.error("[leagues] Error al eliminar liga");
      return NextResponse.json({ error: "Error al eliminar la liga" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
