// The wallpaper (ADR D-006, D-007, D-008, D-011). The portfolio is a substrate consumer like root: one fixed canvas
// behind the page, a named recipe (or the visitor's pasted one), colours from the palette drift. Without WebGPU the
// canvas is dropped and root's CSS backdrop (glow and dot grid) stays as the wallpaper. Switching the wallpaper off
// stops rendering and hides both.
//
// The vibe switch drives everything here: which recipe, and whether it animates or holds one static frame. Tuning
// happens in substrate's playground; the site only takes a finished recipe. Changing motion never rebuilds the scene;
// only choosing another recipe does.

import { load, on as onShell, reducedMotion, save, emit } from "../lib/store.js";
import { currentColours, onColours } from "./drift.js";
import type { Colours } from "./palettes.js";
import type { Recipe, RecipeTools } from "./recipe.js";
import { recipeBook, recipeTools } from "./recipes.js";

const SUBSTRATE = "/vendor/substrate@2.1.0/index.js";
const FPS = 30;

type Renderer = {
  frame: number;
  device?: { lost: Promise<{ reason?: string; message?: string }> };
  setPalette(p: Colours): void;
  setOptions(o: Record<string, number>): void;
  setScene(scene: unknown): Promise<void>;
  start(): void;
  stop(): void;
};
type Substrate = {
  loop(canvas: HTMLCanvasElement, scene: unknown, palette: Colours, options: Record<string, number>): Promise<Renderer>;
};

// Substrate's own defaults: at these values every layer draws exactly as its recipe says (opacity 0.8 is neutral).
const NEUTRAL = { speed: 1, density: 1, opacity: 0.8 };
export const PASTED = "pasted";
// The named recipes the site offers, in order; anything else substrate ships is not shown or loaded.
export const RECIPES: readonly string[] = ["root", "nebula"];

// waiting: not started or still loading; running: frames are painting; unavailable: the CSS backdrop is the wallpaper.
export type WallpaperStatus = { state: "waiting" | "running" | "unavailable"; reason: string };

let renderer: Renderer | null = null;
let tools: RecipeTools | null = null;
let engine: Substrate | null = null;
let canvas: HTMLCanvasElement | null = null;
let looping = false; // the renderer's frame loop is going (animated and on)
let on = load("wallpaper", true);
let animate = load("animate", true);
let choice = load("recipe", "root");
if (choice !== PASTED && !RECIPES.includes(choice)) choice = "root";
// The old sliders' values (v4:wallpaper-options) are no longer read; drop them so they don't linger.
try {
  localStorage.removeItem("v4:wallpaper-options");
} catch {
  // storage unavailable: nothing to clear
}
let pasted = load<Recipe | null>("pasted", null);
let status: WallpaperStatus = { state: "waiting", reason: "" };

const listeners = new Set<() => void>();
// A listener that throws must not take the wallpaper down with it.
const changed = () =>
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  });

// The picker listens here for anything it shows: on/off, status, recipe, animation.
export function onWallpaperChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const wallpaperOn = () => on;
export const wallpaperAvailable = () => renderer !== null;
export const wallpaperStatus = () => status;
export const animated = () => animate;
export const recipeChoice = () => choice;
export const pastedRecipe = () => pasted;
// Frames drawn so far; the picker samples it once a second for the FPS readout. Null while nothing renders.
export const framesDrawn = () => (renderer && looping ? renderer.frame : null);

const animating = () => animate && !reducedMotion();
const options = (): Record<string, number> => ({ ...NEUTRAL, fps: animating() ? FPS : 0 });

// Brings the renderer in line with on/off and animated/static. A static frame is drawn by setOptions with fps 0.
function sync(): void {
  if (!renderer) return;
  if (!on) {
    renderer.stop();
    looping = false;
  } else if (animating()) {
    renderer.setOptions(options());
    if (!looping) renderer.start();
    looping = true;
  } else {
    renderer.stop();
    looping = false;
    renderer.setPalette(currentColours());
    renderer.setOptions(options());
  }
}

export function setWallpaper(next: boolean): void {
  on = next;
  save("wallpaper", on);
  document.body.classList.toggle("bg-off", !on);
  sync();
  emit("wallpaper", { on });
  changed();
}

export function setAnimated(next: boolean): void {
  animate = next;
  save("animate", animate);
  sync();
  changed();
}

async function resolve(name: string): Promise<Recipe> {
  const book = await recipeBook();
  if (name === PASTED && pasted) return pasted;
  return (RECIPES.includes(name) && book.getRecipe(name)) || book.getRecipe("root")!;
}

// Chooses a named recipe or "pasted". Resolves with an error message if substrate refused it; the previous recipe then
// comes back. Quick changes (arrow keys) overlap: only the latest one is applied.
let pick = 0;
// A WebGPU device can be lost at any time (a driver or Dawn error, a GPU reset), and the canvas then stays black. The
// renderer is rebuilt on the same canvas with a fresh device, at most twice in a page's life.
let rebuilds = 0;
function watchDevice(r: Renderer): void {
  void r.device?.lost.then(async (info) => {
    if (info?.reason === "destroyed" || renderer !== r || !engine || !tools || !canvas) return;
    console.warn("Wallpaper: GPU device lost, rebuilding:", info?.message ?? "");
    r.stop();
    renderer = null;
    looping = false;
    if (++rebuilds > 2) {
      canvas.remove();
      canvas = null;
      return unavailable("WebGPU stopped");
    }
    try {
      const next = await engine.loop(canvas, tools.recipeToScene(await resolve(choice)), currentColours(), options());
      renderer = next;
      looping = true;
      watchDevice(next);
      sync();
    } catch (err) {
      console.warn("Wallpaper could not rebuild:", err);
      canvas?.remove();
      canvas = null;
      unavailable("WebGPU stopped");
    }
  });
}

export async function chooseRecipe(name: string): Promise<string | null> {
  const before = choice;
  const mine = ++pick;
  choice = (name === PASTED && pasted) || RECIPES.includes(name) ? name : "root";
  save("recipe", choice);
  changed();
  if (!renderer || !tools || !engine || !canvas) return null;
  const recipe = await resolve(choice);
  if (mine !== pick) return null;
  try {
    await renderer.setScene(tools.recipeToScene(recipe));
    return null;
  } catch (first) {
    // Substrate 2.0.2's setScene can fail while compiling the new layers' shaders ("Instance dropped error in
    // getCompilationInfo", seen in headless Chromium on Vulkan and SwiftShader). A fresh renderer compiles them fine,
    // so the recipe is retried that way before giving up.
    if (mine !== pick) return null;
    console.warn("setScene failed, starting a fresh renderer:", first);
  }
  const fresh = async (r: Recipe) => {
    renderer = await engine!.loop(canvas!, tools!.recipeToScene(r), currentColours(), options());
    watchDevice(renderer);
    looping = true;
    sync();
  };
  try {
    await fresh(recipe);
    return null;
  } catch (err) {
    choice = before;
    save("recipe", choice);
    changed();
    try {
      await fresh(await resolve(before));
    } catch (again) {
      console.warn("WebGPU wallpaper stopped:", again);
      canvas?.remove();
      canvas = null;
      renderer = null;
      unavailable("WebGPU stopped");
    }
    return (err as Error).message;
  }
}

// Stores an already validated recipe as the visitor's own and switches to it.
export function setPastedRecipe(recipe: Recipe): Promise<string | null> {
  pasted = recipe;
  save("pasted", recipe);
  return chooseRecipe(PASTED);
}

function forgetPasted(): void {
  pasted = null;
  save("pasted", null);
}

export async function clearPastedRecipe(): Promise<void> {
  forgetPasted();
  if (choice === PASTED) await chooseRecipe("root");
  else changed();
}

function unavailable(reason: string): void {
  status = { state: "unavailable", reason: reason.replace(/[.!?\s]+$/, "") };
  document.body.classList.add("bg-fallback");
  changed();
}

// Starts after first paint. The canvas starts transparent and blurred and eases in once frames are painting.
export async function startWallpaper(): Promise<void> {
  document.body.classList.toggle("bg-off", !on);
  if (!("gpu" in navigator)) return unavailable("WebGPU unavailable");
  // navigator.gpu can exist with no adapter behind it (blocklisted GPU, headless): that is "unavailable" too, not a failure.
  const gpu = (navigator as Navigator & { gpu: { requestAdapter(): Promise<unknown> } }).gpu;
  if (!(await gpu.requestAdapter().catch(() => null))) return unavailable("WebGPU unavailable");
  canvas = document.createElement("canvas");
  canvas.id = "bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  try {
    engine = (await import(SUBSTRATE)) as Substrate;
    tools = await recipeTools();
    // A stored pasted recipe is checked again: storage can be edited, and substrate's rules can change.
    if (pasted && !tools.validateRecipe(pasted).ok) {
      forgetPasted();
    }
    if (choice === PASTED && !pasted) choice = "root";
    // While animating the renderer reads the drift every frame; a static frame is redrawn only when the palette is
    // changed, so "static" really is one frame.
    onColours((c) => {
      if (renderer && on && animating()) renderer.setPalette(c);
    });
    onShell("palette", () => {
      if (renderer && on && !animating()) renderer.setPalette(currentColours());
    });
    const scene = tools.recipeToScene(await resolve(choice));
    // One retry: a first start can fail while compiling shaders on a GPU that is still waking up (seen in headless).
    renderer = await engine
      .loop(canvas, scene, currentColours(), options())
      .catch(() => engine!.loop(canvas!, scene, currentColours(), options()));
    watchDevice(renderer);
    looping = true;
    sync();
    status = { state: "running", reason: "" };
    changed();
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
    const msg = (err as Error)?.message?.replace(/[.!?\s]+$/, "");
    unavailable(msg ? `WebGPU failed (${msg.slice(0, 120)})` : "WebGPU failed");
  }
}
