import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";
import { logger } from "@/lib/logger";

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

    // Verify promo code exists
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("trainer_promo_codes")
      .select("id, trainer_id")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Código no encontrado" }, { status: 404 });
    }

    // Build update
    const update: Record<string, unknown> = {};

    if (body.is_active !== undefined) update.is_active = Boolean(body.is_active);
    if (body.max_uses !== undefined) update.max_uses = body.max_uses === null ? null : Math.max(0, parseInt(body.max_uses, 10));
    if (body.expires_at !== undefined) update.expires_at = body.expires_at; // null or ISO string

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("trainer_promo_codes")
      .update(update)
      .eq("id", id);

    if (updateErr) {
      logger.error("[admin/promo-codes/[id]] Error actualizando");
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    logger.error("[admin/promo-codes/[id]] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
