// The first-visit command hint (v3's CommandHint; Q-07). It shows as soon as the shell runs, with no delay (D-024),
// and only on the first visit. It goes for good when dismissed or when the palette is used; otherwise it stays for the
// visit and is marked seen when the visitor leaves, so it never returns on a later load (a reload within the first
// three seconds still gets it). Quieter than v3's: no slide-in, no countdown bar, low contrast, and it sits in the
// empty band under the top bar and scrolls away with the page, so it never covers content. Touch-only devices (no
// keyboard) don't get it, and don't use up their one showing.

import { keycaps } from "../shell/keymap.js";
import { load, save } from "../lib/store.js";

const KEY = "hint-seen";
const CSS = "/css/features/command-hint.css";
let el: HTMLElement | null = null;

export function dismissHint(): void {
  save(KEY, true);
  if (!el) return;
  const gone = el;
  el = null;
  gone.classList.remove("is-shown");
  const remove = () => gone.remove();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) remove();
  else {
    gone.addEventListener("transitionend", remove, { once: true });
    setTimeout(remove, 400); // in case no transition runs (hidden tab)
  }
}

export function startHint(openPalette: () => void): void {
  if (load(KEY, false) || matchMedia("(hover: none) and (pointer: coarse)").matches) return;

  const hint = document.createElement("aside");
  hint.className = "cmd-hint";
  hint.setAttribute("aria-label", "Tip");
  const open = document.createElement("button");
  open.type = "button";
  open.className = "cmd-hint-open";
  open.innerHTML = `<svg class="icon" aria-hidden="true"><use href="/icons.svg#fi-command"/></svg><span>press</span>`;
  for (const k of keycaps("palette")) {
    const kbd = document.createElement("kbd");
    kbd.textContent = k;
    open.append(kbd);
  }
  open.append(Object.assign(document.createElement("span"), { textContent: "for the command palette" }));
  open.addEventListener("click", () => openPalette());
  const close = document.createElement("button");
  close.type = "button";
  close.className = "cmd-hint-x";
  close.setAttribute("aria-label", "Dismiss tip");
  close.textContent = "×";
  close.addEventListener("click", dismissHint);
  hint.append(open, close);
  hint.hidden = true; // until its few lines of CSS are in

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS;
  link.onload = () => {
    if (el !== hint) return;
    hint.hidden = false;
    requestAnimationFrame(() => hint.classList.add("is-shown"));
  };
  document.head.append(link);
  document.body.append(hint);
  el = hint;
  const shown = performance.now();
  addEventListener("pagehide", () => {
    if (el === hint && performance.now() - shown > 3000) save(KEY, true);
  });
}
