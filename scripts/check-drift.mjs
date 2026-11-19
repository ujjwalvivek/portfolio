// Drift jank check (docs/ADR.md R-08, section 11.4). Local only, needs a Chromium-based browser (see check-cdp.mjs).
// Counts style.setProperty calls on <html> on a long page: 3 s at rest, then 3 s of programmatic scrolling (a step
// every frame). Passes when, at rest, writes come in bursts at least 100 ms apart, and while scrolling, after the
// first scroll event and until scrolling stops, there are none.
//
// node scripts/check-drift.mjs [path=/blog/log_0003_going_open_source/]   (after npm run build)
import { launch, open, serve } from "./check-cdp.mjs";

const PATH = process.argv[2] ?? "/blog/log_0003_going_open_source/";
const STEP_MS = 100;

const INSTRUMENT = String.raw`(() => {
  const log = [];
  // Drift throttles on the frame timestamp rAF hands it, so writes are timed by the frame they ran in.
  let frameTs = 0;
  const raf = requestAnimationFrame;
  window.requestAnimationFrame = (fn) => raf.call(window, (ts) => { frameTs = ts; return fn(ts); });
  const set = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function (name, ...rest) {
    if (this === document.documentElement.style) {
      const line = (new Error().stack || "").split("\n").slice(2).find((l) => /\/js\//.test(l)) || "";
      const m = line.match(/(\/js\/[^\s)]+)/);
      log.push({ t: performance.now(), frame: frameTs, name, site: m ? m[1].replace(/:\d+:\d+$/, "") : "?" });
    }
    return set.call(this, name, ...rest);
  };
  window.__drift = log;
})();`;

const RUN = String.raw`(async () => {
  const log = window.__drift;
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  scrollTo(0, 0);
  await sleep(500);
  const rest0 = performance.now();
  let frames = 0;
  while (performance.now() - rest0 < 3000) { await frame(); frames++; }
  const rest1 = performance.now();
  const scrolls = [];
  addEventListener("scroll", () => scrolls.push(performance.now()), { capture: true, passive: true });
  const max = document.documentElement.scrollHeight - innerHeight;
  let dir = 1;
  const scroll0 = performance.now();
  while (performance.now() - scroll0 < 3000) {
    if (scrollY >= max - 10) dir = -1; else if (scrollY <= 0) dir = 1;
    scrollBy(0, dir * 12);
    await frame();
  }
  const scroll1 = performance.now();
  await sleep(600);
  return { log: log.slice(), rest0, rest1, scroll0, scroll1, scrolls, frames, max };
})()`;

// setProperty calls from one write land in one task; calls less than 5 ms apart are one burst.
function bursts(log) {
  const out = [];
  for (const e of log) {
    const last = out.at(-1);
    if (last && e.t - last.end < 5) {
      last.end = e.t;
      last.n++;
      last.sites.add(e.site);
    } else out.push({ start: e.t, frame: e.frame, end: e.t, n: 1, sites: new Set([e.site]) });
  }
  return out;
}

const server = await serve("public");
const c = await launch();
try {
  await c.send("Page.addScriptToEvaluateOnNewDocument", { source: INSTRUMENT });
  await open(c, server.url + PATH);
  const r = await c.evaluate(RUN);
  if (r.max < 1000) throw new Error(`${PATH} is too short to scroll (${r.max}px)`);
  const all = bursts(r.log);
  const rest = all.filter((b) => b.start >= r.rest0 && b.start < r.rest1);
  const gaps = rest.slice(1).map((b, i) => b.frame - rest[i].frame);
  const firstScroll = r.scrolls[0] ?? r.scroll0;
  const lastScroll = r.scrolls.at(-1) ?? r.scroll1;
  const during = all.filter((b) => b.start > firstScroll && b.start <= lastScroll);
  const window0 = all.filter((b) => b.start >= r.scroll0 && b.start <= firstScroll);
  const after = all.filter((b) => b.start > lastScroll);
  const sites = [...new Set(r.log.map((e) => e.site))];
  const fps = (r.frames / ((r.rest1 - r.rest0) / 1000)).toFixed(0);

  console.log(`drift check on ${PATH} (${fps} frames/s at rest; ${r.scrolls.length} scroll events in ${((r.scroll1 - r.scroll0) / 1000).toFixed(1)} s)`);
  console.log(`writers to <html> style: ${sites.join(", ") || "none"}`);
  console.log(
    `at rest, 3 s: ${rest.length} writes, ${rest.reduce((n, b) => n + b.n, 0)} setProperty calls, ` +
      `gap between frame timestamps min ${gaps.length ? Math.min(...gaps).toFixed(0) : "-"} ms, median ${gaps.length ? gaps.sort((a, b) => a - b)[gaps.length >> 1].toFixed(0) : "-"} ms`,
  );
  console.log(`scrolling: ${window0.length} write(s) before the first scroll event, ${during.length} while scrolling (${during.reduce((n, b) => n + b.n, 0)} setProperty calls)`);
  const resume = after[0] ? (after[0].start - lastScroll).toFixed(0) + " ms after the last scroll event" : "not within 600 ms";
  console.log(`after scrolling stops: first write ${resume}`);

  const ok = during.length === 0 && (gaps.length === 0 || Math.min(...gaps) >= STEP_MS - 1);
  console.log(ok ? "pass" : "FAIL");
  process.exitCode = ok ? 0 : 1;
} finally {
  c.close();
  server.close();
}
