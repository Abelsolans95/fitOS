import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "./route";

// ── Mock @/lib/supabase-server ──
const mockGetUser = vi.fn();
const mockServerFrom = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockServerFrom,
    })
  ),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));
vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true })) },
  getClientIdentifier: vi.fn(() => "test"),
}));
vi.mock("@/lib/sanitize", () => ({
  sanitizeName: vi.fn((s: string) => s?.trim() ?? ""),
  sanitizeText: vi.fn((s: string) => s?.trim() ?? ""),
}));

// ── Helpers ──
function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const m of ["select", "eq", "insert", "update", "delete", "single", "order", "limit"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
    Promise.resolve(result).then(ok, fail);
  return chain;
}

function makeRequest(body?: Record<string, unknown>, method = "GET") {
  return {
    json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error("no body")),
    headers: new Headers({ origin: "http://localhost:3000" }),
    method,
  } as unknown as Request;
}

const TRAINER = { id: "trainer-1", user_metadata: { role: "trainer" } };
const CLIENT = { id: "client-1", user_metadata: { role: "client" } };

describe("GET /api/leagues", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns trainer leagues", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });
    mockServerFrom.mockReturnValue(
      createChain({ data: [{ id: "l1", title: "Liga 1" }], error: null })
    );

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.leagues).toHaveLength(1);
  });

  it("returns client leagues", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT }, error: null });
    mockServerFrom.mockReturnValue(
      createChain({ data: [{ id: "l1" }], error: null })
    );

    const res = await GET(makeRequest() as any);
    expect(res.status).toBe(200);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no" } });

    const res = await GET(makeRequest() as any);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/leagues", () => {
  beforeEach(() => vi.clearAllMocks());

  const VALID_BODY = {
    title: "Liga Test",
    metric: "consistency",
    starts_at: "2026-05-01T00:00:00Z",
    ends_at: "2026-06-01T00:00:00Z",
  };

  it("creates a league for a trainer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });
    mockServerFrom.mockReturnValue(
      createChain({ data: { id: "new-l", title: "Liga Test", status: "upcoming" }, error: null })
    );

    const res = await POST(makeRequest(VALID_BODY, "POST") as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.league.id).toBe("new-l");
  });

  it("returns 403 for client role", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT }, error: null });

    const res = await POST(makeRequest(VALID_BODY, "POST") as any);
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await POST(
      makeRequest({ ...VALID_BODY, title: "" }, "POST") as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when metric is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await POST(
      makeRequest({ ...VALID_BODY, metric: "invalid" }, "POST") as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when end date is before start date", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await POST(
      makeRequest({ ...VALID_BODY, starts_at: "2026-06-01T00:00:00Z", ends_at: "2026-05-01T00:00:00Z" }, "POST") as any
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/leagues", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates league status", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });
    mockServerFrom.mockReturnValue(
      createChain({ data: { id: "l1", status: "active" }, error: null })
    );

    const res = await PUT(
      makeRequest({ id: "l1", status: "active" }, "PUT") as any
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.league.status).toBe("active");
  });

  it("returns 400 when id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await PUT(makeRequest({ status: "active" }, "PUT") as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await PUT(
      makeRequest({ id: "l1", status: "invalid" }, "PUT") as any
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/leagues", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a league", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });
    mockServerFrom.mockReturnValue(createChain({ data: null, error: null }));

    const res = await DELETE(makeRequest({ id: "l1" }, "DELETE") as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 403 for clients", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT }, error: null });

    const res = await DELETE(makeRequest({ id: "l1" }, "DELETE") as any);
    expect(res.status).toBe(403);
  });

  it("returns 400 when id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await DELETE(makeRequest({}, "DELETE") as any);
    expect(res.status).toBe(400);
  });
});
