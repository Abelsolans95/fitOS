import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";

/**
 * GET /api/admin/menus
 * List users with their menus_enabled status.
 * Query params: role (trainer|client|all), search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const { searchParams } = new URL(request.url);

    const roleFilter = searchParams.get("role") ?? "all";
    const search = searchParams.get("search")?.trim() ?? "";
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
    const offset = (page - 1) * limit;

    // Count query
    let countQuery = supabaseAdmin
      .from("profiles")
      .select("user_id", { count: "exact", head: true });

    if (roleFilter === "trainer" || roleFilter === "client") {
      countQuery = countQuery.eq("role", roleFilter);
    } else {
      countQuery = countQuery.in("role", ["trainer", "client"]);
    }

    if (search) {
      countQuery = countQuery.ilike("full_name", `%${search.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`);
    }

    const { count, error: countErr } = await countQuery;

    if (countErr) {
      console.error("[admin/menus] Error counting users");
      return NextResponse.json({ error: "Error al contar usuarios" }, { status: 500 });
    }

    // Data query
    let dataQuery = supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, business_name, role, menus_enabled")
      .order("full_name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (roleFilter === "trainer" || roleFilter === "client") {
      dataQuery = dataQuery.eq("role", roleFilter);
    } else {
      dataQuery = dataQuery.in("role", ["trainer", "client"]);
    }

    if (search) {
      dataQuery = dataQuery.ilike("full_name", `%${search.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`);
    }

    const { data: users, error: dataErr } = await dataQuery;

    if (dataErr) {
      console.error("[admin/menus] Error loading users");
      return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 });
    }

    return NextResponse.json({
      users: users ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/menus
 * Toggle menus_enabled for a user.
 * Body: { user_id: string, menus_enabled: boolean }
 */
export async function PUT(request: NextRequest) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const body = await request.json();

    const userId = body.user_id;
    const menusEnabled = body.menus_enabled;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "user_id es requerido" }, { status: 400 });
    }

    if (typeof menusEnabled !== "boolean") {
      return NextResponse.json({ error: "menus_enabled debe ser boolean" }, { status: 400 });
    }

    // Verify user exists and is trainer or client
    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", userId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (profile.role !== "trainer" && profile.role !== "client") {
      return NextResponse.json({ error: "Solo se pueden modificar trainers y clientes" }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ menus_enabled: menusEnabled })
      .eq("user_id", userId);

    if (updateErr) {
      console.error("[admin/menus] Error updating menus_enabled");
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: userId, menus_enabled: menusEnabled });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
