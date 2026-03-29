"use client";

import { useState } from "react";

export interface MuscleStatus {
  muscle_id: string;
  pain_score: number;
  status: "active" | "recovering" | "recovered";
}

interface AnatomyMapProps {
  muscleStatuses: MuscleStatus[];
  onMuscleClick: (muscleId: string) => void;
  selectedMuscle?: string | null;
}

/* ── Helpers ──────────────────────────────────────────────── */

function getActiveStatus(statuses: MuscleStatus[], muscleId: string) {
  return statuses.find(
    (s) => s.muscle_id === muscleId && s.status !== "recovered"
  );
}

function getMuscleGradient(
  statuses: MuscleStatus[],
  muscleId: string,
  isSelected: boolean
): string {
  const active = getActiveStatus(statuses, muscleId);
  if (isSelected) {
    if (!active) return "url(#muscle-base-sel)";
    if (active.pain_score >= 6) return "url(#muscle-red-sel)";
    return "url(#muscle-orange-sel)";
  }
  if (!active) return "url(#muscle-base)";
  if (active.pain_score >= 6) return "url(#muscle-red)";
  return "url(#muscle-orange)";
}

function getMuscleStroke(
  statuses: MuscleStatus[],
  muscleId: string,
  isSelected: boolean
): string {
  const active = getActiveStatus(statuses, muscleId);
  if (isSelected) {
    if (!active) return "rgba(180,140,115,0.55)";
    if (active.pain_score >= 6) return "rgba(255,50,70,0.72)";
    return "rgba(255,155,40,0.68)";
  }
  if (!active) return "rgba(110,72,55,0.38)";
  if (active.pain_score >= 6) return "rgba(255,35,55,0.58)";
  return "rgba(255,140,15,0.52)";
}

function getGlowFilter(
  statuses: MuscleStatus[],
  muscleId: string,
  isSelected: boolean
): string | undefined {
  if (!isSelected) return undefined;
  const active = getActiveStatus(statuses, muscleId);
  if (!active) return "url(#glow-neutral)";
  if (active.pain_score >= 6) return "url(#glow-red)";
  return "url(#glow-orange)";
}

/* ── FRONT MUSCLES ──────────────────────────────────────── */

const FRONT_MUSCLES: { id: string; label: string; path: string }[] = [
  // Neck — sternocleidomastoid area
  {
    id: "neck",
    label: "Cuello",
    path: "M95,55 C95,52 98,49 104,48 C110,49 113,52 113,55 L112,68 C110,72 107,74 104,74 C101,74 98,72 96,68 Z",
  },
  // Left anterior deltoid
  {
    id: "shoulder_left",
    label: "Hombro izq.",
    path: "M84,72 C79,70 73,70 67,72 C61,75 56,80 53,86 C51,91 50,96 52,99 L60,98 C62,94 66,88 72,83 C76,80 80,77 84,75 Z",
  },
  // Right anterior deltoid
  {
    id: "shoulder_right",
    label: "Hombro der.",
    path: "M124,72 C129,70 135,70 141,72 C147,75 152,80 155,86 C157,91 158,96 156,99 L148,98 C146,94 142,88 136,83 C132,80 128,77 124,75 Z",
  },
  // Left pectoralis major — fan from sternum to arm
  {
    id: "chest_left",
    label: "Pecho izq.",
    path: "M100,74 C97,73 92,72 88,73 L84,74 C80,76 74,80 68,86 L60,96 L60,98 C58,102 58,106 60,110 C64,114 72,117 80,118 C88,119 94,118 98,116 L100,110 L100,74 Z",
  },
  // Right pectoralis major
  {
    id: "chest_right",
    label: "Pecho der.",
    path: "M108,74 C111,73 116,72 120,73 L124,74 C128,76 134,80 140,86 L148,96 L148,98 C150,102 150,106 148,110 C144,114 136,117 128,118 C120,119 114,118 110,116 L108,110 L108,74 Z",
  },
  // Left biceps brachii
  {
    id: "biceps_left",
    label: "Bíceps izq.",
    path: "M52,99 C50,103 48,109 46,116 C44,124 43,132 43,138 C43,142 44,145 46,146 L52,144 C54,140 55,134 56,126 C57,120 58,114 60,108 L60,98 Z",
  },
  // Right biceps brachii
  {
    id: "biceps_right",
    label: "Bíceps der.",
    path: "M156,99 C158,103 160,109 162,116 C164,124 165,132 165,138 C165,142 164,145 162,146 L156,144 C154,140 153,134 152,126 C151,120 150,114 148,108 L148,98 Z",
  },
  // Left forearm (brachioradialis / flexors)
  {
    id: "forearm_left",
    label: "Antebrazo izq.",
    path: "M46,148 C44,154 42,162 40,170 C38,178 37,185 36,190 L36,194 L42,196 C44,190 46,182 48,174 C50,166 51,158 52,150 L52,144 Z",
  },
  // Right forearm
  {
    id: "forearm_right",
    label: "Antebrazo der.",
    path: "M162,148 C164,154 166,162 168,170 C170,178 171,185 172,190 L172,194 L166,196 C164,190 162,182 160,174 C158,166 157,158 156,150 L156,144 Z",
  },
  // Rectus abdominis (six-pack)
  {
    id: "abs",
    label: "Abdominales",
    path: "M98,110 L98,116 C98,126 97,136 97,146 C97,156 98,164 100,170 C102,174 104,176 108,176 C112,174 114,170 116,164 C118,156 118,146 118,136 C118,126 117,116 116,110 L108,110 C106,112 102,112 100,110 Z",
  },
  // Left external oblique
  {
    id: "oblique_left",
    label: "Oblicuo izq.",
    path: "M60,110 C64,114 70,116 78,118 L80,118 C86,119 92,118 98,116 L98,110 L98,170 C96,172 92,174 88,174 L82,172 C76,170 72,166 68,160 C64,152 62,142 60,132 C58,122 58,114 60,110 Z",
  },
  // Right external oblique
  {
    id: "oblique_right",
    label: "Oblicuo der.",
    path: "M148,110 C144,114 138,116 130,118 L128,118 C122,119 116,118 110,116 L110,110 L110,170 C112,172 116,174 120,174 L126,172 C132,170 136,166 140,160 C144,152 146,142 148,132 C150,122 150,114 148,110 Z",
  },
  // Left quadriceps group
  {
    id: "quadriceps_left",
    label: "Cuádriceps izq.",
    path: "M88,176 C84,178 80,182 76,188 C72,196 70,206 68,216 C66,228 66,238 68,248 C70,256 74,260 78,262 L86,260 C88,254 90,246 92,236 C94,226 95,216 96,206 C97,198 96,190 94,184 C92,180 90,178 88,176 Z",
  },
  // Right quadriceps group
  {
    id: "quadriceps_right",
    label: "Cuádriceps der.",
    path: "M120,176 C124,178 128,182 132,188 C136,196 138,206 140,216 C142,228 142,238 140,248 C138,256 134,260 130,262 L122,260 C120,254 118,246 116,236 C114,226 113,216 112,206 C111,198 112,190 114,184 C116,180 118,178 120,176 Z",
  },
  // Left adductor
  {
    id: "adductor_left",
    label: "Aductor izq.",
    path: "M96,184 C98,190 100,198 102,208 C103,216 104,224 104,230 L104,180 C100,180 98,182 96,184 Z",
  },
  // Right adductor
  {
    id: "adductor_right",
    label: "Aductor der.",
    path: "M112,184 C110,190 108,198 106,208 C105,216 104,224 104,230 L104,180 C108,180 110,182 112,184 Z",
  },
  // Left tibialis anterior
  {
    id: "shin_left",
    label: "Tibial izq.",
    path: "M78,266 C76,272 74,280 72,290 C70,300 69,308 70,316 C71,322 72,326 74,328 L82,326 C82,320 82,312 82,304 C82,294 82,284 84,274 C84,270 85,266 86,264 Z",
  },
  // Right tibialis anterior
  {
    id: "shin_right",
    label: "Tibial der.",
    path: "M130,266 C132,272 134,280 136,290 C138,300 139,308 138,316 C137,322 136,326 134,328 L126,326 C126,320 126,312 126,304 C126,294 126,284 124,274 C124,270 123,266 122,264 Z",
  },
];

/* ── BACK MUSCLES ──────────────────────────────────────── */

const BACK_MUSCLES: { id: string; label: string; path: string }[] = [
  // Trapezius
  {
    id: "traps",
    label: "Trapecios",
    path: "M96,56 C100,60 104,62 108,62 C112,62 116,60 120,56 L124,64 C128,68 134,74 142,78 L134,80 C126,78 118,76 112,75 L108,74 L100,74 L96,75 C90,76 82,78 74,80 L66,78 C74,74 80,68 84,64 Z",
  },
  // Left latissimus dorsi
  {
    id: "upper_back_left",
    label: "Dorsal izq.",
    path: "M82,80 C76,82 70,86 66,92 C62,98 60,106 58,114 C56,122 56,130 58,136 L66,140 C72,136 78,130 84,124 C88,120 92,116 94,112 L96,82 C92,82 86,82 82,80 Z",
  },
  // Right latissimus dorsi
  {
    id: "upper_back_right",
    label: "Dorsal der.",
    path: "M126,80 C132,82 138,86 142,92 C146,98 148,106 150,114 C152,122 152,130 150,136 L142,140 C136,136 130,130 124,124 C120,120 116,116 114,112 L112,82 C116,82 122,82 126,80 Z",
  },
  // Left rear deltoid
  {
    id: "rear_delt_left",
    label: "Delt. post. izq.",
    path: "M74,78 C68,76 62,74 56,76 C52,78 50,82 50,88 C50,92 52,96 54,98 L62,96 C66,92 70,88 74,84 Z",
  },
  // Right rear deltoid
  {
    id: "rear_delt_right",
    label: "Delt. post. der.",
    path: "M134,78 C140,76 146,74 152,76 C156,78 158,82 158,88 C158,92 156,96 154,98 L146,96 C142,92 138,88 134,84 Z",
  },
  // Left triceps
  {
    id: "triceps_left",
    label: "Tríceps izq.",
    path: "M54,98 C52,102 50,108 48,114 C46,122 44,128 44,134 C44,138 46,140 48,140 L54,138 C56,134 57,128 58,120 C59,114 60,108 62,102 L62,96 Z",
  },
  // Right triceps
  {
    id: "triceps_right",
    label: "Tríceps der.",
    path: "M154,98 C156,102 158,108 160,114 C162,122 164,128 164,134 C164,138 162,140 160,140 L154,138 C152,134 151,128 150,120 C149,114 148,108 146,102 L146,96 Z",
  },
  // Left rear forearm
  {
    id: "forearm_back_left",
    label: "Antebr. post. izq.",
    path: "M48,142 C46,148 44,156 42,164 C40,172 38,180 37,186 L36,190 L42,192 C44,186 46,178 48,170 C50,162 52,154 54,146 L54,138 Z",
  },
  // Right rear forearm
  {
    id: "forearm_back_right",
    label: "Antebr. post. der.",
    path: "M160,142 C162,148 164,156 166,164 C168,172 170,180 171,186 L172,190 L166,192 C164,186 162,178 160,170 C158,162 156,154 154,146 L154,138 Z",
  },
  // Erector spinae / lower back
  {
    id: "lower_back",
    label: "Lumbar",
    path: "M96,112 C96,120 94,130 92,140 C90,150 88,158 88,164 C90,168 96,172 102,174 L108,174 L114,174 C120,172 126,168 128,164 C128,158 126,150 124,140 C122,130 120,120 120,112 C116,114 112,115 108,115 C104,115 100,114 96,112 Z",
  },
  // Left gluteus maximus
  {
    id: "glute_left",
    label: "Glúteo izq.",
    path: "M88,166 C82,168 76,172 72,180 C68,188 66,196 68,202 C70,206 74,208 80,208 L90,206 C96,204 102,200 106,194 L106,176 C100,176 94,170 90,168 Z",
  },
  // Right gluteus maximus
  {
    id: "glute_right",
    label: "Glúteo der.",
    path: "M128,166 C134,168 140,172 144,180 C148,188 150,196 148,202 C146,206 142,208 136,208 L126,206 C120,204 114,200 110,194 L110,176 C116,176 122,170 126,168 Z",
  },
  // Left hamstrings
  {
    id: "hamstring_left",
    label: "Isquiotibial izq.",
    path: "M68,210 C70,214 74,218 80,220 L92,218 C96,216 100,212 102,208 C102,218 100,230 98,240 C96,250 92,258 88,262 L78,262 C74,256 70,248 68,240 C66,232 66,222 68,210 Z",
  },
  // Right hamstrings
  {
    id: "hamstring_right",
    label: "Isquiotibial der.",
    path: "M148,210 C146,214 142,218 136,220 L124,218 C120,216 116,212 114,208 C114,218 116,230 118,240 C120,250 124,258 128,262 L138,262 C142,256 146,248 148,240 C150,232 150,222 148,210 Z",
  },
  // Left gastrocnemius
  {
    id: "calf_left",
    label: "Gemelo izq.",
    path: "M78,266 C74,270 72,278 70,288 C68,298 68,306 70,314 C72,320 74,326 76,328 L84,326 C84,320 84,312 84,302 C84,292 82,282 80,274 C79,270 78,268 78,266 Z",
  },
  // Right gastrocnemius
  {
    id: "calf_right",
    label: "Gemelo der.",
    path: "M138,266 C142,270 144,278 146,288 C148,298 148,306 146,314 C144,320 142,326 140,328 L132,326 C132,320 132,312 132,302 C132,292 134,282 136,274 C137,270 138,268 138,266 Z",
  },
];

/* ── Exports ─────────────────────────────────────────────── */

export const ALL_MUSCLE_IDS = [
  ...FRONT_MUSCLES.map((m) => m.id),
  ...BACK_MUSCLES.map((m) => m.id),
];

export const MUSCLE_LABELS: Record<string, string> = {};
[...FRONT_MUSCLES, ...BACK_MUSCLES].forEach((m) => {
  MUSCLE_LABELS[m.id] = m.label;
});

/* ── SVG Defs: gradients, filters, patterns ──────────────── */

function SvgDefs() {
  return (
    <defs>
      {/* ── Muscle radial gradients (3D volume effect) ── */}
      <radialGradient
        id="muscle-base"
        cx="50%" cy="38%" r="65%" fx="48%" fy="32%"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="rgb(185,125,100)" stopOpacity="0.34" />
        <stop offset="55%" stopColor="rgb(150,95,72)" stopOpacity="0.24" />
        <stop offset="100%" stopColor="rgb(110,68,50)" stopOpacity="0.14" />
      </radialGradient>

      <radialGradient
        id="muscle-base-sel"
        cx="50%" cy="38%" r="65%" fx="48%" fy="32%"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="rgb(210,155,125)" stopOpacity="0.48" />
        <stop offset="55%" stopColor="rgb(175,120,90)" stopOpacity="0.35" />
        <stop offset="100%" stopColor="rgb(140,90,68)" stopOpacity="0.22" />
      </radialGradient>

      <radialGradient
        id="muscle-orange"
        cx="50%" cy="38%" r="65%" fx="48%" fy="32%"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="rgb(255,170,55)" stopOpacity="0.58" />
        <stop offset="55%" stopColor="rgb(255,145,25)" stopOpacity="0.42" />
        <stop offset="100%" stopColor="rgb(210,110,0)" stopOpacity="0.26" />
      </radialGradient>

      <radialGradient
        id="muscle-orange-sel"
        cx="50%" cy="38%" r="65%" fx="48%" fy="32%"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="rgb(255,185,70)" stopOpacity="0.72" />
        <stop offset="55%" stopColor="rgb(255,155,35)" stopOpacity="0.55" />
        <stop offset="100%" stopColor="rgb(230,120,5)" stopOpacity="0.38" />
      </radialGradient>

      <radialGradient
        id="muscle-red"
        cx="50%" cy="38%" r="65%" fx="48%" fy="32%"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="rgb(255,55,75)" stopOpacity="0.62" />
        <stop offset="55%" stopColor="rgb(255,35,55)" stopOpacity="0.46" />
        <stop offset="100%" stopColor="rgb(190,18,38)" stopOpacity="0.28" />
      </radialGradient>

      <radialGradient
        id="muscle-red-sel"
        cx="50%" cy="38%" r="65%" fx="48%" fy="32%"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="rgb(255,70,90)" stopOpacity="0.78" />
        <stop offset="55%" stopColor="rgb(255,45,65)" stopOpacity="0.58" />
        <stop offset="100%" stopColor="rgb(210,25,45)" stopOpacity="0.4" />
      </radialGradient>

      {/* ── Background spotlight ── */}
      <radialGradient id="bg-spotlight" cx="50%" cy="42%" r="48%">
        <stop offset="0%" stopColor="rgba(150,100,80,0.07)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>

      {/* ── Muscle fiber texture pattern ── */}
      <pattern
        id="fiber-pattern"
        patternUnits="userSpaceOnUse"
        width="5" height="5"
        patternTransform="rotate(20)"
      >
        <line
          x1="0" y1="0" x2="0" y2="5"
          stroke="rgba(255,255,255,0.025)"
          strokeWidth="0.5"
        />
      </pattern>

      {/* ── Glow filters ── */}
      <filter id="glow-neutral" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feColorMatrix
          in="blur" type="matrix"
          values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0.55 0"
          result="colorBlur"
        />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feColorMatrix
          in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.57  0 0 0 0 0  0 0 0 0.72 0"
          result="colorBlur"
        />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix
          in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.1  0 0 0 0 0.28  0 0 0 0.78 0"
          result="colorBlur"
        />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="hover-brighten" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feColorMatrix
          in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.85  0 0 0 0 0.7  0 0 0 0.18 0"
          result="warmBrush"
        />
        <feMerge>
          <feMergeNode in="warmBrush" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* ── Anatomical detail lines (decorative) ────────────────── */

function AnatomyDetails({ view }: { view: "front" | "back" }) {
  if (view === "front") {
    return (
      <g className="pointer-events-none">
        {/* Muscle fiber direction lines */}
        <g opacity={0.13} stroke="rgba(200,150,118,1)" strokeWidth={0.4} fill="none">
          {/* Linea alba (center of abs) */}
          <line x1="104" y1="112" x2="104" y2="174" />

          {/* Ab tendinous intersections (six-pack divisions) */}
          <line x1="99" y1="120" x2="109" y2="120" />
          <line x1="98" y1="132" x2="110" y2="132" />
          <line x1="98" y1="144" x2="110" y2="144" />
          <line x1="99" y1="156" x2="109" y2="156" />

          {/* Pec fiber fan — left */}
          <path d="M100,80 C92,84 82,90 72,98" />
          <path d="M100,90 C93,94 84,100 76,108" />
          <path d="M100,100 C95,104 88,110 82,116" />

          {/* Pec fiber fan — right */}
          <path d="M108,80 C116,84 126,90 136,98" />
          <path d="M108,90 C115,94 124,100 132,108" />
          <path d="M108,100 C113,104 120,110 126,116" />

          {/* Serratus anterior fingers — left */}
          <path d="M64,108 L76,114" />
          <path d="M62,114 L74,120" />
          <path d="M60,120 L72,126" />
          <path d="M60,126 L70,132" />

          {/* Serratus anterior fingers — right */}
          <path d="M144,108 L132,114" />
          <path d="M146,114 L134,120" />
          <path d="M148,120 L136,126" />
          <path d="M148,126 L138,132" />

          {/* Quad divisions — left */}
          <path d="M82,188 C82,208 82,228 80,250" />
          <path d="M90,184 C90,204 90,224 90,252" />

          {/* Quad divisions — right */}
          <path d="M126,188 C126,208 126,228 128,250" />
          <path d="M118,184 C118,204 118,224 118,252" />
        </g>

        {/* Anatomical landmarks */}
        <g opacity={0.08} stroke="rgba(255,255,255,1)" strokeWidth={0.4} fill="none">
          {/* Clavicles */}
          <path d="M104,70 C98,68 90,67 82,70" />
          <path d="M104,70 C110,68 118,67 126,70" />

          {/* Sternum notch */}
          <circle cx="104" cy="70" r="1.2" fill="rgba(255,255,255,0.06)" stroke="none" />

          {/* Navel */}
          <circle cx="104" cy="150" r="1.5" fill="rgba(255,255,255,0.05)" stroke="none" />

          {/* Kneecap outlines */}
          <ellipse cx="82" cy="264" rx="5" ry="4" />
          <ellipse cx="126" cy="264" rx="5" ry="4" />
        </g>
      </g>
    );
  }

  // Back view
  return (
    <g className="pointer-events-none">
      <g opacity={0.13} stroke="rgba(200,150,118,1)" strokeWidth={0.4} fill="none">
        {/* Spine line */}
        <line x1="104" y1="62" x2="104" y2="170" strokeDasharray="2,3" />

        {/* Scapula outlines */}
        <path d="M92,80 C88,84 86,92 86,100 C86,106 88,110 92,112" />
        <path d="M116,80 C120,84 122,92 122,100 C122,106 120,110 116,112" />

        {/* Lat fiber lines — left */}
        <path d="M94,92 C86,98 78,106 70,114" />
        <path d="M94,102 C86,108 78,116 70,124" />
        <path d="M94,112 C88,118 80,126 74,132" />

        {/* Lat fiber lines — right */}
        <path d="M114,92 C122,98 130,106 138,114" />
        <path d="M114,102 C122,108 130,116 138,124" />
        <path d="M114,112 C120,118 128,126 134,132" />

        {/* Erector spinae lines */}
        <line x1="100" y1="116" x2="100" y2="168" />
        <line x1="108" y1="116" x2="108" y2="168" />

        {/* Glute fiber lines */}
        <path d="M104,178 C96,184 88,192 80,200" />
        <path d="M104,178 C112,184 120,192 128,200" />

        {/* Hamstring divisions */}
        <line x1="84" y1="214" x2="84" y2="256" />
        <line x1="124" y1="214" x2="124" y2="256" />

        {/* Calf medial head division */}
        <path d="M78,272 C78,288 76,304 76,320" />
        <path d="M138,272 C138,288 140,304 140,320" />
      </g>

      {/* Anatomical landmarks */}
      <g opacity={0.08} stroke="rgba(255,255,255,1)" strokeWidth={0.4} fill="none">
        {/* Spine bumps (vertebrae hints) */}
        <circle cx="104" cy="72" r="0.8" fill="rgba(255,255,255,0.06)" stroke="none" />
        <circle cx="104" cy="82" r="0.8" fill="rgba(255,255,255,0.06)" stroke="none" />
        <circle cx="104" cy="92" r="0.8" fill="rgba(255,255,255,0.06)" stroke="none" />
        <circle cx="104" cy="102" r="0.8" fill="rgba(255,255,255,0.06)" stroke="none" />
        <circle cx="104" cy="112" r="0.8" fill="rgba(255,255,255,0.06)" stroke="none" />

        {/* Sacrum triangle */}
        <path d="M100,168 L104,178 L108,168" />

        {/* Knee crease lines */}
        <path d="M74,264 C78,266 84,266 88,264" />
        <path d="M120,264 C124,266 130,266 134,264" />
      </g>
    </g>
  );
}

/* ── Body outline (silhouette) ───────────────────────────── */

function BodyOutline({ view }: { view: "front" | "back" }) {
  // Head
  const head =
    "M104,6 C94,6 87,12 85,22 C83,30 84,38 86,44 C88,48 92,50 96,52 L104,53 L112,52 C116,50 120,48 122,44 C124,38 125,30 123,22 C121,12 114,6 104,6 Z";

  // Front body silhouette — hugs muscle regions tightly
  const frontBody = `
    M93,56 C88,58 84,62 82,68 C80,72 78,76 76,80
    C72,78 66,76 60,78 C54,80 50,86 48,94
    C46,102 44,112 42,122 C40,132 38,144 36,156
    C34,168 34,178 36,186 L42,188
    C44,180 48,168 52,156 C56,146 60,138 64,134
    C64,146 64,160 66,174
    C66,186 64,200 64,218
    C63,232 63,246 66,256
    C68,264 70,278 70,294
    C70,308 70,320 72,328
    L78,332 C82,334 86,332 86,328
    C84,318 84,304 84,290
    C84,278 86,268 88,258
    C92,246 96,232 100,216
    C102,204 104,194 104,188
    C104,194 106,204 108,216
    C112,232 116,246 120,258
    C122,268 124,278 124,290
    C124,304 124,318 124,328
    L126,332 C130,334 134,332 136,328
    C138,320 138,308 138,294
    C138,278 140,264 142,256
    C145,246 145,232 144,218
    C144,200 142,186 142,174
    C144,160 144,146 144,134
    C148,138 152,146 156,156 C160,168 164,180 166,188
    L172,186 C174,178 174,168 172,156
    C170,144 168,132 166,122 C164,112 162,102 160,94
    C158,86 154,80 148,78 C142,76 136,78 132,80
    C130,76 128,72 126,68 C124,62 120,58 115,56
    C112,54 108,53 104,53 C100,53 96,54 93,56 Z
  `;

  const backBody = `
    M93,56 C88,58 84,62 82,68 C80,72 78,76 76,80
    C70,78 64,76 58,78 C52,80 50,86 50,92
    C50,100 48,110 46,120 C44,132 42,144 40,156
    C38,168 36,178 36,186 L42,188
    C44,180 46,172 48,164 C50,156 52,148 54,140
    C56,152 56,164 58,174
    C60,186 62,200 62,218
    C62,232 62,246 64,256
    C66,264 66,278 66,294
    C66,308 68,320 70,328
    L78,332 C82,334 86,332 86,328
    C84,318 84,304 84,290
    C84,278 86,268 88,258
    C92,246 96,232 100,216
    C102,204 104,194 104,188
    C104,194 106,204 108,216
    C112,232 116,246 120,258
    C122,268 124,278 124,290
    C124,304 124,318 124,328
    L126,332 C130,334 134,332 136,328
    C140,320 140,308 142,294
    C142,278 144,264 146,256
    C148,246 148,232 148,218
    C148,200 148,186 150,174
    C152,164 152,152 154,140
    C156,148 158,156 160,164 C162,172 164,180 166,188
    L172,186 C174,178 170,168 168,156
    C166,144 164,132 162,120 C160,110 158,100 158,92
    C158,86 156,80 150,78 C144,76 138,78 132,80
    C130,76 128,72 126,68 C124,62 120,58 115,56
    C112,54 108,53 104,53 C100,53 96,54 93,56 Z
  `;

  return (
    <g>
      {/* Head */}
      <path
        d={head}
        fill="rgba(160,110,88,0.06)"
        stroke="rgba(160,120,95,0.14)"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      {/* Ears (small arcs) */}
      <path
        d="M85,26 C83,22 83,30 85,28"
        fill="none"
        stroke="rgba(160,120,95,0.1)"
        strokeWidth={0.5}
      />
      <path
        d="M123,26 C125,22 125,30 123,28"
        fill="none"
        stroke="rgba(160,120,95,0.1)"
        strokeWidth={0.5}
      />

      {/* Body silhouette */}
      <path
        d={view === "front" ? frontBody : backBody}
        fill="rgba(160,110,88,0.04)"
        stroke="rgba(160,120,95,0.12)"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {/* Center line (subtle anatomical reference) */}
      <line
        x1="104" y1="56" x2="104" y2="174"
        stroke="rgba(160,120,95,0.04)"
        strokeWidth={0.4}
        strokeDasharray="2,4"
      />

    </g>
  );
}

/* ── Interactive muscle region ───────────────────────────── */

function MuscleRegion({
  muscle,
  statuses,
  isSelected,
  onClick,
}: {
  muscle: { id: string; label: string; path: string };
  statuses: MuscleStatus[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const gradientUrl = getMuscleGradient(statuses, muscle.id, isSelected);
  const strokeColor = getMuscleStroke(statuses, muscle.id, isSelected);
  const glowFilter = getGlowFilter(statuses, muscle.id, isSelected);

  return (
    <g className="cursor-pointer" onClick={onClick}>
      {/* Main muscle shape with gradient fill */}
      <path
        d={muscle.path}
        fill={gradientUrl}
        stroke={strokeColor}
        strokeWidth={isSelected ? 1.3 : 0.7}
        strokeLinejoin="round"
        filter={glowFilter}
        className="transition-all duration-300 hover:brightness-[1.5]"
      >
        <title>{muscle.label}</title>
      </path>

      {/* Fiber texture overlay */}
      <path
        d={muscle.path}
        fill="url(#fiber-pattern)"
        stroke="none"
        className="pointer-events-none"
      />
    </g>
  );
}

/* ── Main component ──────────────────────────────────────── */

export function AnatomyMap({
  muscleStatuses,
  onMuscleClick,
  selectedMuscle,
}: AnatomyMapProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const muscles = view === "front" ? FRONT_MUSCLES : BACK_MUSCLES;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* View toggle */}
      <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-[#0A0A12] p-1">
        <button
          type="button"
          onClick={() => setView("front")}
          className={`rounded-md px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
            view === "front"
              ? "bg-[#00E5FF]/8 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.1)]"
              : "text-[#5A5A72] hover:text-[#8B8BA3]"
          }`}
        >
          Frontal
        </button>
        <button
          type="button"
          onClick={() => setView("back")}
          className={`rounded-md px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
            view === "back"
              ? "bg-[#00E5FF]/8 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.1)]"
              : "text-[#5A5A72] hover:text-[#8B8BA3]"
          }`}
        >
          Posterior
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-5 text-[9px] uppercase tracking-[0.2em] text-[#5A5A72]">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8B5A4A]/25 ring-1 ring-[#8B5A4A]/30" />
          Sin molestias
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF9100]/45 shadow-[0_0_8px_rgba(255,145,0,0.5)]" />
          Leve (1-5)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF1744]/45 shadow-[0_0_8px_rgba(255,23,68,0.5)]" />
          Grave (6-10)
        </span>
      </div>

      {/* SVG Anatomy Map */}
      <svg
        viewBox="0 0 208 350"
        className="h-[460px] w-auto max-w-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <SvgDefs />

        {/* Background spotlight effect */}
        <rect
          x="0" y="0" width="208" height="350"
          fill="url(#bg-spotlight)"
        />

        {/* Body silhouette */}
        <BodyOutline view={view} />

        {/* Interactive muscle regions */}
        {muscles.map((muscle) => (
          <MuscleRegion
            key={muscle.id}
            muscle={muscle}
            statuses={muscleStatuses}
            isSelected={selectedMuscle === muscle.id}
            onClick={() => onMuscleClick(muscle.id)}
          />
        ))}

        {/* Anatomical detail lines (fiber directions, landmarks) */}
        <AnatomyDetails view={view} />

        {/* View label */}
        <text
          x="104"
          y="348"
          textAnchor="middle"
          fill="rgba(160,120,95,0.18)"
          fontSize="6"
          fontWeight="700"
          letterSpacing="0.3em"
          fontFamily="system-ui, sans-serif"
        >
          {view === "front" ? "VISTA FRONTAL" : "VISTA POSTERIOR"}
        </text>
      </svg>
    </div>
  );
}
