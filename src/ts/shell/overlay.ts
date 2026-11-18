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
  card.focus({ preventScroll: true });
}

export function closeOverlay(id: string): void {
  stack.find((o) => o.id === id)?.close();
}
