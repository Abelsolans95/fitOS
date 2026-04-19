"use client";

import { useState, memo } from "react";
import Image from "next/image";
import {
  getZonesByView,
  ZONE_LABELS,
  ALL_ZONE_IDS,
  ANATOMY_VIEWBOX,
} from "@kuvox/shared";
import type { MuscleZone } from "@kuvox/shared";

/* ── Public types ──────────────────────────────────────────── */

export interface MuscleStatus {
  muscle_id: string;
  pain_score: number;
  status: "active" | "recovering" | "recovered";
}

export type Gender = "male" | "female";

interface AnatomyMapProps {
  muscleStatuses: MuscleStatus[];
  onMuscleClick: (muscleId: string) => void;
  selectedMuscle?: string | null;
  gender?: Gender;
}

/* ── Re-exports for consumers ──────────────────────────────── */

export { ZONE_LABELS as MUSCLE_LABELS, ALL_ZONE_IDS as ALL_MUSCLE_IDS };

/* ── Helpers ──────────────────────────────────────────────── */

function getActiveStatus(statuses: MuscleStatus[], muscleId: string) {
  return statuses.find(
    (s) => s.muscle_id === muscleId && s.status !== "recovered"
  );
}

function getZoneFill(
  statuses: MuscleStatus[],
  muscleId: string,
  isSelected: boolean
): string {
  const active = getActiveStatus(statuses, muscleId);

  if (isSelected) {
    if (!active) return "rgba(0,229,255,0.30)"; // cyan selection
    if (active.pain_score >= 6) return "rgba(255,23,68,0.45)"; // red severe
    return "rgba(255,145,0,0.40)"; // orange mild
  }

  if (!active) return "transparent";
  if (active.pain_score >= 6) return "rgba(255,23,68,0.35)";
  return "rgba(255,145,0,0.30)";
}

function getZoneStroke(
  statuses: MuscleStatus[],
  muscleId: string,
  isSelected: boolean
): string {
  const active = getActiveStatus(statuses, muscleId);

  if (isSelected) {
    if (!active) return "rgba(0,229,255,0.6)";
    if (active.pain_score >= 6) return "rgba(255,23,68,0.7)";
    return "rgba(255,145,0,0.65)";
  }

  if (!active) return "transparent";
  if (active.pain_score >= 6) return "rgba(255,23,68,0.5)";
  return "rgba(255,145,0,0.45)";
}

function getGlowFilter(
  statuses: MuscleStatus[],
  muscleId: string,
  isSelected: boolean
): string | undefined {
  const active = getActiveStatus(statuses, muscleId);
  if (!active && !isSelected) return undefined;
  if (isSelected) {
    if (!active) return "url(#glow-cyan)";
    if (active.pain_score >= 6) return "url(#glow-red)";
    return "url(#glow-orange)";
  }
  if (active && active.pain_score >= 6) return "url(#glow-red)";
  if (active) return "url(#glow-orange)";
  return undefined;
}

/** Select correct image based on gender + view */
function getImageSrc(gender: Gender, view: "front" | "back"): string {
  const map: Record<string, string> = {
    "male-front": "/assets/anatomy/front_male.png",
    "male-back": "/assets/anatomy/back_male.jpg",
    "female-front": "/assets/anatomy/front_female.jpg",
    "female-back": "/assets/anatomy/back_female.jpg",
  };
  return map[`${gender}-${view}`];
}

/* ── SVG Defs ──────────────────────────────────────────────── */

function SvgDefs() {
  return (
    <defs>
      <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.6 0"
          result="colorBlur"
        />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.57  0 0 0 0 0  0 0 0 0.7 0"
          result="colorBlur"
        />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 0.1  0 0 0 0 0.26  0 0 0 0.75 0"
          result="colorBlur"
        />
        <feMerge>
          <feMergeNode in="colorBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* ── Interactive zone region ───────────────────────────────── */

const ZoneRegion = memo(function ZoneRegion({
  zone,
  statuses,
  isSelected,
  onClick,
}: {
  zone: MuscleZone;
  statuses: MuscleStatus[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const fill = getZoneFill(statuses, zone.id, isSelected);
  const stroke = getZoneStroke(statuses, zone.id, isSelected);
  const filter = getGlowFilter(statuses, zone.id, isSelected);

  return (
    <path
      d={zone.path}
      fill={fill}
      stroke={stroke}
      strokeWidth={isSelected ? 1.5 : 0.8}
      strokeLinejoin="round"
      filter={filter}
      className="cursor-pointer transition-all duration-200 hover:fill-[rgba(0,229,255,0.25)] hover:stroke-[rgba(0,229,255,0.5)]"
      onClick={onClick}
    >
      <title>{zone.label}</title>
    </path>
  );
});

/* ── Main component ──────────────────────────────────────── */

export function AnatomyMap({
  muscleStatuses,
  onMuscleClick,
  selectedMuscle,
  gender = "male",
}: AnatomyMapProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const zones = getZonesByView(view);
  const imageSrc = getImageSrc(gender, view);

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
          <span className="h-2.5 w-2.5 rounded-full bg-[#5A5A72]/20 ring-1 ring-[#5A5A72]/30" />
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

      {/* Image + SVG overlay container */}
      <div
        className="relative mx-auto w-full select-none"
        style={{ maxWidth: 350, aspectRatio: "400 / 720" }}
      >
        {/* Background anatomy image */}
        <Image
          src={imageSrc}
          alt={`Vista ${view === "front" ? "frontal" : "posterior"} — ${gender === "male" ? "hombre" : "mujer"}`}
          fill
          sizes="350px"
          className="rounded-xl object-contain"
          priority
        />

        {/* Interactive SVG overlay */}
        <svg
          viewBox={ANATOMY_VIEWBOX}
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <SvgDefs />

          {zones.map((zone) => (
            <ZoneRegion
              key={zone.id}
              zone={zone}
              statuses={muscleStatuses}
              isSelected={selectedMuscle === zone.id}
              onClick={() => onMuscleClick(zone.id)}
            />
          ))}
        </svg>
      </div>

      {/* View label */}
      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]/40">
        {view === "front" ? "Vista frontal" : "Vista posterior"} —{" "}
        {gender === "male" ? "Hombre" : "Mujer"}
      </p>
    </div>
  );
}
