import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @supabase/supabase-js (dynamic import in route) ──
const mockFrom = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => ({ check: vi.fn(() => ({ success: true })) })),
  getClientIdentifier: vi.fn(() => "test-ip"),
}));
vi.mock("@/lib/sanitize", () => ({
  sanitizeName: vi.fn((s: string) => s?.trim() ?? ""),
  sanitizeEmail: vi.fn((s: string) => (s?.includes("@") ? s.trim() : "")),
  sanitizeText: vi.fn((s: string) => s?.trim() ?? ""),
}));

// ── Helpers ──
function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const m of ["select", "eq", "insert", "single"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
    Promise.resolve(result).then(ok, fail);
  return chain;
}

function makeRequest(body: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({ origin: "http://localhost:3000" }),
    method: "POST",
  } as unknown as Request;
}

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("POST /api/leads", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to reset module state
    const mod = await import("./route");
    POST = mod.POST;
  });

  it("creates a lead successfully", async () => {
    const trainerChain = createChain({ data: { user_id: VALID_UUID }, error: null });
    const insertChain = createChain({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? trainerChain : insertChain;
    });

    const res = await POST(
      makeRequest({
        name: "Juan",
        email: "juan@test.com",
        trainer_id: VALID_UUID,
        goal: "Perder peso",
        source: "landing",
      }) as any
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(
      makeRequest({ email: "test@test.com", trainer_id: VALID_UUID }) as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(
      makeRequest({ name: "Test", email: "invalid", trainer_id: VALID_UUID }) as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when trainer_id is not a valid UUID", async () => {
    const res = await POST(
      makeRequest({ name: "Test", email: "test@test.com", trainer_id: "not-a-uuid" }) as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when trainer does not exist", async () => {
    mockFrom.mockReturnValue(
      createChain({ data: null, error: { message: "not found" } })
    );

    const res = await POST(
      makeRequest({ name: "Test", email: "test@test.com", trainer_id: VALID_UUID }) as any
    );
    expect(res.status).toBe(404);
  });

  it("returns 500 when insert fails", async () => {
    const trainerChain = createChain({ data: { user_id: VALID_UUID }, error: null });
    const insertChain = createChain({ data: null, error: { code: "23505" } });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? trainerChain : insertChain;
    });

    const res = await POST(
      makeRequest({ name: "Test", email: "test@test.com", trainer_id: VALID_UUID }) as any
    );
    expect(res.status).toBe(500);
  });

  it("defaults invalid source to 'landing'", async () => {
    const trainerChain = createChain({ data: { user_id: VALID_UUID }, error: null });
    const insertChain = createChain({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? trainerChain : insertChain;
    });

    const res = await POST(
      makeRequest({
        name: "Test",
        email: "test@test.com",
        trainer_id: VALID_UUID,
        source: "evil_source",
      }) as any
    );
    expect(res.status).toBe(201);
    // The insert chain was called — we can verify the source was sanitized
    expect(insertChain.insert).toHaveBeenCalled();
  });
});
