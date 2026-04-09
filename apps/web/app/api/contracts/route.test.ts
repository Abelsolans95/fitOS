import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "./route";

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

// ── Mock CSRF & rate-limit ──
vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));
vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true })) },
  getClientIdentifier: vi.fn(() => "test"),
}));

// ── Mock sanitize ──
vi.mock("@/lib/sanitize", () => ({
  sanitizeName: vi.fn((s: string) => s?.trim() ?? ""),
  sanitizeText: vi.fn((s: string) => s?.trim() ?? ""),
}));

// ── Helpers ──
function createChain(result: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  for (const m of ["select", "eq", "in", "insert", "update", "delete", "single", "order", "limit"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
    Promise.resolve(result).then(ok, fail);
  return chain;
}

function makeRequest(body?: Record<string, unknown>, method = "GET") {
  return {
    json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error("no body")),
    headers: new Headers({ origin: "http://localhost:3000" }),
    method,
  } as unknown as Request;
}

const TRAINER_USER = {
  id: "trainer-1",
  user_metadata: { role: "trainer" },
};
const CLIENT_USER = {
  id: "client-1",
  user_metadata: { role: "client" },
};

// ── Tests ──

describe("GET /api/contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns trainer contracts with client names", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    const contractsChain = createChain({
      data: [{ id: "c1", client_id: "client-1", trainer_id: "trainer-1" }],
      error: null,
    });
    const profilesChain = createChain({
      data: [{ user_id: "client-1", full_name: "Juan" }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "contracts") return contractsChain;
      if (table === "profiles") return profilesChain;
      return createChain({ data: null, error: null });
    });

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.contracts[0].client_name).toBe("Juan");
  });

  it("returns client contracts", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    const contractsChain = createChain({
      data: [{ id: "c1", status: "sent" }],
      error: null,
    });
    mockFrom.mockReturnValue(contractsChain);

    const res = await GET(makeRequest() as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.contracts).toHaveLength(1);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no session" } });

    const res = await GET(makeRequest() as any);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a contract for a valid trainer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    const tcChain = createChain({ data: { client_id: "client-1" }, error: null });
    const insertChain = createChain({
      data: { id: "new-c", title: "Contrato", status: "draft" },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "trainer_clients") return tcChain;
      if (table === "contracts") return insertChain;
      return createChain({ data: null, error: null });
    });

    const res = await POST(
      makeRequest({ client_id: "client-1", title: "Contrato", content: "Cuerpo del contrato" }, "POST") as any
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.contract.id).toBe("new-c");
  });

  it("returns 403 for client role", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    const res = await POST(
      makeRequest({ client_id: "c1", title: "T", content: "C" }, "POST") as any
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    const res = await POST(
      makeRequest({ client_id: "c1", content: "C" }, "POST") as any
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when client is not linked to trainer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    const tcChain = createChain({ data: null, error: { message: "not found" } });
    mockFrom.mockReturnValue(tcChain);

    const res = await POST(
      makeRequest({ client_id: "unlinked", title: "T", content: "C" }, "POST") as any
    );
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("client marks contract as viewed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: CLIENT_USER }, error: null });

    const fetchChain = createChain({
      data: { id: "c1", trainer_id: "trainer-1", client_id: "client-1", status: "sent" },
      error: null,
    });
    const updateChain = createChain({
      data: { id: "c1", status: "viewed", signature_data: null },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const res = await PUT(makeRequest({ id: "c1" }, "PUT") as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.contract.status).toBe("viewed");
  });

  it("returns 404 for nonexistent contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });
    mockFrom.mockReturnValue(createChain({ data: null, error: { message: "not found" } }));

    const res = await PUT(makeRequest({ id: "bad-id", status: "sent" }, "PUT") as any);
    expect(res.status).toBe(404);
  });

  it("returns 400 when id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    const res = await PUT(makeRequest({}, "PUT") as any);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a draft contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    const fetchChain = createChain({
      data: { id: "c1", trainer_id: "trainer-1", status: "draft" },
      error: null,
    });
    const deleteChain = createChain({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : deleteChain;
    });

    const res = await DELETE(makeRequest({ id: "c1" }, "DELETE") as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("rejects deleting a sent contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    mockFrom.mockReturnValue(
      createChain({ data: { id: "c1", trainer_id: "trainer-1", status: "sent" }, error: null })
    );

    const res = await DELETE(makeRequest({ id: "c1" }, "DELETE") as any);
    expect(res.status).toBe(400);
  });

  it("rejects deletion by non-owner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: TRAINER_USER }, error: null });

    mockFrom.mockReturnValue(
      createChain({ data: { id: "c1", trainer_id: "other-trainer", status: "draft" }, error: null })
    );

    const res = await DELETE(makeRequest({ id: "c1" }, "DELETE") as any);
    expect(res.status).toBe(403);
  });
});
