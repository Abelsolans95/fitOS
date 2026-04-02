// FitOS Design System — Mobile
// Colores, spacing y radius vienen de @fitos/theme (fuente de verdad compartida).
// Para cambiar la paleta: editar packages/theme/src/index.ts
// Para actualizar Tailwind web: ejecutar pnpm sync-theme desde la raíz.

import { colors, spacing, radius, fonts } from "@fitos/theme";

export { colors, spacing, radius, fonts };
export type { Colors, ColorKey, Spacing, Radius } from "@fitos/theme";

// Shadow utilities — permanecen aquí porque usan APIs de React Native.
// No se pueden compartir con web (shadowColor, elevation son propiedades RN).
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
  glowCyan: {
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glowViolet: {
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
