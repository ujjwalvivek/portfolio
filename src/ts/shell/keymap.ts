// The keyboard layout (ADR D-023): one shortcut per action, single keys or one chord, no timed chords after a modifier.
// Single-key shortcuts are ignored while typing, and inside anything marked data-keys="off" (terminals, the navigator).
// The shortcut sheet, the command palette (its rows and footer) and the command hint all read KEYS, so the layout is
// written down once.

import { closeTop } from "./overlay.js";
import { navigate } from "./router.js";

export type Action = "palette" | "search" | "mood" | "vibe" | "zen" | "music" | "help" | "home" | "about" | "blog" | "projects";
// label is the shortcut sheet's line.
export const KEYS: { keys: string; label: string; action?: Action }[] = [
  { keys: "Ctrl K", label: "command palette", action: "palette" },
  { keys: "g h", label: "go home", action: "home" },
  { keys: "g a", label: "go to about", action: "about" },
  { keys: "g b", label: "go to the blog", action: "blog" },
  { keys: "g p", label: "go to projects", action: "projects" },
  { keys: "/", label: "search the blog list, else open the palette", action: "search" },
  { keys: "v", label: "change mood: the next wallpaper and palette", action: "mood" },
  { keys: "Shift V", label: "mood settings: pick a wallpaper, palette, motion", action: "vibe" },
  { keys: "z", label: "zen mode: fullscreen", action: "zen" },
  { keys: "m", label: "music on or off", action: "music" },
  { keys: "?", label: "keyboard shortcuts", action: "help" },
  { keys: "Esc", label: "close the top overlay" },
];

export const PAGES: Partial<Record<Action, string>> = { home: "/", about: "/about/", blog: "/blog/", projects: "/projects/" };

const apple = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// The keycaps for an action (or a keys string), as this machine names them: Ctrl reads Cmd on Apple keyboards.
export function keycaps(of: Action | string): string[] {
  const keys = KEYS.find((k) => k.action === of)?.keys ?? (KEYS.some((k) => k.keys === of) ? of : "");
  return keys ? keys.split(" ").map((k) => (k === "Ctrl" && apple ? "⌘" : k)) : [];
}

const handlers = new Map<Action, () => boolean | void>();

// A feature claims an action; returning false means "not handled here", so the default (if any) runs.
export function handle(action: Action, fn: () => boolean | void): () => void {
  handlers.set(action, fn);
  return () => {
    if (handlers.get(action) === fn) handlers.delete(action);
  };
}

// Runs an action as its key would. The palette uses this, so a row and its shortcut always do the same thing.
export function trigger(action: Action): boolean {
  const fn = handlers.get(action);
  if (fn && fn() !== false) return true;
  const to = PAGES[action];
  if (to) {
    while (closeTop()); // a chord pressed over an open overlay leaves for the new page with nothing on top
    void navigate(to);
    return true;
  }
  if (action === "zen") {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
    return true;
  }
  if (action === "search") return trigger("palette");
  return false;
}

function typing(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !(el instanceof HTMLElement)) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !!el.closest('[data-keys="off"]');
}

export function startKeymap(): void {
  let pendingG = 0;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (closeTop()) e.preventDefault();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
      if (trigger("palette")) e.preventDefault();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e.target)) return;

    if (pendingG) {
      const fresh = Date.now() - pendingG < 1000;
      pendingG = 0;
      const to = ({ h: "home", a: "about", b: "blog", p: "projects" } as const)[e.key as "h" | "a" | "b" | "p"];
      if (fresh && to) {
        if (trigger(to)) e.preventDefault();
        return;
      }
      // anything else after g is an ordinary key press
    }
    if (e.key === "g") {
      pendingG = Date.now();
      return;
    }
    const single: Record<string, Action> = { "/": "search", v: "mood", V: "vibe", z: "zen", m: "music", "?": "help" };
    const action = single[e.key];
    if (action && trigger(action)) e.preventDefault();
  });
}
