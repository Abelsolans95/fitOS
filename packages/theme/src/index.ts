/**
 * @kuvox/theme — Única fuente de verdad para colores, spacing y radius.
 *
 * Uso:
 *   Mobile: import { colors } from "@kuvox/theme"
 *   Web JS:  import { colors } from "@kuvox/theme"  (inline styles, charts)
 *   Web CSS: clases Tailwind (bg-neon-cyan, text-neon-violet...) generadas
 *            por `pnpm sync-theme` desde estos valores.
 *
 * Para cambiar la paleta de marca: editar aquí y ejecutar `pnpm sync-theme`.
 */

export const colors = {
  // Fondos
  bg: "#0A0A0F",
  surface: "#12121A",
  surfaceHover: "#1A1A2E",
  surfaceElevated: "#16162266",
  sidebar: "#08080D",

  // Texto
  white: "#E8E8ED",
  muted: "#8B8BA3",
  dimmed: "#5A5A72",

  // Bordes
  border: "rgba(255, 255, 255, 0.06)",
  borderSubtle: "rgba(255, 255, 255, 0.03)",
  borderActive: "rgba(0, 229, 255, 0.15)",
  // Versiones hex para manipulación dinámica de opacidad en RN:
  // usar borderHex con StyleSheet opacity en lugar de rgba string
  borderHex: "#FFFFFF",

  // Brand — acento principal
  cyan: "#00E5FF",
  cyanDim: "rgba(0, 229, 255, 0.08)",
  cyanGlow: "rgba(0, 229, 255, 0.15)",

  // Brand — acento secundario
  violet: "#7C3AED",
  violetDim: "rgba(124, 58, 237, 0.08)",
  violetGlow: "rgba(124, 58, 237, 0.15)",

  // Estados
  green: "#00C853",
  greenDim: "rgba(0, 200, 83, 0.08)",
  orange: "#FF9100",
  orangeDim: "rgba(255, 145, 0, 0.08)",
  red: "#FF1744",
  redDim: "rgba(255, 23, 68, 0.08)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
} as const;

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
} as const;

export type Colors = typeof colors;
export type ColorKey = keyof Colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
