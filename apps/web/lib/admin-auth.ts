/**
 * Admin auth helper — verifies admin role + returns service_role client.
 * Used by all /api/admin/* routes.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = ReturnType<typeof createClient<any>>;

export interface AdminAuthResult {
  userId: string;
  supabaseAdmin: AnySupabaseClient;
}

/**
 * Verify admin role and return service_role client.
 * Returns null + sends error response if auth fails.
 *
 * SECURITY: Double verification — checks BOTH user_metadata (JWT) AND profiles.role (DB).
 * user_metadata alone is insufficient because an attacker can signUp() with { data: { role: "admin" } }.
 * The prevent_role_change() trigger only blocks UPDATE, not initial INSERT.
 * profiles.role is the source of truth — only set via onboarding (trainer/client) or admin creation.
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<{ auth: AdminAuthResult | null; errorResponse: NextResponse | null }> {
  // 1. Verify session
  const authClient = await createServerClient();
  const { data: { user }, error: authErr } = await authClient.auth.getUser();

  if (authErr || !user) {
    return { auth: null, errorResponse: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  // 2. Quick check on JWT metadata (fast rejection for non-admin)
  if (user.user_metadata?.role !== "admin") {
    return { auth: null, errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // 3. Rate limiting
  const { success } = apiLimiter.check(getClientIdentifier(request, user.id));
  if (!success) {
    return { auth: null, errorResponse: NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 }) };
  }

  // 4. Build service_role client INSIDE handler (Rule 40)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5. CRITICAL: Verify profiles.role in DB — prevents signUp() role spoofing
  // An attacker can set role: "admin" in user_metadata during signUp, but cannot
  // create a profile with role: "admin" (RLS blocks it, onboarding only creates trainer/client).
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileErr || !profile || profile.role !== "admin") {
    return { auth: null, errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    auth: { userId: user.id, supabaseAdmin },
    errorResponse: null,
  };
}
