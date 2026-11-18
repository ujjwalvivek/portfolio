// Palettes (ADR D-027, superseding D-020's literal v3 values). Every v3 palette keeps its name and character, rebuilt on
// root's rule: one hue family per end. The accent is the vivid colour the whole page is drawn in; primary and secondary
// are dim tints of the same hue; the background is near-black with a trace of it. The two ends are neighbouring hues
// taken from the v3 palette's own colours, so the drift moves the hue and never changes which colour leads.
// "root" is root's warm and dusk pair, exactly as root has it. "custom" builds the same shape from the visitor's colour.

import { hexToRgb, hslToRgb, mixHex, rgbToHex, rgbToHsl } from "../lib/colour.js";

export type Colours = { primary: string; secondary: string; accent: string; background: string };
export type Palette = { name: string; label: string; a: Colours; b: Colours };

const hsl = (h: number, s: number, l: number) => rgbToHex(hslToRgb({ h: ((h % 360) + 360) % 360, s, l }));

// One end of a palette from its accent: hue, saturation and lightness of the vivid colour.
function end(h: number, s: number, l: number): Colours {
  return {
    primary: hsl(h, Math.min(s, 24), 26),
    secondary: hsl(h, Math.min(s, 22), 52),
    accent: hsl(h, s, l),
    background: hsl(h, 30, 3),
  };
}

const pal = (name: string, label: string, a: [number, number, number], b: [number, number, number]): Palette => ({
  name,
  label,
  a: end(...a),
  b: end(...b),
});

export const PALETTES: Palette[] = [
  {
    name: "root",
    label: "Root",
    a: { primary: "#404040", secondary: "#808080", accent: "#ffaa00", background: "#030303" },
    b: { primary: "#3d3752", secondary: "#7f78a0", accent: "#b794ff", background: "#040309" },
  },
  // v3: #ff0080 pink, #8000ff violet, #00ffff cyan
  pal("cyber", "Cyber", [330, 100, 58], [278, 100, 66]),
  // v3: #00aaff azure, #0066aa, #00ffff cyan
  pal("ocean", "Ocean", [200, 100, 55], [182, 100, 50]),
  // v3: #ff4500 orange-red, #ff6600, #ffff00 yellow
  pal("fire", "Fire", [16, 100, 55], [42, 100, 55]),
  // v3: #00ff41 green, #0080ff blue, #ff4500
  pal("spark", "Spark", [135, 100, 50], [172, 100, 45]),
  // v3: #90ee90 light green, #8fbc8f, #f0e68c khaki
  pal("forest", "Forest", [120, 60, 66], [62, 62, 64]),
  // v3: #ff6ec7 hot pink, #7209b7 purple, #00f5ff
  pal("synthwave", "Synthwave", [322, 100, 70], [282, 92, 66]),
  // v3: #ff6b35 orange, #f7931e, #ffcd3c gold
  pal("sunset", "Sunset", [18, 100, 60], [44, 100, 62]),
  // v3: #1e3a8a navy, #3730a3, #6366f1 indigo (v3's light set: #42a5f5)
  pal("midnight", "Midnight", [239, 84, 67], [207, 90, 61]),
  // v3: #10b981 emerald, #06b6d4 cyan, #8b5cf6
  pal("aurora", "Aurora", [160, 84, 45], [190, 94, 45]),
  // v3: #39ff14 acid green, #ff073a, #ff9f00
  pal("neon", "Neon", [111, 100, 54], [78, 100, 50]),
];

export const DEFAULT_PALETTE = "root";
export const DEFAULT_CUSTOM = "#d63031";

// The visitor's colour as the accent at one end, and its neighbour 30 degrees round at the other.
export function customPalette(colour: string): Palette {
  const c = rgbToHsl(hexToRgb(rgbToHex(hexToRgb(colour))));
  const s = Math.max(c.s, 40);
  const l = Math.min(Math.max(c.l, 45), 70);
  return { name: "custom", label: "Custom", a: end(c.h, s, l), b: end(c.h + 30, s, l) };
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
