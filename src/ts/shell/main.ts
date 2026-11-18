// Shell entry. Runs once per document: palette drift and router at once, the wallpaper after first paint.
// Feature modules for overlays load on first use.

import { startDrift } from "./drift.js";
import { handle, startKeymap } from "./keymap.js";
import { startRouter } from "./router.js";
import { setWallpaper, startWallpaper, wallpaperOn } from "./wallpaper.js";
import { on } from "../lib/store.js";

const lazy = <T>(spec: string, pick: (m: T) => () => void) => () => {
  void import(spec).then((m) => pick(m as T)());
};

const openVibe = lazy<typeof import("../features/vibe-switch.js")>("../features/vibe-switch.js", (m) => m.openVibeSwitch);
const openStack = lazy<typeof import("../features/tech-stack.js")>("../features/tech-stack.js", (m) => m.openTechStack);
const openKeys = lazy<typeof import("../features/shortcuts.js")>("../features/shortcuts.js", (m) => m.openShortcuts);

function wireBars(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-bg-toggle]");
  const sync = () => toggle?.setAttribute("aria-pressed", String(wallpaperOn()));
  toggle?.addEventListener("click", () => setWallpaper(!wallpaperOn()));
  on("wallpaper", sync);
  sync();

  document.addEventListener("click", (e) => {
    const opener = (e.target as Element | null)?.closest?.<HTMLElement>("[data-open]");
    if (!opener) return;
    if (opener.dataset.open === "vibe") openVibe();
    if (opener.dataset.open === "stack") openStack();
  });
}

startDrift();
startKeymap();
startRouter();
wireBars();
handle("vibe", openVibe);
handle("help", openKeys);
handle("music", () => void import("./audio.js").then((m) => m.toggleMusic()));

// After the first frame is on screen, so the wallpaper never competes with the page's own content.
requestAnimationFrame(() => setTimeout(() => void startWallpaper(), 0));

// /?vibe (where v3's /bg-test now redirects) opens the vibe switch.
if (new URLSearchParams(location.search).has("vibe")) openVibe();
