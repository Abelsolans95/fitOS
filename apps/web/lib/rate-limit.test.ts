import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter, getClientIdentifier } from "./rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ interval: 1000, maxRequests: 3 });
    expect(limiter.check("u1").success).toBe(true);
    expect(limiter.check("u1").success).toBe(true);
    expect(limiter.check("u1").success).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    const limiter = createRateLimiter({ interval: 1000, maxRequests: 2 });
    expect(limiter.check("u1").success).toBe(true);
    expect(limiter.check("u1").success).toBe(true);
    expect(limiter.check("u1").success).toBe(false);
  });

  it("resets the counter after the interval elapses", () => {
    const limiter = createRateLimiter({ interval: 1000, maxRequests: 1 });
    expect(limiter.check("u1").success).toBe(true);
    expect(limiter.check("u1").success).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(limiter.check("u1").success).toBe(true);
  });

  it("scopes counters per identifier", () => {
    const limiter = createRateLimiter({ interval: 1000, maxRequests: 1 });
    expect(limiter.check("u1").success).toBe(true);
    expect(limiter.check("u2").success).toBe(true);
    expect(limiter.check("u1").success).toBe(false);
  });

  it("reports remaining count correctly", () => {
    const limiter = createRateLimiter({ interval: 1000, maxRequests: 3 });
    expect(limiter.check("u1").remaining).toBe(2);
    expect(limiter.check("u1").remaining).toBe(1);
    expect(limiter.check("u1").remaining).toBe(0);
  });
});

describe("getClientIdentifier", () => {
  it("prefers userId when provided", () => {
    const req = new Request("https://x", { headers: { "x-forwarded-for": "1.2.3.4" } });
    expect(getClientIdentifier(req, "alice")).toBe("user:alice");
  });

  it("falls back to X-Forwarded-For IP", () => {
    const req = new Request("https://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(getClientIdentifier(req)).toBe("ip:1.2.3.4");
  });

  it("returns ip:unknown when no identifier available", () => {
    const req = new Request("https://x");
    expect(getClientIdentifier(req)).toBe("ip:unknown");
  });
});
