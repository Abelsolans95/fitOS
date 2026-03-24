import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js (service_role client)
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-server (auth client)
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    }),
  ),
}));

// ---------------------------------------------------------------------------
// Chainable query builder
// ---------------------------------------------------------------------------

function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const method of ["select", "eq", "update", "is", "single"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeRequest() {
  return {
    json: () => Promise.resolve({}),
  } as unknown as Request;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/activate-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "client-1", email: "client@test.com" } },
      error: null,
    });
  });

  // 1. Happy path — activation succeeds
  it("returns { success: true } when activation succeeds", async () => {
    const trainerClientsChain = createChain({ data: null, error: null });
    const profilesChain = createChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profilesChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(trainerClientsChain.update).toHaveBeenCalledWith({ status: "active" });
  });

  // 2. Unauthenticated → 401
  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "not authenticated" },
    });

    const res = await POST(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  // 3. trainer_clients update fails → 500
  it("returns 500 when trainer_clients update fails", async () => {
    const failChain = createChain({
      data: null,
      error: { message: "update failed" },
    });

    mockFrom.mockImplementation(() => failChain);

    const res = await POST(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Error al activar el cliente");
  });

  // 4. Profile update fails — non-blocking, still returns success
  it("returns success even if profile email update fails", async () => {
    const trainerClientsChain = createChain({ data: null, error: null });
    const profilesChain = createChain({
      data: null,
      error: { message: "profile update failed" },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profilesChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  // 5. Unexpected error → 500 via catch
  it("returns 500 when an unexpected error is thrown", async () => {
    mockGetUser.mockRejectedValue(new Error("unexpected crash"));

    const res = await POST(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("unexpected crash");
  });
});
