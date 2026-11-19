// The crash screen (v3 SystemError/CrashOverlay): what "run exit" does in the about page's terminal and in the command
// palette. It takes the whole window and stays until the page reloads, as in v3: the close key refuses ("Nice try!
// Try Harder."), minimise opens DuckDuckGo, restart reloads, the bug key writes to Vivek. v3 never let Esc out either;
// here Esc gets the same refusal as the close key. The right-click menu is off and the console gets v3's note.
//
// Restyled to the design system: v3's mac-style coloured dots become three keycaps that keep their jokes, the outlined
// red headline is drawn with a text stroke in the error colour (this screen is an error), and the green glow on the
// footer is gone. The page underneath is made inert and the site's shortcuts are held, so nothing reacts behind it.

import { loadFeature } from "../lib/lazy.js";

const CSS = "/css/features/crash.css";
const MAIL = "mailto:hello@ujjwalvivek.com";
let shown = false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function crash(reason?: string): void {
  if (shown) return;
  shown = true;
  // the stylesheet first, a few ms on the first crash, so the screen never draws unstyled
  void loadFeature(import.meta.url, [CSS])
    .catch(() => {})
    .finally(() => show(reason));
}

function show(reason?: string): void {
  const root = el("div", "crash");
  root.setAttribute("role", "alertdialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "crash-main");
  root.setAttribute("aria-describedby", "crash-sub");
  root.dataset.keys = "off";

  const win = el("div", "crash-window");
  win.tabIndex = -1;
  const bar = el("div", "crash-bar");
  const keys = el("div", "crash-keys");
  const key = (label: string, title: string, cls = "") => {
    const b = el("button", `crash-key ${cls}`.trim(), label);
    b.type = "button";
    b.title = title;
    return b;
  };
  const closeKey = key("close", "You wouldn't", "is-close");
  const minKey = key("minimise", "Embrace Privacy!");
  const restartKey = key("restart", "Refresh button for the curious.", "is-restart");
  keys.append(closeKey, minKey, restartKey);
  const title = el("span", "crash-title", "uh oh!");
  const bug = el("a", "crash-bug");
  bug.href = MAIL;
  bug.target = "_blank";
  bug.rel = "noopener noreferrer";
  bug.title = "Send Feedback/Report or Just Say Hi";
  bug.setAttribute("aria-label", "Send feedback, a report, or just say hi");
  bug.innerHTML = '<svg class="icon" aria-hidden="true"><use href="/icons.svg#md-outline-bug-report"/></svg>';
  bar.append(keys, title, bug);

  const content = el("div", "crash-content");
  const nope = el("div", "crash-nope", "Nice try! Try Harder.");
  nope.setAttribute("role", "status");
  nope.hidden = true;
  const main = el("div", "crash-main");
  main.id = "crash-main";
  main.append(el("span", "crash-blink", "> session.crashed"), el("span", "crash-caret", " _"));
  const sub = el("div", "crash-sub", "logs flushed. session configurations saved. play the game.");
  sub.id = "crash-sub";
  const dino = el("div", "crash-dino crash-flicker", "If you have arrived here in search of the Dino, he has moved on to greener pastures. He's one with the logs now.");
  content.append(nope, main, sub);
  if (reason) content.append(el("div", "crash-reason", `exit reason: ${reason}`));
  content.append(dino);

  const foot = el("div", "crash-foot");
  foot.append(el("div", "crash-foot-text crash-flicker", "ujjwalvivek.com ⊗ no trackers ⊗ no cookies ⊗ no analytics"));
  win.append(bar, content, foot);
  root.append(win);

  // ---- behaviour, as v3 ------------------------------------------------------------------------------------------
  let nopeTimer = 0;
  const refuse = () => {
    nope.hidden = false;
    nope.classList.remove("is-shaking");
    void nope.offsetWidth; // restart the shake on a repeat press
    nope.classList.add("is-shaking");
    window.clearTimeout(nopeTimer);
    nopeTimer = window.setTimeout(() => (nope.hidden = true), 800);
  };
  closeKey.addEventListener("click", refuse);
  minKey.addEventListener("click", () => window.open("https://duckduckgo.com", "_blank", "noopener"));
  restartKey.addEventListener("click", () => location.reload());
  root.addEventListener("contextmenu", (e) => e.preventDefault());

  // Hold the site's keys while crashed: Esc is refused, Tab stays inside, Enter and Space work the keys, and the
  // browser's own reload (F5, Ctrl+R) still goes through, being the honest way out.
  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      refuse();
      return;
    }
    if (k === "F5" || ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "r")) return;
    if (k === "Tab") {
      const stops = [closeKey, minKey, restartKey, bug];
      const at = stops.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      e.stopImmediatePropagation();
      const next = at < 0 ? (e.shiftKey ? stops.length - 1 : 0) : (at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length;
      stops[next]!.focus();
      return;
    }
    if ((k === "Enter" || k === " ") && root.contains(e.target as Node)) return;
    e.stopImmediatePropagation();
    if (e.ctrlKey || e.metaKey || k.length === 1 || k.startsWith("Arrow") || k.startsWith("Page") || k === "Home" || k === "End") e.preventDefault();
  };
  document.addEventListener("keydown", onKey, true);

  for (const child of document.body.children) if (child !== root && child instanceof HTMLElement) child.inert = true;
  document.body.append(root);
  document.documentElement.classList.add("is-crashed");
  win.focus({ preventScroll: true });
  console.log("Welcome curious dev. You found the logs under the logs. Just refresh the page and it should restart.");
}
