import { describe, it, expect, vi, afterEach } from "vitest";
import { timeAgo } from "./utils";

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function dateMinutesAgo(mins: number): string {
    return new Date(Date.now() - mins * 60000).toISOString();
  }

  it('returns "ahora" for dates less than 1 minute ago', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("ahora");
  });

  it('returns "ahora" for date just seconds ago', () => {
    const fewSecsAgo = new Date(Date.now() - 30_000).toISOString();
    expect(timeAgo(fewSecsAgo)).toBe("ahora");
  });

  it('returns "hace Xm" for dates minutes ago', () => {
    expect(timeAgo(dateMinutesAgo(5))).toBe("hace 5m");
    expect(timeAgo(dateMinutesAgo(1))).toBe("hace 1m");
    expect(timeAgo(dateMinutesAgo(59))).toBe("hace 59m");
  });

  it('returns "hace Xh" for dates hours ago', () => {
    expect(timeAgo(dateMinutesAgo(60))).toBe("hace 1h");
    expect(timeAgo(dateMinutesAgo(120))).toBe("hace 2h");
    expect(timeAgo(dateMinutesAgo(23 * 60))).toBe("hace 23h");
  });

  it('returns "hace Xd" for dates days ago', () => {
    expect(timeAgo(dateMinutesAgo(24 * 60))).toBe("hace 1d");
    expect(timeAgo(dateMinutesAgo(3 * 24 * 60))).toBe("hace 3d");
    expect(timeAgo(dateMinutesAgo(6 * 24 * 60))).toBe("hace 6d");
  });

  it("returns formatted date for dates 7+ days ago", () => {
    const twoWeeksAgo = dateMinutesAgo(14 * 24 * 60);
    const result = timeAgo(twoWeeksAgo);
    // Should be a localized date string like "20 mar" — not a relative string
    expect(result).not.toMatch(/^hace/);
    expect(result).toMatch(/\d{1,2}\s\w+/);
  });

  it("handles exact boundary between minutes and hours", () => {
    // 60 minutes = 1 hour
    expect(timeAgo(dateMinutesAgo(60))).toBe("hace 1h");
  });

  it("handles exact boundary between hours and days", () => {
    // 24 hours = 1 day
    expect(timeAgo(dateMinutesAgo(24 * 60))).toBe("hace 1d");
  });
});
