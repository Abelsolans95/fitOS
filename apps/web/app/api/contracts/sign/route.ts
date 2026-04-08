import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

/**
 * POST /api/contracts/sign
 * Sign a contract (client only).
 * Body: { id, signature_data }
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

    if (user.user_metadata?.role !== "client") {
      return NextResponse.json({ error: "Solo clientes pueden firmar contratos" }, { status: 403 });
    }

    const body = await request.json();
    const { id, signature_data } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    if (!signature_data || typeof signature_data !== "string") {
      return NextResponse.json({ error: "signature_data es requerido" }, { status: 400 });
    }

    // Limit signature data size (base64 canvas ~ 50KB max)
    if (signature_data.length > 100000) {
      return NextResponse.json({ error: "Firma demasiado grande" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch contract and verify ownership + status
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("contracts")
      .select("id, client_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    if (existing.client_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!["sent", "viewed"].includes(existing.status)) {
      return NextResponse.json({ error: "Este contrato no se puede firmar" }, { status: 400 });
    }

    // Extract signer IP
    const forwarded = request.headers.get("x-forwarded-for");
    const signerIp = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("contracts")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signature_data,
        signer_ip: signerIp,
      })
      .eq("id", id)
      .select("id, trainer_id, client_id, title, content, status, signed_at, pdf_url, created_at, updated_at")
      .single();

    if (updateErr) {
      console.error("[contracts/sign] Error signing contract");
      return NextResponse.json({ error: "Error al firmar contrato" }, { status: 500 });
    }

    return NextResponse.json({ contract: updated });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
