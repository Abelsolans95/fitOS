import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/csrf", () => ({
  validateCsrf: vi.fn(() => true),
}));
vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true, remaining: 1, resetAt: 0 })) },
  getClientIdentifier: vi.fn(() => "ip:1.2.3.4"),
}));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), security: vi.fn() },
}));

import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateCsrf } from "@/lib/csrf";
import { apiLimiter } from "@/lib/rate-limit";
import { handler } from "./api-handler";

function makeReq(method = "POST", body?: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://x/api/test", {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json", ...headers },
  });
}

function mockAuthUser(user: { id: string; user_metadata?: Record<string, unknown> } | null) {
  vi.mocked(createServerClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
  } as never);
}

function mockProfileRole(role: string) {
  vi.mocked(createAdminClient).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role }, error: null }),
        }),
      }),
    }),
  } as never);
}

const ctx = { params: Promise.resolve({}) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(validateCsrf).mockReturnValue(true);
  vi.mocked(apiLimiter.check).mockReturnValue({ success: true, remaining: 1, resetAt: 0 });
  vi.mocked(createAdminClient).mockReturnValue({} as never);
});

describe("handler — defense stack", () => {
  it("returns 403 when CSRF fails", async () => {
    vi.mocked(validateCsrf).mockReturnValue(false);
    const fn = handler({ auth: "none" }, async () => NextResponse.json({ ok: true }));
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(403);
  });

  it("skips CSRF for GET by default", async () => {
    vi.mocked(validateCsrf).mockReturnValue(false);
    const fn = handler({ auth: "none" }, async () => NextResponse.json({ ok: true }));
    const res = await fn(makeReq("GET"), ctx);
    expect(res.status).toBe(200);
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(apiLimiter.check).mockReturnValue({ success: false, remaining: 0, resetAt: 0 });
    const fn = handler({ auth: "none" }, async () => NextResponse.json({ ok: true }));
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(429);
  });

  it("returns 401 when auth required but no user", async () => {
    mockAuthUser(null);
    const fn = handler({ auth: "required" }, async () => NextResponse.json({ ok: true }));
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(401);
  });

  it("passes user to handler when authenticated", async () => {
    mockAuthUser({ id: "u1", user_metadata: { role: "trainer" } });
    const fn = handler({ auth: "required" }, async ({ user }) => NextResponse.json({ id: user?.id }));
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "u1" });
  });

  it("rejects wrong metadata role with 403", async () => {
    mockAuthUser({ id: "u1", user_metadata: { role: "client" } });
    const fn = handler({ auth: "required", role: "trainer" }, async () => NextResponse.json({ ok: true }));
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(403);
  });

  it("for role=admin performs DB check (gotcha #121)", async () => {
    // JWT says admin, but DB profiles.role says trainer → must reject.
    mockAuthUser({ id: "u1", user_metadata: { role: "admin" } });
    mockProfileRole("trainer");
    const fn = handler({ auth: "required", role: "admin" }, async () => NextResponse.json({ ok: true }));
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(403);
  });

  it("accepts genuine admin (JWT + DB both admin)", async () => {
    mockAuthUser({ id: "u1", user_metadata: { role: "admin" } });
    mockProfileRole("admin");
    const fn = handler({ auth: "required", role: "admin" }, async () => NextResponse.json({ ok: true }));
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(200);
  });

  it("validates body schema and returns 400 with issue paths only", async () => {
    const fn = handler(
      { auth: "none", body: z.object({ name: z.string(), age: z.number().int().positive() }) },
      async () => NextResponse.json({ ok: true })
    );
    const res = await fn(makeReq("POST", { name: 1, age: -1 }), ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Datos inválidos");
    expect(Array.isArray(body.issues)).toBe(true);
    // PII safety: issues expose `path` + `code` but never values.
    for (const issue of body.issues) {
      expect(Object.keys(issue).sort()).toEqual(["code", "path"]);
    }
  });

  it("passes validated body to handler", async () => {
    const fn = handler(
      { auth: "none", body: z.object({ name: z.string() }) },
      async ({ body }) => NextResponse.json({ echo: body.name })
    );
    const res = await fn(makeReq("POST", { name: "alice" }), ctx);
    expect(await res.json()).toEqual({ echo: "alice" });
  });

  it("returns 400 on invalid JSON body", async () => {
    const fn = handler(
      { auth: "none", body: z.object({}) },
      async () => NextResponse.json({ ok: true })
    );
    const req = new NextRequest("https://x/api/test", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    });
    const res = await fn(req, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 500 on unhandled handler error", async () => {
    const fn = handler({ auth: "none" }, async () => {
      throw new Error("kaboom");
    });
    const res = await fn(makeReq(), ctx);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Error inesperado" });
  });
});
