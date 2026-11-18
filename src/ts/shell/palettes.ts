// The palettes (ADR D-020, section 11.3). Every v3 colour mode is kept: end A is the set v3 used in dark mode, end B the set
// it used in light mode, both over a dark background now that light mode is gone. "root" is root's warm and dusk pair.
// "custom" is built from the visitor's colour. Values are copied from v3 ColorUtils.getThemeColors and root's background.js.

import { hexToRgb, hslToRgb, mixHex, rgbToHex, rgbToHsl } from "../lib/colour.js";

export type Colours = { primary: string; secondary: string; accent: string; background: string };
export type Palette = { name: string; label: string; a: Colours; b: Colours };

const BG = "#0a0a0a";
const pair = (name: string, label: string, a: [string, string, string], b: [string, string, string]): Palette => ({
  name,
  label,
  a: { primary: a[0], secondary: a[1], accent: a[2], background: BG },
  b: { primary: b[0], secondary: b[1], accent: b[2], background: BG },
});

export const PALETTES: Palette[] = [
  {
    name: "root",
    label: "Root",
    a: { primary: "#404040", secondary: "#808080", accent: "#ffaa00", background: "#030303" },
    b: { primary: "#3d3752", secondary: "#7f78a0", accent: "#b794ff", background: "#040309" },
  },
  pair("cyber", "Cyber", ["#ff0080", "#8000ff", "#00ffff"], ["#d63384", "#6f42c1", "#0dcaf0"]),
  pair("ocean", "Ocean", ["#00aaff", "#0066aa", "#00ffff"], ["#0d6efd", "#0a58ca", "#17a2b8"]),
  pair("fire", "Fire", ["#ff4500", "#ff6600", "#ffff00"], ["#fd7e14", "#dc3545", "#ffc107"]),
  pair("spark", "Spark", ["#00ff41", "#0080ff", "#ff4500"], ["#28a745", "#007bff", "#fd7e14"]),
  pair("forest", "Forest", ["#90ee90", "#8fbc8f", "#f0e68c"], ["#6b8e23", "#9acd32", "#deb887"]),
  pair("synthwave", "Synthwave", ["#ff6ec7", "#7209b7", "#00f5ff"], ["#e91e63", "#9c27b0", "#00bcd4"]),
  pair("sunset", "Sunset", ["#ff6b35", "#f7931e", "#ffcd3c"], ["#ff5722", "#ff9800", "#ffc107"]),
  pair("midnight", "Midnight", ["#1e3a8a", "#3730a3", "#6366f1"], ["#1565c0", "#1976d2", "#42a5f5"]),
  pair("aurora", "Aurora", ["#10b981", "#06b6d4", "#8b5cf6"], ["#059669", "#0891b2", "#7c3aed"]),
  pair("neon", "Neon", ["#39ff14", "#ff073a", "#ff9f00"], ["#4caf50", "#f44336", "#ff9800"]),
];

export const DEFAULT_PALETTE = "root";
export const DEFAULT_CUSTOM = "#d63031";

// v3's custom mode used the colour at full, 50% and 38% alpha over the background. Substrate reads only six hex digits,
// so the alphas become real mixes with the background. End B is the same hue, darker.
export function customPalette(colour: string): Palette {
  const c = rgbToHex(hexToRgb(colour));
  const hsl = rgbToHsl(hexToRgb(c));
  const deep = rgbToHex(hslToRgb({ ...hsl, l: hsl.l * 0.65 }));
  const set = (base: string): Colours => ({
    primary: base,
    secondary: mixHex(BG, base, 0.5),
    accent: mixHex(BG, base, 0.376),
    background: BG,
  });
  return { name: "custom", label: "Custom", a: set(c), b: set(deep) };
}

export function findPalette(name: string, custom: string): Palette {
  if (name === "custom") return customPalette(custom);
  return PALETTES.find((p) => p.name === name) ?? PALETTES[0]!;
}

export function mixColours(p: Palette, t: number): Colours {
  return {
    primary: mixHex(p.a.primary, p.b.primary, t),
    secondary: mixHex(p.a.secondary, p.b.secondary, t),
    accent: mixHex(p.a.accent, p.b.accent, t),
    background: mixHex(p.a.background, p.b.background, t),
  };
}
