// The header game as a document-wide singleton (ADR section 12). Loaded once, on home after first paint, or on demand
// (music). The engine appends its canvas to <body>; it is moved into the home header while home is shown, and parked
// (hidden, paused, never removed: removing a wgpu canvas kills its surface) while any other page is shown. If the GPU
// device is lost, the instance is replaced by a fresh one (watchEngineDevice).

import { derive, hexToRgb } from "../lib/colour.js";
import { reducedMotion } from "../lib/store.js";
import { onColours } from "./drift.js";

export type GameModule = {
  default(): Promise<unknown>;
  set_palette(c: Float32Array): void;
  set_paused(p: boolean): void;
  set_reduced_motion(r: boolean): void;
  AudioEngine: new (sampleRate: number) => AudioEngineLike;
};
export type AudioEngineLike = {
  process(out: Float32Array): void;
  toggle_music(): void;
  music_on(): boolean;
  play_ui_click(): void;
  play_ui_hover(): void;
};

const GAME_URL = "/game/game.js";
const READY_EVENT = "header:first-frame";
// Journey names its device; the page watches that device for loss (ADR section 12: recovery).
const ENGINE_DEVICE = "Engine Device";
const MAX_RESTARTS = 2;

// One running copy of the engine: its module once loaded, and its canvas once the first frame is drawn.
type Instance = { module: Promise<GameModule>; canvas: Promise<HTMLCanvasElement>; unsubscribe: () => void };

let current: Instance | null = null;
let generation = 0;
let restarts = 0;
let host: HTMLElement | null = null; // where the scene is shown; null while parked
let park: HTMLElement | null = null;
let lostHook = false;

function parking(): HTMLElement {
  if (!park) {
    park = document.createElement("div");
    park.id = "game-park";
    park.hidden = true;
    document.body.append(park);
  }
  return park;
}

// wgpu on the web uses WebGPU whenever navigator.gpu exists, and panics if no adapter comes back (a blocklisted GPU,
// headless browsers) instead of falling back to WebGL2. So ask first, and if there is no adapter, hide WebGPU from the
// engine. Root does this only on plain http; here it is decided by the adapter itself.
async function preferWorkingBackend(): Promise<void> {
  const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  if (!gpu) return;
  const adapter = await gpu.requestAdapter().catch(() => null);
  if (adapter) return;
  try {
    Object.defineProperty(Navigator.prototype, "gpu", { get: () => undefined, configurable: true });
  } catch {
    // If the property cannot be redefined, the engine fails and the HTML header stays.
  }
}

// A WebGPU device can be lost at any time (a driver or Dawn error such as "vkCreateSemaphore failed", a GPU reset).
// wgpu does not recover from that, and the canvas just stays black. So the engine's device is watched from here: when
// it is lost, the instance is retired and a fresh copy of the module (a new wasm instance, so a new device) takes its
// place in the header.
type GpuDevice = { label?: string; lost: Promise<{ reason?: string; message?: string }> };
function watchEngineDevice(): void {
  if (lostHook) return;
  const proto = (globalThis as unknown as { GPUAdapter?: { prototype: { requestDevice(d?: { label?: string }): Promise<GpuDevice> } } })
    .GPUAdapter?.prototype;
  if (!proto) return;
  lostHook = true;
  const request = proto.requestDevice;
  proto.requestDevice = async function (this: unknown, desc?: { label?: string }) {
    const device = await request.call(this, desc);
    if (desc?.label === ENGINE_DEVICE) {
      const mine = generation;
      void device.lost.then((info) => {
        if (info?.reason === "destroyed" || mine !== generation) return;
        console.warn("Header scene: GPU device lost, restarting:", info?.message ?? "");
        restart();
      });
    }
    return device;
  };
}

function instantiate(): Instance {
  const gen = ++generation;
  // Resolves when this instance has drawn its first frame; until then its canvas is held off-screen.
  const ready = new Promise<HTMLCanvasElement>((resolve) => {
    addEventListener(
      READY_EVENT,
      () => {
        const found = [...document.querySelectorAll<HTMLCanvasElement>("body > canvas")].find((c) => c.id !== "bg-canvas");
        if (!found) return;
        holding.disconnect();
        for (const prop of ["position", "left", "top", "width", "height", "visibility"]) found.style.removeProperty(prop);
        found.id = "header-canvas";
        found.removeAttribute("tabindex");
        found.setAttribute("aria-hidden", "true");
        found.blur();
        parking().append(found);
        resolve(found);
      },
      { once: true },
    );
  });
  // The engine appends its canvas to the end of <body> and focuses it, which scrolls the page to the bottom. Canvas
  // focus is silenced until the canvas has been parked (v3 did the same for its Journey wallpaper).
  const focus = HTMLCanvasElement.prototype.focus;
  HTMLCanvasElement.prototype.focus = function () {};
  // The engine also sizes its fresh canvas to the whole viewport inside <body>'s layout. Until it is moved into the
  // header, hold it fixed and off-screen at the scene's own size, so it never shifts the page.
  const holding = new MutationObserver((records) => {
    for (const r of records)
      for (const n of r.addedNodes)
        if (n instanceof HTMLCanvasElement && n.id !== "bg-canvas" && n.parentElement === document.body) {
          n.style.cssText += ";position:fixed;left:-10000px;top:0;width:640px;height:360px;visibility:hidden;";
          holding.disconnect();
        }
  });
  holding.observe(document.body, { childList: true });
  void ready.finally(() => {
    HTMLCanvasElement.prototype.focus = focus;
  });
  watchEngineDevice();
  // A restart imports a fresh copy of the module (its own wasm instance); the wasm file itself comes from the cache.
  const url = gen === 1 ? GAME_URL : `${GAME_URL}?instance=${gen}`;
  const inst: Instance = { module: null as unknown as Promise<GameModule>, canvas: ready, unsubscribe: () => {} };
  inst.module = preferWorkingBackend()
    .then(() => import(url))
    .then(async (m: GameModule) => {
      await m.default();
      m.set_paused(true);
      m.set_reduced_motion(reducedMotion());
      const buf = new Float32Array(18);
      inst.unsubscribe = onColours((c) => {
        const { hslAverage } = derive([c.primary, c.secondary, c.accent]);
        const dominant = hexToRgb(c.accent);
        const rgb = [hexToRgb(c.primary), hexToRgb(c.secondary), hexToRgb(c.accent), hexToRgb(c.background), dominant, hslAverage];
        rgb.forEach((x, i) => buf.set([x.r / 255, x.g / 255, x.b / 255], i * 3));
        m.set_palette(buf);
      });
      return m;
    })
    .catch((err) => {
      HTMLCanvasElement.prototype.focus = focus;
      holding.disconnect();
      throw err;
    });
  return inst;
}

function restart(): void {
  const old = current;
  if (!old) return;
  void old.module.then((m) => m.set_paused(true), () => {});
  old.unsubscribe();
  void old.canvas.then((c) => c.remove());
  if (++restarts > MAX_RESTARTS) {
    current = null;
    dispatchEvent(new CustomEvent("header:lost"));
    return;
  }
  const next = (current = instantiate());
  next.module.then(
    async (m) => {
      if (!host) return;
      m.set_paused(false);
      const c = await next.canvas;
      if (host && current === next) host.append(c);
    },
    (err) => {
      console.warn("Header scene could not restart:", err);
      current = null;
      dispatchEvent(new CustomEvent("header:lost"));
    },
  );
}

export function loadGame(): Promise<GameModule> {
  if (!current) {
    const inst = (current = instantiate());
    inst.module.catch(() => {
      if (current === inst) current = null;
    });
  }
  return current.module;
}

// Show the scene inside `to`. Resolves once the canvas is there and running.
export async function showGame(to: HTMLElement): Promise<HTMLCanvasElement> {
  host = to;
  await loadGame();
  const inst = current!;
  const c = await inst.canvas;
  if (host === to && current === inst) {
    to.append(c);
    (await inst.module).set_paused(false);
  }
  return c;
}

export function hideGame(): void {
  host = null;
  const inst = current;
  if (!inst) return;
  void inst.module.then((m) => {
    if (host) return;
    m.set_paused(true);
    void inst.canvas.then((c) => {
      if (!host && current === inst) parking().append(c);
    });
  }, () => {});
}
