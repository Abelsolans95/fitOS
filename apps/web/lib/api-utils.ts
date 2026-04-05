import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// ─── Standard API response helpers ───────────────────────────────────────────

export function successResponse(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ─── Auth helpers ────────────────────────────────────────────────────────────

type Role = "trainer" | "client" | "admin";

interface AuthResult {
  user: { id: string; email?: string; user_metadata: Record<string, unknown> };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Verify the request comes from an authenticated user.
 * Returns the user and server supabase client, or a NextResponse error.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return errorResponse("No autenticado", 401);
  }

  return { user, supabase };
}

/**
 * Verify authenticated user has the expected role (from JWT metadata).
 * Returns error response if role doesn't match.
 */
export function requireMetadataRole(
  user: AuthResult["user"],
  role: Role
): NextResponse | null {
  if (user.user_metadata?.role !== role) {
    return errorResponse("Forbidden", 403);
  }
  return null;
}

/**
 * Verify authenticated user has the expected role in the profiles DB table.
 * More secure than metadata check — queries the database.
 * Returns the admin client for further operations, or error response.
 */
export async function requireDbRole(
  userId: string,
  role: Role
): Promise<{ admin: ReturnType<typeof createAdminClient> } | NextResponse> {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || profile?.role !== role) {
    return errorResponse("Forbidden", 403);
  }

  return { admin };
}

/**
 * Combined: require auth + metadata role check.
 * Use for lightweight role checks (most routes).
 */
export async function requireAuthWithRole(
  role: Role
): Promise<(AuthResult & { admin: ReturnType<typeof createAdminClient> }) | NextResponse> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireMetadataRole(authResult.user, role);
  if (roleCheck) return roleCheck;

  const admin = createAdminClient();
  return { ...authResult, admin };
}

// ─── Safe JSON body parsing ──────────────────────────────────────────────────

export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T;
  } catch {
    return errorResponse("JSON inválido", 400);
  }
}
