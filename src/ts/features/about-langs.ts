// Languages bar (v3 LangsBar): bytes of code per language across Vivek's repositories, from echopoint's /v1/langs.
// The six biggest and "Other", as v3 showed them, into the seven segments and legend slots the HTML already holds.
// Pointing at a segment or a legend entry lights both and shows the share above the bar. If echopoint does not
// answer, the slots stay at "-" and the first one says so; v3 dropped the whole block instead.

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
  const segs = [...host.querySelectorAll<HTMLElement>(".ab-bar-seg")];
  const rows = [...host.querySelectorAll<HTMLElement>(".ab-lang")];
  if (!bar) return () => {};
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
    // centred over its segment, kept inside the bar
    const left = seg.offsetLeft + seg.offsetWidth / 2;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.min(bar.clientWidth - half, Math.max(half, left))}px`;
  };

  items().then(
    (got) => {
      if (signal.aborted) return;
      list = got;
      segs.forEach((s, i) => {
        const it = got[i];
        s.hidden = !it;
        if (it) s.style.flex = `${it.bytes} 1 0`;
      });
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

  return () => {
    ac.abort();
    tip?.remove();
  };
}
