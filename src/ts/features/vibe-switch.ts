// The vibe switch (ADR D-011): v3's "Choose Your Vibe!" picker on substrate. Recipes (root and the two candidates, plus
// the visitor's pasted one), the palette swatches, global speed, density and opacity, an animation toggle that holds one
// static frame, a real FPS readout, the ON/OFF lettered wallpaper switch, and a field that takes a recipe in the
// section 11.1 format. A pasted recipe is read with JSON.parse, checked by substrate's validator, and stored locally.
// Without WebGPU the palettes still work and the picker says plainly that the wallpaper needs it (D-008).
//
// Entry points: open() opens it (?vibe, the command palette); openVibeSwitch() toggles it (the v key, the status bar).

import { loadFeature } from "../lib/lazy.js";
import { load, reducedMotion } from "../lib/store.js";
import { currentPalette, setPalette } from "../shell/drift.js";
import { closeOverlay, isOpen, openOverlay } from "../shell/overlay.js";
import { DEFAULT_CUSTOM, PALETTES, customPalette, type Palette } from "../shell/palettes.js";
import type { Recipe, RecipeBook } from "../shell/recipe.js";
import { recipeBook, recipeTools } from "../shell/recipes-local.js";
import {
  DEFAULT_OPTIONS,
  PASTED,
  animated,
  chooseRecipe,
  clearPastedRecipe,
  framesDrawn,
  globalOptions,
  onWallpaperChange,
  pastedRecipe,
  recipeChoice,
  setAnimated,
  setGlobalOptions,
  setPastedRecipe,
  setWallpaper,
  wallpaperOn,
  wallpaperStatus,
  type GlobalOptions,
} from "../shell/wallpaper.js";

const CSS = "/css/features/vibe-switch.css";
// Pasted text over this is refused before parsing. An eight-layer recipe with every param is about 2 KB.
const MAX_PASTE = 16_384;
const MAX_ERRORS = 12;
const FPS_SAMPLE_MS = 1000;

// v3's switch markup: the stroked letters redraw from OFF to ON.
const SWITCH = `<label class="switch"><input class="switch__input" type="checkbox" role="switch" aria-label="Wallpaper">
<svg class="switch__letters" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><g stroke="currentcolor" stroke-linecap="round" stroke-width="4" transform="translate(0,4)">
<g class="switch__letter"><polyline class="switch__letter-stroke" points="2 2,2 14"/><polyline class="switch__letter-stroke" points="2 2,16 2" stroke-dasharray="14 16" stroke-dashoffset="8" transform="rotate(0,2,2)"/><polyline class="switch__letter-stroke" points="2 8,6 8" stroke-dasharray="4 6"/></g>
<g class="switch__letter" transform="translate(14,0)"><polyline class="switch__letter-stroke" points="2 2,2 14"/><polyline class="switch__letter-stroke" points="2 2,8 2" stroke-dasharray="6 8"/><polyline class="switch__letter-stroke" points="2 8,6 8" stroke-dasharray="4 6"/></g>
</g></svg></label>`;

// v3's labels and roughly its ranges; the neutral value of each is substrate's default.
const SLIDERS: { key: keyof GlobalOptions; label: string; min: number; max: number; step: number }[] = [
  { key: "speed", label: "Flow Speed", min: 0, max: 3, step: 0.05 },
  { key: "density", label: "Pattern Density", min: 0.2, max: 3, step: 0.05 },
  { key: "opacity", label: "Opacity", min: 0.1, max: 1, step: 0.05 },
];

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
  const custom = load("custom", DEFAULT_CUSTOM);
  for (const p of [...PALETTES, customPalette(custom)]) {
    const sw = el("button", "vibe-swatch" + (p.name === "custom" ? " is-custom" : ""));
    sw.type = "button";
    sw.dataset.name = p.name;
    sw.dataset.label = p.label;
    sw.setAttribute("role", "radio");
    sw.setAttribute("aria-label", p.label);
    paint(sw, p);
    sw.addEventListener("click", () => {
      setPalette(p.name);
      mark();
    });
    if (p.name === "custom") {
      const pick = el("input", "vibe-pick");
      pick.type = "color";
      pick.value = custom;
      pick.setAttribute("aria-label", "Pick a custom colour");
      // the swatch is the key; Enter or Space on it opens the colour picker, so the input stays out of the tab order
      pick.tabIndex = -1;
      sw.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") pick.showPicker?.();
      });
      pick.addEventListener("input", () => {
        setPalette("custom", pick.value);
        paint(sw, customPalette(pick.value));
        mark();
      });
      sw.append(el("span", "vibe-plus", "+"), pick);
    }
    swatches.push(sw);
    grid.append(sw);
  }
  arrows(grid, () => swatches);
  mark();
  return grid;
}

// A recipe tile: a keycap with the recipe's name and its layer stack listed top to bottom, the way it composites.
function recipeTile(recipe: Recipe, id: string, tag: string): HTMLButtonElement {
  const tile = el("button", "vibe-recipe");
  tile.type = "button";
  tile.dataset.id = id;
  tile.setAttribute("role", "radio");
  const head = el("span", "vibe-recipe-head");
  head.append(el("span", "vibe-recipe-name", recipe.name.slice(0, 40)), el("span", "vibe-recipe-tag", tag));
  const stack = el("ol", "vibe-recipe-stack");
  stack.setAttribute("aria-hidden", "true");
  [...recipe.layers].reverse().forEach((layer, i) => {
    const li = el("li");
    li.append(el("span", "vibe-recipe-n", String(recipe.layers.length - i).padStart(2, "0")), ` ${layer.name}`);
    stack.append(li);
  });
  tile.setAttribute("aria-label", `${recipe.name}, ${recipe.layers.length} layers`);
  tile.append(head, el("span", "vibe-recipe-count", `${recipe.layers.length} layers`), stack);
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
  let refresh = () => {};
  let fpsTimer = 0;
  const cleanups: (() => void)[] = [];
  let last: { frames: number; at: number } | null = null;

  openOverlay({
    id: "vibe",
    title: "Choose Your Vibe!",
    icon: "#ti-flow-switch",
    build(body) {
      const book: { value: RecipeBook | null } = { value: null };
      const root = el("div", "vibe");
      const note = el("p", "vibe-note");
      note.setAttribute("role", "status");

      // Wallpaper: the recipes.
      const wall = section("Wallpaper", "substrate recipes");
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
          pal.meta.textContent = `${label.toLowerCase()} · two ends, drifting`;
          paletteName.textContent = label;
        }),
      );

      // Tune: global multipliers on every layer, through substrate's effectiveLayerOptions.
      const tune = section("Tune", "applies to every layer");
      const reset = el("button", "vibe-key vibe-reset", "Reset");
      reset.type = "button";
      reset.title = "Recipe root, sliders at neutral, animated";
      tune.meta.after(reset);
      const sliders: { input: HTMLInputElement; out: HTMLOutputElement; key: keyof GlobalOptions }[] = [];
      for (const s of SLIDERS) {
        const row = el("label", "vibe-slider");
        const input = el("input");
        input.type = "range";
        input.min = String(s.min);
        input.max = String(s.max);
        input.step = String(s.step);
        const out = el("output", "vibe-slider-value");
        row.append(el("span", "vibe-slider-label", s.label), input, out);
        input.addEventListener("input", () => {
          setGlobalOptions({ [s.key]: Number(input.value) });
          paintSlider(sliders.find((x) => x.input === input)!);
        });
        sliders.push({ input, out, key: s.key });
        tune.root.append(row);
      }
      const paintSlider = ({ input, out, key }: (typeof sliders)[number]) => {
        const min = Number(input.min);
        const max = Number(input.max);
        const v = Number(input.value);
        input.style.setProperty("--fill", `${((v - min) / (max - min)) * 100}%`);
        // opacity reads as a share of the recipe's own (0.8 is neutral), the others as multipliers
        out.textContent = key === "opacity" ? `${Math.round((v / DEFAULT_OPTIONS.opacity) * 100)}%` : `${v.toFixed(2)}×`;
      };
      const loadSliders = () =>
        sliders.forEach((s) => {
          s.input.value = String(globalOptions()[s.key]);
          paintSlider(s);
        });
      loadSliders();
      reset.addEventListener("click", () => {
        setGlobalOptions(DEFAULT_OPTIONS);
        setAnimated(true);
        loadSliders();
        void chooseRecipe("root");
      });

      // Paste: a recipe from the playground's COPY RECIPE.
      const paste = section("Paste a recipe", "json from the substrate playground's copy recipe", true);
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
      const hint = el("span", "vibe-sec-meta", "ctrl+enter applies · saved in this browser only");
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
        if (lines.length > MAX_ERRORS) list.append(el("li", "vibe-result-more", `and ${lines.length - MAX_ERRORS} more`));
        where.replaceChildren(list);
        list.scrollIntoView({ block: "nearest", behavior: "smooth" });
      };

      const submit = async () => {
        const text = field.value.trim();
        if (!text) return say("Paste a recipe first.", "error");
        if (text.length > MAX_PASTE)
          return say(`That is ${text.length.toLocaleString("en")} characters; a recipe fits in ${MAX_PASTE.toLocaleString("en")}.`, "error");
        const tools = await recipeTools();
        const check = tools.parseRecipe(text);
        if (!check.ok || !check.recipe) return say(check.errors, "error");
        const err = await setPastedRecipe(check.recipe);
        if (err) return say(err, "error");
        say(`${check.recipe.name.slice(0, 40)} is on, ${check.recipe.layers.length} layers. Saved in this browser.`, "ok");
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
      cols.append(pal.root, tune.root);
      root.append(note, wall.root, cols, paste.root);
      body.append(root);

      // Everything that follows the wallpaper's state.
      const gpuControls = () => [...tiles.querySelectorAll<HTMLButtonElement>("button"), ...sliders.map((s) => s.input), field, apply, clear, motion, reset];
      refresh = () => {
        const st = wallpaperStatus();
        const off = st.state === "unavailable";
        note.hidden = st.state === "running";
        note.className = "vibe-note" + (off ? " is-off" : "");
        note.textContent = off
          ? `${st.reason} The wallpaper needs WebGPU, so the plain backdrop stays. Palettes still colour the page.`
          : "Starting the wallpaper.";
        root.classList.toggle("is-inert", off);
        for (const c of gpuControls()) c.disabled = off;

        // tiles: the named recipes, then the pasted one if there is one
        if (book.value) {
          const want = [...book.value.recipeNames, ...(pastedRecipe() ? [PASTED] : [])].join(",");
          if (tiles.dataset.ids !== want) {
            tiles.dataset.ids = want;
            tiles.replaceChildren(
              ...book.value.recipeNames.map((n) => recipeTile(book.value!.getRecipe(n)!, n, n === "root" ? "root's own" : "substrate")),
              ...(pastedRecipe() ? [recipeTile(pastedRecipe()!, PASTED, "pasted")] : []),
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
        recipeName.textContent = chosen?.name.slice(0, 40) ?? choice;
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
      const label = el("span", "vibe-foot-label vibe-current");
      label.append("recipe ", recipeName, " · palette ", paletteName);
      const visuals = el("span", "vibe-foot-label");
      visuals.innerHTML = "<kbd>Visuals</kbd>";
      visuals.style.marginRight = "0";
      const wrap = el("div");
      wrap.innerHTML = SWITCH;
      const sw = wrap.firstElementChild as HTMLElement;
      const box = sw.querySelector("input")!;
      box.checked = wallpaperOn();
      box.addEventListener("change", () => setWallpaper(box.checked));
      cleanups.push(onWallpaperChange(() => (box.checked = wallpaperOn())));
      foot.append(label, fps, motion, visuals, sw);
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
