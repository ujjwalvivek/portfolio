// Vibe switch, M0 cut: v3's palette swatches (each one a gradient across the palette's two ends) and its ON/OFF lettered
// wallpaper switch. M6 grows it into the full picker (recipes, global sliders, FPS, pasted recipes) per ADR D-011.

import { load } from "../lib/store.js";
import { currentPalette, setPalette } from "../shell/drift.js";
import { openOverlay } from "../shell/overlay.js";
import { DEFAULT_CUSTOM, PALETTES, customPalette, type Palette } from "../shell/palettes.js";
import { setWallpaper, wallpaperOn } from "../shell/wallpaper.js";

// v3's switch markup: the stroked letters redraw from OFF to ON.
const SWITCH = `<label class="switch"><input class="switch__input" type="checkbox" role="switch" aria-label="Wallpaper">
<svg class="switch__letters" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><g stroke="currentcolor" stroke-linecap="round" stroke-width="4" transform="translate(0,4)">
<g class="switch__letter"><polyline class="switch__letter-stroke" points="2 2,2 14"/><polyline class="switch__letter-stroke" points="2 2,16 2" stroke-dasharray="14 16" stroke-dashoffset="8" transform="rotate(0,2,2)"/><polyline class="switch__letter-stroke" points="2 8,6 8" stroke-dasharray="4 6"/></g>
<g class="switch__letter" transform="translate(14,0)"><polyline class="switch__letter-stroke" points="2 2,2 14"/><polyline class="switch__letter-stroke" points="2 2,8 2" stroke-dasharray="6 8"/><polyline class="switch__letter-stroke" points="2 8,6 8" stroke-dasharray="4 6"/></g>
</g></svg></label>`;

// The two accents corner to corner over the palette's own dark background, so each swatch reads as its drift.
const gradient = (p: Palette) =>
  `radial-gradient(circle at 30% 30%, transparent 0 40%, ${p.a.background}66 100%), linear-gradient(135deg, ${p.a.accent}, ${p.b.accent})`;

export function openVibeSwitch(): void {
  const current = document.createElement("span");
  current.className = "vibe-foot-label vibe-current";
  openOverlay({
    id: "vibe",
    title: "Choose Your Vibe!",
    icon: "#ti-flow-switch",
    build(body) {
      const grid = document.createElement("div");
      grid.className = "vibe-grid";
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
        current.innerHTML = `palette <b>${currentPalette().label}</b>`;
      };
      const paint = (sw: HTMLElement, p: Palette) => {
        sw.style.setProperty("--swatch", gradient(p));
        sw.style.setProperty("--swatch-edge", p.a.accent);
      };

      const custom = load("custom", DEFAULT_CUSTOM);
      for (const p of [...PALETTES, customPalette(custom)]) {
        const sw = document.createElement("button");
        sw.type = "button";
        sw.className = "vibe-swatch" + (p.name === "custom" ? " is-custom" : "");
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
          const pick = document.createElement("input");
          pick.type = "color";
          pick.value = custom;
          pick.className = "vibe-pick";
          pick.setAttribute("aria-label", "Pick a custom colour");
          pick.addEventListener("input", () => {
            setPalette("custom", pick.value);
            paint(sw, customPalette(pick.value));
            mark();
          });
          sw.append(pick);
        }
        swatches.push(sw);
        grid.append(sw);
      }

      // Arrow keys move through the palettes and apply each one, like v3's list.
      grid.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const i = swatches.findIndex((s) => s.dataset.name === currentPalette().name);
        const next = swatches[(i + step + swatches.length) % swatches.length]!;
        next.click();
        next.focus();
      });

      body.append(grid);
      mark();
      requestAnimationFrame(() => swatches.find((s) => s.tabIndex === 0)?.focus({ preventScroll: true }));
    },
    foot(foot) {
      const label = document.createElement("span");
      label.className = "vibe-foot-label";
      label.innerHTML = "<kbd>Visuals</kbd>";
      label.style.marginRight = "0";
      foot.append(current, label);
      const wrap = document.createElement("div");
      wrap.innerHTML = SWITCH;
      const sw = wrap.firstElementChild as HTMLElement;
      const box = sw.querySelector("input")!;
      box.checked = wallpaperOn();
      box.addEventListener("change", () => setWallpaper(box.checked));
      foot.append(sw);
    },
  });
}
