// Budget gate (docs/ADR.md section 14, docs/BUDGETS.md). For every built page, gzip sizes of:
//   css   the page's stylesheets (tokens, base and the page's own), counted against the CSS budget;
//   js    own JS before interaction: module scripts, modulepreload links and the page modules on <main data-modules>,
//         following static imports and export-from, counted against the JS budget;
//   lazy  JS and CSS the page can load later (dynamic imports, data-lazy sections, stylesheets added from JS);
//   fonts the page preloads (woff2 bytes as served, already compressed), reported, no budget;
//   vendor files and the header game, reported once at the end.
// Exits 1 when any page is over budget. node scripts/sizes.mjs [--all] [--json] [--self-test]
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const ROOT = "public";
const BUDGET = { js: 30 * 1024, css: 30 * 1024 };
const ALL = process.argv.includes("--all");

// Static imports in the form tsc emits: default, named (one or many lines), namespace, side-effect, and export-from.
// Anchored at a statement start so `import(` calls, `export const` and comments do not match.
const STATIC = /(?:^|[;}])[ \t]*(?:import|export)\s*(?:[\w$*{}\s,]*?\bfrom\s*)?["']([^"'\n]+)["']/gm;
// Any other string literal that names a module or stylesheet: dynamic import specifiers, loadFeature arguments, constants.
const LITERAL = /["'`]((?:\.{1,2}\/|\/(?:js|css|vendor|game)\/)[^"'`\s$]*)["'`]/g;

export function staticSpecs(src) {
  return [...src.matchAll(STATIC)].map((m) => m[1]);
}

function selfTest() {
  const src = [
    'import a from "./a.js";',
    'import { b, c } from "./b.js";',
    "import {\n  d,\n  e as f,\n} from '../d.js';",
    'import * as g from "/js/g.js";',
    'import "./side.js";',
    'import h, { i } from "./h.js";',
    'export * from "./star.js";',
    'export * as ns from "./ns.js";',
    'export { j } from "./j.js";',
    "export {\n  k,\n  l,\n} from \"./k.js\";",
    'import{m}from"./min.js";',
    'export const x = "./not-an-import.js";',
    'const y = import("./dynamic.js");',
    '// import z from "./comment.js";',
    'export function f() { return "./neither.js"; }',
  ].join("\n");
  const want = ["./a.js", "./b.js", "../d.js", "/js/g.js", "./side.js", "./h.js", "./star.js", "./ns.js", "./j.js", "./k.js", "./min.js"];
  const got = staticSpecs(src);
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(ok ? "import regex: all static forms found" : `import regex FAILED\n want ${want}\n got  ${got}`);
  return ok;
}

const gzCache = new Map();
const gz = (url) => {
  if (!gzCache.has(url)) gzCache.set(url, gzipSync(readFileSync(local(url))).length);
  return gzCache.get(url);
};
const local = (url) => join(ROOT, decodeURIComponent(url.split(/[?#]/)[0]));
const resolve = (spec, from) => new URL(spec, "https://x" + from).pathname;
const isFile = (url) => existsSync(local(url)) && statSync(local(url)).isFile();
const kind = (url) => (/^\/(vendor|game)\//.test(url) ? "vendor" : url.startsWith("/js/") ? "own" : "other");

// Per module: static edges and other references (dynamic modules, stylesheets, vendor folders).
const modCache = new Map();
function scan(url) {
  if (modCache.has(url)) return modCache.get(url);
  const src = isFile(url) ? readFileSync(local(url), "utf8") : "";
  const stat = new Set(staticSpecs(src).map((s) => resolve(s, url)));
  const refs = new Set();
  for (const [, s] of src.matchAll(LITERAL)) {
    const r = resolve(s, url);
    if (!stat.has(r)) refs.add(r);
  }
  const out = { stat: [...stat], refs: [...refs] };
  modCache.set(url, out);
  return out;
}

function closure(entries, into = new Set()) {
  const stack = [...entries];
  while (stack.length) {
    const u = stack.pop();
    if (into.has(u) || !isFile(u)) continue;
    into.add(u);
    stack.push(...scan(u).stat);
  }
  return into;
}

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return pages(p);
    return name === "index.html" ? [p] : [];
  });
}

const attr = (html, re) => [...html.matchAll(re)].flatMap((m) => m[1].split(/\s+/)).filter((u) => u.startsWith("/"));

function measure(page) {
  const html = readFileSync(page, "utf8");
  const css = [...new Set(attr(html, /<link rel="stylesheet" href="([^"]+)"/g).concat(attr(html, /data-styles="([^"]*)"/g)))];
  const entries = attr(html, /<(?:link rel="modulepreload" href|script type="module" src)="([^"]+)"/g).concat(attr(html, /data-modules="([^"]*)"/g));
  const pre = closure(entries);

  // Everything reachable later: references from loaded modules, then their static graphs, until nothing new appears.
  const lazy = new Set();
  const lazyCss = new Set(attr(html, /data-lazy-styles="([^"]*)"/g));
  const vendor = new Set();
  let frontier = [...pre, ...attr(html, /data-lazy="([^"]*)"/g)];
  const seen = new Set();
  while (frontier.length) {
    const next = [];
    for (const u of frontier) {
      if (seen.has(u)) continue;
      seen.add(u);
      if (!pre.has(u) && isFile(u)) {
        if (kind(u) === "vendor") { if (/\.(m?js|wasm)$/.test(u)) vendor.add(u); }
        else if (u.endsWith(".js") || u.endsWith(".mjs")) lazy.add(u);
      }
      if (u.endsWith("/") && kind(u) === "vendor") vendor.add(u);
      if (!u.endsWith(".js") && !u.endsWith(".mjs")) continue;
      const { stat, refs } = scan(u);
      for (const r of [...stat, ...refs]) {
        if (r.endsWith(".css")) {
          if (!css.includes(r) && isFile(r)) lazyCss.add(r);
        } else next.push(r);
      }
    }
    frontier = next;
  }
  const own = [...pre].filter((u) => kind(u) === "own");
  const fonts = attr(html, /<link rel="preload" href="([^"]+)" as="font"/g).filter(isFile);
  const sum = (list) => list.reduce((n, u) => n + gz(u), 0);
  return {
    page: page.slice(ROOT.length).replace(/index\.html$/, ""),
    html: gzipSync(html).length,
    css,
    cssBytes: sum(css),
    own,
    jsBytes: sum(own),
    lazy: [...lazy],
    lazyBytes: sum([...lazy]),
    lazyCss: [...lazyCss],
    lazyCssBytes: sum([...lazyCss]),
    vendor: [...vendor],
    fontBytes: fonts.reduce((n, u) => n + statSync(local(u)).size, 0),
  };
}

if (process.argv.includes("--self-test")) process.exit(selfTest() ? 0 : 1);
if (!process.argv.includes("--json") && !selfTest()) process.exit(1);
if (!existsSync(ROOT)) {
  console.error("no public/; run npm run build first");
  process.exit(1);
}

const results = pages(ROOT).sort().map(measure);
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 1));
  process.exit(0);
}
const kb = (n) => (n / 1024).toFixed(1).padStart(5);

// Pages with the same assets collapse into one row (the 14 posts, the tag pages); --all prints each page.
const groups = new Map();
for (const r of results) {
  const sig = ALL ? r.page : [r.css, r.own, r.lazy, r.lazyCss].map((l) => [...l].sort().join(",")).join("|");
  if (!groups.has(sig)) groups.set(sig, []);
  groups.get(sig).push(r);
}

const over = (r) => r.jsBytes > BUDGET.js || r.cssBytes > BUDGET.css;
const rows = [...groups.values()].map((g) => {
  const r = g.reduce((a, b) => (b.html > a.html ? b : a));
  const name = g.length > 1 ? `${commonPrefix(g.map((x) => x.page))}* (${g.length} pages)` : r.page;
  return { ...r, name, n: g.length, over: g.some(over) };
});

function commonPrefix(list) {
  let p = list[0];
  for (const s of list) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p.slice(0, p.lastIndexOf("/") + 1);
}

const W = Math.max(28, ...rows.map((r) => r.name.length));
console.log("");
console.log(`gzip KB. Budgets: own JS before interaction ${BUDGET.js / 1024}, CSS ${BUDGET.css / 1024}.`);
console.log(`     ${"page".padEnd(W)}   html    css  js-pre files   lazy-js lazy-css  fonts`);
for (const r of rows) {
  const flag = r.over ? "OVER" : "ok  ";
  const c = r.cssBytes > BUDGET.css ? "!" : " ";
  const j = r.jsBytes > BUDGET.js ? "!" : " ";
  console.log(
    `${flag} ${r.name.padEnd(W)}  ${kb(r.html)}  ${kb(r.cssBytes)}${c} ${kb(r.jsBytes)}${j}  ${String(r.own.length).padStart(3)}    ${kb(r.lazyBytes)}    ${kb(r.lazyCssBytes)}  ${kb(r.fontBytes)}`,
  );
}

// Largest own files before interaction, and every over-budget page's top files.
const top = (list, n = 5) =>
  list
    .map((u) => [u, gz(u)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([u, s]) => `${u} ${kb(s).trim()}`)
    .join(", ");
console.log("");
for (const r of rows) {
  if (!r.over && !ALL) continue;
  console.log(`${r.name}: js ${top(r.own)}`);
  console.log(`${" ".repeat(r.name.length)}  css ${top(r.css)}`);
}
const heaviest = rows.reduce((a, b) => (b.jsBytes > a.jsBytes ? b : a));
console.log(`heaviest JS before interaction, ${heaviest.name}: ${top(heaviest.own)}`);

// Vendor and game: loaded after first paint or on use, never counted against a page.
const vendorRefs = new Set(results.flatMap((r) => r.vendor));
const vendorFiles = [];
for (const v of vendorRefs) {
  if (v.endsWith("/")) {
    const core = v + "core.js";
    if (isFile(core)) vendorFiles.push([core, "plus one grammar per language shown"]);
  } else vendorFiles.push([v, ""]);
}
for (const f of ["/game/game_bg.wasm", "/vendor/pdfjs@6.5.438/pdf.worker.min.mjs"]) if (isFile(f) && !vendorRefs.has(f)) vendorFiles.push([f, ""]);
console.log("");
console.log("vendor and game, gzip KB, after first paint or on use:");
for (const [f, note] of vendorFiles.sort()) console.log(`     ${f.padEnd(W + 20)} ${kb(gz(f))} ${note}`);

const failed = results.filter(over);
console.log("");
if (failed.length) {
  console.log(`FAIL: ${failed.length} page(s) over budget: ${failed.map((r) => r.page).join(" ")}`);
  process.exit(1);
}
console.log(`pass: ${results.length} pages within budget`);
