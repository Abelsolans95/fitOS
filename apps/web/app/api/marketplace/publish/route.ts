import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName, sanitizeText } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

const VALID_CATEGORIES = [
  "hipertrofia",
  "fuerza",
  "perdida_peso",
  "funcional",
  "calistenia",
  "otro",
];

/**
 * POST /api/marketplace/publish
 * Trainer creates a new marketplace product from an existing routine.
 * Auth required, trainer role only.
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auth
    const serverSupabase = await createBrowserClient();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Rate limiting
    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas peticiones" },
        { status: 429 }
      );
    }

    // Role check
    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json(
        { error: "Solo entrenadores pueden publicar productos" },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Cuerpo de solicitud invalido" },
        { status: 400 }
      );
    }

    const {
      title: rawTitle,
      description: rawDescription,
      price_cents,
      category,
      routine_id,
      cover_image_url,
    } = body as {
      title?: unknown;
      description?: unknown;
      price_cents?: unknown;
      category?: unknown;
      routine_id?: unknown;
      cover_image_url?: unknown;
    };

    // Validate fields
    if (typeof rawTitle !== "string" || !rawTitle.trim()) {
      return NextResponse.json(
        { error: "El titulo es obligatorio" },
        { status: 400 }
      );
    }
    if (typeof rawDescription !== "string" || !rawDescription.trim()) {
      return NextResponse.json(
        { error: "La descripcion es obligatoria" },
        { status: 400 }
      );
    }
    if (
      typeof price_cents !== "number" ||
      !Number.isInteger(price_cents) ||
      price_cents < 0
    ) {
      return NextResponse.json(
        { error: "El precio debe ser un numero entero >= 0 (en centimos)" },
        { status: 400 }
      );
    }
    if (typeof category !== "string" || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Categoria invalida" },
        { status: 400 }
      );
    }
    if (typeof routine_id !== "string" || !routine_id.trim()) {
      return NextResponse.json(
        { error: "Debes seleccionar una rutina" },
        { status: 400 }
      );
    }

    const title = sanitizeName(rawTitle);
    const description = sanitizeText(rawDescription);

    if (!title) {
      return NextResponse.json(
        { error: "Titulo invalido despues de sanitizacion" },
        { status: 400 }
      );
    }

    // Validate cover_image_url if provided
    let cleanCoverUrl: string | null = null;
    if (cover_image_url && typeof cover_image_url === "string") {
      try {
        const parsed = new URL(cover_image_url);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          cleanCoverUrl = cover_image_url;
        }
      } catch {
        // Invalid URL, ignore
      }
    }

    // Service role to fetch routine + verify ownership
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify routine ownership
    const { data: routine, error: routineErr } = await supabaseAdmin
      .from("user_routines")
      .select(
        "id, title, exercises, training_days, total_weeks, current_week, goal, trainer_id"
      )
      .eq("id", routine_id)
      .eq("trainer_id", user.id)
      .single();

    if (routineErr || !routine) {
      return NextResponse.json(
        { error: "Rutina no encontrada o no te pertenece" },
        { status: 404 }
      );
    }

    // Build routine_data JSONB
    const routineData = {
      exercises: routine.exercises,
      training_days: routine.training_days ?? [],
      total_weeks: routine.total_weeks ?? 4,
      current_week: routine.current_week ?? 1,
      goal: routine.goal,
    };

    // Insert product
    const { data: product, error: insertErr } = await supabaseAdmin
      .from("marketplace_products")
      .insert({
        trainer_id: user.id,
        title,
        description,
        price_cents,
        currency: "EUR",
        category,
        routine_data: routineData,
        cover_image_url: cleanCoverUrl,
        status: "pending_review",
      })
      .select("id, title, status, created_at")
      .single();

    if (insertErr) {
      logger.error("[marketplace/publish] Error inserting product");
      return NextResponse.json(
        { error: "Error al crear el producto" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error inesperado" },
      { status: 500 }
    );
  }
}
