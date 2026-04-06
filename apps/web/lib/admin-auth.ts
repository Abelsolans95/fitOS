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

  // 2. Verify admin role (fail-closed: DB error = 403)
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

  return {
    auth: { userId: user.id, supabaseAdmin },
    errorResponse: null,
  };
}
