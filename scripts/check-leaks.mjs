// Soft-navigation leak check (docs/ADR.md R-03). Local only, needs a Chromium-based browser (see check-cdp.mjs).
// Loads the built site, soft-navigates home -> about -> blog -> a post -> projects -> home by clicking links (the
// router's own path), N rounds, and after each round measures, back on home:
//   heap     JS heap used after forced GC (HeapProfiler.collectGarbage, Runtime.getHeapUsage)
//   nodes    DOM nodes and JS event listeners alive (Memory.getDOMCounters), detached nodes (DOM.getDetachedDomNodes)
//   win/doc  listeners on window and document (DOMDebugger.getEventListeners)
// A second, instrumented pass records where every listener on long-lived targets (window, document, html, body, and
// non-DOM targets such as the shell's event bus), every interval, pending timeout and observer was created, and prints
// the call sites whose live count grows between round 2 and the last round.
//
// node scripts/check-leaks.mjs [rounds=10] [--list] [--heap]   (after npm run build)
//   --list  every live call site at the end; --heap  heap snapshot diff, round 2 vs the last, by constructor
import { launch, open, serve, wait } from "./check-cdp.mjs";

const ROUNDS = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 10);
const HEAP = process.argv.includes("--heap");
const POST = "/blog/log_0003_going_open_source/";
const ROUTE = [
  ["/about/", "/js/pages/about.js"],
  ["/blog/", "/js/pages/blog-list.js"],
  [POST, "/js/pages/post.js"],
  ["/projects/", "/js/pages/projects.js"],
  ["/", "/js/pages/home.js"],
];

// Runs in the page before any app code: wraps the APIs that hold work alive and keys each live item by call site.
const INSTRUMENT = String.raw`(() => {
  const live = new Map(); // key -> { kind, site, n }
  const site = () => {
    const lines = (new Error().stack || "").split("\n").slice(3);
    const own = lines.find((l) => /\/(js|vendor|game)\//.test(l)) || lines[0] || "";
    const m = own.match(/(\/(?:js|vendor|game)\/[^\s)]+)/);
    return m ? m[1] : own.trim();
  };
  const bump = (kind, s, d) => {
    const k = kind + " " + s;
    const e = live.get(k) || { kind, site: s, n: 0 };
    e.n += d;
    if (e.n === 0) live.delete(k); else live.set(k, e);
  };
  const longLived = (t) => !(t instanceof Node) || t === document || t === document.documentElement || t === document.body || t === document.head;
  const reg = new WeakMap(); // target -> Map(type|capture|fn -> site)
  const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
  const cap = (o) => (typeof o === "boolean" ? o : !!(o && o.capture));
  const fnKeys = new WeakMap(); let fnId = 0;
  const fk = (fn) => { if (!fnKeys.has(fn)) fnKeys.set(fn, ++fnId); return fnKeys.get(fn); };
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if (fn && longLived(this)) {
      let m = reg.get(this); if (!m) reg.set(this, (m = new Map()));
      const k = type + "|" + cap(opts) + "|" + fk(fn);
      if (!m.has(k)) {
        const s = site(), name = this === window ? "window" : this === document ? "document" : this instanceof Node ? this.nodeName.toLowerCase() : (this.constructor && this.constructor.name) || "target";
        const label = "listener " + name + ":" + type;
        m.set(k, label + "@" + s); bump(label, s, 1);
        if (opts && opts.once) { const t = this; add.call(this, type, () => { if (m.delete(k)) bump(label, s, -1); }, { once: true, capture: cap(opts) }); }
        if (opts && opts.signal) { const t = this; opts.signal.addEventListener("abort", () => { if (m.delete(k)) bump(label, s, -1); }); }
      }
    }
    return add.call(this, type, fn, opts);
  };
  EventTarget.prototype.removeEventListener = function (type, fn, opts) {
    const m = fn && reg.get(this);
    if (m) {
      const k = type + "|" + cap(opts) + "|" + fk(fn), v = m.get(k);
      if (v) { m.delete(k); const i = v.indexOf("@"); bump(v.slice(0, i), v.slice(i + 1), -1); }
    }
    return rem.call(this, type, fn, opts);
  };
  const si = setInterval, ci = clearInterval, st = setTimeout, ct = clearTimeout;
  const iv = new Map(), to = new Map();
  window.setInterval = function (fn, ms, ...a) { const s = site(); const id = si(fn, ms, ...a); iv.set(id, s); bump("interval", s, 1); return id; };
  window.clearInterval = function (id) { const s = iv.get(id); if (s) { iv.delete(id); bump("interval", s, -1); } return ci(id); };
  window.setTimeout = function (fn, ms, ...a) {
    const s = site();
    const id = st(function () { if (to.delete(id)) bump("timeout", s, -1); return typeof fn === "function" ? fn.apply(this, arguments) : undefined; }, ms, ...a);
    to.set(id, s); bump("timeout", s, 1); return id;
  };
  window.clearTimeout = function (id) { const s = to.get(id); if (s) { to.delete(id); bump("timeout", s, -1); } return ct(id); };
  for (const name of ["IntersectionObserver", "ResizeObserver", "MutationObserver"]) {
    const C = window[name]; if (!C) continue;
    const obs = C.prototype.observe, dis = C.prototype.disconnect;
    const state = new WeakMap();
    C.prototype.observe = function (...a) { if (!state.has(this)) { const s = site(); state.set(this, s); bump(name, s, 1); } return obs.apply(this, a); };
    C.prototype.disconnect = function () { const s = state.get(this); if (s) { state.delete(this); bump(name, s, -1); } return dis.apply(this); };
  }
  let frames = 0; const raf = requestAnimationFrame;
  window.requestAnimationFrame = function (fn) { frames++; return raf.call(window, fn); };
  window.__leaks = { snapshot: () => [...live.values()].map((e) => ({ ...e })), frames: () => frames };
})();`;

// Runs in the page: clicks a link to `path` (a real one when the page has it, else a temporary one, which goes through
// the same router click handler), then waits for the page module to be mounted and the page to settle.
const GO = String.raw`async (path, module) => {
  let a = [...document.querySelectorAll("a[href]")].find((x) => new URL(x.href).pathname === path && x.getClientRects().length);
  let synthetic = false;
  if (!a) { a = document.createElement("a"); a.href = path; a.hidden = true; document.body.append(a); synthetic = true; }
  a.click();
  if (synthetic) a.remove();
  const t0 = performance.now();
  while (performance.now() - t0 < 10000) {
    if (location.pathname === path && document.getElementById("main")?.dataset.modules === module) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  await new Promise((r) => setTimeout(r, 1500));
  return { ok: location.pathname === path, synthetic };
}`;

// Heap snapshot, summed by node type and name: { "type name": { n, bytes } }.
async function heapSummary(c) {
  let json = "";
  const chunk = (p) => (json += p.chunk);
  c.on("HeapProfiler.addHeapSnapshotChunk", chunk);
  await c.send("HeapProfiler.collectGarbage");
  await c.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false, captureNumericValue: false });
  c.off("HeapProfiler.addHeapSnapshotChunk", chunk);
  const snap = JSON.parse(json);
  const f = snap.snapshot.meta.node_fields;
  const types = snap.snapshot.meta.node_types[0];
  const [iType, iName, iSize] = ["type", "name", "self_size"].map((k) => f.indexOf(k));
  const out = {};
  for (let i = 0; i < snap.nodes.length; i += f.length) {
    const type = types[snap.nodes[i + iType]];
    let name = snap.strings[snap.nodes[i + iName]];
    if (type === "string" || type === "concatenated string" || type === "sliced string") name = "(strings)";
    else if (type === "code") name = "(code)";
    else name = name.slice(0, 80);
    const k = `${type} ${name}`;
    const e = (out[k] ??= { n: 0, bytes: 0 });
    e.n++;
    e.bytes += snap.nodes[i + iSize];
  }
  return out;
}

async function measure(c) {
  for (let i = 0; i < 3; i++) await c.send("HeapProfiler.collectGarbage");
  const heap = await c.send("Runtime.getHeapUsage");
  const dom = await c.send("Memory.getDOMCounters");
  let detached = null;
  try {
    detached = (await c.send("DOM.getDetachedDomNodes")).detachedNodes.length;
  } catch {}
  const listeners = async (expr) => {
    const { result } = await c.send("Runtime.evaluate", { expression: expr });
    const { listeners } = await c.send("DOMDebugger.getEventListeners", { objectId: result.objectId });
    await c.send("Runtime.releaseObject", { objectId: result.objectId });
    return listeners.length;
  };
  return {
    heapMB: +(heap.usedSize / 1048576).toFixed(2),
    nodes: dom.nodes,
    jsListeners: dom.jsEventListeners,
    detached,
    anims: await c.evaluate("document.getAnimations().length"),
    win: await listeners("window"),
    doc: await listeners("document"),
  };
}

async function pass(base, instrumented) {
  const c = await launch();
  try {
    if (instrumented) await c.send("Page.addScriptToEvaluateOnNewDocument", { source: INSTRUMENT });
    await Promise.all([c.send("Runtime.enable"), c.send("DOM.enable"), c.send("HeapProfiler.enable")]);
    let loads = 0;
    let lastNav = "";
    c.on("Page.frameNavigated", (p) => {
      if (!p.frame.parentId) (loads++, (lastNav = p.frame.url));
    });
    await open(c, base + "/");
    const loadsBefore = loads;
    const rows = [];
    const sites = {};
    const heaps = {};
    let synthetic = new Set();
    for (let round = 1; round <= ROUNDS; round++) {
      for (const [path, module] of ROUTE) {
        let r;
        try {
          r = await c.evaluate(`(${GO})(${JSON.stringify(path)}, ${JSON.stringify(module)})`);
        } catch (err) {
          throw new Error(`round ${round}, on the way to ${path}: full page load of ${lastNav} (${err.message})`);
        }
        if (!r.ok) throw new Error(`round ${round}: did not reach ${path}`);
        if (r.synthetic) synthetic.add(path);
      }
      if (loads !== loadsBefore) throw new Error(`round ${round}: full page load of ${lastNav}, so the router fell back`);
      if (instrumented) {
        if (round === 2 || round === ROUNDS) sites[round] = await c.evaluate("window.__leaks.snapshot()");
        if (round === ROUNDS) {
          const f0 = await c.evaluate("window.__leaks.frames()");
          await wait(1000);
          rows.framesPerSecond = (await c.evaluate("window.__leaks.frames()")) - f0;
        }
      } else {
        rows.push({ round, ...(await measure(c)) });
        if (HEAP && (round === 2 || round === ROUNDS)) heaps[round] = await heapSummary(c);
      }
    }
    return { rows, sites, heaps, synthetic: [...synthetic] };
  } finally {
    c.close();
  }
}

const server = await serve("public");
try {
  console.log(`leak check: ${ROUNDS} rounds of / -> ${ROUTE.map((r) => r[0]).join(" -> ")}`);
  const clean = await pass(server.url, false);
  if (clean.synthetic.length) console.log(`no visible link on the way to ${clean.synthetic.join(", ")}; clicked a temporary link instead`);
  console.log("");
  console.log("round  heap MB  dom nodes  js listeners  detached  window  document  animations");
  for (const r of clean.rows)
    console.log(
      `${String(r.round).padStart(5)}  ${r.heapMB.toFixed(2).padStart(7)}  ${String(r.nodes).padStart(9)}  ${String(r.jsListeners).padStart(12)}  ${String(r.detached ?? "n/a").padStart(8)}  ${String(r.win).padStart(6)}  ${String(r.doc).padStart(8)}  ${String(r.anims).padStart(10)}`,
    );
  const a = clean.rows.find((r) => r.round === 2) ?? clean.rows[0];
  const b = clean.rows.at(-1);
  const per = (k) => ((b[k] - a[k]) / Math.max(1, b.round - a.round)).toFixed(2);
  console.log("");
  console.log(
    `round ${a.round} -> ${b.round}: heap ${(b.heapMB - a.heapMB).toFixed(2)} MB (${per("heapMB")}/round), nodes ${b.nodes - a.nodes}, js listeners ${b.jsListeners - a.jsListeners} (${per("jsListeners")}/round), detached ${b.detached == null ? "n/a" : b.detached - a.detached}, window ${b.win - a.win}, document ${b.doc - a.doc}, animations ${b.anims - a.anims}`,
  );

  if (HEAP) {
    const [h2, hN] = [clean.heaps[2], clean.heaps[ROUNDS]];
    const diff = Object.entries(hN)
      .map(([k, e]) => ({ k, n: e.n - (h2[k]?.n ?? 0), bytes: e.bytes - (h2[k]?.bytes ?? 0) }))
      .filter((d) => d.bytes > 0 || d.n > 0)
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 25);
    console.log("");
    console.log(`heap snapshot, round 2 -> ${ROUNDS}, largest growth by type and name:`);
    for (const d of diff) console.log(`  ${String(d.bytes).padStart(8)} B  ${String(d.n).padStart(6)} objects  ${d.k}`);
  }

  const inst = await pass(server.url, true);
  const before = new Map(inst.sites[2].map((e) => [e.kind + " " + e.site, e.n]));
  const grown = inst.sites[ROUNDS]
    .map((e) => ({ ...e, from: before.get(e.kind + " " + e.site) ?? 0 }))
    .filter((e) => e.n > e.from)
    .sort((x, y) => y.n - y.from - (x.n - x.from));
  console.log("");
  console.log(`instrumented pass: live items by call site, round 2 -> ${ROUNDS}; ${inst.rows.framesPerSecond} requestAnimationFrame calls in 1 s at the end`);
  if (!grown.length) console.log("no call site grows");
  for (const e of grown) console.log(`  +${e.n - e.from}  ${e.kind}  ${e.site}  (${e.from} -> ${e.n})`);
  const total = inst.sites[ROUNDS].reduce((n, e) => n + e.n, 0);
  console.log(`live at round ${ROUNDS}: ${total} items at ${inst.sites[ROUNDS].length} call sites`);
  if (process.argv.includes("--list")) for (const e of inst.sites[ROUNDS]) console.log(`  ${e.n}  ${e.kind}  ${e.site}`);
  process.exitCode = grown.length || b.jsListeners > a.jsListeners || (b.detached ?? 0) > (a.detached ?? 0) ? 1 : 0;
} finally {
  server.close();
}
