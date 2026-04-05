/**
 * Shared authentication helper for Edge Functions.
 * Validates JWT, extracts user, and optionally checks role.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SECURITY: Restrict CORS to actual app domains instead of wildcard
const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Fallback: allow if origin matches Vercel preview deploys
  if (origin.endsWith(".vercel.app")) return origin;
  return ALLOWED_ORIGINS[0];
}

export function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}


interface AuthResult {
  user: { id: string; role: string | null };
  supabase: ReturnType<typeof createClient>;
}

/**
 * Authenticate the request and return the user + Supabase client.
 * Throws a Response if authentication fails.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const headers = getCorsHeaders(req);
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Response(
      JSON.stringify({ error: "Authorization required" }),
      { status: 401, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Response(
      JSON.stringify({ error: "Token invalido o expirado" }),
      { status: 401, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  return {
    user: { id: user.id, role: user.user_metadata?.role ?? null },
    supabase,
  };
}

/**
 * Validate request body size (prevent JSONB bombs).
 * Default max: 1MB.
 */
export async function validateBodySize(req: Request, maxBytes = 1_048_576): Promise<string> {
  const headers = getCorsHeaders(req);
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxBytes) {
    throw new Response(
      JSON.stringify({ error: `Payload demasiado grande (max ${Math.round(maxBytes / 1024)}KB)` }),
      { status: 413, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  const body = await req.text();
  if (body.length > maxBytes) {
    throw new Response(
      JSON.stringify({ error: `Payload demasiado grande (max ${Math.round(maxBytes / 1024)}KB)` }),
      { status: 413, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  return body;
}

/**
 * Sanitize a string for use in AI prompts.
 * Strips HTML, control chars, and prompt injection delimiters.
 */
export function sanitizeForPrompt(input: string, maxLength = 2000): string {
  if (!input || typeof input !== "string") return "";
  let clean = input;
  // Strip HTML tags (loop until stable to prevent nested tag bypass)
  let prev = "";
  while (prev !== clean) {
    prev = clean;
    clean = clean.replace(/<[^>]*>/g, "");
  }
  // Remove control characters
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Remove prompt injection delimiters that could break Claude's prompt structure
  clean = clean.replace(/\n\s*(Human|Assistant|System)\s*:/gi, " ");
  clean = clean.replace(/<\/?system>/gi, "");
  clean = clean.replace(/<\/?user>/gi, "");
  clean = clean.replace(/<\/?assistant>/gi, "");
  // Remove Unicode RTL override and other bidi control chars
  clean = clean.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
  return clean.trim().slice(0, maxLength);
}

