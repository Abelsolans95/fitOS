import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status"); // open | in_progress | resolved
    const category = searchParams.get("category");
    const trainerId = searchParams.get("trainer_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("support_tickets")
      .select("id, trainer_id, client_id, category, subject, description, status, created_at, updated_at", { count: "exact" });

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (trainerId) query = query.eq("trainer_id", trainerId);

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error("[admin/tickets] Error cargando tickets");
      return NextResponse.json({ error: "Error al cargar consultas" }, { status: 500 });
    }

    // Enrich with names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enriched: any[] = tickets ?? [];
    if (enriched.length > 0) {
      const allIds = [
        ...new Set([
          ...enriched.map((t: { trainer_id: string }) => t.trainer_id),
          ...enriched.map((t: { client_id: string }) => t.client_id),
        ]),
      ];

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, business_name, role")
        .in("user_id", allIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: { user_id: string; full_name: string; business_name?: string; role: string }) => [
          p.user_id,
          { name: p.role === "trainer" ? (p.business_name || p.full_name) : p.full_name, role: p.role },
        ])
      );

      enriched = enriched.map((t: { trainer_id: string; client_id: string }) => ({
        ...t,
        trainer_name: profileMap.get(t.trainer_id)?.name ?? "Desconocido",
        client_name: profileMap.get(t.client_id)?.name ?? "Desconocido",
      }));
    }

    return NextResponse.json({
      tickets: enriched,
      total: count ?? 0,
      page,
      limit,
    });
  } catch {
    console.error("[admin/tickets] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
