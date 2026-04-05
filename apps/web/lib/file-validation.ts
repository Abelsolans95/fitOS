/**
 * File upload validation utilities.
 *
 * Validates magic bytes (file signatures) to prevent malicious files
 * disguised with fake extensions (e.g., .exe renamed to .jpg).
 */

/** Known magic bytes for allowed image formats */
const IMAGE_SIGNATURES: { type: string; bytes: number[] }[] = [
  // JPEG: FF D8 FF
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  // GIF: 47 49 46 38
  { type: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
];

/**
 * Validate that a file's actual bytes match its claimed type.
 * Returns the detected MIME type, or null if unrecognized.
 */
export function validateImageMagicBytes(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer).slice(0, 12);

  for (const sig of IMAGE_SIGNATURES) {
    const match = sig.bytes.every((b, i) => bytes[i] === b);
    if (match) {
      // Extra check for WebP: bytes 8-11 should be "WEBP"
      if (sig.type === "image/webp") {
        const webpCheck = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
        if (!webpCheck) continue;
      }
      return sig.type;
    }
  }

  return null;
}

/** Excel file signatures */
const EXCEL_SIGNATURES = [
  // XLSX (ZIP-based): PK (50 4B 03 04)
  [0x50, 0x4b, 0x03, 0x04],
  // XLS (OLE2): D0 CF 11 E0
  [0xd0, 0xcf, 0x11, 0xe0],
];

/**
 * Validate that a file's bytes match Excel format.
 */
export function validateExcelMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer).slice(0, 4);
  return EXCEL_SIGNATURES.some((sig) => sig.every((b, i) => bytes[i] === b));
}

/**
 * Validate an image upload: check size, extension, and magic bytes.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateImageUpload(
  file: File,
  buffer: ArrayBuffer,
  maxSizeMB = 5
): { valid: boolean; error?: string } {
  // Size check
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Archivo demasiado grande (max ${maxSizeMB}MB)` };
  }

  // Extension check
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return { valid: false, error: "Extension no permitida. Usa .jpg, .png, .webp o .gif" };
  }

  // Magic bytes check
  const detectedType = validateImageMagicBytes(buffer);
  if (!detectedType) {
    return { valid: false, error: "El contenido del archivo no coincide con una imagen valida" };
  }

  return { valid: true };
}
