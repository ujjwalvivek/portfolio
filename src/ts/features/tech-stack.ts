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
