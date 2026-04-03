import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service_role key for admin operations.
 * MUST only be called inside API route handlers, NEVER at module level.
 * MUST only be used AFTER auth + role verification (Rule 94).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
