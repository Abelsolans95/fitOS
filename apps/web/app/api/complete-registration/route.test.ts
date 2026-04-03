import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js (service_role client)
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockGetUserById = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  })),
}));

// ---------------------------------------------------------------------------
// Chainable query builder
// ---------------------------------------------------------------------------

function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const method of ["select", "eq", "insert", "update", "single"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

// ---------------------------------------------------------------------------
// Helper: build a NextRequest-like object
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_BODY = {
  trainer_id: "trainer-1",
  client_id: "client-1",
  promo_code_id: "promo-1",
  email: "client@test.com",
  role: "client",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/complete-registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: getUserById returns a valid user with matching role
    mockGetUserById.mockResolvedValue({
      data: {
        user: {
          id: "client-1",
          user_metadata: { role: "client" },
        },
      },
      error: null,
    });
    // Default: RPC increment succeeds
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  // 1. Happy path — all operations succeed
  it("returns { success: true } when all operations succeed", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const trainerProfileChain = createChain({
      data: { user_id: "trainer-1", role: "trainer" },
      error: null,
    });
    const promoCodeChain = createChain({
      data: { id: "promo-1", trainer_id: "trainer-1", is_active: true },
      error: null,
    });
    const trainerClientsChain = createChain({ data: null, error: null });
    const profilesUpdateChain = createChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      if (table === "profiles") {
        // First call: trainer check, second: email update
        const calls = mockFrom.mock.calls.filter((c: string[]) => c[0] === "profiles");
        return calls.length <= 1 ? trainerProfileChain : profilesUpdateChain;
      }
      if (table === "trainer_promo_codes") return promoCodeChain;
      if (table === "trainer_clients") return trainerClientsChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Verify trainer_clients insert was called
    expect(trainerClientsChain.insert).toHaveBeenCalledWith({
      trainer_id: "trainer-1",
      client_id: "client-1",
      promo_code_id: "promo-1",
      status: "pending",
    });

    // Verify atomic promo increment was called
    expect(mockRpc).toHaveBeenCalledWith("increment_promo_code_usage", {
      p_promo_code_id: "promo-1",
    });
  });

  // 2. Missing required fields → 400
  it("returns 400 when client_id is missing", async () => {
    const res = await POST(
      makeRequest({ trainer_id: "t1", role: "client" }) as any,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when role is missing", async () => {
    const res = await POST(
      makeRequest({ client_id: "c1", trainer_id: "t1" }) as any,
    );
    expect(res.status).toBe(400);
  });

  // 3. Auth user not found → 403
  it("returns 403 when user does not exist in auth", async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: null },
      error: { message: "User not found" },
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(403);
  });

  // 4. Role mismatch → 403
  it("returns 403 when role does not match auth metadata", async () => {
    mockGetUserById.mockResolvedValue({
      data: {
        user: { id: "client-1", user_metadata: { role: "trainer" } },
      },
      error: null,
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(403);
  });

  // 5. Invalid trainer → 400
  it("returns 400 when trainer does not exist", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const trainerNotFound = createChain({ data: null, error: { message: "not found" } });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      if (table === "profiles") return trainerNotFound;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(400);
  });

  // 6. Promo code doesn't belong to trainer → 400
  it("returns 400 when promo code does not belong to trainer", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const trainerProfileChain = createChain({
      data: { user_id: "trainer-1", role: "trainer" },
      error: null,
    });
    const promoNotFound = createChain({ data: null, error: { message: "not found" } });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      if (table === "profiles") return trainerProfileChain;
      if (table === "trainer_promo_codes") return promoNotFound;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(400);
  });

  // 7. DB error on trainer_clients insert → 500
  it("returns 500 when trainer_clients insert fails", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const trainerProfileChain = createChain({
      data: { user_id: "trainer-1", role: "trainer" },
      error: null,
    });
    const promoCodeChain = createChain({
      data: { id: "promo-1", trainer_id: "trainer-1", is_active: true },
      error: null,
    });
    const failChain = createChain({
      data: null,
      error: { message: "unique violation" },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      if (table === "profiles") return trainerProfileChain;
      if (table === "trainer_promo_codes") return promoCodeChain;
      if (table === "trainer_clients") return failChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(500);
  });

  // 8. Invalid JSON body → 500
  it("returns 500 when request body is unparseable", async () => {
    const badRequest = {
      json: () => Promise.reject(new Error("invalid json")),
    } as unknown as Request;

    const res = await POST(badRequest as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("invalid json");
  });
});
