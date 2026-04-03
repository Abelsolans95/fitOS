/**
 * CSRF protection for API routes.
 *
 * Validates that the request Origin or Referer header matches our domain.
 * This prevents cross-site form submissions from malicious websites.
 *
 * Usage in API routes:
 *   if (!validateCsrf(request)) {
 *     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   }
 */

/** Allowed origins — add your production domain(s) here */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

/**
 * Parse origin string to compare strictly.
 * Uses URL constructor to prevent subdomain bypass (e.g. localhost:3000.evil.com).
 */
function isOriginAllowed(origin: string, allowed: string[]): boolean {
  try {
    const parsed = new URL(origin);
    return allowed.some((a) => {
      try {
        const allowedParsed = new URL(a);
        return parsed.origin === allowedParsed.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Validate CSRF by checking Origin/Referer headers.
 * Returns true if the request is from a trusted origin.
 */
export function validateCsrf(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Add production URL from env if available
  const prodUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowed = [...ALLOWED_ORIGINS];
  if (prodUrl) allowed.push(prodUrl);

  // Check Origin header first (most reliable)
  if (origin) {
    return isOriginAllowed(origin, allowed);
  }

  // Fallback to Referer header
  if (referer) {
    return isOriginAllowed(referer, allowed);
  }

  // No Origin or Referer — block state-changing requests
  const method = request.method?.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  return false;
}
