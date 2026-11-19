// "Tech Stack I Don't Suck At!", the footer overlay from v3, with the stack updated in v4 from his repos' languages,
// echopoint's language totals, the tools his recent projects use, and the resume. Icons come from the shared sprite,
// fetched on first open. Rows are balanced: the grid takes as few rows as the width allows and spreads the tiles
// evenly across them, and a shorter last row is centred.

import { openOverlay } from "../shell/overlay.js";

const STACK: [string, string][] = [
  // languages
  ["Rust", "si-rust"], ["Go", "si-go"], ["C", "si-c"], ["C#", "tb-brand-c-sharp"], ["Zig", "si-zig"],
  ["TypeScript", "si-typescript"], ["JavaScript", "io-logo-javascript"], ["Python", "si-python"],
  ["Assembly (NASM)", "bs-cpu-fill"],
  // graphics and the web
  ["wgpu", "si-wgpu"], ["WebGPU", "si-webgpu"], ["WebAssembly", "si-webassembly"], ["Zola", "si-zola"],
  // systems and infrastructure
  ["Linux (Arch)", "si-archlinux"], ["Git", "fa-git"], ["Docker", "si-docker"], ["Cloudflare", "si-cloudflare"],
  ["Tailscale", "si-tailscale"],
  // product and 3D
  ["Figma", "lu-figma"], ["Jira", "fa-jira"], ["Linear", "si-linear"], ["Unity", "fa-unity"],
  ["Unreal Engine", "si-unrealengine"], ["Blender", "si-blender"],
];

// Columns for n tiles in a width: the fewest rows that fit, then the tiles spread evenly over those rows.
function columns(width: number, tile: number, gap: number, n: number): number {
  const fit = Math.max(1, Math.floor((width + gap) / (tile + gap)));
  const rows = Math.ceil(n / fit);
  return Math.ceil(n / rows);
}

export function openTechStack(): void {
  openOverlay({
    id: "stack",
    title: "Tech Stack I Don't Suck At!",
    icon: "#fa-code",
    build(body) {
      const grid = document.createElement("div");
      grid.className = "stack-grid";
      for (const [title, id] of STACK) {
        const item = document.createElement("div");
        item.className = "stack-item";
        item.dataset.label = title;
        item.tabIndex = 0;
        item.innerHTML = `<svg class="icon" role="img" aria-label="${title}"><use href="/icons.svg#${id}"/></svg>`;
        grid.append(item);
      }
      body.append(grid);
      // The icons come from different sets, each padding its drawing differently inside its box. The sprite (already
      // cached) is read once, each icon's artwork is measured, and its svg's viewBox is cropped to a square around it,
      // so every glyph fills its tile the same way.
      void fetch("/icons.svg")
        .then((r) => r.text())
        .then((text) => {
          const sprite = new DOMParser().parseFromString(text, "image/svg+xml");
          const NS = "http://www.w3.org/2000/svg";
          const probe = document.createElementNS(NS, "svg");
          probe.setAttribute("aria-hidden", "true");
          probe.classList.add("stack-probe");
          document.body.append(probe);
          for (const svg of grid.querySelectorAll<SVGSVGElement>("svg")) {
            const id = svg.querySelector("use")?.getAttribute("href")?.split("#")[1];
            const symbol = id ? sprite.getElementById(id) : null;
            if (!symbol) continue;
            const g = document.importNode(symbol.firstElementChild!, true) as SVGGraphicsElement;
            probe.replaceChildren(g);
            const b = g.getBBox();
            if (!(b.width > 0 && b.height > 0)) continue;
            // sized by area, so a wide wordmark and a square logo weigh the same; a wide one may run past the
            // square (the svg shows overflow), up to 1.6 times its width
            const side = Math.max(Math.sqrt(b.width * b.height) * 1.08, Math.max(b.width, b.height) / 1.6);
            svg.setAttribute("viewBox", `${b.x + b.width / 2 - side / 2} ${b.y + b.height / 2 - side / 2} ${side} ${side}`);
            svg.replaceChildren(g);
          }
          probe.remove();
        })
        .catch(() => {});

      const fit = () => {
        const cs = getComputedStyle(grid);
        // the body's width, not the grid's: the grid narrows itself to the columns it is given
        const width = body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const tile = parseFloat(getComputedStyle(grid.firstElementChild!).width);
        const gap = parseFloat(cs.columnGap);
        if (!(width > 0 && tile > 0)) return;
        grid.style.setProperty("--cols", String(columns(width, tile, gap || 0, STACK.length)));
      };
      const ro = new ResizeObserver(fit);
      ro.observe(body);
      fit();
      return () => ro.disconnect();
    },
    foot(foot) {
      const a = document.createElement("a");
      a.className = "chip";
      a.href = "https://github.com/ujjwalvivek";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "GITHUB";
      foot.append(a);
    },
  });
}
