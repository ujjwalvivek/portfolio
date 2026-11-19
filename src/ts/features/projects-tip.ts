// Projects tooltips (v3 DescriptionCell and TagCell). The text is already in the page: each title and each "+n" tag chip
// points at a hidden element with aria-describedby, so screen readers get it without this module. This module shows a
// copy of that element in one floating box:
//   mouse    hovering a zone (the title, or the whole tag group) shows it under the cursor and follows it, as v3 did;
//   keyboard focusing the title button or the +n chip shows it under the element;
//   touch    tapping the same button toggles it; tapping anywhere else hides it.
// Esc, scrolling and leaving the zone hide it.

const GAP = 12;
const EDGE = 12;

export function mountTips(root: HTMLElement): () => void {
  const tip = document.createElement("div");
  tip.className = "pj-tip";
  tip.setAttribute("aria-hidden", "true"); // the source element is already the accessible description
  tip.hidden = true;
  document.body.append(tip);

  let current: string | null = null; // id of the source element shown
  let anchor: HTMLElement | null = null; // set when shown for focus or a tap, null when following the mouse
  let lastPointer = "mouse";

  const fill = (id: string): boolean => {
    if (current === id && !tip.hidden) return true;
    const src = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!src) return false;
    tip.replaceChildren(...[...src.childNodes].map((n) => n.cloneNode(true)));
    tip.classList.toggle("is-tags", src.classList.contains("pj-more-list"));
    current = id;
    tip.hidden = false;
    return true;
  };

  // Below the point, centred on x and kept inside the viewport; above it when there is no room below.
  const place = (x: number, top: number, bottom: number) => {
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const left = Math.max(EDGE, Math.min(x - w / 2, innerWidth - EDGE - w));
    const y = bottom + GAP + h > innerHeight - EDGE && top - GAP - h > EDGE ? top - GAP - h : bottom + GAP;
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(y)}px)`;
  };

  const showAt = (id: string, x: number, y: number) => {
    if (!fill(id)) return;
    anchor = null;
    place(x, y, y);
  };
  const showFor = (el: HTMLElement) => {
    const id = el.dataset.pjTip;
    if (!id || !fill(id)) return;
    anchor = el;
    const r = el.getBoundingClientRect();
    place(r.left + Math.min(r.width, 240) / 2, r.top, r.bottom);
  };
  const hide = () => {
    if (tip.hidden) return;
    tip.hidden = true;
    current = null;
    anchor = null;
  };

  const zoneOf = (t: EventTarget | null) => (t as Element | null)?.closest?.<HTMLElement>("[data-pj-zone]") ?? null;
  const triggerOf = (t: EventTarget | null) => (t as Element | null)?.closest?.<HTMLElement>("[data-pj-tip]") ?? null;

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const zone = zoneOf(e.target);
    if (zone && root.contains(zone)) showAt(zone.dataset.pjZone!, e.clientX, e.clientY);
    else if (!anchor) hide();
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const zone = zoneOf(e.target);
    if (zone && !zone.contains(e.relatedTarget as Node | null) && !anchor) hide();
  };
  const onDown = (e: PointerEvent) => {
    lastPointer = e.pointerType;
    if (!triggerOf(e.target) && !(anchor && anchor.contains(e.target as Node))) {
      if (anchor || e.pointerType !== "mouse") hide();
    }
  };
  // A tap (or Enter/Space, which also fires click) toggles; a mouse click leaves the hover tip alone.
  const onClick = (e: MouseEvent) => {
    const el = triggerOf(e.target);
    if (!el) return;
    if (lastPointer === "mouse" && e.detail > 0) return;
    if (anchor === el && !tip.hidden) hide();
    else showFor(el);
    lastPointer = "mouse";
  };
  const onFocusIn = (e: FocusEvent) => {
    const el = triggerOf(e.target);
    if (el && el.matches(":focus-visible")) showFor(el);
  };
  const onFocusOut = (e: FocusEvent) => {
    if (anchor && anchor === triggerOf(e.target)) hide();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !tip.hidden) hide();
  };
  const onScroll = () => hide();

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerout", onLeave);
  document.addEventListener("pointerdown", onDown, true);
  root.addEventListener("click", onClick);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  document.addEventListener("keydown", onKey);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });

  return () => {
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerout", onLeave);
    document.removeEventListener("pointerdown", onDown, true);
    root.removeEventListener("click", onClick);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("keydown", onKey);
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", onScroll);
    tip.remove();
  };
}
