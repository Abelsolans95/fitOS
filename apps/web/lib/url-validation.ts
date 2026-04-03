/**
 * URL validation utilities.
 *
 * Prevents SSRF attacks by whitelisting allowed domains for video URLs
 * and other user-provided URLs.
 */

/** Allowed domains for video embeds */
const ALLOWED_VIDEO_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "vimeo.com",
  "player.vimeo.com",
  "www.vimeo.com",
];

/**
 * Validate that a URL is a safe video URL (YouTube or Vimeo only).
 * Returns true if the URL is from an allowed domain, false otherwise.
 */
export function isAllowedVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  try {
    const parsed = new URL(url.trim());
    // Only allow https
    if (parsed.protocol !== "https:") return false;
    // Check domain against whitelist
    return ALLOWED_VIDEO_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize a video URL. Returns the cleaned URL or null if invalid.
 */
export function sanitizeVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return isAllowedVideoUrl(trimmed) ? trimmed : null;
}

/**
 * Validate that a URL uses HTTPS protocol (safe for rendering as href).
 * Blocks javascript:, data:, file:, and other dangerous schemes.
 */
export function isSafeHttpsUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
