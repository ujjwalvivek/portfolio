// Overlays (tech stack, vibe switch, shortcut sheet, later the command palette). One at a time is the normal case, but
// they stack; Esc and a click outside close the top one. Focus returns to where it was.

export type OverlaySpec = {
  id: string;
  title: string;
  icon?: string;
  build(body: HTMLElement, close: () => void): void | (() => void);
  foot?(foot: HTMLElement, close: () => void): void;
  wide?: boolean;
};

type Open = { id: string; el: HTMLElement; close: () => void };
const stack: Open[] = [];

// What Tab can reach inside an overlay, in order.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
function tabbable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest("[inert], [hidden]") && el.getClientRects().length > 0,
  );
}

// While an overlay is open, Tab and Shift+Tab cycle inside the top one, and focus that lands outside it is pulled back.
let trapping = false;
function trap(): void {
  if (trapping) return;
  trapping = true;
  document.addEventListener(
    "keydown",
    (e) => {
      const top = stack.at(-1);
      if (e.key !== "Tab" || !top || e.defaultPrevented) return;
      const card = top.el.querySelector<HTMLElement>(".overlay-card") ?? top.el;
      const list = tabbable(card);
      if (!list.length) {
        e.preventDefault();
        card.focus({ preventScroll: true });
        return;
      }
      const at = list.indexOf(document.activeElement as HTMLElement);
      const inside = card.contains(document.activeElement);
      if (e.shiftKey && (!inside || at <= 0)) {
        e.preventDefault();
        list.at(-1)!.focus();
      } else if (!e.shiftKey && (at === list.length - 1 || !inside)) {
        e.preventDefault();
        list[0]!.focus();
      }
    },
    true,
  );
  document.addEventListener("focusin", (e) => {
    const top = stack.at(-1);
    const target = e.target as Node | null;
    if (!top || !target || top.el.contains(target)) return;
    // another layer (the crash screen, a lightbox) may sit above the overlays; leave its focus alone
    const modal = (target as Element).closest?.('[aria-modal="true"]');
    if (modal && !modal.closest(".overlay")) return;
    (top.el.querySelector<HTMLElement>(".overlay-card") ?? top.el).focus({ preventScroll: true });
  });
}

export function isOpen(id: string): boolean {
  return stack.some((o) => o.id === id);
}

export function closeTop(): boolean {
  const top = stack.at(-1);
  if (!top) return false;
  top.close();
  return true;
}

export function openOverlay(spec: OverlaySpec): void {
  if (isOpen(spec.id)) return closeOverlay(spec.id);
  const returnFocus = document.activeElement as HTMLElement | null;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  // the bars' heights, so a tall card can sit exactly between the top bar and the status bar
  const barH = (sel: string) => `${Math.round(document.querySelector(sel)?.getBoundingClientRect().height ?? 0)}px`;
  overlay.style.setProperty("--top-h", barH(".topbar"));
  overlay.style.setProperty("--bottom-h", barH(".statusbar"));
  const card = document.createElement("div");
  card.className = "overlay-card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-label", spec.title);
  card.tabIndex = -1;

  const head = document.createElement("div");
  head.className = "overlay-head";
  if (spec.icon) head.innerHTML = `<svg class="icon" aria-hidden="true"><use href="${spec.icon}"/></svg>`;
  const title = document.createElement("div");
  title.className = "overlay-title";
  title.textContent = spec.title;
  const esc = document.createElement("button");
  esc.type = "button";
  esc.className = "chip";
  esc.textContent = "ESC";
  esc.setAttribute("aria-label", "Close (Esc)");
  head.append(title, esc);

  const body = document.createElement("div");
  body.className = "overlay-body";
  card.append(head, body);

  let teardown: void | (() => void);
  const close = () => {
    const i = stack.findIndex((o) => o.id === spec.id);
    if (i >= 0) stack.splice(i, 1);
    if (typeof teardown === "function") teardown();
    overlay.remove();
    returnFocus?.focus?.({ preventScroll: true });
  };
  esc.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  teardown = spec.build(body, close);
  if (spec.foot) {
    const foot = document.createElement("div");
    foot.className = "overlay-foot";
    spec.foot(foot, close);
    card.append(foot);
  }
  overlay.append(card);
  document.body.append(overlay);
  stack.push({ id: spec.id, el: overlay, close });
  trap();
  card.focus({ preventScroll: true });
}

export function closeOverlay(id: string): void {
  stack.find((o) => o.id === id)?.close();
}
