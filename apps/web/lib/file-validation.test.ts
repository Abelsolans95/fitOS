import { describe, it, expect } from "vitest";
import {
  validateImageMagicBytes,
  validateExcelMagicBytes,
  validateImageUpload,
} from "./file-validation";

function buf(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe("validateImageMagicBytes", () => {
  it("detects JPEG signature", () => {
    expect(validateImageMagicBytes(buf(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  });

  it("detects PNG signature", () => {
    expect(validateImageMagicBytes(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe("image/png");
  });

  it("detects GIF signature", () => {
    expect(validateImageMagicBytes(buf(0x47, 0x49, 0x46, 0x38, 0x39))).toBe("image/gif");
  });

  it("requires WEBP bytes 8-11 to match (rejects plain RIFF)", () => {
    // RIFF header with wrong payload at offset 8 → null
    const notWebp = buf(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20);
    expect(validateImageMagicBytes(notWebp)).toBe(null);
    const webp = buf(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
    expect(validateImageMagicBytes(webp)).toBe("image/webp");
  });

  it("rejects HTML disguised as image (polyglot attack)", () => {
    const fakeJpeg = buf(0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e); // "<html>"
    expect(validateImageMagicBytes(fakeJpeg)).toBe(null);
  });
});

describe("validateExcelMagicBytes", () => {
  it("accepts XLSX (ZIP-based PK signature)", () => {
    expect(validateExcelMagicBytes(buf(0x50, 0x4b, 0x03, 0x04))).toBe(true);
  });

  it("accepts legacy XLS (OLE2 signature)", () => {
    expect(validateExcelMagicBytes(buf(0xd0, 0xcf, 0x11, 0xe0))).toBe(true);
  });

  it("rejects arbitrary bytes", () => {
    expect(validateExcelMagicBytes(buf(0, 0, 0, 0))).toBe(false);
  });
});

describe("validateImageUpload", () => {
  function makeFile(name: string, size: number): File {
    const data = new Uint8Array(size);
    return new File([data], name, { type: "image/jpeg" });
  }

  it("accepts a valid JPEG", () => {
    const f = makeFile("photo.jpg", 1000);
    const result = validateImageUpload(f, buf(0xff, 0xd8, 0xff, 0xe0));
    expect(result.valid).toBe(true);
  });

  it("rejects file above max size", () => {
    const f = makeFile("photo.jpg", 6 * 1024 * 1024);
    const result = validateImageUpload(f, buf(0xff, 0xd8, 0xff), 5);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/grande/);
  });

  it("rejects svg extension even with valid-looking bytes (gotcha #91 — SVG XSS)", () => {
    const f = makeFile("evil.svg", 500);
    const result = validateImageUpload(f, buf(0xff, 0xd8, 0xff));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Extension/);
  });

  it("rejects mismatched magic bytes (extension says jpg, bytes say something else)", () => {
    const f = makeFile("fake.jpg", 500);
    const result = validateImageUpload(f, buf(0x00, 0x00, 0x00, 0x00));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/imagen valida/);
  });
});
