import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Valid canonical-lowercase UUIDs (gotcha #148) ──
const USER_UUID = "11111111-aaaa-bbbb-cccc-111111111111";
const ADMIN_UUID = "22222222-aaaa-bbbb-cccc-222222222222";
const BAD_UUID = "33333333-aaaa-bbbb-cccc-333333333333";

// ── Mock supabase admin + auth stack ──
const mockSupabaseAdmin = { from: vi.fn() };

vi.mock("@/lib/admin-auth", () => ({
  verifyAdmin: vi.fn(() =>
    Promise.resolve({
      auth: { userId: "admin-1", supabaseAdmin: mockSupabaseAdmin },
      errorResponse: null,
    })
  ),
}));

vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));

// The new declarative handler uses supabase-server for getUser() + supabase-admin for profile role.
vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: { id: "admin-1", email: "a@b.co", user_metadata: { role: "admin" } },
        },
        error: null,
      }),
    },
  })),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(() => mockSupabaseAdmin),
}));

vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true, remaining: 1, resetAt: 0 })) },
  getClientIdentifier: vi.fn(() => "ip:1.2.3.4"),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), security: vi.fn() },
}));

import { GET, PUT } from "./route";
import { NextRequest } from "next/server";

// ── Helpers ──
function createChain(result: { data: unknown; error: unknown; count?: number | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const m of ["select", "eq", "in", "ilike", "update", "single", "order", "range"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
    Promise.resolve(result).then(ok, fail);
  return chain;
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/menus");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return {
    url: url.toString(),
    headers: new Headers({ origin: "http://localhost:3000" }),
    method: "GET",
  } as unknown as NextRequest;
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/admin/menus", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
  });
}

const routeCtx = { params: Promise.resolve({}) };

describe("GET /api/admin/menus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated users with menus_enabled", async () => {
    const countChain = createChain({ data: null, error: null, count: 2 });
    const dataChain = createChain({
      data: [
        { user_id: "u1", full_name: "Ana", role: "trainer", menus_enabled: true },
        { user_id: "u2", full_name: "Juan", role: "client", menus_enabled: false },
      ],
      error: null,
    });

    let callCount = 0;
    mockSupabaseAdmin.from.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : dataChain;
    });

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.users).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it("filters by role", async () => {
    const countChain = createChain({ data: null, error: null, count: 1 });
    const dataChain = createChain({
      data: [{ user_id: "u1", full_name: "Ana", role: "trainer", menus_enabled: true }],
      error: null,
    });

    let callCount = 0;
    mockSupabaseAdmin.from.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : dataChain;
    });

    const res = await GET(makeGetRequest({ role: "trainer" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.users).toHaveLength(1);
    expect(countChain.eq).toHaveBeenCalledWith("role", "trainer");
  });
});

describe("PUT /api/admin/menus (migrated to handler wrapper)", () => {
  beforeEach(() => vi.clearAllMocks());

  function mockAdminProfileCheck() {
    // The handler wrapper does a profiles.role SELECT to verify DB-level admin.
    const roleCheckChain = createChain({ data: { role: "admin" }, error: null });
    mockSupabaseAdmin.from.mockImplementationOnce(() => roleCheckChain);
  }

  it("toggles menus_enabled for a user", async () => {
    mockAdminProfileCheck();
    const fetchChain = createChain({
      data: { user_id: USER_UUID, role: "trainer" },
      error: null,
    });
    const updateChain = createChain({ data: null, error: null });
    mockSupabaseAdmin.from
      .mockImplementationOnce(() => fetchChain)
      .mockImplementationOnce(() => updateChain);

    const res = await PUT(
      makePutRequest({ user_id: USER_UUID, menus_enabled: false }),
      routeCtx
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.menus_enabled).toBe(false);
  });

  it("returns 400 when user_id is missing (zod rejects)", async () => {
    mockAdminProfileCheck();
    const res = await PUT(makePutRequest({ menus_enabled: false }), routeCtx);
    expect(res.status).toBe(400);
  });

  it("returns 400 when menus_enabled is not boolean (zod rejects)", async () => {
    mockAdminProfileCheck();
    const res = await PUT(
      makePutRequest({ user_id: USER_UUID, menus_enabled: "yes" }),
      routeCtx
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when user_id is not a valid UUID (gotcha #148)", async () => {
    mockAdminProfileCheck();
    const res = await PUT(
      makePutRequest({ user_id: "not-a-uuid", menus_enabled: false }),
      routeCtx
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when user does not exist", async () => {
    mockAdminProfileCheck();
    mockSupabaseAdmin.from.mockImplementationOnce(() =>
      createChain({ data: null, error: { message: "not found" } })
    );

    const res = await PUT(
      makePutRequest({ user_id: BAD_UUID, menus_enabled: false }),
      routeCtx
    );
    expect(res.status).toBe(404);
  });

  it("rejects toggling for admin users", async () => {
    mockAdminProfileCheck();
    mockSupabaseAdmin.from.mockImplementationOnce(() =>
      createChain({ data: { user_id: ADMIN_UUID, role: "admin" }, error: null })
    );

    const res = await PUT(
      makePutRequest({ user_id: ADMIN_UUID, menus_enabled: false }),
      routeCtx
    );
    expect(res.status).toBe(400);
  });
});
