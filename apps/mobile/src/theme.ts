// FitOS Design System — Mobile
// Aesthetic: Dark luxury tech with elegant brutalism

export const colors = {
  // Core
  bg: "#0A0A0F",
  surface: "#12121A",
  surfaceHover: "#1A1A2E",
  surfaceElevated: "#16162266",
  sidebar: "#08080D",

  // Text
  white: "#E8E8ED",
  muted: "#8B8BA3",
  dimmed: "#5A5A72",

  // Borders
  border: "rgba(255, 255, 255, 0.06)",
  borderSubtle: "rgba(255, 255, 255, 0.03)",
  borderActive: "rgba(0, 229, 255, 0.15)",

  // Brand
  cyan: "#00E5FF",
  cyanDim: "rgba(0, 229, 255, 0.08)",
  cyanGlow: "rgba(0, 229, 255, 0.15)",
  violet: "#7C3AED",
  violetDim: "rgba(124, 58, 237, 0.08)",
  violetGlow: "rgba(124, 58, 237, 0.15)",
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

// Shadow utilities for iOS
export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  }),
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;
