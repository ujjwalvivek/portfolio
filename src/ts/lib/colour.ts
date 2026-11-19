// Colour maths shared by the palettes, the drift and the CSS variables. One copy (v3 had three).

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1]!, 16), g: parseInt(m[2]!, 16), b: parseInt(m[3]!, 16) };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100, ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (ln - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

// The two averaged colours v3 published for the design. The leading colour is no longer derived: it is the palette's
// accent (ADR D-027), so the drift can never flip it.
export function derive(colours: string[]): { rgbAverage: Rgb; hslAverage: Rgb } {
  const rgbs = colours.map(hexToRgb);
  const n = rgbs.length || 1;
  const rgbAverage = {
    r: rgbs.reduce((s, c) => s + c.r, 0) / n,
    g: rgbs.reduce((s, c) => s + c.g, 0) / n,
    b: rgbs.reduce((s, c) => s + c.b, 0) / n,
  };
  const hsls = rgbs.map(rgbToHsl);
  const hues = hsls.filter((c) => c.s > 5).map((c) => (c.h * Math.PI) / 180);
  let h = 0;
  if (hues.length) {
    const x = hues.reduce((s, a) => s + Math.cos(a), 0) / hues.length;
    const y = hues.reduce((s, a) => s + Math.sin(a), 0) / hues.length;
    h = (Math.atan2(y, x) * 180) / Math.PI;
    if (h < 0) h += 360;
  }
  const hslAverage = hslToRgb({
    h,
    s: hsls.reduce((s, c) => s + c.s, 0) / n,
    l: hsls.reduce((s, c) => s + c.l, 0) / n,
  });
  return { rgbAverage, hslAverage };
}

export const rgbTriple = ({ r, g, b }: Rgb) => `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;

// WCAG contrast of a colour against black.
const channel = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const onBlack = ({ r, g, b }: Rgb) => (0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) + 0.05) / 0.05;

// The same hue, lightened until it reads as text on the black page (AA, 4.5:1, with a little room).
export function readable(c: Rgb, min = 4.6): Rgb {
  const hsl = rgbToHsl(c);
  let out = c;
  while (onBlack(out) < min && hsl.l < 100) out = hslToRgb({ ...hsl, l: (hsl.l += 2) });
  return out;
}
