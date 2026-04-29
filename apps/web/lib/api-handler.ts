/**
 * Declarative API route wrapper.
 *
 * Eliminates the boilerplate (CSRF → rate-limit → auth → role → body parse → validate)
 * that every /api/* route repeats. The defenses are applied by construction — you can't
 * forget them by accident. This is the mechanism that prevents gotchas #68, #93, #94,
 * #97, #138 from ever happening again.
 *
 * Usage:
 *   export const POST = handler({
 *     rateLimit: apiLimiter,
 *     csrf: true,
 *     auth: "required",
 *     role: "admin",
 *     body: z.object({ email: z.string().email() }),
 *   }, async ({ user, admin, body }) => {
 *     // your logic — all inputs already validated, all defenses already applied
 *     return NextResponse.json({ ok: true });
 *   });
 *
 * Read-only GET routes can skip CSRF/body and just declare auth+rateLimit.
 */

import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateCsrf } from "@/lib/csrf";
import { apiLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type Role = "trainer" | "client" | "admin";

type RateLimiter = { check: (id: string) => { success: boolean } };

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
type SupabaseAdmin = ReturnType<typeof createAdminClient>;

interface HandlerOptions<B> {
  /** Apply CSRF validation — defaults to true for POST/PUT/DELETE/PATCH. */
  csrf?: boolean;
  /** Rate limiter instance. Set to false to disable (tests only). Defaults to apiLimiter. */
  rateLimit?: RateLimiter | false;
  /** Auth mode. "required" = user must be logged in. "optional" = logged-in info passed if present. */
  auth?: "required" | "optional" | "none";
  /**
   * Role enforcement. Only evaluated when auth === "required".
   * "admin" triggers a DB-level profiles.role check (gotcha #121).
   * "trainer"/"client" use JWT metadata (cheaper).
   */
  role?: Role;
  /** Zod schema for the JSON body. Required routes must declare it to get `body`. */
  body?: z.ZodType<B>;
}

interface HandlerContext<B, P> {
  request: NextRequest;
  /** Authenticated user — null iff auth === "optional" and no session. */
  user: { id: string; email?: string; user_metadata: Record<string, unknown> } | null;
  /** Server Supabase client bound to the caller's cookies. */
  supabase: SupabaseServer;
  /** Admin (service_role) client. Only use after ownership/role checks. */
  admin: SupabaseAdmin;
  /** Parsed + validated JSON body. `undefined` if no `body` schema was declared. */
  body: B;
  /** Route params (from Next.js context.params — already awaited). */
  params: P;
}

type Handler<B, P, R = NextResponse> = (
  ctx: HandlerContext<B, P>
) => Promise<R>;

type NextRouteContext<P> = { params: Promise<P> };

const MUTATING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

/**
 * Wrap a route handler with the standard defense stack.
 * Order: CSRF → rate-limit → auth → role → body parse/validate → handler.
 */
export function handler<B = undefined, P = Record<string, string>>(
  options: HandlerOptions<B>,
  fn: Handler<B, P>
): (request: NextRequest, context: NextRouteContext<P>) => Promise<NextResponse> {
  return async (request, context) => {
    try {
      // 1. CSRF — default on for mutating methods.
      const shouldCsrf = options.csrf ?? MUTATING_METHODS.has(request.method);
      if (shouldCsrf && !validateCsrf(request)) {
        logger.security("CSRF validation failed", {
          path: request.nextUrl.pathname,
          method: request.method,
        });
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // 2. Rate limit — default apiLimiter.
      const limiter = options.rateLimit === false ? null : options.rateLimit ?? apiLimiter;
      if (limiter) {
        // We bind to user id once auth runs; pre-auth fallback is IP.
        const id = getClientIdentifier(request);
        const rl = limiter.check(id);
        if (!rl.success) {
          return NextResponse.json(
            { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
            { status: 429 }
          );
        }
      }

      // 3. Auth.
      const supabase = await createClient();
      let user: HandlerContext<B, P>["user"] = null;
      if (options.auth !== "none") {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user && !error) {
          user = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: (data.user.user_metadata ?? {}) as Record<string, unknown>,
          };
        }
        if (options.auth === "required" && !user) {
          return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
      }

      // 4. Role check.
      const admin = createAdminClient();
      if (user && options.role) {
        if (options.role === "admin") {
          // DB-verified admin (gotcha #121 — JWT is spoofable, profiles.role is source of truth).
          const { data: profile, error } = await admin
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();
          if (error || profile?.role !== "admin") {
            logger.security("Admin role check failed", { userId: user.id });
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        } else if (user.user_metadata.role !== options.role) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      // 5. Body parse + validate.
      let body: B = undefined as unknown as B;
      if (options.body) {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
        }
        const parsed = options.body.safeParse(raw);
        if (!parsed.success) {
          return NextResponse.json(
            {
              error: "Datos inválidos",
              issues: parsed.error.issues.map((i) => ({
                path: i.path.join("."),
                code: i.code,
              })),
            },
            { status: 400 }
          );
        }
        body = parsed.data;
      }

      // 6. Route params (Next 15 makes them a Promise).
      const params = (await context.params) ?? ({} as P);

      return await fn({ request, user, supabase, admin, body, params });
    } catch (err) {
      logger.error("[api-handler] Unhandled error", {
        path: request.nextUrl.pathname,
        method: request.method,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
    }
  };
}
