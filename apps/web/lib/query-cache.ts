/**
 * Simple in-memory TTL cache for deduplicating Supabase queries
 * within the same page load / server request.
 *
 * Default TTL: 30 seconds — long enough to avoid duplicate queries
 * from multiple components mounting, short enough to stay fresh.
 */

const DEFAULT_TTL_MS = 30_000;

const cache = new Map<string, { data: unknown; expiresAt: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidate cache entries. If prefix is provided, only keys starting
 * with that prefix are removed. Otherwise the entire cache is cleared.
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
