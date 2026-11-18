// "Tech Stack I Don't Suck At!", the footer overlay from v3. Icons come from the shared sprite, fetched on first open.

import { openOverlay } from "../shell/overlay.js";

const STACK: [string, string][] = [
  ["Rust", "si-rust"], ["wGPU", "si-wgpu"], ["Markdown", "fa-markdown"], ["Confluence", "fa-confluence"],
  ["Jira", "fa-jira"], ["Mixpanel", "si-mixpanel"], ["Git", "fa-git"], ["Unity", "fa-unity"],
  ["Unreal Engine", "si-unrealengine"], ["Linear", "si-linear"], ["JavaScript", "io-logo-javascript"],
  ["Figma", "lu-figma"], ["Firebase", "io-logo-firebase"], ["SQL", "tb-sql"], ["NodeJs", "fa-node-js"],
  ["CSS", "fa-css3-alt"], ["Excel", "fa-file-excel"], ["Still Learning More", "hi-dots-horizontal"],
];

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
        item.title = title;
        item.innerHTML = `<svg class="icon" role="img" aria-label="${title}"><use href="/icons.svg#${id}"/></svg>`;
        grid.append(item);
      }
      body.append(grid);
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
