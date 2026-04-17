import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateCsrf } from "./csrf";

// We hand-roll a minimal Request surface because the fetch spec treats
// `Origin` and `Referer` as "forbidden" request headers — undici silently
// drops them when passed via `new Request(..., { headers: {...} })`, which
// makes it impossible to test header-driven logic against a real Request.
function makeRequest(method: string, headers: Record<string, string>): Request {
  return {
    method,
    headers: {
      get: (name: string) =>
        headers[name.toLowerCase()] ?? headers[name] ?? null,
    },
  } as unknown as Request;
}

describe("validateCsrf", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NEXT_PUBLIC_APP_URL;
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it("accepts POST from allowed localhost origin", () => {
    const req = makeRequest("POST", { origin: "http://localhost:3000" });
    expect(validateCsrf(req)).toBe(true);
  });

  it("rejects POST from foreign origin", () => {
    const req = makeRequest("POST", { origin: "https://evil.com" });
    expect(validateCsrf(req)).toBe(false);
  });

  it("rejects subdomain-bypass attempt", () => {
    // Gotcha #92: startsWith() bypass via `localhost:3000.evil.com`.
    // URL-based comparison must reject this.
    const req = makeRequest("POST", { origin: "https://localhost:3000.evil.com" });
    expect(validateCsrf(req)).toBe(false);
  });

  it("falls back to Referer when Origin missing", () => {
    const req = makeRequest("POST", { referer: "http://localhost:3000/app/foo" });
    expect(validateCsrf(req)).toBe(true);
  });

  it("blocks mutating methods without Origin or Referer", () => {
    const req = makeRequest("POST", {});
    expect(validateCsrf(req)).toBe(false);
  });

  it("allows GET/HEAD/OPTIONS without Origin/Referer", () => {
    expect(validateCsrf(makeRequest("GET", {}))).toBe(true);
    expect(validateCsrf(makeRequest("HEAD", {}))).toBe(true);
    expect(validateCsrf(makeRequest("OPTIONS", {}))).toBe(true);
  });

  it("accepts production URL from env", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://fitos.app";
    const req = makeRequest("POST", { origin: "https://fitos.app" });
    expect(validateCsrf(req)).toBe(true);
  });

  it("rejects malformed origin string", () => {
    const req = makeRequest("POST", { origin: "not-a-url" });
    expect(validateCsrf(req)).toBe(false);
  });
});
