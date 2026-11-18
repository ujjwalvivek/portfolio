// The wallpaper (ADR D-006, D-007, D-008). The portfolio is a substrate consumer like root: one fixed canvas behind the
// page, a layered recipe, colours from the palette drift. Without WebGPU the canvas is dropped and root's CSS backdrop
// (glow and dot grid) stays as the wallpaper. Switching the wallpaper off stops rendering and hides both.

import { load, reducedMotion, save, emit } from "../lib/store.js";
import { onColours } from "./drift.js";
import type { Colours } from "./palettes.js";
import { ROOT_RECIPE, toLayers, type Recipe } from "./recipe.js";

const SUBSTRATE = "/vendor/substrate/index.js";
const FPS = 30;

type Renderer = {
  setPalette(p: Colours): void;
  setOptions(o: Record<string, number>): void;
  setScene(scene: unknown): Promise<void>;
  start(): void;
  stop(): void;
};
type Substrate = {
  compose(layers: { fn: unknown; options: Record<string, unknown> }[]): unknown;
  primitives: Record<string, unknown>;
  loop(canvas: HTMLCanvasElement, scene: unknown, palette: Colours, options: Record<string, number>): Promise<Renderer>;
};

let renderer: Renderer | null = null;
let engine: Substrate | null = null;
let canvas: HTMLCanvasElement | null = null;
let on = load("wallpaper", true);
let global = { speed: 1, density: 1, opacity: 0.8 };

export const wallpaperOn = () => on;
export const wallpaperAvailable = () => renderer !== null;

function sceneOf(sub: Substrate, recipe: Recipe): unknown {
  return sub.compose(toLayers(recipe).map(({ name, options }) => ({ fn: sub.primitives[name], options })));
}

function options(): Record<string, number> {
  return { ...global, fps: on && !reducedMotion() ? FPS : 0 };
}

export function setWallpaper(next: boolean): void {
  on = next;
  save("wallpaper", on);
  document.body.classList.toggle("bg-off", !on);
  if (renderer) {
    if (on) {
      renderer.setOptions(options());
      renderer.start();
    } else renderer.stop();
  }
  emit("wallpaper", { on });
}

export function setGlobalOptions(next: Partial<typeof global>): void {
  global = { ...global, ...next };
  renderer?.setOptions(options());
}

export async function setRecipe(recipe: Recipe): Promise<void> {
  if (renderer && engine) await renderer.setScene(sceneOf(engine, recipe));
}

// Starts after first paint. The canvas starts transparent and blurred and eases in once frames are painting.
export async function startWallpaper(): Promise<void> {
  document.body.classList.toggle("bg-off", !on);
  if (!("gpu" in navigator)) {
    document.body.classList.add("bg-fallback");
    return;
  }
  canvas = document.createElement("canvas");
  canvas.id = "bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  try {
    engine = (await import(SUBSTRATE)) as Substrate;
    let first: Colours | null = null;
    onColours((c) => {
      first ??= c;
      renderer?.setPalette(c);
    });
    renderer = await engine.loop(canvas, sceneOf(engine, ROOT_RECIPE), first!, options());
    if (!on) renderer.stop();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        canvas?.classList.add("is-ready");
        document.body.classList.add("bg-ready");
      }),
    );
  } catch (err) {
    console.warn("WebGPU wallpaper unavailable, keeping the CSS backdrop:", err);
    canvas.remove();
    canvas = null;
    renderer = null;
    document.body.classList.add("bg-fallback");
  }
}
