import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const status = searchParams.get("status"); // active | inactive | expired
    const trainerId = searchParams.get("trainer_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("trainer_promo_codes")
      .select("id, trainer_id, code, is_active, max_uses, current_uses, expires_at, created_at", { count: "exact" });

    if (trainerId) {
      query = query.eq("trainer_id", trainerId);
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }
    // "expired" handled after fetch (needs date comparison)

    if (search) {
      query = query.ilike("code", `%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: codes, error, count } = await query;

    if (error) {
      logger.error("[admin/promo-codes] Error listando códigos");
      return NextResponse.json({ error: "Error al cargar códigos" }, { status: 500 });
    }

    // Enrich with trainer names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enriched: any[] = codes ?? [];
    if (enriched.length > 0) {
      const trainerIds = [...new Set(enriched.map((c: { trainer_id: string }) => c.trainer_id))];
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, business_name")
        .in("user_id", trainerIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: { user_id: string; full_name: string; business_name?: string }) => [
          p.user_id,
          p.business_name || p.full_name || "Sin nombre",
        ])
      );

      enriched = enriched.map((c: { trainer_id: string; expires_at?: string }) => ({
        ...c,
        trainer_name: profileMap.get(c.trainer_id) ?? "Desconocido",
        is_expired: c.expires_at ? new Date(c.expires_at) < new Date() : false,
      }));

      // Filter expired if requested
      if (status === "expired") {
        enriched = enriched.filter((c: { is_expired: boolean }) => c.is_expired);
      }
    }

    return NextResponse.json({
      codes: enriched,
      total: count ?? 0,
      page,
      limit,
    });
  } catch {
    logger.error("[admin/promo-codes] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
