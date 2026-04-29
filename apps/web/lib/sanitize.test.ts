import { describe, it, expect } from "vitest";
import { stripHtml, sanitizeText, sanitizeName, sanitizeEmail } from "./sanitize";

describe("stripHtml", () => {
  it("removes simple tags", () => {
    expect(stripHtml("<b>hola</b>")).toBe("hola");
  });

  it("removes nested tags to stable output (<<b>script>...)", () => {
    // The loop removes every `<...>` block. Leftover text like "script>alert(1)"
    // has no `<`, so React will render it as plain text — no XSS surface.
    expect(stripHtml("<<b>script>alert(1)</script>")).toBe("script>alert(1)");
  });

  it("fully strips a well-formed <script> tag", () => {
    expect(stripHtml("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("handles text without tags", () => {
    expect(stripHtml("texto plano")).toBe("texto plano");
  });
});

describe("sanitizeText", () => {
  it("strips HTML and trims", () => {
    expect(sanitizeText("  <script>evil</script>  ")).toBe("evil");
  });

  it("removes null bytes and control chars", () => {
    expect(sanitizeText("a\x00b\x07c")).toBe("abc");
  });

  it("keeps newlines and tabs", () => {
    expect(sanitizeText("line1\nline2\tend")).toBe("line1\nline2\tend");
  });

  it("caps at maxLength", () => {
    expect(sanitizeText("a".repeat(10), 5)).toBe("aaaaa");
  });

  it("returns empty string for non-string input", () => {
    // @ts-expect-error runtime hardening: non-string should yield ""
    expect(sanitizeText(null)).toBe("");
    // @ts-expect-error runtime hardening: non-string should yield ""
    expect(sanitizeText(undefined)).toBe("");
  });
});

describe("sanitizeName", () => {
  it("collapses newlines into spaces", () => {
    expect(sanitizeName("foo\nbar\rbaz")).toBe("foo bar baz");
  });

  it("strips HTML", () => {
    expect(sanitizeName("<img src=x>Juan")).toBe("Juan");
  });
});

describe("sanitizeEmail", () => {
  it("lowercases and trims", () => {
    expect(sanitizeEmail("  Alice@Example.COM  ")).toBe("alice@example.com");
  });

  it("rejects malformed email", () => {
    expect(sanitizeEmail("not-an-email")).toBe("");
    expect(sanitizeEmail("missing@tld")).toBe("");
  });

  it("caps at RFC 5321 max length (254 chars)", () => {
    const huge = "a".repeat(300) + "@b.co";
    expect(sanitizeEmail(huge).length).toBe(254);
  });
});
