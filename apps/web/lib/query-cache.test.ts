import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCached, setCache, invalidateCache } from "./query-cache";

describe("query-cache", () => {
  beforeEach(() => {
    invalidateCache(); // clear all
  });

  it("returns null for missing keys", () => {
    expect(getCached("nonexistent")).toBeNull();
  });

  it("stores and retrieves cached values", () => {
    const data = [{ id: "1", name: "Bench Press" }];
    setCache("exercises:trainer-1", data);
    expect(getCached("exercises:trainer-1")).toEqual(data);
  });

  it("returns null for expired entries", () => {
    vi.useFakeTimers();
    setCache("exercises:trainer-1", [1, 2, 3], 100); // 100ms TTL
    vi.advanceTimersByTime(101);
    expect(getCached("exercises:trainer-1")).toBeNull();
    vi.useRealTimers();
  });

  it("returns value before TTL expires", () => {
    vi.useFakeTimers();
    setCache("exercises:trainer-1", "data", 1000);
    vi.advanceTimersByTime(500);
    expect(getCached("exercises:trainer-1")).toBe("data");
    vi.useRealTimers();
  });

  it("invalidateCache() clears all entries", () => {
    setCache("exercises:t1", "a");
    setCache("foods:t1", "b");
    invalidateCache();
    expect(getCached("exercises:t1")).toBeNull();
    expect(getCached("foods:t1")).toBeNull();
  });

  it("invalidateCache(prefix) clears only matching keys", () => {
    setCache("exercises:t1", "a");
    setCache("exercises:t2", "b");
    setCache("foods:t1", "c");
    invalidateCache("exercises:");
    expect(getCached("exercises:t1")).toBeNull();
    expect(getCached("exercises:t2")).toBeNull();
    expect(getCached("foods:t1")).toBe("c");
  });

  it("overwrites existing entry with new data and TTL", () => {
    setCache("key", "old");
    setCache("key", "new");
    expect(getCached("key")).toBe("new");
  });
});
