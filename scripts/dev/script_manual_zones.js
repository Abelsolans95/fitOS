const fs = require('fs');

const fullPath = 'packages/shared/src/anatomy/zones.ts';
let content = fs.readFileSync(fullPath, 'utf8');

const newFrontZones = `const FRONT_ZONES: MuscleZone[] = [
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
];`;

let matchOrig = content.match(/const FRONT_ZONES: MuscleZone\[\] = \[[\s\S]+?\];/);
if (matchOrig) {
  content = content.replace(matchOrig[0], newFrontZones);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Update matched properly!');
} else {
  console.log('Could not find FRONT_ZONES');
}
