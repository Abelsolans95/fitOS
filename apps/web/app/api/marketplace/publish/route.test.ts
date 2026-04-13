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
vi.mock("@/lib/sanitize", () => ({
  sanitizeName: vi.fn((s: string) => s?.trim() ?? ""),
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

function makeRequest(body: Record<string, unknown> | null) {
  return {
    json: body !== null ? () => Promise.resolve(body) : () => Promise.resolve(null),
    headers: new Headers({ origin: "http://localhost:3000" }),
    method: "POST",
  } as unknown as Request;
}

const TRAINER = { id: "trainer-1", user_metadata: { role: "trainer" } };

const VALID_BODY = {
  title: "Rutina PRO",
  description: "Rutina de 12 semanas",
  price_cents: 2999,
  category: "hipertrofia",
  routine_id: "routine-1",
};

describe("POST /api/marketplace/publish", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a product from a valid routine", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const routineChain = createChain({
      data: {
        id: "routine-1",
        title: "R1",
        exercises: [],
        training_days: ["lunes"],
        total_weeks: 12,
        current_week: 1,
        goal: "hipertrofia",
        trainer_id: "trainer-1",
      },
      error: null,
    });
    const insertChain = createChain({
      data: { id: "prod-1", title: "Rutina PRO", status: "pending_review", created_at: "2026-04-09" },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_routines") return routineChain;
      if (table === "marketplace_products") return insertChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.product.id).toBe("prod-1");
  });

  it("returns 403 for client role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "c1", user_metadata: { role: "client" } } },
      error: null,
    });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no" } });

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 when title is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await POST(makeRequest({ ...VALID_BODY, title: "" }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when price is negative", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await POST(makeRequest({ ...VALID_BODY, price_cents: -100 }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when category is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await POST(makeRequest({ ...VALID_BODY, category: "yoga" }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 404 when routine does not belong to trainer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    mockFrom.mockReturnValue(
      createChain({ data: null, error: { message: "not found" } })
    );

    const res = await POST(makeRequest(VALID_BODY) as any);
    expect(res.status).toBe(404);
  });

  it("returns 400 when routine_id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER }, error: null });

    const res = await POST(
      makeRequest({ ...VALID_BODY, routine_id: "" }) as any
    );
    expect(res.status).toBe(400);
  });
});
