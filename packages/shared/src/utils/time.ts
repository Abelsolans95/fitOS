// ── Time formatting utilities ─────────────────────────────────────────────────

/** Converts seconds to M:SS format. e.g. 75 → "1:15" */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
