// Prints what each built page asks for before interaction, gzip sizes, against the budgets in docs/ADR.md section 14.
// Counts the page's stylesheets and its module graph from modulepreload links and module scripts, following static imports.
// Vendor files and the game are reported but not counted against the page's own JS budget.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const ROOT = "public";
const BUDGET = { js: 30 * 1024, css: 30 * 1024 };
const gz = (path) => gzipSync(readFileSync(path)).length;
const local = (url) => join(ROOT, url.split("?")[0]);

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return pages(p);
    return name === "index.html" ? [p] : [];
  });
}

function graph(entry, seen = new Set()) {
  if (seen.has(entry) || !existsSync(local(entry))) return seen;
  seen.add(entry);
  const src = readFileSync(local(entry), "utf8");
  for (const [, spec] of src.matchAll(/^\s*import\s[^"']*["'](\.{1,2}\/[^"']+)["']/gm)) {
    graph(new URL(spec, "https://x" + entry).pathname, seen);
  }
  return seen;
}

let failed = false;
for (const page of pages(ROOT)) {
  const html = readFileSync(page, "utf8");
  const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]).filter((u) => u.startsWith("/"));
  const entries = [...html.matchAll(/<(?:link rel="modulepreload" href|script type="module" src)="([^"]+)"/g)].map((m) => m[1]);
  const js = new Set();
  for (const e of entries) for (const f of graph(e)) js.add(f);
  const own = [...js].filter((f) => f.startsWith("/js/"));
  const jsBytes = own.reduce((n, f) => n + gz(local(f)), 0);
  const cssBytes = css.reduce((n, f) => n + gz(local(f)), 0);
  const htmlBytes = gzipSync(html).length;
  const over = jsBytes > BUDGET.js || cssBytes > BUDGET.css;
  failed ||= over;
  const kb = (n) => (n / 1024).toFixed(1).padStart(5) + " KB";
  console.log(`${over ? "OVER" : "ok  "} ${page.slice(ROOT.length).padEnd(44)} html ${kb(htmlBytes)}  css ${kb(cssBytes)}  js ${kb(jsBytes)} (${own.length} files)`);
}
for (const f of ["vendor/substrate@2.1.0/index.js", "game/game_bg.wasm"]) {
  if (existsSync(join(ROOT, f))) console.log(`     /${f.padEnd(43)} ${(gz(join(ROOT, f)) / 1024).toFixed(1)} KB gzip, loaded after first paint`);
}
process.exit(failed ? 1 : 0);
