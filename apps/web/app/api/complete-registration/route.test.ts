import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-admin (service_role client)
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockGetUserById = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      admin: { getUserById: mockGetUserById },
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
    // Default: auth user exists with matching role
    mockGetUserById.mockResolvedValue({
      data: { user: { id: "client-1", user_metadata: { role: "client" } } },
      error: null,
    });
    // Default: RPC succeeds
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  // 1. Happy path — all inserts succeed
  it("returns { success: true } when all operations succeed", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const trainerClientsChain = createChain({ data: null, error: null });
    const profilesChain = createChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profilesChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Verify user auth was checked
    expect(mockGetUserById).toHaveBeenCalledWith("client-1");

    // Verify user_roles insert
    expect(userRolesChain.insert).toHaveBeenCalledWith({
      user_id: "client-1",
      role: "client",
    });

    // Verify trainer_clients insert
    expect(trainerClientsChain.insert).toHaveBeenCalledWith({
      trainer_id: "trainer-1",
      client_id: "client-1",
      promo_code_id: "promo-1",
      status: "pending",
    });

    // Verify email was saved to profiles
    expect(profilesChain.update).toHaveBeenCalledWith({
      email: "client@test.com",
    });

    // Verify atomic promo code increment via RPC
    expect(mockRpc).toHaveBeenCalledWith("increment_promo_code_uses", {
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
  it("returns 403 when user not found in auth", async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: null },
      error: { message: "User not found" },
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(403);
  });

  // 4. Role mismatch → 403
  it("returns 403 when role does not match user_metadata", async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { id: "client-1", user_metadata: { role: "trainer" } } },
      error: null,
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(403);
  });

  // 5. DB error on user_roles insert → 500
  it("returns 500 when user_roles insert fails", async () => {
    const failChain = createChain({
      data: null,
      error: { message: "unique violation" },
    });

    mockFrom.mockImplementation(() => failChain);

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(500);
  });

  // 6. DB error on trainer_clients insert → 500
  it("returns 500 when trainer_clients insert fails", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const failChain = createChain({
      data: null,
      error: { message: "unique violation" },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      return failChain;
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Error al vincular con el entrenador");
  });

  // 7. Skips email update when email is not provided
  it("does not update profiles when email is absent", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const trainerClientsChain = createChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      if (table === "trainer_clients") return trainerClientsChain;
      return createChain({ data: null, error: null });
    });

    const bodyNoEmail = { trainer_id: "t1", client_id: "client-1", promo_code_id: "p1", role: "client" };
    const res = await POST(makeRequest(bodyNoEmail) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(
      mockFrom.mock.calls.filter((c: string[]) => c[0] === "profiles"),
    ).toHaveLength(0);
  });

  // 8. Promo RPC error is non-blocking — still succeeds
  it("succeeds even if promo code RPC fails", async () => {
    const userRolesChain = createChain({ data: null, error: null });
    const trainerClientsChain = createChain({ data: null, error: null });
    const profilesChain = createChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") return userRolesChain;
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profilesChain;
      return createChain({ data: null, error: null });
    });

    mockRpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });

    const res = await POST(makeRequest(VALID_BODY) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  // 9. Invalid JSON body → 400 (handled by parseJsonBody)
  it("returns 400 when request body is unparseable", async () => {
    const badRequest = {
      json: () => Promise.reject(new Error("invalid json")),
    } as unknown as Request;

    const res = await POST(badRequest as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("JSON inválido");
  });
});
