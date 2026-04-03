/**
 * Structured logging utility.
 *
 * Outputs JSON-formatted logs for easy parsing by log aggregators
 * (Sentry, Datadog, Vercel Logs, etc.).
 *
 * PII-sensitive keys are automatically redacted.
 *
 * Usage:
 *   logger.info("User login", { userId: "abc", ip: "1.2.3.4" });
 *   logger.warn("Rate limit near", { userId: "abc", remaining: 2 });
 *   logger.error("DB query failed", { table: "profiles" });
 *   logger.security("IDOR attempt blocked", { userId: "abc", targetResource: "routine-xyz" });
 */

type LogLevel = "info" | "warn" | "error" | "security";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

// Keys that should never appear in logs
const SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "apikey", "api_key",
  "authorization", "cookie", "session", "credit_card", "ssn",
  "access_token", "refresh_token", "private_key", "service_role",
]);

/** Redact sensitive fields from context objects (shallow + 1 level deep). */
function redactSensitive(context: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      // Redact one level deep
      const nested: Record<string, unknown> = {};
      for (const [nk, nv] of Object.entries(value as Record<string, unknown>)) {
        nested[nk] = SENSITIVE_KEYS.has(nk.toLowerCase()) ? "[REDACTED]" : nv;
      }
      redacted[key] = nested;
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context: redactSensitive(context) } : {}),
  };

  // Safe stringify — handle circular references
  let output: string;
  try {
    output = JSON.stringify(entry);
  } catch {
    output = JSON.stringify({ level, message, timestamp: entry.timestamp, context: "[serialization error]" });
  }

  switch (level) {
    case "error":
    case "security":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
  /** Security events: IDOR attempts, role escalation, suspicious patterns */
  security: (msg: string, ctx?: Record<string, unknown>) => log("security", msg, ctx),
};
