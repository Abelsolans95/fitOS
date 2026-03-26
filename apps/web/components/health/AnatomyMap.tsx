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

/* ── Color logic ─────────────────────────────────────────────────────── */

function getActiveStatus(statuses: MuscleStatus[], muscleId: string) {
  return statuses.find(
    (s) => s.muscle_id === muscleId && s.status !== "recovered"
  );
}

function getMuscleColor(statuses: MuscleStatus[], muscleId: string): string {
  const active = getActiveStatus(statuses, muscleId);
  if (!active) return "rgba(255,255,255,0.035)";
  if (active.pain_score >= 6) return "rgba(255,23,68,0.38)";
  return "rgba(255,145,0,0.32)";
}

function getMuscleStroke(statuses: MuscleStatus[], muscleId: string): string {
  const active = getActiveStatus(statuses, muscleId);
  if (!active) return "rgba(255,255,255,0.06)";
  if (active.pain_score >= 6) return "rgba(255,23,68,0.5)";
  return "rgba(255,145,0,0.4)";
}

function getGlowFilter(statuses: MuscleStatus[], muscleId: string, isSelected: boolean): string | undefined {
  if (!isSelected) return undefined;
  const active = getActiveStatus(statuses, muscleId);
  if (!active) return "url(#glow-neutral)";
  if (active.pain_score >= 6) return "url(#glow-red)";
  return "url(#glow-orange)";
}

/* ── Organic muscle paths — FRONT ────────────────────────────────────── */

const FRONT_MUSCLES: { id: string; label: string; path: string }[] = [
  // Head / Neck
  { id: "neck", label: "Cuello",
    path: "M93,60 C93,56 97,53 104,53 C111,53 115,56 115,60 L114,72 C112,75 108,77 104,77 C100,77 96,75 94,72 Z" },

  // Deltoids
  { id: "shoulder_left", label: "Hombro izq.",
    path: "M82,76 C78,74 72,72 66,74 C60,76 55,82 53,88 C51,93 52,97 54,98 L62,96 C66,92 72,86 78,82 Z" },
  { id: "shoulder_right", label: "Hombro der.",
    path: "M126,76 C130,74 136,72 142,74 C148,76 153,82 155,88 C157,93 156,97 154,98 L146,96 C142,92 136,86 130,82 Z" },

  // Pectorals
  { id: "chest_left", label: "Pecho izq.",
    path: "M82,80 C82,78 88,77 93,78 L93,82 L93,104 C91,108 86,112 80,114 C74,116 68,114 62,110 C58,107 56,102 56,98 L62,96 C66,92 74,84 82,80 Z" },
  { id: "chest_right", label: "Pecho der.",
    path: "M126,80 C126,78 120,77 115,78 L115,82 L115,104 C117,108 122,112 128,114 C134,116 140,114 146,110 C150,107 152,102 152,98 L146,96 C142,92 134,84 126,80 Z" },

  // Biceps
  { id: "biceps_left", label: "Bíceps izq.",
    path: "M54,98 C52,100 50,104 48,108 C46,114 44,120 44,126 C44,130 45,133 47,134 L53,132 C55,128 57,122 58,116 C59,112 60,108 62,104 L62,96 Z" },
  { id: "biceps_right", label: "Bíceps der.",
    path: "M154,98 C156,100 158,104 160,108 C162,114 164,120 164,126 C164,130 163,133 161,134 L155,132 C153,128 151,122 150,116 C149,112 148,108 146,104 L146,96 Z" },

  // Forearms
  { id: "forearm_left", label: "Antebrazo izq.",
    path: "M47,136 C45,140 43,148 42,156 C41,164 40,172 38,178 C37,182 36,185 36,186 L42,188 C44,184 46,178 48,170 C50,162 52,154 53,146 L53,132 Z" },
  { id: "forearm_right", label: "Antebrazo der.",
    path: "M161,136 C163,140 165,148 166,156 C167,164 168,172 170,178 C171,182 172,185 172,186 L166,188 C164,184 162,178 160,170 C158,162 156,154 155,146 L155,132 Z" },

  // Abdominals
  { id: "abs", label: "Abdominales",
    path: "M93,104 L93,108 C93,118 92,128 92,138 C92,148 92,158 93,164 C94,168 97,172 104,174 C111,172 114,168 115,164 C116,158 116,148 116,138 C116,128 115,118 115,108 L115,104 C112,106 108,107 104,107 C100,107 96,106 93,104 Z" },

  // Obliques
  { id: "oblique_left", label: "Oblicuo izq.",
    path: "M62,110 C66,113 72,115 78,116 L80,114 C82,116 86,118 90,118 L92,118 C92,128 92,138 92,148 C92,156 92,162 93,166 L88,170 C82,168 76,164 72,158 C68,152 66,144 64,136 C62,128 62,120 62,110 Z" },
  { id: "oblique_right", label: "Oblicuo der.",
    path: "M146,110 C142,113 136,115 130,116 L128,114 C126,116 122,118 118,118 L116,118 C116,128 116,138 116,148 C116,156 116,162 115,166 L120,170 C126,168 132,164 136,158 C140,152 142,144 144,136 C146,128 146,120 146,110 Z" },

  // Quadriceps
  { id: "quadriceps_left", label: "Cuádriceps izq.",
    path: "M88,172 C84,174 80,178 76,184 C72,192 70,200 68,210 C66,220 66,230 68,238 C70,244 72,248 76,250 L84,248 C86,244 88,238 90,230 C92,222 93,214 94,206 C95,198 95,190 94,182 C93,178 92,175 90,172 Z" },
  { id: "quadriceps_right", label: "Cuádriceps der.",
    path: "M120,172 C124,174 128,178 132,184 C136,192 138,200 140,210 C142,220 142,230 140,238 C138,244 136,248 132,250 L124,248 C122,244 120,238 118,230 C116,222 115,214 114,206 C113,198 113,190 114,182 C115,178 116,175 118,172 Z" },

  // Adductors (inner thigh)
  { id: "adductor_left", label: "Aductor izq.",
    path: "M94,182 C96,186 98,192 100,200 C102,210 103,218 104,224 L104,178 C100,178 97,180 94,182 Z" },
  { id: "adductor_right", label: "Aductor der.",
    path: "M114,182 C112,186 110,192 108,200 C106,210 105,218 104,224 L104,178 C108,178 111,180 114,182 Z" },

  // Shins / Tibialis
  { id: "shin_left", label: "Tibial izq.",
    path: "M76,254 C74,260 72,268 70,278 C68,288 67,298 68,306 C69,312 70,316 72,318 L80,316 C80,310 80,302 80,294 C80,284 80,274 82,264 C83,258 84,254 84,252 Z" },
  { id: "shin_right", label: "Tibial der.",
    path: "M132,254 C134,260 136,268 138,278 C140,288 141,298 140,306 C139,312 138,316 136,318 L128,316 C128,310 128,302 128,294 C128,284 128,274 126,264 C125,258 124,254 124,252 Z" },
];

/* ── Organic muscle paths — BACK ─────────────────────────────────────── */

const BACK_MUSCLES: { id: string; label: string; path: string }[] = [
  // Trapezius
  { id: "traps", label: "Trapecios",
    path: "M93,60 C96,62 100,64 104,64 C108,64 112,62 115,60 L118,68 C120,72 126,78 134,82 L126,82 C120,80 114,78 108,77 L104,76 L100,77 C94,78 88,80 82,82 L74,82 C82,78 88,72 90,68 Z" },

  // Lats / Upper back
  { id: "upper_back_left", label: "Dorsal izq.",
    path: "M82,84 C76,86 70,88 66,92 C62,96 60,102 58,108 C56,116 56,124 58,130 L66,134 C72,130 78,126 84,122 C88,118 91,114 92,110 L92,84 C89,84 86,84 82,84 Z" },
  { id: "upper_back_right", label: "Dorsal der.",
    path: "M126,84 C132,86 138,88 142,92 C146,96 148,102 150,108 C152,116 152,124 150,130 L142,134 C136,130 130,126 124,122 C120,118 117,114 116,110 L116,84 C119,84 122,84 126,84 Z" },

  // Rear Deltoids
  { id: "rear_delt_left", label: "Deltoides post. izq.",
    path: "M74,82 C68,78 62,76 56,78 C52,80 50,84 50,90 C50,94 52,97 54,98 L62,96 C66,92 70,88 74,84 Z" },
  { id: "rear_delt_right", label: "Deltoides post. der.",
    path: "M134,82 C140,78 146,76 152,78 C156,80 158,84 158,90 C158,94 156,97 154,98 L146,96 C142,92 138,88 134,84 Z" },

  // Triceps
  { id: "triceps_left", label: "Tríceps izq.",
    path: "M54,98 C52,102 50,108 48,114 C46,120 44,126 44,130 C44,134 46,136 48,136 L54,134 C56,130 57,124 58,118 C59,112 60,106 62,100 L62,96 Z" },
  { id: "triceps_right", label: "Tríceps der.",
    path: "M154,98 C156,102 158,108 160,114 C162,120 164,126 164,130 C164,134 162,136 160,136 L154,134 C152,130 151,124 150,118 C149,112 148,106 146,100 L146,96 Z" },

  // Rear Forearms
  { id: "forearm_back_left", label: "Antebrazo post. izq.",
    path: "M48,138 C46,144 44,152 42,160 C40,168 38,176 37,182 L36,186 L42,188 C44,182 46,174 48,166 C50,158 52,150 54,142 L54,134 Z" },
  { id: "forearm_back_right", label: "Antebrazo post. der.",
    path: "M160,138 C162,144 164,152 166,160 C168,168 170,176 171,182 L172,186 L166,188 C164,182 162,174 160,166 C158,158 156,150 154,142 L154,134 Z" },

  // Lower Back / Erectors
  { id: "lower_back", label: "Lumbar",
    path: "M92,110 C92,120 90,130 88,138 C86,146 84,152 84,158 C86,162 92,166 100,168 L104,168 L108,168 C116,166 122,162 124,158 C124,152 122,146 120,138 C118,130 116,120 116,110 C112,112 108,113 104,113 C100,113 96,112 92,110 Z" },

  // Glutes
  { id: "glute_left", label: "Glúteo izq.",
    path: "M84,160 C78,162 72,168 68,176 C64,184 64,190 66,194 C68,198 72,200 78,200 L88,198 C94,196 100,192 104,188 L104,170 C98,170 92,166 86,162 Z" },
  { id: "glute_right", label: "Glúteo der.",
    path: "M124,160 C130,162 136,168 140,176 C144,184 144,190 142,194 C140,198 136,200 130,200 L120,198 C114,196 108,192 104,188 L104,170 C110,170 116,166 122,162 Z" },

  // Hamstrings
  { id: "hamstring_left", label: "Isquiotibial izq.",
    path: "M66,202 C68,206 72,210 78,212 L90,210 C94,208 98,204 100,200 C100,210 98,222 96,232 C94,240 90,246 86,250 L76,250 C72,246 68,240 66,232 C64,224 64,214 66,202 Z" },
  { id: "hamstring_right", label: "Isquiotibial der.",
    path: "M142,202 C140,206 136,210 130,212 L118,210 C114,208 110,204 108,200 C108,210 110,222 112,232 C114,240 118,246 122,250 L132,250 C136,246 140,240 142,232 C144,224 144,214 142,202 Z" },

  // Calves
  { id: "calf_left", label: "Gemelo izq.",
    path: "M76,254 C72,258 70,264 68,272 C66,282 66,292 68,302 C70,310 72,316 74,318 L82,316 C82,310 82,302 82,292 C82,282 80,272 78,264 C77,260 76,256 76,254 Z" },
  { id: "calf_right", label: "Gemelo der.",
    path: "M132,254 C136,258 138,264 140,272 C142,282 142,292 140,302 C138,310 136,316 134,318 L126,316 C126,310 126,302 126,292 C126,282 128,272 130,264 C131,260 132,256 132,254 Z" },
];

/* ── Exports ─────────────────────────────────────────────────────────── */

export const ALL_MUSCLE_IDS = [
  ...FRONT_MUSCLES.map((m) => m.id),
  ...BACK_MUSCLES.map((m) => m.id),
];

export const MUSCLE_LABELS: Record<string, string> = {};
[...FRONT_MUSCLES, ...BACK_MUSCLES].forEach((m) => {
  MUSCLE_LABELS[m.id] = m.label;
});

/* ── SVG Filter Definitions (glow effects) ───────────────────────────── */

function GlowFilters() {
  return (
    <defs>
      {/* Neutral glow for selected muscle with no injury */}
      <filter id="glow-neutral" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.6  0 0 0 0.6 0" result="colorBlur" />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Orange glow for mild pain (1-5) */}
      <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.57  0 0 0 0 0  0 0 0 0.7 0" result="colorBlur" />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Red glow for severe pain (6-10) */}
      <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.09  0 0 0 0 0.27  0 0 0 0.8 0" result="colorBlur" />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Hover brightening */}
      <filter id="hover-brighten" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.15 0" result="whiteBrush" />
        <feMerge>
          <feMergeNode in="whiteBrush" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* ── Muscle region component ─────────────────────────────────────────── */

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
  const fillColor = getMuscleColor(statuses, muscle.id);
  const strokeColor = getMuscleStroke(statuses, muscle.id);
  const glowFilter = getGlowFilter(statuses, muscle.id, isSelected);

  return (
    <path
      d={muscle.path}
      fill={isSelected
        ? getActiveStatus(statuses, muscle.id)
          ? getActiveStatus(statuses, muscle.id)!.pain_score >= 6
            ? "rgba(255,23,68,0.55)"
            : "rgba(255,145,0,0.5)"
          : "rgba(255,255,255,0.1)"
        : fillColor
      }
      stroke={isSelected
        ? getActiveStatus(statuses, muscle.id)
          ? getActiveStatus(statuses, muscle.id)!.pain_score >= 6
            ? "rgba(255,23,68,0.7)"
            : "rgba(255,145,0,0.6)"
          : "rgba(255,255,255,0.2)"
        : strokeColor
      }
      strokeWidth={isSelected ? 1.2 : 0.6}
      strokeLinejoin="round"
      filter={glowFilter}
      className="cursor-pointer transition-all duration-300 hover:brightness-[1.8]"
      onClick={onClick}
    >
      <title>{muscle.label}</title>
    </path>
  );
}

/* ── Body silhouette outlines (organic) ──────────────────────────────── */

function BodyOutline({ view }: { view: "front" | "back" }) {
  // Shared head
  const head = "M104,6 C94,6 87,12 85,22 C83,30 84,38 86,44 C88,48 92,50 96,52 L104,53 L112,52 C116,50 120,48 122,44 C124,38 125,30 123,22 C121,12 114,6 104,6 Z";

  // Organic front body silhouette
  const frontBody = `
    M93,56 C88,58 84,62 82,68 C80,72 78,76 76,80
    C72,78 66,76 60,78 C54,80 50,86 48,94
    C46,102 44,112 42,122 C40,132 38,144 36,156
    C34,168 34,178 36,186 L42,188
    C44,180 48,168 52,156 C56,146 60,138 64,134
    C64,148 62,164 60,178 C58,194 56,210 56,226
    C56,248 58,270 62,290 C64,302 68,312 72,318
    L80,316 C80,306 80,294 82,280
    C84,266 86,254 88,250
    C90,252 92,256 94,262 C96,270 98,280 100,290
    C101,296 102,302 104,306
    C106,302 107,296 108,290 C110,280 112,270 114,262
    C116,256 118,252 120,250
    C122,254 124,266 126,280
    C128,294 128,306 128,316
    L136,318 C140,312 144,302 146,290
    C150,270 152,248 152,226 C152,210 150,194 148,178
    C146,164 144,148 144,134
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
    C56,154 56,170 56,186 C56,202 54,220 54,234
    C54,250 56,268 60,286 C64,302 68,314 74,318
    L82,316 C82,308 82,298 82,288
    C82,276 80,264 78,256
    C82,258 86,262 90,268 C94,274 98,282 100,290
    C102,298 103,304 104,308
    C105,304 106,298 108,290 C110,282 114,274 118,268
    C122,262 126,258 130,256
    C128,264 126,276 126,288
    C126,298 126,308 126,316
    L134,318 C140,314 144,302 148,286
    C152,268 154,250 154,234 C154,220 152,202 152,186
    C152,170 152,154 154,140
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
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {/* Body silhouette */}
      <path
        d={view === "front" ? frontBody : backBody}
        fill="rgba(255,255,255,0.015)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {/* Center line (subtle anatomical reference) */}
      <line
        x1="104" y1="56" x2="104" y2="174"
        stroke="rgba(255,255,255,0.025)"
        strokeWidth={0.4}
        strokeDasharray="2,4"
      />
    </g>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

export function AnatomyMap({ muscleStatuses, onMuscleClick, selectedMuscle }: AnatomyMapProps) {
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
          <span className="h-2 w-2 rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]" />
          Sin molestias
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FF9100]/40 shadow-[0_0_6px_rgba(255,145,0,0.4)]" />
          Leve (1-5)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FF1744]/40 shadow-[0_0_6px_rgba(255,23,68,0.4)]" />
          Grave (6-10)
        </span>
      </div>

      {/* SVG Anatomy Map */}
      <svg
        viewBox="0 0 208 330"
        className="h-[440px] w-auto max-w-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <GlowFilters />

        {/* Body silhouette (faint outline) */}
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

        {/* View label */}
        <text
          x="104"
          y="328"
          textAnchor="middle"
          fill="rgba(255,255,255,0.12)"
          fontSize="6"
          fontWeight="600"
          letterSpacing="0.25em"
          fontFamily="system-ui, sans-serif"
        >
          {view === "front" ? "VISTA FRONTAL" : "VISTA POSTERIOR"}
        </text>
      </svg>
    </div>
  );
}
