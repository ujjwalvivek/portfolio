// Palette drift (ADR D-009, section 11.4). The page owns the colour: it moves between the chosen palette's two ends on
// its own clock and hands the mixed colours to every listener (the wallpaper, the header game) each frame, and to the
// --dynamic-* CSS variables at most every 100 ms and never while the page is scrolling.
// The phase comes from the wall clock, so a reload or another tab shows the same moment of the drift.

import { derive, hexToRgb, rgbTriple } from "../lib/colour.js";
import { load, reducedMotion, save, emit } from "../lib/store.js";
import { DEFAULT_CUSTOM, DEFAULT_PALETTE, findPalette, mixColours, type Colours, type Palette } from "./palettes.js";

const PERIOD_MS = 120_000; // one full A to B to A cycle
const CSS_STEP_MS = 100;
const SCROLL_REST_MS = 160;

type Listener = (c: Colours, t: number) => void;
const listeners = new Set<Listener>();

let palette: Palette = findPalette(load("palette", DEFAULT_PALETTE), load("custom", DEFAULT_CUSTOM));
let current: Colours = mixColours(palette, 0);
let lastCss = -Infinity;
let scrolling = false;
let restTimer = 0;
let started = false;

export const currentColours = () => current;
export const currentPalette = () => palette;

export function onColours(fn: Listener): () => void {
  listeners.add(fn);
  fn(current, 0);
  return () => listeners.delete(fn);
}

export function setPalette(name: string, custom?: string): void {
  if (custom) save("custom", custom);
  save("palette", name);
  palette = findPalette(name, custom ?? load("custom", DEFAULT_CUSTOM));
  lastCss = -Infinity;
  tick(performance.now());
  emit("palette", { name });
}

function phase(): number {
  if (reducedMotion()) return 0;
  const x = (Date.now() % PERIOD_MS) / PERIOD_MS;
  return (1 - Math.cos(x * Math.PI * 2)) / 2;
}

function writeCss(c: Colours): void {
  const { rgbAverage, hslAverage } = derive([c.primary, c.secondary, c.accent]);
  const dominant = hexToRgb(c.accent);
  const s = document.documentElement.style;
  const hex = (x: { r: number; g: number; b: number }) =>
    "#" + [x.r, x.g, x.b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
  s.setProperty("--dynamic-rgb-average", hex(rgbAverage));
  s.setProperty("--dynamic-rgb-average-rgb", rgbTriple(rgbAverage));
  s.setProperty("--dynamic-hsl-average", hex(hslAverage));
  s.setProperty("--dynamic-hsl-average-rgb", rgbTriple(hslAverage));
  s.setProperty("--dynamic-dominant-color", hex(dominant));
  s.setProperty("--dynamic-dominant-color-rgb", rgbTriple(dominant));
  for (const key of ["primary", "secondary", "accent", "background"] as const) {
    s.setProperty(`--dynamic-theme-${key}`, c[key]);
    s.setProperty(`--dynamic-theme-${key}-rgb`, rgbTriple(hexToRgb(c[key])));
  }
}

function tick(now: number): void {
  const t = phase();
  current = mixColours(palette, t);
  for (const fn of listeners) fn(current, t);
  if (!scrolling && now - lastCss >= CSS_STEP_MS) {
    lastCss = now;
    writeCss(current);
  }
}

export function startDrift(): void {
  if (started) return;
  started = true;
  writeCss(current);
  addEventListener(
    "scroll",
    () => {
      scrolling = true;
      clearTimeout(restTimer);
      restTimer = window.setTimeout(() => (scrolling = false), SCROLL_REST_MS);
    },
    { capture: true, passive: true },
  );
  const loop = (now: number) => {
    tick(now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
