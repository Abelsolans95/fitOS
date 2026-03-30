"use client";

const PREF_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  allergies:            { label: "Alergias",             icon: "\u26A0\uFE0F", color: "#FF1744" },
  allergy:              { label: "Alergias",             icon: "\u26A0\uFE0F", color: "#FF1744" },
  disliked_foods:       { label: "No le gusta",          icon: "\uD83D\uDC4E", color: "#FF9100" },
  disliked:             { label: "No le gusta",          icon: "\uD83D\uDC4E", color: "#FF9100" },
  dietary_restrictions: { label: "Restricciones",        icon: "\uD83D\uDEAB", color: "#7C3AED" },
  restrictions:         { label: "Restricciones",        icon: "\uD83D\uDEAB", color: "#7C3AED" },
  preferred_foods:      { label: "Alimentos preferidos", icon: "\u2705", color: "#00C853" },
  preferences:          { label: "Preferencias",         icon: "\u2705", color: "#00C853" },
  goals:                { label: "Objetivos",            icon: "\uD83C\uDFAF", color: "#00E5FF" },
  notes:                { label: "Notas",                icon: "\uD83D\uDCDD", color: "#8B8BA3" },
};

function formatPrefValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function FoodPreferencesCard({ prefs }: { prefs: string | Record<string, unknown> }) {
  // Parse if string
  let parsed: Record<string, unknown> = {};
  if (typeof prefs === "string") {
    try { parsed = JSON.parse(prefs); } catch { parsed = { notas: prefs }; }
  } else {
    parsed = prefs;
  }

  const entries = Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined && v !== "");

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4 space-y-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00E5FF]">
        Preferencias alimentarias
      </p>
      <div className="space-y-1.5">
        {entries.map(([key, value]) => {
          const meta = PREF_LABELS[key.toLowerCase()] ?? {
            label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            icon: "\u2022",
            color: "#8B8BA3",
          };
          const formatted = formatPrefValue(value);
          return (
            <div key={key} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-[13px]">{meta.icon}</span>
              <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span
                  className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="text-[13px] text-[#E8E8ED]">{formatted}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
