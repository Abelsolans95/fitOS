import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true, remaining: 1, resetAt: 0 })) },
  getClientIdentifier: vi.fn(() => "ip:1.2.3.4"),
}));

import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { apiLimiter } from "@/lib/rate-limit";
import { verifyAdmin } from "./admin-auth";

function makeReq(): NextRequest {
  return new NextRequest("https://x/api/admin");
}

function mockAuth(user: { id: string; user_metadata?: Record<string, unknown> } | null) {
  vi.mocked(createServerClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
  } as never);
}

function mockProfile(role: string | null) {
  vi.mocked(createSbClient).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: role === null ? null : { role },
            error: role === null ? new Error("not found") : null,
          }),
        }),
      }),
    }),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiLimiter.check).mockReturnValue({ success: true, remaining: 1, resetAt: 0 });
});

describe("verifyAdmin", () => {
  it("rejects unauthenticated request with 401", async () => {
    mockAuth(null);
    const { auth, errorResponse } = await verifyAdmin(makeReq());
    expect(auth).toBe(null);
    expect(errorResponse?.status).toBe(401);
  });

  it("rejects user with non-admin JWT role with 403 (fast path)", async () => {
    mockAuth({ id: "u1", user_metadata: { role: "client" } });
    const { auth, errorResponse } = await verifyAdmin(makeReq());
    expect(auth).toBe(null);
    expect(errorResponse?.status).toBe(403);
  });

  it("rejects user with admin JWT but non-admin profile (gotcha #121 — JWT spoofable)", async () => {
    // Attacker signed up with { data: { role: "admin" } } — JWT says admin,
    // but profiles.role is "trainer". verifyAdmin MUST reject.
    mockAuth({ id: "u1", user_metadata: { role: "admin" } });
    mockProfile("trainer");
    const { auth, errorResponse } = await verifyAdmin(makeReq());
    expect(auth).toBe(null);
    expect(errorResponse?.status).toBe(403);
  });

  it("accepts genuine admin (JWT + profiles.role both admin)", async () => {
    mockAuth({ id: "u1", user_metadata: { role: "admin" } });
    mockProfile("admin");
    const { auth, errorResponse } = await verifyAdmin(makeReq());
    expect(errorResponse).toBe(null);
    expect(auth?.userId).toBe("u1");
    expect(auth?.supabaseAdmin).toBeDefined();
  });

  it("rejects with 429 when rate-limited", async () => {
    mockAuth({ id: "u1", user_metadata: { role: "admin" } });
    vi.mocked(apiLimiter.check).mockReturnValue({ success: false, remaining: 0, resetAt: 0 });
    const { auth, errorResponse } = await verifyAdmin(makeReq());
    expect(auth).toBe(null);
    expect(errorResponse?.status).toBe(429);
  });
});
