// Vibe switch, M0 cut: every palette with its two ends, the custom colour, and the wallpaper on/off switch.
// M6 grows it into the full picker (recipes, global sliders, FPS, pasted recipes) per ADR D-011.

import { load } from "../lib/store.js";
import { currentPalette, setPalette } from "../shell/drift.js";
import { openOverlay } from "../shell/overlay.js";
import { DEFAULT_CUSTOM, PALETTES, customPalette, type Palette } from "../shell/palettes.js";
import { setWallpaper, wallpaperAvailable, wallpaperOn } from "../shell/wallpaper.js";

function swatch(p: Palette): string {
  const g = (c: Palette["a"]) => `${c.primary}, ${c.secondary}, ${c.accent}`;
  return `linear-gradient(90deg, ${g(p.a)}, ${g(p.b)})`;
}

export function openVibeSwitch(): void {
  openOverlay({
    id: "vibe",
    title: "Choose Your Vibe!",
    icon: "#ti-flow-switch",
    build(body) {
      const list = document.createElement("div");
      list.className = "vibe-list";
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-label", "Palettes");

      const rows: HTMLButtonElement[] = [];
      const mark = () => {
        for (const r of rows) r.setAttribute("aria-selected", String(r.dataset.name === currentPalette().name));
      };

      const custom = load("custom", DEFAULT_CUSTOM);
      for (const p of [...PALETTES, customPalette(custom)]) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "vibe-row";
        row.dataset.name = p.name;
        row.setAttribute("role", "option");
        row.innerHTML = `<span class="vibe-name">${p.label}</span><span class="vibe-swatch" style="background:${swatch(p)}"></span>`;
        row.addEventListener("click", () => {
          setPalette(p.name);
          mark();
        });
        if (p.name === "custom") {
          const pick = document.createElement("input");
          pick.type = "color";
          pick.value = custom;
          pick.className = "vibe-pick";
          pick.setAttribute("aria-label", "Custom colour");
          pick.addEventListener("click", (e) => e.stopPropagation());
          pick.addEventListener("input", () => {
            setPalette("custom", pick.value);
            (row.querySelector(".vibe-swatch") as HTMLElement).style.background = swatch(customPalette(pick.value));
            mark();
          });
          row.append(pick);
        }
        rows.push(row);
        list.append(row);
      }
      mark();
      body.append(list);

      const onKey = (e: KeyboardEvent) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        const i = rows.findIndex((r) => r.dataset.name === currentPalette().name);
        const next = rows[(i + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length]!;
        next.click();
        next.focus();
        next.scrollIntoView({ block: "nearest" });
      };
      body.addEventListener("keydown", onKey);
    },
    foot(foot) {
      const label = document.createElement("label");
      label.className = "vibe-toggle";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.role = "switch";
      box.checked = wallpaperOn();
      box.addEventListener("change", () => setWallpaper(box.checked));
      const text = document.createElement("span");
      text.textContent = wallpaperAvailable() || !("gpu" in navigator) ? "Wallpaper" : "Wallpaper (starting)";
      if (!("gpu" in navigator)) text.textContent = "Wallpaper (no WebGPU here, backdrop only)";
      label.append(box, text);
      foot.append(label);
    },
  });
}
