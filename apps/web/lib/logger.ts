/**
 * Structured logging utility.
 *
 * Outputs JSON-formatted logs for easy parsing by log aggregators
 * (Sentry, Datadog, Vercel Logs, etc.).
 *
 * Usage:
 *   logger.info("User login", { userId: "abc", ip: "1.2.3.4" });
 *   logger.warn("Rate limit near", { userId: "abc", remaining: 2 });
 *   logger.error("DB query failed", { table: "profiles", error: err.message });
 *   logger.security("IDOR attempt blocked", { userId: "abc", targetResource: "routine-xyz" });
 */

type LogLevel = "info" | "warn" | "error" | "security";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  };

  const output = JSON.stringify(entry);

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
