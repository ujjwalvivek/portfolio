// The easter egg's door (v3 EasterEgg): a near-invisible line at the bottom of the page, with a "Click me :)" tip that
// follows the cursor. Clicking it swaps the line for the hidden terminal, whose module and styles load only then.

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
