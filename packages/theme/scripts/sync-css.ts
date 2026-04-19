/**
 * sync-css.ts — Sincroniza los colores de @kuvox/theme con globals.css (Tailwind v4)
 *
 * Uso: pnpm sync-theme
 *
 * Lee los valores de packages/theme/src/index.ts y regenera el bloque
 * marcado entre [fitos-theme-start] y [fitos-theme-end] en globals.css.
 * El resto del archivo (tokens shadcn, utilidades CSS) no se toca.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { colors } from "../src/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSS_PATH = resolve(__dirname, "../../../apps/web/app/globals.css");

// Mapeo: clave de colors → nombre de variable CSS Tailwind
// Solo se generan los colores hex puros (no rgba, que no son válidos en @theme)
const CSS_MAP: Array<[keyof typeof colors, string]> = [
  ["cyan",         "neon-cyan"],
  ["violet",       "neon-violet"],
  ["green",        "neon-green"],
  ["orange",       "neon-orange"],
  ["red",          "neon-red"],
  ["surface",      "surface"],
  ["surfaceHover", "surface-hover"],
];

function generateBlock(): string {
  const lines = CSS_MAP.map(([key, cssName]) => {
    const value = colors[key];
    return `  --color-${cssName}: ${value};`;
  });

  // Nota: el string `before` ya incluye los espacios de indentación
  // previos al marcador (ej. "  " del bloque @theme). No añadir aquí.
  return [
    "/* [fitos-theme-start] — AUTO-GENERATED: edit packages/theme/src/index.ts + run pnpm sync-theme */",
    ...lines,
    "  /* [fitos-theme-end] */",
  ].join("\n");
}

function sync() {
  const css = readFileSync(CSS_PATH, "utf-8");

  const startMarker = "/* [fitos-theme-start]";
  const endMarker = "/* [fitos-theme-end] */";

  const startIdx = css.indexOf(startMarker);
  const endIdx = css.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error(
      "❌  No se encontraron los marcadores [fitos-theme-start] / [fitos-theme-end] en globals.css.\n" +
      "   Añade los marcadores manualmente primero (ver comentarios en globals.css)."
    );
    process.exit(1);
  }

  const before = css.slice(0, startIdx);
  const after = css.slice(endIdx + endMarker.length);
  const updated = before + generateBlock() + after;

  writeFileSync(CSS_PATH, updated, "utf-8");

  console.log("✅  globals.css actualizado con los colores de @kuvox/theme:");
  CSS_MAP.forEach(([key, cssName]) => {
    console.log(`   --color-${cssName}: ${colors[key]}`);
  });
}

sync();
