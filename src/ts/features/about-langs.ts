// Languages tide (v3 LangsBar, redrawn): bytes of code per language across Vivek's repositories, from echopoint's /v1/langs.
// The six biggest and "Other", as v3 showed them. Each language is a band as wide as its share of bytes and as tall as
// its share against the biggest; the band tops join in one smooth curve, and the curve swells slowly like water (held
// still with reduced motion, paused off screen). Pointing at a band or a legend entry lights both and shows the share
// above the tide. If echopoint does not answer, the legend stays at "-" and the first slot says so.

import { reducedMotion } from "../lib/store.js";

const URL_LANGS = "https://echopoint.ujjwalvivek.com/v1/langs";
const TOP = 6;

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
        .filter(([, b]) => typeof b === "number" && b > 0)
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
  const bar = host.querySelector<HTMLElement>("[data-ab-bar]");
  const rows = [...host.querySelectorAll<HTMLElement>(".ab-lang")];
  if (!bar) return () => {};
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "ab-tide");
  svg.setAttribute("viewBox", "0 0 1000 100");
  svg.setAttribute("preserveAspectRatio", "none");
  bar.replaceChildren(svg);
  let segs: SVGPathElement[] = [];
  let spans: { x0: number; x1: number; h: number }[] = [];
  let frame = 0;
  let visible = true;
  const ac = new AbortController();
  const signal = ac.signal;
  let tip: HTMLElement | null = null;
  let list: Item[] = [];

  const light = (i: number | null) => {
    segs.forEach((s, j) => s.classList.toggle("is-active", j === i));
    rows.forEach((r, j) => r.classList.toggle("is-active", j === i));
    const item = i == null ? undefined : list[i];
    const seg = i == null ? undefined : segs[i];
    if (!item || !seg) {
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
    const span = spans[i as number]!;
    const left = ((span.x0 + span.x1) / 2) * bar.clientWidth;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.min(bar.clientWidth - half, Math.max(half, left))}px`;
  };

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
        // a floor of 18% so the smallest band still reads as water, not a line
        return { x0, x1: x, h: 0.18 + 0.82 * (it.pct / max) };
      });
      segs = got.map(() => {
        const path = document.createElementNS(NS, "path");
        path.setAttribute("class", "ab-bar-seg");
        svg.append(path);
        return path;
      });
      draw(0);
      if (!reducedMotion()) {
        const io = new IntersectionObserver(([e]) => {
          visible = !!e?.isIntersecting;
          if (visible && !frame) frame = requestAnimationFrame(tick);
        });
        io.observe(bar);
        signal.addEventListener("abort", () => io.disconnect());
      }
      rows.forEach((r, i) => {
        const it = got[i];
        r.hidden = !it;
        if (!it) return;
        r.querySelector(".ab-lang-name")!.textContent = it.lang;
        r.querySelector(".ab-lang-pct")!.textContent = `${it.pct.toFixed(1)}%`;
      });
      host.classList.add("is-live");
      segs.forEach((s, i) => s.addEventListener("pointerenter", () => light(i), { signal }));
      rows.forEach((r, i) => {
        r.addEventListener("pointerenter", () => light(i), { signal });
        r.addEventListener("pointerleave", () => light(null), { signal });
      });
      bar.addEventListener("pointerleave", () => light(null), { signal });
    },
    (err: unknown) => {
      console.warn("about: languages unavailable:", err);
      if (signal.aborted) return;
      const first = rows[0]?.querySelector(".ab-lang-name");
      if (first) first.textContent = "unavailable";
    },
  );

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
          const k = (1 - Math.cos(((x - a.x) / (b.x - a.x)) * Math.PI)) / 2;
          h = a.h + (b.h - a.h) * k;
          break;
        }
      }
    const swell = 0.045 * Math.sin(t * 0.0011 - x * 9) + 0.025 * Math.sin(t * 0.0007 + x * 17);
    return Math.max(0.08, Math.min(1, h + swell));
  }

  // The SVG is 1000 by 100 units, stretched to the bar; each band is the area under the surface across its span.
  function draw(t: number): void {
    spans.forEach((s, i) => {
      const steps = Math.max(2, Math.ceil((s.x1 - s.x0) * 60));
      let d = `M${(s.x0 * 1000).toFixed(1)} 100`;
      for (let k = 0; k <= steps; k++) {
        const x = s.x0 + ((s.x1 - s.x0) * k) / steps;
        d += ` L${(x * 1000).toFixed(1)} ${(100 - surface(x, t) * 100).toFixed(2)}`;
      }
      segs[i]!.setAttribute("d", d + ` L${(s.x1 * 1000).toFixed(1)} 100 Z`);
    });
  }

  function tick(t: number): void {
    frame = 0;
    if (signal.aborted || !visible) return;
    draw(t);
    frame = requestAnimationFrame(tick);
  }

  return () => {
    ac.abort();
    cancelAnimationFrame(frame);
    tip?.remove();
  };
}
