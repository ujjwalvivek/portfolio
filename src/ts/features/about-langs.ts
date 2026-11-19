// Languages tide (v3 LangsBar, redrawn): bytes of code per language across Vivek's repositories, from echopoint's
// /v1/langv2, the presentation-ranked aggregate. Only its first category, Languages: frameworks and esolangs are left out
// with the same lists echopoint's languageDisplay profile uses (echopoint src/config.js). The six biggest and "Other".
//
// Drawn as pixels, like root's heatmap: square cells with even gaps on a canvas. Each language owns the columns across
// its share of bytes; a column stands as tall as the tide there, in whole cells, and its top cell is lit in the accent.
// The surface eases between band heights and swells slowly, stepped at 12 frames a second so it moves like pixel water
// (held still with reduced motion, paused off screen). Pointing at a band or a legend entry lights both and shows the
// share above the tide. If echopoint does not answer, the legend stays at "-" and the first slot says so.

import { reducedMotion } from "../lib/store.js";

const URL_LANGS = "https://echopoint.ujjwalvivek.com/v1/langv2";
const TOP = 6;
const FRAMEWORKS = new Set([
  "Astro", "Svelte", "Vue", "Angular", "React", "Next.js", "Nuxt", "Remix", "Solid", "Qwik", "Ember", "Marko", "Jinja",
  "Handlebars", "Liquid", "Twig", "Blade", "Razor", "Pug", "EJS", "ERB", "Haml",
]);
const ESOLANGS = new Set(["Brainfuck"]);
const CELL = 6; // px per pixel slot; the lit square sits inside it with a gap all round
const GAP = 1;
const STEP_MS = 1000 / 12;

type Item = { lang: string; bytes: number; pct: number };
let cached: Promise<Item[]> | null = null;

function items(): Promise<Item[]> {
  cached ??= fetch(URL_LANGS)
    .then((r) => {
      if (!r.ok) throw new Error(`langs ${r.status}`);
      return r.json() as Promise<Record<string, number>>;
    })
    .then((data) => {
      const sorted = Object.entries(data)
        .filter(([lang, b]) => typeof b === "number" && b > 0 && !FRAMEWORKS.has(lang) && !ESOLANGS.has(lang))
        .sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((s, [, b]) => s + b, 0);
      if (!total) throw new Error("langs empty");
      const top = sorted.slice(0, TOP);
      const other = sorted.slice(TOP).reduce((s, [, b]) => s + b, 0);
      if (other > 0) top.push(["Other", other]);
      return top.map(([lang, bytes]) => ({ lang, bytes, pct: (bytes / total) * 100 }));
    });
  cached.catch(() => (cached = null));
  return cached;
}

export function mount(host: HTMLElement): () => void {
  const found = host.querySelector<HTMLElement>("[data-ab-bar]");
  const rows = [...host.querySelectorAll<HTMLElement>(".ab-lang")];
  if (!found) return () => {};
  const bar: HTMLElement = found;
  const canvas = document.createElement("canvas");
  canvas.className = "ab-tide";
  bar.replaceChildren(canvas);
  const ctx = canvas.getContext("2d");
  const ac = new AbortController();
  const signal = ac.signal;
  let tip: HTMLElement | null = null;
  let list: Item[] = [];
  let spans: { x0: number; x1: number; h: number }[] = [];
  let active: number | null = null;
  let frame = 0;
  let last = 0;
  let visible = true;
  let shades: string[] = [];
  let crest = "";

  const light = (i: number | null) => {
    active = i;
    rows.forEach((r, j) => r.classList.toggle("is-active", j === i));
    draw(performance.now());
    const item = i == null ? undefined : list[i];
    if (!item || i == null) {
      tip?.remove();
      tip = null;
      return;
    }
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "ab-langs-tip";
      tip.setAttribute("aria-hidden", "true");
      bar.append(tip);
    }
    const sw = document.createElement("i");
    sw.className = "ab-swatch";
    sw.style.setProperty("--s", String(i));
    const name = document.createElement("b");
    name.textContent = item.lang;
    const pct = document.createElement("span");
    pct.textContent = `${item.pct.toFixed(1)}%`;
    tip.replaceChildren(sw, name, pct);
    // centred over its band, kept inside the bar
    const span = spans[i]!;
    const left = ((span.x0 + span.x1) / 2) * bar.clientWidth;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.min(bar.clientWidth - half, Math.max(half, left))}px`;
  };

  // The band colours are the legend swatches' own (shades of the accent, so they follow the palette and its drift).
  function readColours(): void {
    shades = rows.map((r) => getComputedStyle(r.querySelector(".ab-swatch")!).backgroundColor);
    crest = getComputedStyle(host).getPropertyValue("--dynamic-dominant-color").trim() || "#fff";
  }

  // The tide's surface at x (0..1): a cosine ease between band centres, plus a slow travelling swell.
  function surface(x: number, t: number): number {
    const c = spans.map((s) => ({ x: (s.x0 + s.x1) / 2, h: s.h }));
    let h = c[0]!.h;
    if (x >= c[c.length - 1]!.x) h = c[c.length - 1]!.h;
    else
      for (let i = 0; i < c.length - 1; i++) {
        const a = c[i]!;
        const b = c[i + 1]!;
        if (x >= a.x && x <= b.x) {
          h = a.h + (b.h - a.h) * ((1 - Math.cos(((x - a.x) / (b.x - a.x)) * Math.PI)) / 2);
          break;
        }
      }
    const swell = 0.07 * Math.sin(t * 0.0011 - x * 9) + 0.04 * Math.sin(t * 0.0007 + x * 17);
    return Math.max(0, Math.min(1, h + swell));
  }

  function draw(t: number): void {
    if (!ctx || !spans.length) return;
    const dpr = Math.max(1, Math.round(devicePixelRatio || 1));
    const w = bar.clientWidth;
    const h = bar.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cols = Math.floor(w / CELL);
    const rowsN = Math.max(1, Math.floor(h / CELL));
    const ox = Math.floor((w - cols * CELL) / 2);
    const oy = h - rowsN * CELL;
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) / cols;
      const found = spans.findIndex((s) => x >= s.x0 && x < s.x1);
      const b = found < 0 ? spans.length - 1 : found;
      const n = Math.max(1, Math.round(surface(x, t) * rowsN));
      ctx.globalAlpha = active == null || active === b ? 1 : 0.3;
      for (let r = 0; r < n; r++) {
        ctx.fillStyle = r === n - 1 ? crest : shades[b] ?? crest;
        ctx.fillRect(ox + c * CELL + GAP, oy + (rowsN - 1 - r) * CELL + GAP, CELL - GAP * 2, CELL - GAP * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(t: number): void {
    frame = 0;
    if (signal.aborted || !visible) return;
    if (t - last >= STEP_MS) {
      // the palette drifts, so the colours are read again every half second
      if (Math.floor(t / 500) !== Math.floor(last / 500)) readColours();
      last = t;
      draw(t);
    }
    frame = requestAnimationFrame(tick);
  }

  items().then(
    (got) => {
      if (signal.aborted) return;
      list = got;
      const total = got.reduce((s, it) => s + it.bytes, 0);
      const max = Math.max(...got.map((it) => it.pct));
      let x = 0;
      spans = got.map((it) => {
        const x0 = x;
        x += it.bytes / total;
        // a floor so the smallest band still stands a cell or two above the bed
        return { x0, x1: x, h: 0.25 + 0.75 * (it.pct / max) };
      });
      rows.forEach((r, i) => {
        const it = got[i];
        r.hidden = !it;
        if (!it) return;
        r.querySelector(".ab-lang-name")!.textContent = it.lang;
        r.querySelector(".ab-lang-pct")!.textContent = `${it.pct.toFixed(1)}%`;
      });
      host.classList.add("is-live");
      readColours();
      draw(0);
      bar.addEventListener(
        "pointermove",
        (e) => {
          const r = bar.getBoundingClientRect();
          const at = (e.clientX - r.left) / r.width;
          const i = spans.findIndex((s) => at >= s.x0 && at < s.x1);
          if ((i < 0 ? null : i) !== active) light(i < 0 ? null : i);
        },
        { signal },
      );
      bar.addEventListener("pointerleave", () => light(null), { signal });
      rows.forEach((r, i) => {
        r.addEventListener("pointerenter", () => light(i), { signal });
        r.addEventListener("pointerleave", () => light(null), { signal });
      });
      const ro = new ResizeObserver(() => draw(performance.now()));
      ro.observe(bar);
      signal.addEventListener("abort", () => ro.disconnect());
      if (!reducedMotion()) {
        const io = new IntersectionObserver(([e]) => {
          visible = !!e?.isIntersecting;
          if (visible && !frame) frame = requestAnimationFrame(tick);
        });
        io.observe(bar);
        signal.addEventListener("abort", () => io.disconnect());
      }
    },
    (err: unknown) => {
      console.warn("languages unavailable:", err);
      if (signal.aborted) return;
      const first = rows[0]?.querySelector(".ab-lang-name");
      if (first) first.textContent = "unavailable";
    },
  );

  return () => {
    ac.abort();
    cancelAnimationFrame(frame);
    tip?.remove();
  };
}
