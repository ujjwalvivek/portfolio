// v3 URL check (docs/ADR.md D-016, section 13). Resolves every URL v3 served against the built site in public/, the way
// Cloudflare Pages does: _redirects first (top-most match wins, splats and :placeholders, 200 rewrites), then static
// assets with Pages' HTML handling (/x/index.html at /x/, /x redirects to /x/, /x.html redirects to /x and is served
// there), else 404.
//
// node scripts/check-urls.mjs [--strict] [--git]
//   --strict  known gaps fail too (CI passes it on main, so cutover cannot ship them)
//   --git     also compare the list below with `git ls-tree main public` and v3's posts/meta.json
import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = "public";
const STRICT = process.argv.includes("--strict");

// The 14 posts in v3's meta.json, linked as /blog/<file>.md.
const POSTS = [
  "log_0000_boot_sequence", "log_0002_midnight_patchdrop", "log_0003_going_open_source", "log_0004_journey_updates",
  "log_0005_finally_it_happened", "log_0006_simpleclippy", "log_0007_chaotic_week", "log_0008_game_of_games",
  "log_0009_baremetal", "log_0010_gpui_experiment", "proj_0002_greedysnek", "proj_0003_kill_bad_guys",
  "proj_0004_rust_game_engine", "proj_0005_the_synclippy",
];
// In v3's public/posts but not in meta.json: v3's post page rendered "not found" for them (ADR D-002 amendment).
const UNLISTED = ["log_0001_md_showcase", "proj_0000_the_reckoning", "proj_0001_cement_ary_journey"];

// Every v3 URL: React routes, then the files v3 served from public/ (git ls-tree -r main public).
const V3 = [
  "/", "/about", "/projects", "/blog", "/bg-test",
  ...POSTS.map((p) => `/blog/${p}.md`),
  ...UNLISTED.map((p) => `/blog/${p}.md`),
  "/index.html", "/manifest.json", "/robots.txt",
  "/posts/meta.json",
  ...[...POSTS, ...UNLISTED].sort().map((p) => `/posts/${p}.md`),
  "/games/dino-blink.html",
  "/media/map-blr-dark.png", "/media/map-blr-light.png",
];

// Where some v3 URLs must land, beyond "resolves to something".
const EXPECT = {
  "/bg-test": "/?vibe",
  ...Object.fromEntries(POSTS.map((p) => [`/blog/${p}.md`, `/blog/${p}/`])),
  ...Object.fromEntries(POSTS.map((p) => [`/posts/${p}.md`, `/blog/${p}/`])),
};

// URLs that do not resolve yet, each with why and what fixes it. Printed as GAP; they fail only with --strict.
const GAPS = {
  "/posts/meta.json": "ADR section 13 keeps it as a Zola-generated JSON; nothing generates it yet",
};

// v3 URLs that are meant to 404 in v4, with the decision behind it. Printed as GONE, never fail; if one starts to
// resolve, the check says so.
const GONE = Object.fromEntries(
  UNLISTED.flatMap((p) => [
    [`/blog/${p}.md`, "unlisted in v3, where its page rendered not found; left out by the D-002 amendment"],
    [`/posts/${p}.md`, "raw file of a post left out by the D-002 amendment; no v4 page to map to"],
  ]),
);

function parseRedirects(text) {
  const rules = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [from, to, code = "302"] = line.split(/\s+/);
    if (!from || !to) continue;
    let splat = false;
    const names = [];
    const re = from
      .split(/(\*|:[A-Za-z]\w*)/)
      .map((part) => {
        if (part === "*") {
          if (splat) return "\\*";
          splat = true;
          names.push("splat");
          return "(.*)";
        }
        if (/^:[A-Za-z]\w*$/.test(part)) {
          names.push(part.slice(1));
          return "([^/]+)";
        }
        return part.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    rules.push({ from, to, code: Number(code), re: new RegExp(`^${re}$`), names });
  }
  return rules;
}

function matchRule(rules, path) {
  for (const r of rules) {
    const m = path.match(r.re);
    if (!m) continue;
    let to = r.to;
    r.names.forEach((n, i) => (to = to.replaceAll(`:${n}`, m[i + 1])));
    return { ...r, to };
  }
  return null;
}

const file = (p) => existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).isFile();

// One step of Pages' static asset handling: { status, location?, served? }.
function asset(path) {
  if (path.endsWith("/index.html")) return { status: 308, location: path.slice(0, -"index.html".length) };
  if (path.endsWith(".html") && file(path)) return { status: 308, location: path.slice(0, -".html".length) };
  if (path.endsWith("/")) return file(path + "index.html") ? { status: 200, served: path + "index.html" } : { status: 404 };
  if (file(path)) return { status: 200, served: path };
  if (file(path + ".html")) return { status: 200, served: path + ".html" };
  if (file(path + "/index.html")) return { status: 308, location: path + "/" };
  return { status: 404 };
}

function resolve(rules, url) {
  const hops = [];
  let cur = new URL(url, "https://site.test");
  for (let i = 0; i < 10; i++) {
    const rule = matchRule(rules, decodeURIComponent(cur.pathname));
    if (rule && rule.code !== 200) {
      const next = new URL(rule.to, cur);
      if (next.origin !== cur.origin) return { status: 200, final: next.href, hops: [...hops, `${rule.code} ${next.href}`], external: true };
      if (!next.search) next.search = cur.search;
      hops.push(`${rule.code} ${next.pathname}${next.search}`);
      cur = next;
      continue;
    }
    const target = rule ? new URL(rule.to, cur).pathname : cur.pathname;
    const a = asset(decodeURIComponent(target));
    if (a.status === 308) {
      const next = new URL(a.location + cur.search, cur);
      hops.push(`308 ${next.pathname}${next.search}`);
      cur = next;
      continue;
    }
    return { status: a.status, final: cur.pathname + cur.search, served: a.served, hops, rewrite: rule ? rule.to : undefined };
  }
  return { status: 508, final: cur.pathname, hops };
}

function gitCheck() {
  const tree = execFileSync("git", ["ls-tree", "-r", "--name-only", "main", "public"], { encoding: "utf8" })
    .split("\n")
    .filter((f) => f && f !== "public/_redirects")
    .map((f) => f.slice("public".length));
  const meta = JSON.parse(execFileSync("git", ["show", "main:public/posts/meta.json"], { encoding: "utf8" })).map((p) =>
    p.filename.replace(/\.md$/, ""),
  );
  const missing = [...tree.filter((f) => !V3.includes(f)), ...meta.filter((p) => !POSTS.includes(p)).map((p) => `/blog/${p}.md`)];
  const stale = POSTS.filter((p) => !meta.includes(p));
  if (missing.length || stale.length) {
    console.log(`v3 list out of date: missing ${missing.join(" ") || "-"}; not in meta.json ${stale.join(" ") || "-"}`);
    return false;
  }
  console.log(`v3 list matches git main: ${tree.length} files in public/, ${meta.length} posts in meta.json`);
  return true;
}

if (!existsSync(join(ROOT, "_redirects"))) {
  console.error("no public/_redirects; run npm run build first");
  process.exit(1);
}
let ok = !process.argv.includes("--git") || gitCheck();
const rules = parseRedirects(readFileSync(join(ROOT, "_redirects"), "utf8"));
const W = Math.max(...V3.map((u) => u.length));
let fails = 0;
let gaps = 0;
let gone = 0;
for (const url of V3) {
  const r = resolve(rules, url);
  const want = EXPECT[url];
  const good = r.status === 200 && (!want || r.final === want);
  let tag = good ? "ok  " : GAPS[url] ? "GAP " : GONE[url] && r.status === 404 ? "GONE" : "FAIL";
  let note = "";
  if (!good) note = GAPS[url] ?? GONE[url] ?? (want ? `want ${want}` : "");
  if (good && (GAPS[url] || GONE[url])) note = "resolves now; take it off GAPS or GONE";
  const path = [...r.hops, r.status === 200 ? `200 ${r.served ?? r.final}` : `${r.status}`].join(" -> ");
  console.log(`${tag} ${url.padEnd(W)}  ${path}${note ? `  (${note})` : ""}`);
  if (tag === "FAIL") fails++;
  if (tag === "GAP ") gaps++;
  if (tag === "GONE") gone++;
}
console.log("");
console.log(`${V3.length} v3 URLs: ${V3.length - fails - gaps - gone} resolve, ${gone} gone by decision, ${gaps} known gap(s), ${fails} failure(s)${STRICT ? " (strict)" : ""}`);
if (fails || (STRICT && gaps)) ok = false;
process.exit(ok ? 0 : 1);
