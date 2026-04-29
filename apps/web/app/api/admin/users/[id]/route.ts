import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const { id } = await params;

    // Get profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, email, role, business_name, specialty, bio, gender, height, weight, food_preferences, goal, created_at, updated_at")
      .eq("user_id", id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Build response based on role
    const result: Record<string, unknown> = { ...profile };

    if (profile.role === "trainer") {
      // Get trainer stats in parallel
      const [clientsRes, routinesRes, mealsRes, articlesRes, promoRes] = await Promise.all([
        supabaseAdmin
          .from("trainer_clients")
          .select("client_id, status, joined_at")
          .eq("trainer_id", id),
        supabaseAdmin
          .from("user_routines")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", id),
        supabaseAdmin
          .from("meal_plans")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", id),
        supabaseAdmin
          .from("knowledge_articles")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", id),
        supabaseAdmin
          .from("trainer_promo_codes")
          .select("id, code, is_active, max_uses, current_uses, expires_at")
          .eq("trainer_id", id),
      ]);

      const clients = clientsRes.data ?? [];
      result.clients = clients;
      result.active_clients_count = clients.filter((c) => c.status === "active").length;
      result.total_clients = clients.length;
      result.routines_count = routinesRes.count ?? 0;
      result.meal_plans_count = mealsRes.count ?? 0;
      result.articles_count = articlesRes.count ?? 0;
      result.promo_codes = promoRes.data ?? [];
    }

    if (profile.role === "client") {
      // Get client's trainer and stats
      const [tcRes, sessionsRes, ticketsRes] = await Promise.all([
        supabaseAdmin
          .from("trainer_clients")
          .select("trainer_id, status, joined_at")
          .eq("client_id", id)
          .limit(1)
          .single(),
        supabaseAdmin
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("client_id", id)
          .eq("status", "completed"),
        supabaseAdmin
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("client_id", id),
      ]);

      if (tcRes.data) {
        result.trainer_id = tcRes.data.trainer_id;
        result.trainer_client_status = tcRes.data.status;
        result.joined_at = tcRes.data.joined_at;

        // Get trainer name
        const { data: trainerProfile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, business_name")
          .eq("user_id", tcRes.data.trainer_id)
          .single();

        result.trainer_name = trainerProfile?.business_name ?? trainerProfile?.full_name ?? "Desconocido";
      }

      result.completed_sessions = sessionsRes.count ?? 0;
      result.tickets_count = ticketsRes.count ?? 0;
    }

    return NextResponse.json(result);
  } catch {
    logger.error("[admin/users/[id]] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const { id } = await params;
    const body = await request.json();

    // Verify user exists
    const { data: existing, error: existErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", id)
      .single();

    if (existErr || !existing) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Build update object (only allowed fields)
    const update: Record<string, unknown> = {};
    if (body.full_name !== undefined) update.full_name = sanitizeName(body.full_name, 100);
    if (body.business_name !== undefined) update.business_name = sanitizeName(body.business_name, 100);
    if (body.specialty !== undefined) update.specialty = sanitizeName(body.specialty, 100);
    if (body.bio !== undefined) update.bio = body.bio?.substring(0, 500) ?? null;
    if (body.gender !== undefined) update.gender = body.gender;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    // Always include role (Rule 8: profiles.role is NOT NULL)
    update.role = existing.role;

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("user_id", id);

    if (updateErr) {
      logger.error("[admin/users/[id]] Error actualizando perfil");
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    // Handle trainer reassignment for clients
    if (body.trainer_id && existing.role === "client" && body.trainer_id !== body.current_trainer_id) {
      // Verify new trainer exists
      const { data: newTrainer } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("user_id", body.trainer_id)
        .eq("role", "trainer")
        .single();

      if (newTrainer) {
        // Deactivate old relationship
        if (body.current_trainer_id) {
          await supabaseAdmin
            .from("trainer_clients")
            .update({ status: "cancelled" })
            .eq("client_id", id)
            .eq("trainer_id", body.current_trainer_id);
        }

        // Create new relationship
        await supabaseAdmin
          .from("trainer_clients")
          .upsert({
            trainer_id: body.trainer_id,
            client_id: id,
            status: "active",
            joined_at: new Date().toISOString(),
          });
      }
    }

    // Handle status change for clients
    if (body.client_status && existing.role === "client") {
      const validStatuses = ["active", "paused", "cancelled", "pending"];
      if (validStatuses.includes(body.client_status)) {
        await supabaseAdmin
          .from("trainer_clients")
          .update({ status: body.client_status })
          .eq("client_id", id);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    logger.error("[admin/users/[id]] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
