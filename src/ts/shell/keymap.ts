// The keyboard layout (ADR D-023): one shortcut per action, single keys or one chord, no timed chords after a modifier.
// Single-key shortcuts are ignored while typing, and inside anything marked data-keys="off" (terminals, the navigator).
// The shortcut sheet and the command palette read KEYS, so the layout is written down once.

import { closeTop } from "./overlay.js";
import { navigate } from "./router.js";

export type Action = "palette" | "search" | "vibe" | "zen" | "music" | "help" | "home" | "about" | "blog" | "projects";
export const KEYS: { keys: string; label: string; action?: Action }[] = [
  { keys: "Ctrl K", label: "command palette", action: "palette" },
  { keys: "g h", label: "go home", action: "home" },
  { keys: "g a", label: "go to about", action: "about" },
  { keys: "g b", label: "go to the blog", action: "blog" },
  { keys: "g p", label: "go to projects", action: "projects" },
  { keys: "/", label: "search", action: "search" },
  { keys: "v", label: "vibe switch: wallpaper and palette", action: "vibe" },
  { keys: "z", label: "zen: fullscreen", action: "zen" },
  { keys: "m", label: "music on or off", action: "music" },
  { keys: "?", label: "this sheet", action: "help" },
  { keys: "Esc", label: "close the top overlay" },
];

const handlers = new Map<Action, () => boolean | void>();

// A feature claims an action; returning false means "not handled here", so the default (if any) runs.
export function handle(action: Action, fn: () => boolean | void): () => void {
  handlers.set(action, fn);
  return () => {
    if (handlers.get(action) === fn) handlers.delete(action);
  };
}

function run(action: Action): boolean {
  const fn = handlers.get(action);
  if (fn && fn() !== false) return true;
  const go: Partial<Record<Action, string>> = { home: "/", about: "/about/", blog: "/blog/", projects: "/projects/" };
  if (go[action]) {
    navigate(go[action]!);
    return true;
  }
  if (action === "zen") {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
    return true;
  }
  if (action === "search") return run("palette");
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
      if (run("palette")) e.preventDefault();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e.target)) return;

    if (pendingG && Date.now() - pendingG < 1000) {
      pendingG = 0;
      const to = ({ h: "home", a: "about", b: "blog", p: "projects" } as const)[e.key as "h" | "a" | "b" | "p"];
      if (to && run(to)) e.preventDefault();
      return;
    }
    const single: Record<string, Action> = { "/": "search", v: "vibe", z: "zen", m: "music", "?": "help" };
    if (e.key === "g") {
      pendingG = Date.now();
      return;
    }
    const action = single[e.key];
    if (action && run(action)) e.preventDefault();
  });
}
