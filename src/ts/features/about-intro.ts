// About intro (v3 IntroText): the prompt's version segment is Vivek's age as v{years}.{mm}.{dd}, the uptime counts from
// 2023-02-04 every second, and the words fade in once in reading order (v3's per-word glow, without the glow). Only
// text nodes change, never the tree around them.

const BIRTH = new Date("1997-09-21T00:00:00Z");
const BOOT = Date.parse("2023-02-04T00:00:00Z");
const STEP_CAP = 90; // words past this many share the last delay, so the whole reveal is over in under 2 s

function age(now: Date): { y: number; m: number; d: number } {
  let y = now.getFullYear() - BIRTH.getFullYear();
  let m = now.getMonth() - BIRTH.getMonth();
  let d = now.getDate() - BIRTH.getDate();
  if (d < 0) {
    d += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    m -= 1;
  }
  if (m < 0) {
    m += 12;
    y -= 1;
  }
  return { y, m, d };
}

function uptime(now: number): string {
  const s = Math.max(0, Math.floor((now - BOOT) / 1000));
  return `${Math.floor(s / 86400)}d ${Math.floor(s / 3600) % 24}h ${Math.floor(s / 60) % 60}m ${s % 60}s`;
}

// Wraps every word of every text node under `el` in a span carrying its reading-order index.
function wrapWords(el: Element, counter: { n: number }): void {
  for (const node of [...el.childNodes]) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (!(node as Element).hasAttribute("data-ab-uptime")) wrapWords(node as Element, counter);
      continue;
    }
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const parts = (node.textContent ?? "").split(/(\s+)/);
    if (!parts.some((p) => p.trim())) continue;
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part.trim()) {
        if (part) frag.append(part);
        continue;
      }
      const w = document.createElement("span");
      w.className = "ab-w";
      w.style.setProperty("--i", String(Math.min(counter.n++, STEP_CAP)));
      w.textContent = part;
      frag.append(w);
    }
    node.replaceWith(frag);
  }
}

export function mount(root: HTMLElement): () => void {
  const intro = root.querySelector<HTMLElement>("[data-ab-intro]");
  if (!intro) return () => {};
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const counter = { n: 0 };
    for (const out of intro.querySelectorAll(".ab-out")) wrapWords(out, counter);
  }

  const stamps = [...intro.querySelectorAll<HTMLElement>("[data-ab-age]")];
  const clock = intro.querySelector<HTMLElement>("[data-ab-uptime]");
  let day = "";
  const tick = () => {
    const now = new Date();
    if (clock) clock.textContent = uptime(now.getTime());
    const { y, m, d } = age(now);
    const stamp = `v${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
    if (stamp === day) return;
    day = stamp;
    for (const s of stamps) {
      s.textContent = stamp;
      s.title = `${y}y ${m}m ${d}d`;
    }
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}
