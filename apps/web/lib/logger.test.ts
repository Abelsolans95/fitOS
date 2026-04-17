import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits JSON with level, message and timestamp", () => {
    logger.info("hello");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const out = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(out).toMatchObject({ level: "info", message: "hello" });
    expect(out.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("routes error and security to console.error", () => {
    logger.error("boom");
    logger.security("idor");
    expect(errSpy).toHaveBeenCalledTimes(2);
    const first = JSON.parse(errSpy.mock.calls[0][0] as string);
    const second = JSON.parse(errSpy.mock.calls[1][0] as string);
    expect(first.level).toBe("error");
    expect(second.level).toBe("security");
  });

  it("routes warn to console.warn", () => {
    logger.warn("careful");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("redacts sensitive top-level keys", () => {
    logger.info("login", { userId: "u1", password: "secret", token: "abc" });
    const out = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(out.context.userId).toBe("u1");
    expect(out.context.password).toBe("[REDACTED]");
    expect(out.context.token).toBe("[REDACTED]");
  });

  it("redacts sensitive keys one level deep", () => {
    logger.info("req", { req: { method: "POST", authorization: "Bearer xyz" } });
    const out = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(out.context.req.method).toBe("POST");
    expect(out.context.req.authorization).toBe("[REDACTED]");
  });

  it("survives circular references in context", () => {
    const cyclic: Record<string, unknown> = { a: 1 };
    cyclic.self = cyclic;
    expect(() => logger.info("cyclic", cyclic)).not.toThrow();
    // The fallback output also goes through console.log successfully.
    expect(logSpy).toHaveBeenCalled();
  });
});
