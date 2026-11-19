// The easter egg's door (v3 EasterEgg): a near-invisible line at the bottom of the page, with a "Click me :)" tip that
// follows the cursor. The line glows and blinks as in v3; its styles live with the terminal's in about-egg.css, which
// loads once the page is idle. Clicking the line swaps it for the hidden terminal, whose module loads only then.

import { loadFeature } from "../lib/lazy.js";

const TERMINAL = "/js/features/about-egg.js";
const STYLES = ["/css/features/about-egg.css"];

export function mount(root: HTMLElement): () => void {
  const host = root.querySelector<HTMLElement>("[data-ab-egg]");
  const key = host?.querySelector<HTMLButtonElement>("[data-ab-egg-open]");
  if (!host || !key) return () => {};
  const ac = new AbortController();
  const signal = ac.signal;
  let tip: HTMLElement | null = null;
  let undo: void | (() => void);
  let gone = false;

  // wrap the text so the glow and blink sit on the glyphs while the button keeps its own fade and flicker
  if (!key.querySelector(".ab-egg-glyphs")) {
    const glyphs = document.createElement("span");
    glyphs.className = "ab-egg-glyphs";
    glyphs.append(...key.childNodes);
    key.append(glyphs);
  }
  const idle = typeof requestIdleCallback === "function" ? requestIdleCallback : (fn: () => void) => setTimeout(fn, 1500);
  idle(() => {
    if (gone || document.querySelector(`link[href="${STYLES[0]}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLES[0]!;
    document.head.append(link);
  });

  const hideTip = () => {
    tip?.remove();
    tip = null;
  };
  key.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      if (!tip) {
        tip = document.createElement("span");
        tip.className = "ab-egg-tip";
        tip.textContent = "Click me :)";
        tip.setAttribute("aria-hidden", "true");
        document.body.append(tip);
      }
      tip.style.left = `${e.clientX + 8}px`;
      tip.style.top = `${e.clientY + 8}px`;
    },
    { signal },
  );
  key.addEventListener("pointerleave", hideTip, { signal });

  key.addEventListener(
    "click",
    () => {
      hideTip();
      key.disabled = true;
      loadFeature(TERMINAL, STYLES)
        .then((m) => {
          if (gone) return;
          host.classList.add("is-open");
          undo = m.mount(host);
        })
        .catch((err: unknown) => {
          console.error("easter egg terminal failed to load:", err);
          key.disabled = false;
        });
    },
    { signal },
  );

  return () => {
    gone = true;
    ac.abort();
    hideTip();
    if (typeof undo === "function") undo();
  };
}
