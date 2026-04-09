import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// ── Mock @/lib/supabase-server ──
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser } })
  ),
}));

// ── Mock @supabase/supabase-js (service_role) ──
const mockFrom = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));
vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true })) },
  getClientIdentifier: vi.fn(() => "test"),
}));

// ── Helpers ──
function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const m of ["select", "eq", "update", "single"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
    Promise.resolve(result).then(ok, fail);
  return chain;
}

function makeRequest(body: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({
      origin: "http://localhost:3000",
      "x-forwarded-for": "1.2.3.4",
    }),
    method: "POST",
  } as unknown as Request;
}

const CLIENT_USER = { id: "client-1", user_metadata: { role: "client" } };

describe("POST /api/contracts/sign", () => {
  beforeEach(() => vi.clearAllMocks());

  it("signs a contract successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    const fetchChain = createChain({
      data: { id: "c1", client_id: "client-1", status: "sent" },
      error: null,
    });
    const updateChain = createChain({
      data: { id: "c1", status: "signed", signed_at: "2026-04-09", signature_data: "data:image/png;base64,abc" },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const res = await POST(
      makeRequest({ id: "c1", signature_data: "data:image/png;base64,abc" }) as any
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.contract.status).toBe("signed");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no session" } });

    const res = await POST(makeRequest({ id: "c1", signature_data: "abc" }) as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 for trainer role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "t1", user_metadata: { role: "trainer" } } },
      error: null,
    });

    const res = await POST(makeRequest({ id: "c1", signature_data: "abc" }) as any);
    expect(res.status).toBe(403);
  });

  it("returns 400 when signature_data is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    const res = await POST(makeRequest({ id: "c1" }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature_data exceeds 100KB", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    const res = await POST(
      makeRequest({ id: "c1", signature_data: "x".repeat(100001) }) as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when client doesn't own the contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    mockFrom.mockReturnValue(
      createChain({ data: { id: "c1", client_id: "other-client", status: "sent" }, error: null })
    );

    const res = await POST(
      makeRequest({ id: "c1", signature_data: "data:image/png;base64,abc" }) as any
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when contract is already signed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    mockFrom.mockReturnValue(
      createChain({ data: { id: "c1", client_id: "client-1", status: "signed" }, error: null })
    );

    const res = await POST(
      makeRequest({ id: "c1", signature_data: "data:image/png;base64,abc" }) as any
    );
    expect(res.status).toBe(400);
  });
});
