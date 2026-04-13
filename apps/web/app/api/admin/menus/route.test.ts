import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";

// ── Mock admin auth ──
const mockSupabaseAdmin = {
  from: vi.fn(),
};

vi.mock("@/lib/admin-auth", () => ({
  verifyAdmin: vi.fn(() =>
    Promise.resolve({
      auth: { userId: "admin-1", supabaseAdmin: mockSupabaseAdmin },
      errorResponse: null,
    })
  ),
}));

vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));

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

function makeRequest(params: Record<string, string> = {}, method = "GET", body?: Record<string, unknown>) {
  const url = new URL("http://localhost:3000/api/admin/menus");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return {
    url: url.toString(),
    json: body ? () => Promise.resolve(body) : undefined,
    headers: new Headers({ origin: "http://localhost:3000" }),
    method,
  } as unknown as Request;
}

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

    const res = await GET(makeRequest() as any);
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

    const res = await GET(makeRequest({ role: "trainer" }) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.users).toHaveLength(1);
    // Verify eq was called with "trainer" (role filter)
    expect(countChain.eq).toHaveBeenCalledWith("role", "trainer");
  });
});

describe("PUT /api/admin/menus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("toggles menus_enabled for a user", async () => {
    const fetchChain = createChain({
      data: { user_id: "u1", role: "trainer" },
      error: null,
    });
    const updateChain = createChain({ data: null, error: null });

    let callCount = 0;
    mockSupabaseAdmin.from.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const res = await PUT(
      makeRequest({}, "PUT", { user_id: "u1", menus_enabled: false }) as any
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.menus_enabled).toBe(false);
  });

  it("returns 400 when user_id is missing", async () => {
    const res = await PUT(
      makeRequest({}, "PUT", { menus_enabled: false }) as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when menus_enabled is not boolean", async () => {
    const res = await PUT(
      makeRequest({}, "PUT", { user_id: "u1", menus_enabled: "yes" }) as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when user does not exist", async () => {
    mockSupabaseAdmin.from.mockReturnValue(
      createChain({ data: null, error: { message: "not found" } })
    );

    const res = await PUT(
      makeRequest({}, "PUT", { user_id: "bad-id", menus_enabled: false }) as any
    );
    expect(res.status).toBe(404);
  });

  it("rejects toggling for admin users", async () => {
    mockSupabaseAdmin.from.mockReturnValue(
      createChain({ data: { user_id: "admin-1", role: "admin" }, error: null })
    );

    const res = await PUT(
      makeRequest({}, "PUT", { user_id: "admin-1", menus_enabled: false }) as any
    );
    expect(res.status).toBe(400);
  });
});
