/**
 * Input sanitization utilities.
 *
 * Strips HTML tags and dangerous patterns from user-provided text.
 * React auto-escapes JSX output, but these functions protect against:
 * - Stored XSS (malicious text saved to DB, rendered in emails/exports/webhooks)
 * - Log injection (control characters in server logs)
 * - SQL-like patterns that could confuse PostgREST filters
 */

/** Strip all HTML tags from a string. Returns plain text. */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a text field: strip HTML, trim whitespace, limit length.
 * Use for all user-provided text before saving to DB.
 */
export function sanitizeText(input: string, maxLength = 5000): string {
  if (!input || typeof input !== "string") return "";
  let clean = stripHtml(input);
  // Remove null bytes and other control characters (except newlines/tabs)
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Trim and limit length
  return clean.trim().slice(0, maxLength);
}

/**
 * Sanitize a short field (name, title, etc.): single line, no HTML, limited length.
 */
export function sanitizeName(input: string, maxLength = 200): string {
  if (!input || typeof input !== "string") return "";
  let clean = stripHtml(input);
  // Remove all newlines — names/titles are single-line
  clean = clean.replace(/[\r\n]/g, " ");
  // Remove control characters
  clean = clean.replace(/[\x00-\x1F\x7F]/g, "");
  return clean.trim().slice(0, maxLength);
}

/**
 * Sanitize an email address: basic format validation + lowercase.
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim().toLowerCase();
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "";
  return trimmed.slice(0, 254); // RFC 5321 max email length
}
