/**
 * In-memory TTL cache for deduplicating resolver queries within a page load.
 *
 * Cross-platform (web + mobile) — no Node- or browser-specific APIs.
 * Default TTL: 30 seconds.
 */

const DEFAULT_TTL_MS = 30_000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

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
