import { describe, it, expect } from "vitest";
import { isAllowedVideoUrl, sanitizeVideoUrl, isSafeHttpsUrl } from "./url-validation";

describe("isAllowedVideoUrl", () => {
  it("accepts YouTube HTTPS URLs", () => {
    expect(isAllowedVideoUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isAllowedVideoUrl("https://youtu.be/abc")).toBe(true);
    expect(isAllowedVideoUrl("https://www.youtube-nocookie.com/embed/xyz")).toBe(true);
  });

  it("accepts Vimeo HTTPS URLs", () => {
    expect(isAllowedVideoUrl("https://vimeo.com/12345")).toBe(true);
    expect(isAllowedVideoUrl("https://player.vimeo.com/video/123")).toBe(true);
  });

  it("rejects http:// (requires HTTPS)", () => {
    expect(isAllowedVideoUrl("http://www.youtube.com/watch?v=abc")).toBe(false);
  });

  it("rejects javascript: URLs (gotcha #88 — XSS via video URL)", () => {
    expect(isAllowedVideoUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects foreign domains", () => {
    expect(isAllowedVideoUrl("https://evil.com/video")).toBe(false);
  });

  it("rejects subdomain impersonation", () => {
    expect(isAllowedVideoUrl("https://youtube.com.evil.com/v")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isAllowedVideoUrl("")).toBe(false);
    expect(isAllowedVideoUrl("not a url")).toBe(false);
    // @ts-expect-error runtime hardening
    expect(isAllowedVideoUrl(null)).toBe(false);
  });
});

describe("sanitizeVideoUrl", () => {
  it("returns null for invalid URLs", () => {
    expect(sanitizeVideoUrl("https://evil.com")).toBe(null);
    expect(sanitizeVideoUrl(null)).toBe(null);
    expect(sanitizeVideoUrl("")).toBe(null);
    expect(sanitizeVideoUrl("   ")).toBe(null);
  });

  it("returns trimmed URL if allowed", () => {
    expect(sanitizeVideoUrl("  https://youtu.be/abc  ")).toBe("https://youtu.be/abc");
  });
});

describe("isSafeHttpsUrl", () => {
  it("accepts https", () => {
    expect(isSafeHttpsUrl("https://example.com")).toBe(true);
  });

  it("rejects http, javascript, data, file", () => {
    expect(isSafeHttpsUrl("http://example.com")).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeHttpsUrl("file:///etc/passwd")).toBe(false);
  });
});
