import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/csrf", () => ({ validateCsrf: vi.fn(() => true) }));

const mockAuth = { getUser: vi.fn() };
const mockQueries: Record<string, unknown> = {};

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const m of [
    "select",
    "eq",
    "in",
    "gte",
    "lte",
    "order",
    "limit",
    "single",
    "maybeSingle",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  // Support both `await chain` and `.single()` patterns by making chain thenable.
  (chain as { then: (ok: (v: unknown) => unknown) => Promise<unknown> }).then = (ok) =>
    Promise.resolve(result).then(ok);
  return chain;
}

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(async () => ({
    auth: mockAuth,
    from: (table: string) => {
      const result = (mockQueries[table] as { data: unknown; error: unknown } | undefined) ?? {
        data: [],
        error: null,
      };
      return makeChain(result);
    },
  })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/rate-limit", () => ({
  apiLimiter: { check: vi.fn(() => ({ success: true, remaining: 1, resetAt: 0 })) },
  getClientIdentifier: vi.fn(() => "ip:1.2.3.4"),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), security: vi.fn() },
}));

import { GET } from "./route";

const TRAINER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const CLIENT_A = "11111111-1111-1111-1111-111111111111";
const CLIENT_B = "22222222-2222-2222-2222-222222222222";

function makeReq(): NextRequest {
  return new NextRequest("https://x/api/trainer/today", { method: "GET" });
}

const routeCtx = { params: Promise.resolve({}) };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.getUser.mockResolvedValue({
    data: {
      user: { id: TRAINER_ID, email: "t@x.co", user_metadata: { role: "trainer" } },
    },
    error: null,
  });
  for (const k of Object.keys(mockQueries)) delete mockQueries[k];
});

function setTable(name: string, data: unknown) {
  mockQueries[name] = { data, error: null };
}

describe("GET /api/trainer/today", () => {
  it("returns an empty panel when the trainer has no active clients", async () => {
    setTable("trainer_clients", []);
    const res = await GET(makeReq(), routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total_clients).toBe(0);
    expect(body.total_alerts).toBe(0);
  });

  it("flags clients without a workout as no_workout", async () => {
    setTable("trainer_clients", [{ client_id: CLIENT_A }, { client_id: CLIENT_B }]);
    setTable("profiles", [
      { user_id: CLIENT_A, full_name: "Alice" },
      { user_id: CLIENT_B, full_name: "Bob" },
    ]);
    setTable("workout_sessions", [
      { client_id: CLIENT_A, completed_at: new Date().toISOString() },
    ]);
    setTable("daily_checkins", []);
    setTable("health_logs", []);
    setTable("support_tickets", []);

    const res = await GET(makeReq(), routeCtx);
    const body = await res.json();

    expect(body.total_clients).toBe(2);
    expect(body.alerts_by_kind.no_workout).toHaveLength(1);
    expect(body.alerts_by_kind.no_workout[0].client_id).toBe(CLIENT_B);
    expect(body.alerts_by_kind.no_workout[0].client_name).toBe("Bob");
  });

  it("flags clients without a recent check-in as no_checkin", async () => {
    setTable("trainer_clients", [{ client_id: CLIENT_A }]);
    setTable("profiles", [{ user_id: CLIENT_A, full_name: "Alice" }]);
    setTable("workout_sessions", [
      { client_id: CLIENT_A, completed_at: new Date().toISOString() },
    ]);
    setTable("daily_checkins", []); // no check-ins ever
    setTable("health_logs", []);
    setTable("support_tickets", []);

    const res = await GET(makeReq(), routeCtx);
    const body = await res.json();

    expect(body.alerts_by_kind.no_checkin).toHaveLength(1);
    expect(body.alerts_by_kind.no_checkin[0].hours_since_last).toBeNull();
  });

  it("surfaces pending tickets", async () => {
    setTable("trainer_clients", [{ client_id: CLIENT_A }]);
    setTable("profiles", [{ user_id: CLIENT_A, full_name: "Alice" }]);
    setTable("workout_sessions", [
      { client_id: CLIENT_A, completed_at: new Date().toISOString() },
    ]);
    // Fresh checkin to silence no_checkin
    setTable("daily_checkins", [
      { client_id: CLIENT_A, created_at: new Date().toISOString() },
    ]);
    setTable("health_logs", []);
    setTable("support_tickets", [
      {
        id: "ticket-1",
        client_id: CLIENT_A,
        category: "nutricion",
        subject: "Duda sobre carbos",
        status: "open",
        created_at: new Date().toISOString(),
      },
    ]);

    const res = await GET(makeReq(), routeCtx);
    const body = await res.json();

    expect(body.alerts_by_kind.pending_ticket).toHaveLength(1);
    expect(body.alerts_by_kind.pending_ticket[0].ticket_id).toBe("ticket-1");
    expect(body.alerts_by_kind.pending_ticket[0].client_name).toBe("Alice");
  });

  it("flags high_stress and high_pain above threshold 4", async () => {
    setTable("trainer_clients", [{ client_id: CLIENT_A }, { client_id: CLIENT_B }]);
    setTable("profiles", [
      { user_id: CLIENT_A, full_name: "Alice" },
      { user_id: CLIENT_B, full_name: "Bob" },
    ]);
    setTable("workout_sessions", [
      { client_id: CLIENT_A, completed_at: new Date().toISOString() },
      { client_id: CLIENT_B, completed_at: new Date().toISOString() },
    ]);
    const freshCheckin = new Date().toISOString();
    setTable("daily_checkins", [
      {
        client_id: CLIENT_A,
        created_at: freshCheckin,
        stress_level: 5,
        pain_level: 2,
        checkin_date: freshCheckin.slice(0, 10),
      },
      {
        client_id: CLIENT_B,
        created_at: freshCheckin,
        stress_level: 2,
        pain_level: 4,
        checkin_date: freshCheckin.slice(0, 10),
      },
    ]);
    setTable("health_logs", []);
    setTable("support_tickets", []);

    const res = await GET(makeReq(), routeCtx);
    const body = await res.json();

    expect(body.alerts_by_kind.high_stress).toHaveLength(1);
    expect(body.alerts_by_kind.high_stress[0].client_id).toBe(CLIENT_A);
    expect(body.alerts_by_kind.high_pain).toHaveLength(1);
    expect(body.alerts_by_kind.high_pain[0].client_id).toBe(CLIENT_B);
  });

  it("rejects non-trainer callers with 403", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: { id: "u1", email: "c@x.co", user_metadata: { role: "client" } },
      },
      error: null,
    });
    const res = await GET(makeReq(), routeCtx);
    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated callers with 401", async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(makeReq(), routeCtx);
    expect(res.status).toBe(401);
  });
});
