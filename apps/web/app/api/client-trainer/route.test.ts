import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mock @/lib/api-utils
// ---------------------------------------------------------------------------

const mockRequireAuthWithRole = vi.fn();
const realSuccessResponse = (data: Record<string, unknown>, status = 200) =>
  NextResponse.json(data, { status });
const realErrorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

vi.mock("@/lib/api-utils", () => ({
  requireAuthWithRole: (...args: unknown[]) => mockRequireAuthWithRole(...args),
  successResponse: (data: Record<string, unknown>, status = 200) =>
    NextResponse.json(data, { status }),
  errorResponse: (message: string, status: number) =>
    NextResponse.json({ error: message }, { status }),
}));

// ---------------------------------------------------------------------------
// Import the route AFTER mocks are set up
// ---------------------------------------------------------------------------

import { GET } from "./route";

// ---------------------------------------------------------------------------
// Chainable query builder
// ---------------------------------------------------------------------------

function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const method of ["select", "eq", "or", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
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
  return {} as unknown as Request;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = "user-123";
const TRAINER_ID = "trainer-456";

// ---------------------------------------------------------------------------
// Helper to set up admin mock with table routing
// ---------------------------------------------------------------------------

function setupAuthSuccess(adminFromImpl: (table: string) => unknown) {
  const mockAdminFrom = vi.fn(adminFromImpl);
  mockRequireAuthWithRole.mockResolvedValue({
    user: { id: USER_ID, user_metadata: { role: "client" } },
    supabase: {},
    admin: { from: mockAdminFrom },
  });
  return mockAdminFrom;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/client-trainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Happy path — authenticated client with linked trainer
  it("returns trainer_id and full_name for an authenticated client", async () => {
    const trainerClientsChain = createChain({
      data: [{ trainer_id: TRAINER_ID, client_id: USER_ID }],
      error: null,
    });
    const profileChain = createChain({
      data: { full_name: "Carlos García", business_name: "FitPro Studio" },
      error: null,
    });

    setupAuthSuccess((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profileChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.trainer_id).toBe(TRAINER_ID);
    expect(json.full_name).toBe("FitPro Studio");
  });

  // 2. Unauthenticated user → 401
  it("returns 401 when user is not authenticated", async () => {
    mockRequireAuthWithRole.mockResolvedValue(
      realErrorResponse("No autenticado", 401)
    );

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("No autenticado");
  });

  // 3. Wrong role → 403
  it("returns 403 when user is a trainer", async () => {
    mockRequireAuthWithRole.mockResolvedValue(
      realErrorResponse("Forbidden", 403)
    );

    const res = await GET(makeRequest() as any);
    expect(res.status).toBe(403);
  });

  // 4. No trainer linked → 404
  it("returns 404 when no trainer is linked to the client", async () => {
    const emptyChain = createChain({ data: [], error: null });
    setupAuthSuccess(() => emptyChain);

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain("No se encontró");
  });

  // 5. trainer_clients query error → 500
  it("returns 500 when trainer_clients query errors", async () => {
    const errChain = createChain({
      data: null,
      error: { message: "relation not found" },
    });
    setupAuthSuccess(() => errChain);

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain("Error al buscar");
  });

  // 6. Fallback name — no business_name, no full_name
  it("returns 'Tu entrenador' when profile has no names", async () => {
    const trainerClientsChain = createChain({
      data: [{ trainer_id: TRAINER_ID, client_id: USER_ID }],
      error: null,
    });
    const profileChain = createChain({
      data: { full_name: null, business_name: null },
      error: null,
    });

    setupAuthSuccess((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profileChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.full_name).toBe("Tu entrenador");
  });

  // 7. Uses full_name when business_name is null
  it("returns full_name when business_name is null", async () => {
    const trainerClientsChain = createChain({
      data: [{ trainer_id: TRAINER_ID, client_id: USER_ID }],
      error: null,
    });
    const profileChain = createChain({
      data: { full_name: "Carlos García", business_name: null },
      error: null,
    });

    setupAuthSuccess((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profileChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.full_name).toBe("Carlos García");
  });

  // 8. Unexpected crash → 500
  it("returns 500 on unexpected error", async () => {
    mockRequireAuthWithRole.mockRejectedValue(new Error("connection lost"));

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("connection lost");
  });
});
