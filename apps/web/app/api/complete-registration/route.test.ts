import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Chainable query builder (same pattern as exercise-resolver.test.ts)
// ---------------------------------------------------------------------------

function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const method of ["select", "eq", "insert", "update", "single"]) {
    chain[method] = vi.fn(() => chain);
  }
  // Make the chain awaitable
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
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/complete-registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Happy path — all inserts succeed
  it("returns { success: true } when all operations succeed", async () => {
    const trainerClientsChain = createChain({ data: null, error: null });
    const profilesChain = createChain({ data: null, error: null });
    const promoSelectChain = createChain({
      data: { current_uses: 3 },
      error: null,
    });
    const promoUpdateChain = createChain({ data: null, error: null });

    let promoCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profilesChain;
      if (table === "trainer_promo_codes") {
        promoCallCount++;
        return promoCallCount === 1 ? promoSelectChain : promoUpdateChain;
      }
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

    // Verify email was saved to profiles
    expect(profilesChain.update).toHaveBeenCalledWith({
      email: "client@test.com",
    });

    // Verify promo code current_uses incremented
    expect(promoUpdateChain.update).toHaveBeenCalledWith({ current_uses: 4 });
  });

  // 2. Missing required fields → 400
  it("returns 400 when trainer_id is missing", async () => {
    const res = await POST(
      makeRequest({ client_id: "c1", promo_code_id: "p1" }) as any,
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing required fields");
  });

  it("returns 400 when client_id is missing", async () => {
    const res = await POST(
      makeRequest({ trainer_id: "t1", promo_code_id: "p1" }) as any,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when promo_code_id is missing", async () => {
    const res = await POST(
      makeRequest({ trainer_id: "t1", client_id: "c1" }) as any,
    );
    expect(res.status).toBe(400);
  });

  // 3. DB error on trainer_clients insert → 500
  it("returns 500 when trainer_clients insert fails", async () => {
    const failChain = createChain({
      data: null,
      error: { message: "unique violation" },
    });

    mockFrom.mockImplementation(() => failChain);

    const res = await POST(makeRequest(VALID_BODY) as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("unique violation");
  });

  // 4. Skips email update when email is not provided
  it("does not update profiles when email is absent", async () => {
    const trainerClientsChain = createChain({ data: null, error: null });
    const promoSelectChain = createChain({
      data: { current_uses: 0 },
      error: null,
    });
    const promoUpdateChain = createChain({ data: null, error: null });

    let promoCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "trainer_promo_codes") {
        promoCallCount++;
        return promoCallCount === 1 ? promoSelectChain : promoUpdateChain;
      }
      return createChain({ data: null, error: null });
    });

    const bodyNoEmail = { trainer_id: "t1", client_id: "c1", promo_code_id: "p1" };
    const res = await POST(makeRequest(bodyNoEmail) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // profiles.from should NOT be called
    expect(
      mockFrom.mock.calls.filter((c: string[]) => c[0] === "profiles"),
    ).toHaveLength(0);
  });

  // 5. Promo code not found — still succeeds (no increment)
  it("succeeds even if promo code is not found (no increment)", async () => {
    const trainerClientsChain = createChain({ data: null, error: null });
    const profilesChain = createChain({ data: null, error: null });
    const promoSelectChain = createChain({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return trainerClientsChain;
      if (table === "profiles") return profilesChain;
      if (table === "trainer_promo_codes") return promoSelectChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  // 6. Invalid JSON body → 500 (caught by catch)
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
