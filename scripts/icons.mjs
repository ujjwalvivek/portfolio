// Builds the icon sprites from assets/icons.json, which holds the exact react-icons definitions v3 used.
//   static/icons.svg                        every icon, fetched by features when they first show one
//   templates/partials/shell-icons.html     only the icons the shell draws, inlined in every page
// An icon is used as <svg><use href="/icons.svg#fa-code"/></svg>, or "#ti-flow-switch" for an inlined one.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SHELL = ["TiFlowSwitch", "RiStackFill", "TfiLinkedin", "TbBrandGithubFilled", "FaFolderTree", "RxTriangleRight", "FaCode", "FiCommand"];

const icons = JSON.parse(readFileSync("assets/icons.json", "utf8"));
const kebab = (name) => name.replace(/(?<!^)(?=[A-Z])/g, "-").toLowerCase();
const attrs = (a) => Object.entries(a).map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}="${v}"`).join(" ");
const node = (n) => {
  const kids = (n.child || []).map(node).join("");
  return kids ? `<${n.tag} ${attrs(n.attr)}>${kids}</${n.tag}>` : `<${n.tag} ${attrs(n.attr)}/>`;
};

function symbol(name) {
  const def = icons[name];
  if (!def) throw new Error(`icon ${name} is not in assets/icons.json`);
  const { viewBox = "0 0 24 24", role, ...rest } = def.attr;
  const group = { stroke: "currentColor", fill: "currentColor", strokeWidth: "0", ...rest };
  return `<symbol id="${kebab(name)}" viewBox="${viewBox}"><g ${attrs(group)}>${def.child.map(node).join("")}</g></symbol>`;
}

const all = Object.keys(icons).sort().map(symbol).join("");
writeFileSync("static/icons.svg", `<svg xmlns="http://www.w3.org/2000/svg">${all}</svg>\n`);

mkdirSync("templates/partials", { recursive: true });
const shell = SHELL.map(symbol).join("");
writeFileSync("templates/partials/shell-icons.html", `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="0" height="0" class="icon-sprite">${shell}</svg>\n`);

console.log(`icons: ${Object.keys(icons).length} in the sprite, ${SHELL.length} inlined in the shell`);
