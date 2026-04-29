/**
 * Rate limiter for API routes.
 *
 * LIMITATION (in-memory): the Map is scoped to a single serverless instance and
 * resets on cold start. It protects against rapid bursts within one warm lambda
 * but NOT against a distributed attack that spreads requests across cold starts.
 *
 * MIGRATION PATH TO DISTRIBUTED (Upstash Redis):
 *   1. `cd apps/web && npm install @upstash/ratelimit @upstash/redis --legacy-peer-deps`
 *   2. Create a Redis DB on console.upstash.com (free tier is enough for moderate traffic).
 *   3. Add to Vercel env + .env.local:
 *        UPSTASH_REDIS_REST_URL=...
 *        UPSTASH_REDIS_REST_TOKEN=...
 *   4. Replace the `check()` implementation with:
 *        import { Ratelimit } from "@upstash/ratelimit";
 *        import { Redis } from "@upstash/redis";
 *        const rl = new Ratelimit({
 *          redis: Redis.fromEnv(),
 *          limiter: Ratelimit.slidingWindow(maxRequests, `${interval} ms`),
 *          analytics: true,
 *          prefix: "fitos:rl",
 *        });
 *        // check(id) → await rl.limit(id) → { success, remaining, reset }
 *      Keep the `{ success, remaining, resetAt }` return shape so callers don't change.
 *   5. Keep the in-memory version as a fallback when env vars are missing (dev/preview
 *      without Redis) — gate with `UPSTASH_REDIS_REST_URL` presence.
 *
 * Usage in API routes (unchanged after migration):
 *   const limiter = createRateLimiter({ interval: 60_000, maxRequests: 30 });
 *   const { success } = limiter.check(userId || ip);
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  interval?: number;
  /** Max requests per window (default: 30) */
  maxRequests?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const { interval = 60_000, maxRequests = 30 } = options;
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leaks (every 5 minutes)
  let lastCleanup = Date.now();
  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < 300_000) return; // Only clean every 5 min
    lastCleanup = now;
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }

  return {
    check(identifier: string): RateLimitResult {
      cleanup();
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || entry.resetAt < now) {
        // New window
        store.set(identifier, { count: 1, resetAt: now + interval });
        return { success: true, remaining: maxRequests - 1, resetAt: now + interval };
      }

      entry.count++;

      if (entry.count > maxRequests) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
    },
  };
}

/**
 * Extract client identifier from request (user ID preferred, fallback to IP).
 */
export function getClientIdentifier(
  request: Request,
  userId?: string | null
): string {
  if (userId) return `user:${userId}`;
  // Vercel provides X-Forwarded-For; fallback to generic
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}

// Pre-configured limiters for common use cases
/** General API: 60 requests per minute */
export const apiLimiter = createRateLimiter({ interval: 60_000, maxRequests: 60 });
/** Auth endpoints: 10 requests per minute (brute-force protection) */
export const authLimiter = createRateLimiter({ interval: 60_000, maxRequests: 10 });
/** File upload: 10 uploads per minute */
export const uploadLimiter = createRateLimiter({ interval: 60_000, maxRequests: 10 });
