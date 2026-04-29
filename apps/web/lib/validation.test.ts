import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  uuidSchema,
  emailSchema,
  roleSchema,
  escapeLike,
  validateBody,
} from "./validation";

const validUuid = "abcdef01-2345-6789-abcd-ef0123456789";

describe("uuidSchema", () => {
  it("accepts canonical lowercase UUID", () => {
    expect(uuidSchema.safeParse(validUuid).success).toBe(true);
  });

  it("rejects uppercase UUID (Postgres canonical form is lowercase)", () => {
    expect(uuidSchema.safeParse(validUuid.toUpperCase()).success).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(uuidSchema.safeParse("1234").success).toBe(false);
  });

  it("rejects non-string", () => {
    expect(uuidSchema.safeParse(42).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("trims and lowercases", () => {
    const r = emailSchema.safeParse("  Alice@Example.COM  ");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("alice@example.com");
  });

  it("rejects malformed", () => {
    expect(emailSchema.safeParse("no-at").success).toBe(false);
  });
});

describe("roleSchema", () => {
  it("accepts known roles", () => {
    expect(roleSchema.safeParse("trainer").success).toBe(true);
    expect(roleSchema.safeParse("client").success).toBe(true);
    expect(roleSchema.safeParse("admin").success).toBe(true);
  });

  it("rejects unknown role", () => {
    expect(roleSchema.safeParse("superuser").success).toBe(false);
  });
});

describe("escapeLike", () => {
  it("escapes % and _ (gotcha #134)", () => {
    expect(escapeLike("50%_off")).toBe("50\\%\\_off");
  });

  it("escapes backslash", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("passes through safe characters", () => {
    expect(escapeLike("alice@example.com")).toBe("alice@example.com");
  });
});

describe("validateBody", () => {
  const schema = z.object({ name: z.string(), age: z.number().int().positive() });

  it("returns data on success", () => {
    const out = validateBody(schema, { name: "a", age: 30 });
    expect("data" in out).toBe(true);
    if ("data" in out) expect(out.data).toEqual({ name: "a", age: 30 });
  });

  it("returns 400 NextResponse on failure", async () => {
    const out = validateBody(schema, { name: 1, age: -1 });
    expect("response" in out).toBe(true);
    if ("response" in out) {
      expect(out.response).toBeInstanceOf(NextResponse);
      expect(out.response.status).toBe(400);
      const body = await out.response.json();
      expect(body.error).toBe("Datos inválidos");
      expect(Array.isArray(body.issues)).toBe(true);
      // Never echo user-provided values (PII-safe)
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("\"name\":1");
    }
  });
});
