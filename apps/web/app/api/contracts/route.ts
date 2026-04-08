import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName, sanitizeText } from "@/lib/sanitize";

const VALID_STATUSES = ["draft", "sent", "viewed", "signed", "expired"];

/**
 * GET /api/contracts
 * Returns contracts for the authenticated user (trainer or client).
 */
export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    const role = user.user_metadata?.role;
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (role === "trainer") {
      const { data: contracts, error } = await supabaseAdmin
        .from("contracts")
        .select("id, trainer_id, client_id, template_id, title, content, status, signed_at, signature_data, pdf_url, created_at, updated_at")
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[contracts] Error loading trainer contracts");
        return NextResponse.json({ error: "Error al cargar contratos" }, { status: 500 });
      }

      // Enrich with client names
      const clientIds = [...new Set((contracts ?? []).map((c) => c.client_id))];
      if (clientIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", clientIds);

        const nameMap: Record<string, string> = {};
        (profiles ?? []).forEach((p: { user_id: string; full_name: string | null }) => {
          nameMap[p.user_id] = p.full_name ?? "Cliente";
        });

        return NextResponse.json({
          contracts: (contracts ?? []).map((c) => ({
            ...c,
            client_name: nameMap[c.client_id] ?? "Cliente",
          })),
        });
      }

      return NextResponse.json({ contracts: contracts ?? [] });
    }

    if (role === "client") {
      const { data: contracts, error } = await supabaseAdmin
        .from("contracts")
        .select("id, trainer_id, client_id, template_id, title, content, status, signed_at, signature_data, pdf_url, created_at, updated_at")
        .eq("client_id", user.id)
        .in("status", ["sent", "viewed", "signed", "expired"])
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[contracts] Error loading client contracts");
        return NextResponse.json({ error: "Error al cargar contratos" }, { status: 500 });
      }

      return NextResponse.json({ contracts: contracts ?? [] });
    }

    return NextResponse.json({ error: "Rol no autorizado" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

/**
 * POST /api/contracts
 * Create a new contract (trainer only).
 * Body: { client_id, title, content, template_id? }
 */
export async function POST(request: NextRequest) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serverSupabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json({ error: "Solo entrenadores pueden crear contratos" }, { status: 403 });
    }

    const body = await request.json();
    const { client_id, title, content, template_id } = body;

    // Validate required fields
    if (!client_id || typeof client_id !== "string") {
      return NextResponse.json({ error: "client_id es requerido" }, { status: 400 });
    }
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title es requerido" }, { status: 400 });
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content es requerido" }, { status: 400 });
    }

    const cleanTitle = sanitizeName(title);
    const cleanContent = sanitizeText(content, 50000);

    if (!cleanTitle) {
      return NextResponse.json({ error: "Titulo no valido" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify client belongs to this trainer
    const { data: tcRow, error: tcErr } = await supabaseAdmin
      .from("trainer_clients")
      .select("client_id")
      .eq("trainer_id", user.id)
      .eq("client_id", client_id)
      .single();

    if (tcErr || !tcRow) {
      return NextResponse.json({ error: "Cliente no vinculado" }, { status: 403 });
    }

    const insertData: Record<string, unknown> = {
      trainer_id: user.id,
      client_id,
      title: cleanTitle,
      content: cleanContent,
      status: "draft",
    };

    if (template_id && typeof template_id === "string") {
      insertData.template_id = template_id;
    }

    const { data: contract, error: insertErr } = await supabaseAdmin
      .from("contracts")
      .insert(insertData)
      .select("id, trainer_id, client_id, template_id, title, content, status, created_at, updated_at")
      .single();

    if (insertErr) {
      console.error("[contracts] Error creating contract");
      return NextResponse.json({ error: "Error al crear contrato" }, { status: 500 });
    }

    return NextResponse.json({ contract }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

/**
 * PUT /api/contracts
 * Update a contract (trainer: edit draft/send; client: mark as viewed).
 * Body: { id, title?, content?, status? }
 */
export async function PUT(request: NextRequest) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serverSupabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    const body = await request.json();
    const { id, title, content, status } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the existing contract for ownership validation
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("contracts")
      .select("id, trainer_id, client_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    const role = user.user_metadata?.role;

    if (role === "trainer") {
      if (existing.trainer_id !== user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      const updates: Record<string, unknown> = {};

      if (title && typeof title === "string") {
        updates.title = sanitizeName(title);
      }
      if (content && typeof content === "string") {
        updates.content = sanitizeText(content, 50000);
      }
      if (status && typeof status === "string" && VALID_STATUSES.includes(status)) {
        // Trainer can send a draft, or expire a sent contract
        if (status === "sent" && existing.status !== "draft") {
          return NextResponse.json({ error: "Solo se pueden enviar borradores" }, { status: 400 });
        }
        if (status === "expired" && !["sent", "viewed"].includes(existing.status)) {
          return NextResponse.json({ error: "Solo se pueden expirar contratos enviados o vistos" }, { status: 400 });
        }
        updates.status = status;
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("contracts")
        .update(updates)
        .eq("id", id)
        .select("id, trainer_id, client_id, template_id, title, content, status, signed_at, pdf_url, created_at, updated_at")
        .single();

      if (updateErr) {
        console.error("[contracts] Error updating contract");
        return NextResponse.json({ error: "Error al actualizar contrato" }, { status: 500 });
      }

      return NextResponse.json({ contract: updated });
    }

    if (role === "client") {
      if (existing.client_id !== user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      // Client can only mark as viewed
      if (existing.status !== "sent") {
        return NextResponse.json({ error: "Este contrato no se puede marcar como visto" }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("contracts")
        .update({ status: "viewed" })
        .eq("id", id)
        .select("id, trainer_id, client_id, title, content, status, signed_at, pdf_url, created_at, updated_at")
        .single();

      if (updateErr) {
        console.error("[contracts] Error marking contract viewed");
        return NextResponse.json({ error: "Error al actualizar contrato" }, { status: 500 });
      }

      return NextResponse.json({ contract: updated });
    }

    return NextResponse.json({ error: "Rol no autorizado" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

/**
 * DELETE /api/contracts
 * Delete a draft contract (trainer only).
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serverSupabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
    }

    if (user.user_metadata?.role !== "trainer") {
      return NextResponse.json({ error: "Solo entrenadores pueden eliminar contratos" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership and draft status
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("contracts")
      .select("id, trainer_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    if (existing.trainer_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Solo se pueden eliminar borradores" }, { status: 400 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from("contracts")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      console.error("[contracts] Error deleting contract");
      return NextResponse.json({ error: "Error al eliminar contrato" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
