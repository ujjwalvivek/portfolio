// The home intro (v3 IntroTextHomepage). Words light in one by one (v3's letter-glow, now a CSS animation with staggered
// delays), and the prompt's version segment is Vivek's age as v{years}.{mm}.{dd}, refreshed once a minute.

const BIRTH = new Date("1997-09-21T00:00:00Z");

function age(now = new Date()): { y: number; m: number; d: number } {
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

function splitWords(el: HTMLElement, step: number, start: number): number {
  const words = (el.textContent ?? "").split(/(\s+)/);
  el.textContent = "";
  let i = start;
  for (const w of words) {
    if (!w.trim()) {
      el.append(w);
      continue;
    }
    const span = document.createElement("span");
    span.className = "word";
    span.style.animationDelay = `${(i++ * step).toFixed(2)}s`;
    span.textContent = w;
    el.append(span);
  }
  return i;
}

export function mount(root: HTMLElement): () => void {
  const intro = root.querySelector<HTMLElement>("[data-intro]");
  if (!intro) return () => {};
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let n = 0;
    for (const line of intro.querySelectorAll<HTMLElement>(".intro-out p")) {
      for (const part of line.querySelectorAll<HTMLElement>(".glow, .hl")) n = splitWords(part, part.classList.contains("hl") ? 0.02 : 0.08, n);
    }
  }
  const stamp = intro.querySelector<HTMLElement>("[data-age]");
  const tick = () => {
    if (!stamp) return;
    const { y, m, d } = age();
    stamp.textContent = `v${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
    stamp.title = `${y}y ${m}m ${d}d`;
  };
  tick();
  const timer = setInterval(tick, 60_000);
  return () => clearInterval(timer);
}
