// ── Day-of-week constants ─────────────────────────────────────────────────────

export const DAY_KEYS = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  "miércoles": "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  "sábado": "Sábado",
  domingo: "Domingo",
};

export const DAY_SHORT: Record<string, string> = {
  lunes: "L",
  martes: "M",
  "miércoles": "X",
  jueves: "J",
  viernes: "V",
  "sábado": "S",
  domingo: "D",
};
