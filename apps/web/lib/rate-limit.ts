/**
 * Simple in-memory rate limiter for API routes.
 *
 * Works on Vercel Serverless (per-invocation memory) and long-running servers.
 * For true distributed rate limiting (multiple instances), use Upstash Redis.
 *
 * Usage in API routes:
 *   const limiter = createRateLimiter({ interval: 60_000, maxRequests: 30 });
 *   // In handler:
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
