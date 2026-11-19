// Shell entry. Runs once per document: palette drift and router at once, the wallpaper after first paint.
// Feature modules for overlays load on first use.

import { startDrift } from "./drift.js";
import { handle, startKeymap } from "./keymap.js";
import { startRouter } from "./router.js";
import { moodLabel, nextMood } from "./moods.js";
import { setWallpaper, startWallpaper, wallpaperOn } from "./wallpaper.js";
import { on } from "../lib/store.js";
import { loadFeature } from "../lib/lazy.js";
import { dismissHint, startHint } from "../features/command-hint.js";

const lazy = <T>(spec: string, pick: (m: T) => () => void) => () => {
  void import(spec).then((m) => pick(m as T)());
};

const openVibe = lazy<typeof import("../features/vibe-switch.js")>("../features/vibe-switch.js", (m) => m.openVibeSwitch);
const openStack = lazy<typeof import("../features/tech-stack.js")>("../features/tech-stack.js", (m) => m.openTechStack);
type Palette = typeof import("../features/command-palette.js");
const palette = () =>
  loadFeature("/js/features/command-palette.js", ["/css/features/command-palette.css"]) as unknown as Promise<Palette>;
const openPalette = () => {
  dismissHint();
  void palette().then((m) => m.openPalette());
};
const openKeys = lazy<typeof import("../features/shortcuts.js")>("../features/shortcuts.js", (m) => m.openShortcuts);

// The CDN is another origin, so the download attribute alone would only open the PDF: fetch it and save the bytes.
async function downloadFile(link: HTMLAnchorElement): Promise<void> {
  if (link.getAttribute("aria-busy") === "true") return;
  link.setAttribute("aria-busy", "true");
  try {
    const res = await fetch(link.href, { mode: "cors" });
    if (!res.ok) throw new Error(String(res.status));
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: link.download || "resume.pdf" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    window.open(link.href, "_blank", "noopener");
  } finally {
    link.removeAttribute("aria-busy");
  }
}

function wireBars(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-bg-toggle]");
  const sync = () => toggle?.setAttribute("aria-pressed", String(wallpaperOn()));
  toggle?.addEventListener("click", () => setWallpaper(!wallpaperOn()));
  on("wallpaper", sync);
  sync();

  const moodKey = document.querySelector<HTMLElement>("[data-mood]");
  const moodTitle = () => moodKey && (moodKey.title = `Mood: ${moodLabel()}. Click for another.`);
  on("mood", moodTitle);
  on("palette", moodTitle);
  moodTitle();

  document.addEventListener("click", (e) => {
    const resume = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[data-resume]");
    if (resume) {
      e.preventDefault();
      return void downloadFile(resume);
    }
    const mood = (e.target as Element | null)?.closest?.<HTMLElement>("[data-mood]");
    if (mood) return nextMood();
    const opener = (e.target as Element | null)?.closest?.<HTMLElement>("[data-open]");
    if (!opener) return;
    if (opener.dataset.open === "vibe") openVibe();
    if (opener.dataset.open === "stack") openStack();
    if (opener.dataset.open === "palette") openPalette();
  });
}

startDrift();
startKeymap();
startRouter();
wireBars();
handle("palette", openPalette);
handle("vibe", openVibe);
handle("mood", nextMood);
handle("help", openKeys);
handle("music", () => void import("./audio.js").then((m) => m.toggleMusic()));

// After the first frame is on screen, so the wallpaper never competes with the page's own content.
requestAnimationFrame(() => setTimeout(() => void startWallpaper(), 0));

// The first-visit hint shows now; with a keyboard and pointer, the palette and its index load once the page is idle,
// so the first Ctrl+K finds them ready.
startHint(openPalette);
if (matchMedia("(pointer: fine)").matches) {
  const idle = (fn: () => void) => (typeof requestIdleCallback === "function" ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 2000));
  idle(() => void palette().then((m) => m.prefetchIndex()).catch(() => {}));
}

// /?vibe (where v3's /bg-test now redirects) opens the vibe switch.
if (new URLSearchParams(location.search).has("vibe")) openVibe();
