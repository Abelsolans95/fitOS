import { MuscleZone } from "./types"; // Or whatever

export const FRONT_ZONES: MuscleZone[] = [
  // ── Neck ──
  {
    id: "neck",
    label: "Cuello",
    view: "front",
    path: "M188,73 L212,73 L214,95 L186,95 Z",
  },
  // ── Trapezius (front view — neck-to-shoulder slope) ──
  {
    id: "trap_left",
    label: "Trapecio izq.",
    view: "front",
    path: "M186,92 L168,98 L150,106 L144,114 L152,118 L172,110 L188,102 Z",
  },
  {
    id: "trap_right",
    label: "Trapecio der.",
    view: "front",
    path: "M214,92 L232,98 L250,106 L256,114 L248,118 L228,110 L212,102 Z",
  },
  // ── Shoulders (deltoids) ──
  {
    id: "shoulder_left",
    label: "Hombro izq.",
    view: "front",
    path: "M152,110 L142,112 L132,118 L128,128 L130,138 L136,144 L148,144 L156,138 L158,128 L156,118 Z",
  },
  {
    id: "shoulder_right",
    label: "Hombro der.",
    view: "front",
    path: "M248,110 L258,112 L268,118 L272,128 L270,138 L264,144 L252,144 L244,138 L242,128 L244,118 Z",
  },
  // ── Chest (pectoralis major) ──
  {
    id: "chest_left",
    label: "Pecho izq.",
    view: "front",
    path: "M198,126 L172,124 L156,130 L148,142 L148,154 L154,166 L166,174 L184,178 L198,174 L200,154 Z",
  },
  {
    id: "chest_right",
    label: "Pecho der.",
    view: "front",
    path: "M202,126 L228,124 L244,130 L252,142 L252,154 L246,166 L234,174 L216,178 L202,174 L200,154 Z",
  },
  // ── Serratus anterior ──
  {
    id: "serratus_left",
    label: "Serrato izq.",
    view: "front",
    path: "M144,154 L156,156 L154,176 L150,198 L142,202 L138,182 L140,164 Z",
  },
  {
    id: "serratus_right",
    label: "Serrato der.",
    view: "front",
    path: "M256,154 L244,156 L246,176 L250,198 L258,202 L262,182 L260,164 Z",
  },
  // ── Biceps ──
  {
    id: "biceps_left",
    label: "Biceps izq.",
    view: "front",
    path: "M138,146 L126,150 L118,168 L116,188 L120,208 L128,218 L140,214 L142,194 L142,174 L140,158 Z",
  },
  {
    id: "biceps_right",
    label: "Biceps der.",
    view: "front",
    path: "M262,146 L274,150 L282,168 L284,188 L280,208 L272,218 L260,214 L258,194 L258,174 L260,158 Z",
  },
  // ── Forearms ──
  {
    id: "forearm_left",
    label: "Antebrazo izq.",
    view: "front",
    path: "M128,222 L116,226 L108,250 L102,280 L98,312 L102,326 L116,322 L122,294 L126,264 L128,240 Z",
  },
  {
    id: "forearm_right",
    label: "Antebrazo der.",
    view: "front",
    path: "M272,222 L284,226 L292,250 L298,280 L302,312 L298,326 L284,322 L278,294 L274,264 L272,240 Z",
  },
  // ── Abs (rectus abdominis) ──
  {
    id: "abs",
    label: "Abdominales",
    view: "front",
    path: "M186,180 L214,180 L216,212 L216,248 L214,282 L212,310 L188,310 L186,282 L184,248 L184,212 Z",
  },
  // ── Obliques ──
  {
    id: "oblique_left",
    label: "Oblicuo izq.",
    view: "front",
    path: "M146,186 L184,180 L184,212 L182,248 L180,284 L178,310 L162,306 L150,282 L146,250 L144,218 Z",
  },
  {
    id: "oblique_right",
    label: "Oblicuo der.",
    view: "front",
    path: "M254,186 L216,180 L216,212 L218,248 L220,284 L222,310 L238,306 L250,282 L254,250 L256,218 Z",
  },
  // ── Hip flexors ──
  {
    id: "hip_flexor_left",
    label: "Flexor cadera izq.",
    view: "front",
    path: "M160,312 L184,310 L188,326 L186,340 L172,342 L158,334 L156,322 Z",
  },
  {
    id: "hip_flexor_right",
    label: "Flexor cadera der.",
    view: "front",
    path: "M240,312 L216,310 L212,326 L214,340 L228,342 L242,334 L244,322 Z",
  },
  // ── Quadriceps ──
  {
    id: "quadriceps_left",
    label: "Cuadriceps izq.",
    view: "front",
    path: "M158,344 L190,342 L194,374 L194,410 L190,444 L184,462 L164,464 L152,448 L148,414 L150,378 Z",
  },
  {
    id: "quadriceps_right",
    label: "Cuadriceps der.",
    view: "front",
    path: "M242,344 L210,342 L206,374 L206,410 L210,444 L216,462 L236,464 L248,448 L252,414 L250,378 Z",
  },
  // ── Adductors (inner thigh) ──
  {
    id: "adductor_left",
    label: "Aductor izq.",
    view: "front",
    path: "M190,344 L204,344 L202,384 L200,424 L198,458 L190,456 L186,422 L188,382 Z",
  },
  {
    id: "adductor_right",
    label: "Aductor der.",
    view: "front",
    path: "M210,344 L196,344 L198,384 L200,424 L202,458 L210,456 L214,422 L212,382 Z",
  },
  // ── Knees ──
  {
    id: "knee_left",
    label: "Rodilla izq.",
    view: "front",
    path: "M156,462 L184,460 L188,472 L186,484 L184,488 L156,488 L152,476 Z",
  },
  {
    id: "knee_right",
    label: "Rodilla der.",
    view: "front",
    path: "M244,462 L216,460 L212,472 L214,484 L216,488 L244,488 L248,476 Z",
  },
  // ── Shins (tibialis anterior) ──
  {
    id: "shin_left",
    label: "Tibial izq.",
    view: "front",
    path: "M162,490 L182,490 L184,524 L184,562 L180,598 L176,626 L158,624 L154,596 L154,560 L156,522 Z",
  },
  {
    id: "shin_right",
    label: "Tibial der.",
    view: "front",
    path: "M238,490 L218,490 L216,524 L216,562 L220,598 L224,626 L242,624 L246,596 L246,560 L244,522 Z",
  },
];
