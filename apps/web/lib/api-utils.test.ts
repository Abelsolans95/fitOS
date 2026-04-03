import { describe, it, expect, vi } from "vitest";

// Mock dependencies before importing the module under test
vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(),
}));

import {
  successResponse,
  errorResponse,
  parseJsonBody,
  requireMetadataRole,
} from "./api-utils";

describe("errorResponse", () => {
  it("returns NextResponse with error message and status", async () => {
    const res = errorResponse("No encontrado", 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "No encontrado" });
  });

  it("returns 400 for bad request", async () => {
    const res = errorResponse("Datos invalidos", 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Datos invalidos");
  });

  it("returns 500 for server error", async () => {
    const res = errorResponse("Error interno", 500);
    expect(res.status).toBe(500);
  });
});

describe("successResponse", () => {
  it("returns NextResponse with data and default 200 status", async () => {
    const res = successResponse({ id: "abc", name: "Test" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: "abc", name: "Test" });
  });

  it("accepts custom status code", async () => {
    const res = successResponse({ created: true }, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ created: true });
  });

  it("handles empty object", async () => {
    const res = successResponse({});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });
});

describe("parseJsonBody", () => {
  it("parses valid JSON from request", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "test", value: 42 }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseJsonBody<{ name: string; value: number }>(request);
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("returns 400 error response for invalid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not json {{{",
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseJsonBody(request);
    // Result should be a NextResponse with 400
    expect("status" in result).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).status).toBe(400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await (result as any).json();
    expect(body.error).toBe("JSON inválido");
  });

  it("returns 400 for empty body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
    });
    const result = await parseJsonBody(request);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).status).toBe(400);
  });
});

describe("requireMetadataRole", () => {
  it("returns null when user has the correct role", () => {
    const user = {
      id: "u1",
      email: "test@test.com",
      user_metadata: { role: "trainer" },
    };
    const result = requireMetadataRole(user, "trainer");
    expect(result).toBeNull();
  });

  it("returns 403 error when user has wrong role", async () => {
    const user = {
      id: "u1",
      email: "test@test.com",
      user_metadata: { role: "client" },
    };
    const result = requireMetadataRole(user, "trainer");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const body = await result!.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 403 when user_metadata has no role", async () => {
    const user = {
      id: "u1",
      user_metadata: {},
    };
    const result = requireMetadataRole(user, "admin");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("checks exact role match (client !== trainer)", async () => {
    const user = {
      id: "u1",
      user_metadata: { role: "client" },
    };
    expect(requireMetadataRole(user, "client")).toBeNull();
    expect(requireMetadataRole(user, "trainer")).not.toBeNull();
    expect(requireMetadataRole(user, "admin")).not.toBeNull();
  });
});
