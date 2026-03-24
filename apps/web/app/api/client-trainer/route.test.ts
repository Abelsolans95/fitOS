import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js (admin client — service_role)
// ---------------------------------------------------------------------------

const mockAdminFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-server (server client — auth)
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockServerFrom = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockServerFrom,
    }),
  ),
}));

// ---------------------------------------------------------------------------
// Import the route AFTER mocks are set up
// ---------------------------------------------------------------------------

import { GET } from "./route";

// ---------------------------------------------------------------------------
// Chainable query builder (same pattern as exercise-resolver.test.ts)
// ---------------------------------------------------------------------------

function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const method of ["select", "eq", "or", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  // Make the chain awaitable without calling .single()
  chain.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

// ---------------------------------------------------------------------------
// Helper: build a NextRequest-like object
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
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/client-trainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Happy path — authenticated user with linked trainer
  it("returns trainer_id and full_name for an authenticated client", async () => {
    // Auth: user exists
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    // Admin queries by table
    const trainerClientsChain = createChain({
      data: [{ trainer_id: TRAINER_ID, client_id: USER_ID }],
      error: null,
    });
    const rolesChain = createChain({ data: [], error: null });
    const promosChain = createChain({ data: [], error: null });
    const profileChain = createChain({
      data: { full_name: "Carlos García", business_name: "FitPro Studio" },
      error: null,
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "user_roles") return rolesChain;
      if (table === "trainer_promo_codes") return promosChain;
      if (table === "profiles") return profileChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.trainer_id).toBe(TRAINER_ID);
    // business_name takes priority over full_name
    expect(json.full_name).toBe("FitPro Studio");
  });

  // 2. Unauthenticated user → 401
  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("No autenticado");
  });

  // 3. No trainer linked → 404
  it("returns 404 when no trainer is linked to the client", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const emptyChain = createChain({ data: [], error: null });
    mockAdminFrom.mockImplementation(() => emptyChain);

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain("No se encontró");
  });

  // 4. trainer_clients query error → 404 (route treats tcErr as 404)
  it("returns 404 when trainer_clients query errors", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const errChain = createChain({
      data: null,
      error: { message: "relation not found" },
    });
    mockAdminFrom.mockImplementation(() => errChain);

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain("No se encontró");
  });

  // 5. Fallback name — no business_name, no full_name
  it("returns 'Tu entrenador' when profile has no names", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const trainerClientsChain = createChain({
      data: [{ trainer_id: TRAINER_ID, client_id: USER_ID }],
      error: null,
    });
    const rolesChain = createChain({ data: [], error: null });
    const promosChain = createChain({ data: [], error: null });
    const profileChain = createChain({
      data: { full_name: null, business_name: null },
      error: null,
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "user_roles") return rolesChain;
      if (table === "trainer_promo_codes") return promosChain;
      if (table === "profiles") return profileChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.full_name).toBe("Tu entrenador");
  });

  // 6. Unexpected crash → 500
  it("returns 500 on unexpected error", async () => {
    mockGetUser.mockRejectedValue(new Error("connection lost"));

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("connection lost");
  });

  // 7. Uses full_name when business_name is absent
  it("returns full_name when business_name is null", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const trainerClientsChain = createChain({
      data: [{ trainer_id: TRAINER_ID, client_id: USER_ID }],
      error: null,
    });
    const rolesChain = createChain({ data: [], error: null });
    const promosChain = createChain({ data: [], error: null });
    const profileChain = createChain({
      data: { full_name: "Carlos García", business_name: null },
      error: null,
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "user_roles") return rolesChain;
      if (table === "trainer_promo_codes") return promosChain;
      if (table === "profiles") return profileChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.full_name).toBe("Carlos García");
  });
});
