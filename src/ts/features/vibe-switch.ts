// The vibe switch (ADR D-011): v3's "Choose Your Vibe!" picker on substrate. Recipes (root and nebula, plus the
// visitor's pasted one), the palette swatches, an animation toggle that holds one static frame, a real FPS readout, the
// ON/OFF lettered wallpaper switch, and a field that takes a finished recipe in the section 11.1 format. Tuning lives in
// substrate's playground, not here. A pasted recipe is read with JSON.parse, checked by substrate's validator, and stored locally.
// Without WebGPU the palettes still work and the picker says plainly that the wallpaper needs it (D-008).
//
// Shown as "Moods". The status bar key no longer opens it (it changes the mood, moods.ts); Shift V, the palette entry
// Mood Settings and ?vibe do. Entry points: open() opens it; openVibeSwitch() toggles it.

import { loadFeature } from "../lib/lazy.js";
import { load, reducedMotion } from "../lib/store.js";
import { currentPalette, setPalette } from "../shell/drift.js";
import { closeOverlay, isOpen, openOverlay } from "../shell/overlay.js";
import { PALETTES, type Palette } from "../shell/palettes.js";
import type { Recipe, RecipeBook } from "../shell/recipe.js";
import { recipeBook, recipeTools } from "../shell/recipes.js";
import {
  PASTED,
  RECIPES,
  animated,
  chooseRecipe,
  clearPastedRecipe,
  framesDrawn,
  onWallpaperChange,
  pastedRecipe,
  recipeChoice,
  setAnimated,
  setPastedRecipe,
  setWallpaper,
  wallpaperOn,
  wallpaperStatus,
} from "../shell/wallpaper.js";

const CSS = "/css/features/vibe-switch.css";
// Pasted text over this is refused before parsing. An eight-layer recipe with every param is about 2 KB.
const MAX_PASTE = 16_384;
const MAX_ERRORS = 12;
const FPS_SAMPLE_MS = 1000;

// Display names for the named recipes. The ids stay as they are, so saved choices keep working.
const LABELS: Record<string, string> = { root: "Arcology" };
const label = (id: string, recipe: Recipe | null | undefined) => (LABELS[id] ?? recipe?.name ?? id).slice(0, 40);

// v3's switch markup: the stroked letters redraw from OFF to ON.
const SWITCH = `<label class="switch"><input id="vibe-wall" class="switch__input" type="checkbox" role="switch" aria-label="Wallpaper">
<svg class="switch__letters" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><g stroke="currentcolor" stroke-linecap="round" stroke-width="4" transform="translate(0,4)">
<g class="switch__letter"><polyline class="switch__letter-stroke" points="2 2,2 14"/><polyline class="switch__letter-stroke" points="2 2,16 2" stroke-dasharray="14 16" stroke-dashoffset="8" transform="rotate(0,2,2)"/><polyline class="switch__letter-stroke" points="2 8,6 8" stroke-dasharray="4 6"/></g>
<g class="switch__letter" transform="translate(14,0)"><polyline class="switch__letter-stroke" points="2 2,2 14"/><polyline class="switch__letter-stroke" points="2 2,8 2" stroke-dasharray="6 8"/><polyline class="switch__letter-stroke" points="2 8,6 8" stroke-dasharray="4 6"/></g>
</g></svg></label>`;

const PLACEHOLDER = `{ "recipe": 1, "name": "mine", "layers": [
  { "name": "vignette", "opacity": 1, "params": { "innerRadius": 0.1 } } ] }`;

// The two accents corner to corner over the palette's own dark background, so each swatch reads as its drift.
const gradient = (p: Palette) =>
  `radial-gradient(circle at 30% 30%, transparent 0 40%, ${p.a.background}66 100%), linear-gradient(135deg, ${p.a.accent}, ${p.b.accent})`;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
};

// A panel: UPPERCASE title, lowercase meta. A folded one is a <details> whose summary is the head.
function section(title: string, meta: string, folded = false): { root: HTMLElement; meta: HTMLElement } {
  const root = el(folded ? "details" : "section", "vibe-sec");
  const head = el(folded ? "summary" : "div", "vibe-sec-head");
  const m = el("span", "vibe-sec-meta", meta);
  head.append(el("h3", "vibe-sec-title", title), m);
  root.append(head);
  return { root, meta: m };
}

// Arrow keys walk a roving-tabindex group and pick as they go, as v3's lists did.
function arrows(group: HTMLElement, items: () => HTMLButtonElement[]): void {
  group.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    const list = items().filter((b) => !b.disabled);
    if (!list.length) return;
    e.preventDefault();
    const i = Math.max(0, list.indexOf(document.activeElement as HTMLButtonElement));
    const next = list[(i + step + list.length) % list.length]!;
    next.click();
    next.focus();
  });
}

function palettes(onMark: (label: string) => void): HTMLElement {
  const grid = el("div", "vibe-grid");
  grid.setAttribute("role", "radiogroup");
  grid.setAttribute("aria-label", "Palette");
  const swatches: HTMLButtonElement[] = [];
  const mark = () => {
    const name = currentPalette().name;
    for (const sw of swatches) {
      const on = sw.dataset.name === name;
      sw.setAttribute("aria-checked", String(on));
      sw.tabIndex = on ? 0 : -1;
    }
    onMark(currentPalette().label);
  };
  const paint = (sw: HTMLElement, p: Palette) => {
    sw.style.setProperty("--swatch", gradient(p));
    sw.style.setProperty("--swatch-edge", p.a.accent);
  };
  for (const p of PALETTES) {
    const sw = el("button", "vibe-swatch");
    sw.type = "button";
    sw.dataset.name = p.name;
    sw.dataset.label = p.label;
    sw.setAttribute("role", "radio");
    sw.setAttribute("aria-label", p.label);
    paint(sw, p);
    sw.append(el("span", "vibe-swatch-name", p.label));
    sw.addEventListener("click", () => {
      setPalette(p.name);
      mark();
    });
    swatches.push(sw);
    grid.append(sw);
  }
  arrows(grid, () => swatches);
  mark();
  return grid;
}

// A recipe tile: a keycap with the recipe's name, its layer count, and its layer stack top to bottom, as it composites.
function recipeTile(recipe: Recipe, id: string): HTMLButtonElement {
  const tile = el("button", "vibe-recipe");
  tile.type = "button";
  tile.dataset.id = id;
  tile.setAttribute("role", "radio");
  const head = el("span", "vibe-recipe-head");
  const name = label(id, recipe);
  const count = `${recipe.layers.length} layer${recipe.layers.length === 1 ? "" : "s"}`;
  head.append(el("span", "vibe-recipe-name", name), el("span", "vibe-recipe-tag", id === PASTED ? `pasted · ${count}` : count));
  const stack = el("ol", "vibe-recipe-stack");
  stack.setAttribute("aria-hidden", "true");
  [...recipe.layers].reverse().forEach((layer, i) => {
    const li = el("li");
    li.append(el("span", "vibe-recipe-n", String(recipe.layers.length - i).padStart(2, "0")), ` ${layer.name}`);
    stack.append(li);
  });
  tile.setAttribute("aria-label", `${name}, ${id === PASTED ? "pasted, " : ""}${count}`);
  tile.append(head, stack);
  return tile;
}

let opening = false;

export function openVibeSwitch(): void {
  if (opening) return;
  opening = true;
  // The stylesheet is the only wait: the overlay opens the moment it is in (a few ms, cached after the first time).
  void loadFeature(import.meta.url, [CSS])
    .catch(() => undefined)
    .finally(() => {
      opening = false;
      build();
    });
}

export function open(): void {
  if (!isOpen("vibe")) openVibeSwitch();
}

function build(): void {
  if (isOpen("vibe")) return closeOverlay("vibe");
  const paletteName = el("b");
  const recipeName = el("b");
  const fps = el("span", "vibe-fps");
  const motion = el("button", "vibe-key vibe-motion", "Animated");
  // "Visuals" names the ON/OFF switch beside it, and is the same keycap as the motion key; a click on it flips the switch.
  const visuals = el("label", "vibe-key vibe-visuals", "Visuals");
  visuals.htmlFor = "vibe-wall";
  let refresh = () => {};
  let fpsTimer = 0;
  const cleanups: (() => void)[] = [];
  let last: { frames: number; at: number } | null = null;

  openOverlay({
    id: "vibe",
    title: "Moods",
    live: true,
    icon: "#ti-flow-switch",
    build(body) {
      const book: { value: RecipeBook | null } = { value: null };
      const root = el("div", "vibe");
      const note = el("p", "vibe-note");
      note.setAttribute("role", "status");

      // Wallpaper: the recipes.
      const wall = section("Wallpaper", "");
      const tiles = el("div", "vibe-recipes");
      tiles.setAttribute("role", "radiogroup");
      tiles.setAttribute("aria-label", "Recipe");
      const wallMsg = el("div", "vibe-result");
      wallMsg.setAttribute("aria-live", "polite");
      wall.root.append(tiles, wallMsg);
      arrows(tiles, () => [...tiles.querySelectorAll<HTMLButtonElement>(".vibe-recipe")]);
      tiles.addEventListener("click", (e) => {
        const tile = (e.target as Element).closest<HTMLButtonElement>(".vibe-recipe");
        if (!tile || tile.disabled || tile.dataset.id === recipeChoice()) return;
        wallMsg.replaceChildren();
        void chooseRecipe(tile.dataset.id!).then((err) => err && say(err, "error", wallMsg));
      });

      // Palette: the approved swatch grid.
      const pal = section("Palette", "");
      pal.root.append(
        palettes((label) => {
          pal.meta.textContent = label.toLowerCase();
          paletteName.textContent = label;
        }),
      );

      // Paste: a finished recipe from the playground's COPY RECIPE.
      const paste = section("Paste a recipe", "", true);
      const field = el("textarea", "vibe-paste");
      field.spellcheck = false;
      field.rows = 5;
      field.placeholder = PLACEHOLDER;
      field.setAttribute("aria-label", "Recipe JSON");
      field.dataset.keys = "off";
      const actions = el("div", "vibe-paste-actions");
      const apply = el("button", "vibe-key", "Apply");
      apply.type = "button";
      const clear = el("button", "vibe-key", "Clear saved");
      clear.type = "button";
      const hint = el("span", "vibe-paste-keys");
      hint.innerHTML = "<kbd>Ctrl</kbd><kbd>Enter</kbd>";
      hint.title = "Apply";
      actions.append(apply, clear, hint);
      const result = el("div", "vibe-result");
      result.setAttribute("aria-live", "polite");
      paste.root.append(field, actions, result);

      const say = (text: string | string[], kind: "error" | "ok", where = result) => {
        const lines = Array.isArray(text) ? text : [text];
        const list = el("ul", `vibe-result-list is-${kind}`);
        for (const line of lines.slice(0, MAX_ERRORS)) {
          const li = el("li");
          li.append(el("span", "vibe-result-word", kind === "error" ? "error" : "ok"), ` ${line}`);
          list.append(li);
        }
        if (lines.length > MAX_ERRORS) list.append(el("li", "vibe-result-more", `${lines.length - MAX_ERRORS} more`));
        where.replaceChildren(list);
        list.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      };

      const submit = async () => {
        const text = field.value.trim();
        if (!text) return say("Field is empty.", "error");
        if (text.length > MAX_PASTE)
          return say(`Too long: ${text.length.toLocaleString("en")} characters, limit ${MAX_PASTE.toLocaleString("en")}.`, "error");
        const tools = await recipeTools();
        const check = tools.parseRecipe(text);
        if (!check.ok || !check.recipe) return say(check.errors, "error");
        const err = await setPastedRecipe(check.recipe);
        if (err) return say(err, "error");
        say(`Applied ${check.recipe.name.slice(0, 40)}, ${check.recipe.layers.length} layers.`, "ok");
      };
      apply.addEventListener("click", () => void submit());
      field.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          void submit();
        }
      });
      clear.addEventListener("click", () => {
        field.value = "";
        void clearPastedRecipe().then(() => say("Saved recipe cleared.", "ok"));
      });

      const cols = el("div", "vibe-cols");
      cols.append(wall.root, pal.root);
      root.append(note, cols, paste.root);
      body.append(root);

      // Everything that follows the wallpaper's state.
      const gpuControls = () => [...tiles.querySelectorAll<HTMLButtonElement>("button"), field, apply, clear, motion];
      refresh = () => {
        const st = wallpaperStatus();
        const off = st.state === "unavailable";
        note.hidden = st.state === "running";
        note.className = "vibe-note" + (off ? " is-off" : "");
        note.textContent = off ? `${st.reason}: wallpaper off. Palettes still apply.` : "Starting wallpaper.";
        root.classList.toggle("is-inert", off);
        for (const c of gpuControls()) c.disabled = off;

        // tiles: the named recipes, then the pasted one if there is one
        if (book.value) {
          const named = RECIPES.filter((n) => book.value!.recipeNames.includes(n));
          const want = [...named, ...(pastedRecipe() ? [PASTED] : [])].join(",");
          if (tiles.dataset.ids !== want) {
            tiles.dataset.ids = want;
            tiles.replaceChildren(
              ...named.map((n) => recipeTile(book.value!.getRecipe(n)!, n)),
              ...(pastedRecipe() ? [recipeTile(pastedRecipe()!, PASTED)] : []),
            );
            for (const t of tiles.querySelectorAll<HTMLButtonElement>("button")) t.disabled = off;
          }
        }
        const choice = recipeChoice();
        let any = false;
        for (const t of tiles.querySelectorAll<HTMLButtonElement>(".vibe-recipe")) {
          const on = t.dataset.id === choice;
          any ||= on;
          t.setAttribute("aria-checked", String(on));
          t.tabIndex = on ? 0 : -1;
        }
        if (!any) tiles.querySelector<HTMLButtonElement>(".vibe-recipe")?.setAttribute("tabindex", "0");
        const chosen = choice === PASTED ? pastedRecipe() : book.value?.getRecipe(choice);
        recipeName.textContent = label(choice, chosen);
        clear.disabled = off || !pastedRecipe();

        const still = reducedMotion();
        motion.setAttribute("aria-pressed", String(animated() && !still));
        motion.textContent = still ? "Static (reduced motion)" : animated() ? "Animated" : "Static";
        if (still) motion.disabled = true;
        measure();
      };

      void recipeBook().then((b) => {
        book.value = b;
        refresh();
      });
      cleanups.push(onWallpaperChange(refresh));
      requestAnimationFrame(() =>
        root.querySelector<HTMLElement>(".vibe-recipe[tabindex='0'], .vibe-swatch[tabindex='0']")?.focus({ preventScroll: true }),
      );

      return () => {
        cleanups.forEach((fn) => fn());
        clearInterval(fpsTimer);
      };
    },
    foot(foot) {
      motion.type = "button";
      motion.title = "Animate, or hold one still frame";
      motion.addEventListener("click", () => setAnimated(!animated()));
      const current = el("span", "vibe-foot-label vibe-current");
      current.append("recipe ", recipeName, " · palette ", paletteName);
      const wrap = el("div");
      wrap.innerHTML = SWITCH;
      const sw = wrap.firstElementChild as HTMLElement;
      const box = sw.querySelector("input")!;
      box.checked = wallpaperOn();
      box.addEventListener("change", () => setWallpaper(box.checked));
      cleanups.push(onWallpaperChange(() => (box.checked = wallpaperOn())));
      foot.append(current, fps, motion, visuals, sw);
      refresh();
    },
  });

  // The FPS readout counts frames the renderer really drew over the last second.
  function measure(): void {
    const st = wallpaperStatus();
    const frames = framesDrawn();
    if (st.state === "unavailable") fps.textContent = "no webgpu";
    else if (st.state === "waiting") fps.textContent = "starting";
    else if (!wallpaperOn()) fps.textContent = "off";
    else if (frames === null) fps.textContent = "1 still frame";
    else if (last) {
      const now = performance.now();
      // a fresh renderer (after a recipe change) counts from zero again: start a new sample
      if (frames < last.frames) last = { frames, at: now };
      else if (now - last.at >= FPS_SAMPLE_MS / 2) {
        fps.textContent = `${Math.round(((frames - last.frames) * 1000) / (now - last.at))} fps`;
        last = { frames, at: now };
      }
      return;
    } else fps.textContent = "-- fps";
    last = frames === null ? null : { frames, at: performance.now() };
  }
  fpsTimer = window.setInterval(measure, FPS_SAMPLE_MS);
  measure();
}
