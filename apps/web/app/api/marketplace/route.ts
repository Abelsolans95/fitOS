import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";

/**
 * GET /api/marketplace
 * Public endpoint — lists published marketplace products.
 * Optional query params: category, search, limit, id (single product)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (no auth needed, use IP)
    const { success } = apiLimiter.check(getClientIdentifier(request));
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas peticiones" },
        { status: 429 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const url = new URL(request.url);
    const singleId = url.searchParams.get("id");

    // Single product detail
    if (singleId) {
      if (typeof singleId !== "string" || singleId.length > 40) {
        return NextResponse.json(
          { error: "ID invalido" },
          { status: 400 }
        );
      }

      const { data: product, error: productErr } = await supabaseAdmin
        .from("marketplace_products")
        .select(
          "id, trainer_id, title, description, price_cents, currency, category, routine_data, cover_image_url, downloads, created_at, status"
        )
        .eq("id", singleId)
        .eq("status", "published")
        .single();

      if (productErr || !product) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }

      // Get trainer name
      const { data: trainerProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, business_name")
        .eq("user_id", product.trainer_id)
        .single();

      const trainerName =
        trainerProfile?.business_name ??
        trainerProfile?.full_name ??
        "Entrenador";

      return NextResponse.json({
        product: {
          id: product.id,
          trainer_id: product.trainer_id,
          title: product.title,
          description: product.description,
          price_cents: product.price_cents,
          currency: product.currency,
          category: product.category,
          routine_data: product.routine_data,
          cover_image_url: product.cover_image_url,
          downloads: product.downloads,
          created_at: product.created_at,
          trainer_name: trainerName,
        },
      });
    }

    // List products
    const category = url.searchParams.get("category") ?? "";
    const search = url.searchParams.get("search") ?? "";
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam ?? "50", 10) || 50, 1),
      100
    );

    let query = supabaseAdmin
      .from("marketplace_products")
      .select(
        "id, trainer_id, title, description, price_cents, currency, category, cover_image_url, downloads, created_at"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }
    if (search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    const { data: products, error: listErr } = await query;

    if (listErr) {
      console.error("[marketplace] Error listing products");
      return NextResponse.json(
        { error: "Error al obtener productos" },
        { status: 500 }
      );
    }

    // Fetch trainer names for all products
    const trainerIds = [
      ...new Set((products ?? []).map((p) => p.trainer_id)),
    ];

    const trainerNames: Record<string, string> = {};
    if (trainerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, business_name")
        .in("user_id", trainerIds);

      for (const profile of profiles ?? []) {
        trainerNames[profile.user_id] =
          profile.business_name ?? profile.full_name ?? "Entrenador";
      }
    }

    const enriched = (products ?? []).map((p) => ({
      id: p.id,
      trainer_id: p.trainer_id,
      title: p.title,
      description: p.description,
      price_cents: p.price_cents,
      currency: p.currency,
      category: p.category,
      cover_image_url: p.cover_image_url,
      downloads: p.downloads,
      created_at: p.created_at,
      trainer_name: trainerNames[p.trainer_id] ?? "Entrenador",
    }));

    return NextResponse.json({ products: enriched });
  } catch {
    return NextResponse.json(
      { error: "Error inesperado" },
      { status: 500 }
    );
  }
}
