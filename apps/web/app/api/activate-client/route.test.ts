import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";

// ---------------------------------------------------------------------------
// Mock @/lib/api-utils
// ---------------------------------------------------------------------------

const mockRequireAuthWithRole = vi.fn();

vi.mock("@/lib/api-utils", () => ({
  requireAuthWithRole: (...args: unknown[]) => mockRequireAuthWithRole(...args),
  successResponse: (data: Record<string, unknown>, status = 200) =>
    NextResponse.json(data, { status }),
  errorResponse: (message: string, status: number) =>
    NextResponse.json({ error: message }, { status }),
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
// Helpers
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

function setupAuthSuccess(userId = "client-1", email = "client@test.com") {
  mockRequireAuthWithRole.mockResolvedValue({
    user: { id: userId, email, user_metadata: { role: "client" } },
    supabase: {},
    admin: { from: mockFrom },
  });
}

function makeRequest() {
  return { json: () => Promise.resolve({}) } as unknown as Request;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/activate-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthSuccess();
  });

  // 1. Happy path
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
    mockRequireAuthWithRole.mockResolvedValue(
      NextResponse.json({ error: "No autenticado" }, { status: 401 })
    );

    const res = await POST(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("No autenticado");
  });

  // 3. Wrong role → 403
  it("returns 403 when user is not a client", async () => {
    mockRequireAuthWithRole.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 })
    );

    const res = await POST(makeRequest() as any);
    expect(res.status).toBe(403);
  });

  // 4. trainer_clients update fails → 500
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

  // 5. Profile update fails — non-blocking, still returns success
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
});
