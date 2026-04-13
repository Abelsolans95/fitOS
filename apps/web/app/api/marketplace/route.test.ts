import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

// ── Mock @supabase/supabase-js ──
const mockFrom = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true })) },
  getClientIdentifier: vi.fn(() => "test-ip"),
}));

// ── Helpers ──
function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const m of ["select", "eq", "ilike", "in", "single", "order", "limit"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
    Promise.resolve(result).then(ok, fail);
  return chain;
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/marketplace");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return {
    url: url.toString(),
    headers: new Headers({ origin: "http://localhost:3000" }),
    method: "GET",
  } as unknown as Request;
}

describe("GET /api/marketplace", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a list of published products", async () => {
    const productsChain = createChain({
      data: [{ id: "p1", trainer_id: "t1", title: "Rutina" }],
      error: null,
    });
    const profilesChain = createChain({
      data: [{ user_id: "t1", full_name: "Coach Ana", business_name: null }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "marketplace_products") return productsChain;
      if (table === "profiles") return profilesChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toHaveLength(1);
    expect(json.products[0].trainer_name).toBe("Coach Ana");
  });

  it("returns a single product by id", async () => {
    const productChain = createChain({
      data: { id: "p1", trainer_id: "t1", title: "Rutina" },
      error: null,
    });
    const profileChain = createChain({
      data: { full_name: "Ana", business_name: "Studio Ana" },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "marketplace_products") return productChain;
      if (table === "profiles") return profileChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest({ id: "p1" }) as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.product.trainer_name).toBe("Studio Ana");
  });

  it("returns 404 for nonexistent product", async () => {
    mockFrom.mockReturnValue(
      createChain({ data: null, error: { message: "not found" } })
    );

    const res = await GET(makeRequest({ id: "nonexistent" }) as any);
    expect(res.status).toBe(404);
  });

  it("escapes ILIKE wildcards in search", async () => {
    const productsChain = createChain({ data: [], error: null });
    mockFrom.mockReturnValue(productsChain);

    await GET(makeRequest({ search: "test%_evil" }) as any);

    // Verify ilike was called with escaped characters
    expect(productsChain.ilike).toHaveBeenCalledWith(
      "title",
      "%test\\%\\_evil%"
    );
  });

  it("returns 400 for invalid single id", async () => {
    const res = await GET(
      makeRequest({ id: "x".repeat(50) }) as any
    );
    expect(res.status).toBe(400);
  });
});
