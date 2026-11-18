// The header game as a document-wide singleton (ADR section 12). Loaded once, on home after first paint, or on demand
// (music). The engine appends its canvas to <body>; it is moved into the home header while home is shown, and parked
// (hidden, paused, never removed: removing a wgpu canvas kills its surface) while any other page is shown.

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

let loading: Promise<GameModule> | null = null;
let canvas: HTMLCanvasElement | null = null;
let ready: Promise<HTMLCanvasElement> | null = null;
let park: HTMLElement | null = null;

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

export function loadGame(): Promise<GameModule> {
  if (loading) return loading;
  // Resolves when the engine has drawn its first frame; until then the canvas is not in the DOM.
  ready = new Promise((resolve) => {
    addEventListener(
      READY_EVENT,
      () => {
        const found = [...document.querySelectorAll<HTMLCanvasElement>("body > canvas")].find((c) => c.id !== "bg-canvas");
        if (!found) return;
        canvas = found;
        canvas.id = "header-canvas";
        canvas.removeAttribute("tabindex");
        canvas.setAttribute("aria-hidden", "true");
        canvas.blur();
        parking().append(canvas);
        resolve(canvas);
      },
      { once: true },
    );
  });
  loading = preferWorkingBackend()
    .then(() => import(GAME_URL))
    .then(async (m: GameModule) => {
      await m.default();
      m.set_paused(true);
      m.set_reduced_motion(reducedMotion());
      const buf = new Float32Array(18);
      onColours((c) => {
        const { hslAverage } = derive([c.primary, c.secondary, c.accent]);
        const dominant = hexToRgb(c.accent);
        const rgb = [hexToRgb(c.primary), hexToRgb(c.secondary), hexToRgb(c.accent), hexToRgb(c.background), dominant, hslAverage];
        rgb.forEach((x, i) => buf.set([x.r / 255, x.g / 255, x.b / 255], i * 3));
        m.set_palette(buf);
      });
      return m;
    })
    .catch((err) => {
      loading = null;
      throw err;
    });
  return loading;
}

// Show the scene inside `host`. Resolves once the canvas is there and running.
export async function showGame(host: HTMLElement): Promise<HTMLCanvasElement> {
  const m = await loadGame();
  const c = await ready!;
  host.append(c);
  m.set_paused(false);
  return c;
}

export function hideGame(): void {
  if (!loading) return;
  void loading.then((m) => {
    m.set_paused(true);
    if (canvas) parking().append(canvas);
  });
}
