import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const { searchParams } = new URL(request.url);

    const role = searchParams.get("role"); // trainer | client | admin | null (all)
    const status = searchParams.get("status"); // active | pending | inactive | null
    const search = searchParams.get("search"); // search by name/email
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, email, role, business_name, specialty, created_at, gender", { count: "exact" });

    if (role) {
      query = query.eq("role", role);
    }

    if (search) {
      // Search by name or email (case insensitive)
      query = query.or("full_name.ilike." + encodeURIComponent(`%${search}%`) + ",email.ilike." + encodeURIComponent(`%${search}%`));
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("[admin/users] Error listando usuarios");
      return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 });
    }

    // If filtering by status, we need trainer_clients data
    let enrichedUsers = users ?? [];

    if (enrichedUsers.length > 0) {
      // Get trainer_clients data for clients
      const clientIds = enrichedUsers
        .filter((u) => u.role === "client")
        .map((u) => u.user_id);

      if (clientIds.length > 0) {
        const { data: tcData } = await supabaseAdmin
          .from("trainer_clients")
          .select("client_id, trainer_id, status, joined_at")
          .in("client_id", clientIds);

        const tcMap = new Map(
          (tcData ?? []).map((tc) => [tc.client_id, tc])
        );

        enrichedUsers = enrichedUsers.map((u) => {
          if (u.role === "client") {
            const tc = tcMap.get(u.user_id);
            return {
              ...u,
              trainer_client_status: tc?.status ?? null,
              trainer_id: tc?.trainer_id ?? null,
              joined_at: tc?.joined_at ?? null,
            };
          }
          return u;
        });
      }

      // Get client counts for trainers
      const trainerIds = enrichedUsers
        .filter((u) => u.role === "trainer")
        .map((u) => u.user_id);

      if (trainerIds.length > 0) {
        const { data: counts } = await supabaseAdmin
          .from("trainer_clients")
          .select("trainer_id, status")
          .in("trainer_id", trainerIds)
          .eq("status", "active");

        const countMap = new Map<string, number>();
        (counts ?? []).forEach((c) => {
          countMap.set(c.trainer_id, (countMap.get(c.trainer_id) ?? 0) + 1);
        });

        enrichedUsers = enrichedUsers.map((u) => {
          if (u.role === "trainer") {
            return { ...u, active_clients_count: countMap.get(u.user_id) ?? 0 };
          }
          return u;
        });
      }
    }

    // Filter by status after enrichment (trainer_clients status)
    if (status && role === "client") {
      enrichedUsers = enrichedUsers.filter(
        (u: Record<string, unknown>) => u.trainer_client_status === status
      );
    }

    return NextResponse.json({
      users: enrichedUsers,
      total: count ?? 0,
      page,
      limit,
    });
  } catch {
    console.error("[admin/users] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
