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
  // Production domains will be added via env var
];

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
    return allowed.some((a) => origin === a || origin.startsWith(a));
  }

  // Fallback to Referer header
  if (referer) {
    return allowed.some((a) => referer.startsWith(a));
  }

  // No Origin or Referer — could be same-origin request from browser (GET)
  // or a server-to-server call. Block for POST/PUT/DELETE methods.
  const method = request.method?.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  // No origin info for a state-changing request → reject
  return false;
}
