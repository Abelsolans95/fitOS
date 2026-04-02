// ── Anatomy zone definitions ─────────────────────────────────────────────────
// SVG paths that overlay on top of real anatomical images.
// ViewBox: 0 0 400 720 — normalized coordinate space.
//
// FRONT zones calibrated for generated front_male.png (AI, no text, body centered).
// Image: 3072×5504 → maps ~1:1 to 400×720 viewBox.
//
// Corrected body landmarks (viewBox coords):
//   crown y≈25, chin y≈73, neck-base y≈95, shoulder-line y≈108,
//   deltoid-peak y≈118, armpit y≈142, nipple y≈154, pec-fold y≈178,
//   navel y≈260, hip-crease y≈320, crotch y≈340,
//   mid-thigh y≈395, knee y≈468, mid-shin y≈540, ankle y≈625, feet y≈665.
//   center x=200, shoulder-outer x≈272, hand-outer x≈300.

export interface MuscleZone {
  id: string;
  label: string;
  view: "front" | "back";
  path: string;
}

// ── FRONT ZONES ──────────────────────────────────────────────────────────────

const FRONT_ZONES: MuscleZone[] = [
  // ── Neck ──
  {
    id: "neck",
    label: "Cuello",
    view: "front",
    path: "M175,70 L225,70 L228,95 L172,95 Z",
  },
  // ── Trapezius (front view — neck-to-shoulder slope) ──
  {
    id: "trap_left",
    label: "Trapecio izq.",
    view: "front",
    path: "M174,92 L145,102 L130,111 L140,115 L160,104 L178,96 Z",
  },
  {
    id: "trap_right",
    label: "Trapecio der.",
    view: "front",
    path: "M226,92 L255,102 L270,111 L260,115 L240,104 L222,96 Z",
  },
  // ── Shoulders (deltoids) ──
  {
    id: "shoulder_left",
    label: "Hombro izq.",
    view: "front",
    path: "M140,110 L120,115 L100,128 L88,142 L85,165 L95,190 L115,205 L130,185 L138,155 L145,130 Z",
  },
  {
    id: "shoulder_right",
    label: "Hombro der.",
    view: "front",
    path: "M260,110 L280,115 L300,128 L312,142 L315,165 L305,190 L285,205 L270,185 L262,155 L255,130 Z",
  },
  // ── Chest (pectoralis major) ──
  {
    id: "chest_left",
    label: "Pecho izq.",
    view: "front",
    path: "M198,125 L160,125 L145,132 L130,145 L128,165 L138,178 L160,185 L185,188 L198,175 Z",
  },
  {
    id: "chest_right",
    label: "Pecho der.",
    view: "front",
    path: "M202,125 L240,125 L255,132 L270,145 L272,165 L262,178 L240,185 L215,188 L202,175 Z",
  },
  // ── Serratus anterior ──
  {
    id: "serratus_left",
    label: "Serrato izq.",
    view: "front",
    path: "M138,178 L125,185 L120,205 L130,225 L145,215 L148,190 Z",
  },
  {
    id: "serratus_right",
    label: "Serrato der.",
    view: "front",
    path: "M262,178 L275,185 L280,205 L270,225 L255,215 L252,190 Z",
  },
  // ── Biceps ──
  {
    id: "biceps_left",
    label: "Biceps izq.",
    view: "front",
    path: "M130,185 L110,205 L95,225 L92,250 L98,270 L115,275 L128,255 L135,230 L140,210 Z",
  },
  {
    id: "biceps_right",
    label: "Biceps der.",
    view: "front",
    path: "M270,185 L290,205 L305,225 L308,250 L302,270 L285,275 L272,255 L265,230 L260,210 Z",
  },
  // ── Forearms ──
  {
    id: "forearm_left",
    label: "Antebrazo izq.",
    view: "front",
    path: "M115,280 L95,280 L75,310 L70,340 L85,355 L108,345 L122,310 Z",
  },
  {
    id: "forearm_right",
    label: "Antebrazo der.",
    view: "front",
    path: "M285,280 L305,280 L325,310 L330,340 L315,355 L292,345 L278,310 Z",
  },
  // ── Abs (rectus abdominis) ──
  {
    id: "abs",
    label: "Abdominales",
    view: "front",
    path: "M182,185 L218,185 L225,230 L220,280 L212,320 L188,320 L180,280 L175,230 Z",
  },
  // ── Obliques ──
  {
    id: "oblique_left",
    label: "Oblicuo izq.",
    view: "front",
    path: "M145,190 L180,185 L172,230 L178,280 L185,320 L160,315 L145,280 L138,240 Z",
  },
  {
    id: "oblique_right",
    label: "Oblicuo der.",
    view: "front",
    path: "M255,190 L220,185 L228,230 L222,280 L215,320 L240,315 L255,280 L262,240 Z",
  },
  // ── Hip flexors ──
  {
    id: "hip_flexor_left",
    label: "Flexor cadera izq.",
    view: "front",
    path: "M162,320 L188,322 L190,340 L185,355 L165,350 L155,335 Z",
  },
  {
    id: "hip_flexor_right",
    label: "Flexor cadera der.",
    view: "front",
    path: "M238,320 L212,322 L210,340 L215,355 L235,350 L245,335 Z",
  },
  // ── Quadriceps ──
  {
    id: "quadriceps_left",
    label: "Cuadriceps izq.",
    view: "front",
    path: "M155,355 L190,355 L192,390 L195,430 L185,465 L175,480 L145,482 L130,440 L128,400 L135,370 Z",
  },
  {
    id: "quadriceps_right",
    label: "Cuadriceps der.",
    view: "front",
    path: "M245,355 L210,355 L208,390 L205,430 L215,465 L225,480 L255,482 L270,440 L272,400 L265,370 Z",
  },
  // ── Adductors (inner thigh) ──
  {
    id: "adductor_left",
    label: "Aductor izq.",
    view: "front",
    path: "M190,355 L200,355 L198,395 L195,435 L188,465 L182,440 L190,400 Z",
  },
  {
    id: "adductor_right",
    label: "Aductor der.",
    view: "front",
    path: "M210,355 L200,355 L202,395 L205,435 L212,465 L218,440 L210,400 Z",
  },
  // ── Knees ──
  {
    id: "knee_left",
    label: "Rodilla izq.",
    view: "front",
    path: "M145,485 L178,485 L182,500 L180,515 L175,520 L142,518 L138,500 Z",
  },
  {
    id: "knee_right",
    label: "Rodilla der.",
    view: "front",
    path: "M255,485 L222,485 L218,500 L220,515 L225,520 L258,518 L262,500 Z",
  },
  // ── Shins (tibialis anterior) ──
  {
    id: "shin_left",
    label: "Tibial izq.",
    view: "front",
    path: "M145,525 L175,525 L178,560 L175,600 L170,635 L145,630 L135,600 L132,560 Z",
  },
  {
    id: "shin_right",
    label: "Tibial der.",
    view: "front",
    path: "M255,525 L225,525 L222,560 L225,600 L230,635 L255,630 L265,600 L268,560 Z",
  },
];

// ── BACK ZONES ───────────────────────────────────────────────────────────────
// Calibrated for original back_male.jpg (315×756).
// With object-fit:contain in 400×720 viewBox, image scales to ~300×720
// centered with ~50px horizontal padding on each side.

const BACK_ZONES: MuscleZone[] = [
  {
    id: "traps",
    label: "Trapecios",
    view: "back",
    path: "M186,98 C194,106 200,110 206,110 C212,110 218,106 226,98 L234,112 C240,118 252,128 264,134 L252,136 C240,134 228,132 220,130 L206,128 L192,128 L178,130 C170,132 158,134 146,136 L134,134 C146,128 158,118 164,112 Z",
  },
  {
    id: "upper_back_left",
    label: "Dorsal izq.",
    view: "back",
    path: "M162,138 C152,142 142,150 134,160 C126,172 120,186 116,202 C112,218 112,234 116,246 L132,254 C142,248 152,240 162,230 C170,222 176,214 180,206 L186,146 C178,148 168,146 162,138 Z",
  },
  {
    id: "upper_back_right",
    label: "Dorsal der.",
    view: "back",
    path: "M244,138 C254,142 264,150 272,160 C280,172 286,186 290,202 C294,218 294,234 290,246 L274,254 C264,248 254,240 244,230 C236,222 230,214 226,206 L220,146 C228,148 238,146 244,138 Z",
  },
  {
    id: "rear_delt_left",
    label: "Delt. post. izq.",
    view: "back",
    path: "M148,134 C138,130 126,128 116,132 C108,136 104,144 104,154 C104,160 108,166 112,170 L124,166 C132,160 140,152 148,144 Z",
  },
  {
    id: "rear_delt_right",
    label: "Delt. post. der.",
    view: "back",
    path: "M258,134 C268,130 280,128 290,132 C298,136 302,144 302,154 C302,160 298,166 294,170 L282,166 C274,160 266,152 258,144 Z",
  },
  {
    id: "triceps_left",
    label: "Triceps izq.",
    view: "back",
    path: "M112,170 C108,180 104,192 100,206 C96,220 92,234 92,246 C92,254 96,258 100,258 L112,254 C116,246 118,236 120,226 C122,216 124,206 128,196 L128,166 Z",
  },
  {
    id: "triceps_right",
    label: "Triceps der.",
    view: "back",
    path: "M294,170 C298,180 302,192 306,206 C310,220 314,234 314,246 C314,254 310,258 306,258 L294,254 C290,246 288,236 286,226 C284,216 282,206 278,196 L278,166 Z",
  },
  {
    id: "forearm_back_left",
    label: "Antebr. post. izq.",
    view: "back",
    path: "M100,260 C96,272 92,288 88,304 C84,320 82,334 80,346 L78,354 L90,358 C94,346 98,330 102,314 C106,298 110,282 114,268 L114,254 Z",
  },
  {
    id: "forearm_back_right",
    label: "Antebr. post. der.",
    view: "back",
    path: "M306,260 C310,272 314,288 318,304 C322,320 324,334 326,346 L328,354 L316,358 C312,346 308,330 304,314 C300,298 296,282 292,268 L292,254 Z",
  },
  {
    id: "lower_back",
    label: "Lumbar",
    view: "back",
    path: "M186,206 C184,224 180,244 176,264 C172,284 168,300 166,312 C170,320 182,328 196,332 L206,332 L220,332 C234,328 246,320 250,312 C248,300 244,284 240,264 C236,244 232,224 230,206 C224,210 216,212 206,212 C196,212 190,210 186,206 Z",
  },
  {
    id: "glute_left",
    label: "Gluteo izq.",
    view: "back",
    path: "M166,316 C156,322 146,330 140,342 C134,354 132,366 136,374 C140,380 146,384 156,384 L174,380 C184,376 194,370 202,362 L202,334 C192,336 180,326 172,320 Z",
  },
  {
    id: "glute_right",
    label: "Gluteo der.",
    view: "back",
    path: "M250,316 C260,322 270,330 276,342 C282,354 284,366 280,374 C276,380 270,384 260,384 L242,380 C232,376 222,370 214,362 L214,334 C224,336 236,326 244,320 Z",
  },
  {
    id: "hamstring_left",
    label: "Isquiotibial izq.",
    view: "back",
    path: "M136,386 C140,392 146,398 156,402 L174,398 C182,394 190,388 196,382 C196,398 192,418 188,438 C184,458 178,474 172,484 L154,484 C146,476 140,464 136,452 C132,440 130,424 132,408 Z",
  },
  {
    id: "hamstring_right",
    label: "Isquiotibial der.",
    view: "back",
    path: "M280,386 C276,392 270,398 260,402 L242,398 C234,394 226,388 220,382 C220,398 224,418 228,438 C232,458 238,474 244,484 L262,484 C270,476 276,464 280,452 C284,440 286,424 284,408 Z",
  },
  {
    id: "calf_left",
    label: "Gemelo izq.",
    view: "back",
    path: "M154,490 C148,498 144,510 140,526 C136,542 136,556 140,570 C144,580 148,588 152,594 L164,590 C164,580 164,568 164,554 C164,538 162,522 158,508 C156,502 154,496 154,490 Z",
  },
  {
    id: "calf_right",
    label: "Gemelo der.",
    view: "back",
    path: "M262,490 C268,498 272,510 276,526 C280,542 280,556 276,570 C272,580 268,588 264,594 L252,590 C252,580 252,568 252,554 C252,538 254,522 258,508 C260,502 262,496 262,490 Z",
  },
];

// ── Combined & Lookup ────────────────────────────────────────────────────────

/** All muscle zones (front + back) */
export const MUSCLE_ZONES: MuscleZone[] = [...FRONT_ZONES, ...BACK_ZONES];

/** Zones filtered by view */
export function getZonesByView(view: "front" | "back"): MuscleZone[] {
  return view === "front" ? FRONT_ZONES : BACK_ZONES;
}

/** All zone IDs */
export const ALL_ZONE_IDS: string[] = MUSCLE_ZONES.map((z) => z.id);

/** Labels lookup: zoneId → Spanish label */
export const ZONE_LABELS: Record<string, string> = {};
MUSCLE_ZONES.forEach((z) => {
  ZONE_LABELS[z.id] = z.label;
});

/** Standard SVG viewBox for the anatomy overlay */
export const ANATOMY_VIEWBOX = "0 0 400 720";
export const ANATOMY_WIDTH = 400;
export const ANATOMY_HEIGHT = 720;
