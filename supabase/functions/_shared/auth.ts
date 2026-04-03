/**
 * Shared authentication helper for Edge Functions.
 * Validates JWT, extracts user, and optionally checks role.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthResult {
  user: { id: string; role: string | null };
  supabase: ReturnType<typeof createClient>;
}

/**
 * Authenticate the request and return the user + Supabase client.
 * Throws a Response if authentication fails.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Response(
      JSON.stringify({ error: "Authorization required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxBytes) {
    throw new Response(
      JSON.stringify({ error: `Payload demasiado grande (max ${Math.round(maxBytes / 1024)}KB)` }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = await req.text();
  if (body.length > maxBytes) {
    throw new Response(
      JSON.stringify({ error: `Payload demasiado grande (max ${Math.round(maxBytes / 1024)}KB)` }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return body;
}

/** Sanitize a string for use in AI prompts — strip HTML and control chars */
export function sanitizeForPrompt(input: string, maxLength = 2000): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export { corsHeaders };
