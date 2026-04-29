"use client";

import Image from "next/image";
import { useMemo } from "react";

interface AvatarProps {
  /** Signed URL or public URL. `null` renders the initials fallback. */
  src?: string | null;
  /** Full name or label used for the fallback initials + alt text. */
  name: string;
  /** Pixel size — controls both width and height. */
  size?: number;
  /** Extra className applied to the outer container. */
  className?: string;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// Deterministic gradient per name — same name always gets the same colors,
// so the visual identity stays stable across the app.
const GRADIENT_PAIRS = [
  ["#00E5FF", "#7C3AED"],
  ["#7C3AED", "#FF1744"],
  ["#00C853", "#00E5FF"],
  ["#FF9100", "#FF1744"],
  ["#7C3AED", "#00C853"],
];

function gradientFor(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const pair = GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length]!;
  return [pair[0]!, pair[1]!];
}

export function Avatar({ src, name, size = 40, className = "" }: AvatarProps) {
  const initials = useMemo(() => initialsFor(name), [name]);
  const [from, to] = useMemo(() => gradientFor(name), [name]);

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full border border-white/10 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          // Allow remote storage hosts + data URLs without hitting Next optimizer quirks.
          unoptimized={src.startsWith("data:") || src.startsWith("blob:")}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-[#0A0A0F] ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        fontSize: Math.max(10, Math.floor(size * 0.4)),
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </div>
  );
}
