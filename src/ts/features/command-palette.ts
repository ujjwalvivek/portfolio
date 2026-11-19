// The command palette (v3's CommandPalette, keys per D-023). Ctrl/Cmd+K toggles it. One box searches pages, commands,
// posts and projects; arrows move, Enter runs, Esc closes, the mouse works too. Command rows show their own shortcut
// and the footer lists the layout, both read from the keymap. Posts and projects come from /palette-index.json, built
// by Zola (templates/palette-index.json) and fetched the first time the palette opens or the page goes idle; pages
// and commands are here, so they show at once while it loads.
//
// v3 differences: project results link to their row (/projects/#dev-3); v3 scrolled to a data-project-id that wasn't
// on its page. "Switch Theme" is gone with light mode (D-010).

import { KEYS, keycaps, trigger, type Action } from "../shell/keymap.js";
import { closeOverlay, openOverlay } from "../shell/overlay.js";
import { navigate } from "../shell/router.js";
import { setWallpaper, wallpaperOn } from "../shell/wallpaper.js";
import { score, tokens, type Searchable } from "./palette-search.js";

type Group = "go to" | "commands" | "posts" | "projects";
type Item = Searchable & {
  group: Group;
  icon: string; // a sprite id, or a glyph when it starts with "="
  meta?: () => string;
  tags?: string[];
  action?: Action;
  run(): void | Promise<void>;
};
type Entry = { t: string; u: string; d: string; g: string[]; y?: string };
type Index = { posts: Entry[]; projects: Entry[] };

const INDEX = "/palette-index.json";
const LIMIT = 6; // posts and projects shown per group while searching

let index: Promise<Index> | null = null;
let loaded: Index | null = null;
export function prefetchIndex(): Promise<Index> {
  if (!index) {
    index = fetch(INDEX)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<Index>;
      })
      .then((data) => (loaded = data));
    index.catch(() => (index = null)); // a later open tries again
  }
  return index;
}

// Opens a page, or scrolls to the target when it is already this page. `then` runs on the page once it is in.
async function go(href: string, then?: () => void): Promise<void> {
  const url = new URL(href, location.href);
  const here = url.pathname.replace(/\/?$/, "/") === location.pathname.replace(/\/?$/, "/");
  if (!here) await navigate(url.pathname + url.search + url.hash);
  else if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ block: "start" });
  then?.();
}

function reveal(selector: string, focus?: string): () => void {
  return () => {
    const el = document.querySelector<HTMLElement>(selector);
    el?.scrollIntoView({ block: "center" });
    if (focus) el?.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });
  };
}

// Modules built by other streams, loaded by path so this file does not depend on them at compile time.
function external<T>(spec: string, use: (m: T) => void): () => Promise<void> {
  return () =>
    (import(spec) as Promise<T>).then(use, (err: unknown) => console.error(`${spec} failed to load:`, err));
}

const page = (title: string, action: Action, icon: string, words: string): Item => ({
  group: "go to", title, action, icon, words, desc: "", run: () => void trigger(action),
});

const BASE: Item[] = [
  page("Home", "home", "ri-terminal-box-fill", "home index start landing"),
  page("About Moi", "about", "gi-hollow-cat", "about me vivek resume cv"),
  page("Blog", "blog", "ri-markdown-fill", "blog logs posts writing"),
  page("Projects", "projects", "ri-archive-fill", "projects work portfolio"),
  {
    group: "commands", title: "GitHub Terminal Explorer", icon: "im-terminal", desc: "",
    words: "terminal github vscode editor filesystem navigator repos",
    run: external<{ open(): void }>("/js/features/github-navigator.js", (m) => m.open()),
  },
  { group: "commands", title: "Switch Vibe", icon: "tb-switch2", action: "vibe", desc: "", words: "psychedelic colorful rainbow wallpaper palette colour", run: () => void trigger("vibe") },
  {
    group: "commands", title: "Maximum Fun ? Minimum Fun", icon: "gi-thunder-skull", desc: "",
    words: "background wallpaper toggle hide show on off",
    meta: () => (wallpaperOn() ? "wallpaper on" : "wallpaper off"),
    run: () => setWallpaper(!wallpaperOn()),
  },
  { group: "commands", title: "Zen Mode", icon: "fa-expand", action: "zen", desc: "", words: "fullscreen focus zen", run: () => void trigger("zen") },
  { group: "commands", title: "Music", icon: "=♪", action: "music", desc: "", words: "music audio sound play stop", run: () => void trigger("music") },
  { group: "commands", title: "Keyboard Shortcuts", icon: "md-keyboard-command-key", action: "help", desc: "", words: "keys keyboard shortcuts help sheet", run: () => void trigger("help") },
  {
    group: "commands", title: "Tech Stack", icon: "ri-stack-fill", desc: "", words: "tech stack tools skills",
    run: () => void import("./tech-stack.js").then((m) => m.openTechStack()),
  },
  { group: "commands", title: "Easter Egg", icon: "gi-easter-egg", desc: "", words: "easter egg secret terminal hidden", run: () => go("/about/", reveal("[data-ab-egg]", "[data-ab-egg-open]")) },
  { group: "commands", title: "Send Mail", icon: "ri-mail-send-fill", desc: "", words: "mail email message contact send", run: () => go("/", reveal(".home-mail")) },
  {
    group: "commands", title: "Run Exit", icon: "tb-error404", desc: "", words: "exit crash system error blue screen",
    run: external<{ crash(reason?: string): void }>("/js/features/crash.js", (m) => m.crash("run exit")),
  },
];

function fromIndex(data: Index): Item[] {
  const posts = data.posts.map<Item>((p) => ({
    group: "posts", title: p.t, desc: p.d, tags: p.g, icon: "bs-journal-album",
    words: `${p.g.join(" ")} ${p.y ?? ""}`, meta: () => p.y ?? "", run: () => go(p.u),
  }));
  const projects = data.projects.map<Item>((p) => ({
    group: "projects", title: p.t, desc: p.d, tags: p.g, icon: "fa-reg-folder-open", words: p.g.join(" "),
    run: () => go(p.u, () => document.getElementById(p.u.split("#")[1] ?? "")?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true })),
  }));
  return [...posts, ...projects];
}

function results(query: string): { group: Group; items: Item[] }[] {
  const words = tokens(query);
  const all = [...BASE, ...(loaded ? fromIndex(loaded) : [])];
  if (!words.length) {
    return (["go to", "commands"] as const).map((group) => ({ group, items: BASE.filter((i) => i.group === group) }));
  }
  const groups = new Map<Group, { item: Item; s: number }[]>();
  for (const item of all) {
    const s = score(item, words);
    if (!s) continue;
    const list = groups.get(item.group) ?? [];
    list.push({ item, s });
    groups.set(item.group, list);
  }
  return [...groups]
    .map(([group, list]) => {
      list.sort((a, b) => b.s - a.s);
      const cut = group === "posts" || group === "projects" ? list.slice(0, LIMIT) : list;
      return { group, items: cut.map((x) => x.item), best: list[0]?.s ?? 0 };
    })
    .sort((a, b) => b.best - a.best);
}

function icon(id: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "pal-icon";
  span.setAttribute("aria-hidden", "true");
  if (id.startsWith("=")) span.textContent = id.slice(1);
  else span.innerHTML = `<svg class="icon"><use href="/icons.svg#${id}"/></svg>`;
  return span;
}

function caps(list: string[], cls = "pal-keys"): HTMLElement {
  const span = document.createElement("span");
  span.className = cls;
  for (const k of list) {
    const kbd = document.createElement("kbd");
    kbd.textContent = k;
    span.append(kbd);
  }
  return span;
}

let seq = 0;

export function openPalette(): void {
  void prefetchIndex().catch(() => {});
  const ref: { input?: HTMLInputElement } = {};
  openOverlay({
    id: "palette",
    title: "Command palette",
    icon: "/icons.svg#fi-command",
    build(body, close) {
      const card = body.parentElement!;
      card.classList.add("pal-card");
      const head = card.querySelector<HTMLElement>(".overlay-head")!;
      const box = document.createElement("input");
      ref.input = box;
      box.className = "pal-input";
      box.type = "text";
      box.placeholder = "Search commands, blogs, and projects";
      box.autocomplete = "off";
      box.spellcheck = false;
      box.setAttribute("role", "combobox");
      box.setAttribute("aria-expanded", "true");
      box.setAttribute("aria-autocomplete", "list");
      box.setAttribute("aria-label", "Search commands, blogs, and projects");
      head.querySelector(".overlay-title")!.replaceWith(box);

      const list = document.createElement("div");
      list.className = "pal-results";
      list.id = `pal-list-${++seq}`;
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-label", "Results");
      box.setAttribute("aria-controls", list.id);
      body.append(list);

      let shown: Item[] = [];
      let rows: HTMLElement[] = [];
      let at = 0;
      let waiting = false;

      const select = (i: number, scroll = true) => {
        if (!rows.length) return;
        at = (i + rows.length) % rows.length;
        rows.forEach((r, n) => r.setAttribute("aria-selected", String(n === at)));
        const row = rows[at]!;
        box.setAttribute("aria-activedescendant", row.id);
        if (scroll) row.scrollIntoView({ block: "nearest" });
      };

      const runItem = (item: Item | undefined) => {
        if (!item) return;
        close();
        void item.run();
      };

      const draw = () => {
        const groups = results(box.value);
        list.replaceChildren();
        shown = [];
        rows = [];
        for (const { group, items } of groups) {
          if (!items.length) continue;
          const sec = document.createElement("div");
          sec.className = "pal-group";
          sec.setAttribute("role", "group");
          const title = document.createElement("div");
          title.className = "pal-group-title";
          title.id = `${list.id}-${group.replace(" ", "-")}`;
          title.innerHTML = `<span>${group}</span><span class="pal-group-count">${items.length}</span>`;
          sec.setAttribute("aria-labelledby", title.id);
          sec.append(title);
          for (const item of items) {
            const row = document.createElement("div");
            row.className = "pal-row";
            row.id = `${list.id}-r${rows.length}`;
            row.setAttribute("role", "option");
            const text = document.createElement("span");
            text.className = "pal-text";
            const name = document.createElement("span");
            name.className = "pal-title";
            name.textContent = item.title;
            const meta = item.meta?.();
            if (meta) {
              const m = document.createElement("span");
              m.className = "pal-meta";
              m.textContent = meta;
              name.append(m);
            }
            text.append(name);
            if (item.desc) {
              const d = document.createElement("span");
              d.className = "pal-desc";
              d.textContent = item.desc;
              text.append(d);
            }
            if (item.tags?.length) {
              const tags = document.createElement("span");
              tags.className = "pal-tags";
              for (const t of item.tags.slice(0, 3)) {
                const tag = document.createElement("span");
                tag.className = "pal-tag";
                tag.textContent = t.toLowerCase();
                tags.append(tag);
              }
              text.append(tags);
            }
            row.append(icon(item.icon), text);
            if (item.action) row.append(caps(keycaps(item.action)));
            const enter = document.createElement("kbd");
            enter.className = "pal-enter";
            enter.textContent = "⏎";
            enter.setAttribute("aria-hidden", "true");
            row.append(enter);
            const n = rows.length;
            row.addEventListener("click", () => runItem(shown[n]));
            sec.append(row);
            shown.push(item);
            rows.push(row);
          }
          list.append(sec);
        }
        if (waiting && box.value.trim()) {
          const note = document.createElement("p");
          note.className = "pal-note";
          note.textContent = "loading posts and projects";
          list.append(note);
        }
        if (!rows.length && !waiting) {
          const none = document.createElement("div");
          none.className = "pal-none";
          none.innerHTML = `<svg class="icon" aria-hidden="true"><use href="/icons.svg#tb-face-id-error"/></svg><span>No commands found</span>`;
          list.append(none);
          box.removeAttribute("aria-activedescendant");
        }
        select(0, false);
        list.scrollTop = 0;
      };

      box.addEventListener("input", draw);
      box.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          select(at + (e.key === "ArrowDown" ? 1 : -1));
        } else if (e.key === "Enter" && !e.isComposing) {
          e.preventDefault();
          runItem(shown[at]);
        }
      });

      let alive = true;
      if (!loaded) {
        waiting = true;
        prefetchIndex()
          .catch(() => null)
          .then(() => {
            waiting = false;
            if (alive) draw();
          });
      }
      draw();
      return () => {
        alive = false;
      };
    },
    foot(foot) {
      foot.classList.add("pal-foot");
      const item = (keys: string[], label: string) => {
        const span = document.createElement("span");
        span.className = "pal-foot-item";
        span.append(caps(keys, "pal-foot-keys"), label);
        foot.append(span);
      };
      item(["↑", "↓"], "navigate");
      item(["⏎"], "execute");
      for (const k of KEYS) {
        if (k.action === "palette") continue;
        item(k.action ? keycaps(k.action) : k.keys.split(" "), k.short);
      }
    },
  });
  ref.input?.focus({ preventScroll: true });
}

export function closePalette(): void {
  closeOverlay("palette");
}
