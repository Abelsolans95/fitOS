import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("user_id");
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resource_type");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("audit_logs")
      .select("id, user_id, action, resource_type, resource_id, target_user_id, metadata, ip_address, created_at", { count: "exact" });

    if (userId) query = query.eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (resourceType) query = query.eq("resource_type", resourceType);

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("[admin/audit] Error cargando logs");
      return NextResponse.json({ error: "Error al cargar logs" }, { status: 500 });
    }

    // Enrich with user names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enriched: any[] = logs ?? [];
    if (enriched.length > 0) {
      const allUserIds = [
        ...new Set([
          ...enriched.map((l: { user_id: string }) => l.user_id),
          ...enriched.filter((l: { target_user_id?: string }) => l.target_user_id).map((l: { target_user_id: string }) => l.target_user_id),
        ]),
      ];

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, role")
        .in("user_id", allUserIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: { user_id: string; full_name: string; role: string }) => [
          p.user_id,
          { name: p.full_name || "Sin nombre", role: p.role },
        ])
      );

      enriched = enriched.map((l: { user_id: string; target_user_id?: string }) => ({
        ...l,
        user_name: profileMap.get(l.user_id)?.name ?? "Desconocido",
        user_role: profileMap.get(l.user_id)?.role ?? null,
        target_user_name: l.target_user_id ? profileMap.get(l.target_user_id)?.name ?? null : null,
      }));
    }

    return NextResponse.json({
      logs: enriched,
      total: count ?? 0,
      page,
      limit,
    });
  } catch {
    console.error("[admin/audit] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
