// Resume bar (v3 ResumeBar, ResumeOverlay, ArrowPointer).
//
// View opens the resume in a near full-height glass overlay (shell overlay: Esc, the ESC chip and a click outside close
// it) with the pdf.js viewer, whose controls share the one title bar with a dark / light switch. That switch picks the document, not the site
// theme (D-010); the choice is remembered. Download fetches the dark PDF and saves it under a proper name; the button
// says "fetching" only while the bytes are actually coming (D-024). Both are real links, so without JS they open the PDF.
//
// The arrow pointer: while the mouse is over the bar (and not over View), a dashed curve runs from the cursor to the
// download button. v3 restarted its animation loop on every mouse move; this draws once per frame only when something
// moved, and stops when the mouse leaves. Fine pointers only, and not with reduced motion.

import { closeOverlay, openOverlay } from "../shell/overlay.js";
import { load, save } from "../lib/store.js";
import { loadFeature } from "../lib/lazy.js";

type Doc = "dark" | "light";
type PdfViewer = { mountPdf(host: HTMLElement, url: string, opts?: { title?: string; toolbarHost?: HTMLElement }): () => void };

const CDN = "https://cdn.ujjwalvivek.com/docs";
const URLS: Record<Doc, string> = { dark: `${CDN}/resume-dark.pdf`, light: `${CDN}/resume-light.pdf` };
const FILE = "UjjwalVivek_Resume.pdf";
const ID = "about-resume";
const TITLE = "Vivek's Resume";
const DOC_KEY = "resume-doc";
// Not a literal, so tsc leaves the specifier alone.
const PDF_VIEWER: string = "/js/features/pdf-viewer.js";
const PDF_CSS = "/css/features/pdf-viewer.css";

const modified = (e: MouseEvent) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

// ---- overlay ---------------------------------------------------------------------------------------------------------

// One title bar (v3 had one): the viewer puts its toolbar in the overlay's head (its toolbarHost option), and the
// document switch joins it before download and open. The viewer's keys work from there too.

function build(body: HTMLElement): () => void {
  const card = body.parentElement;
  card?.classList.add("ab-resume-card");
  body.classList.add("ab-resume-body");

  let doc: Doc = load<Doc>(DOC_KEY, "dark") === "light" ? "light" : "dark";

  const head = card?.querySelector<HTMLElement>(".overlay-head");
  const esc = head?.querySelector(".chip") ?? null;
  // the viewer's controls land here once it mounts; the document switch sits among them
  const tools = el("div", "ab-pdf-tools");
  tools.setAttribute("role", "toolbar");
  tools.setAttribute("aria-label", "Resume controls");
  const group = el("div", "ab-doc");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Document");
  const buttons = (["dark", "light"] as const).map((d) => {
    const b = el("button", "", d);
    b.type = "button";
    b.title = `The ${d} copy of the resume`;
    b.addEventListener("click", () => show(d));
    group.append(b);
    return [d, b] as const;
  });
  tools.append(group);
  head?.insertBefore(tools, esc);

  const note = el("p", "ab-pdf-note", "loading pdf viewer");
  note.setAttribute("role", "status");
  const host = el("div", "ab-pdf-host");
  body.append(note, host);

  let viewer: PdfViewer | null = null;
  let unmount: (() => void) | null = null;
  let closed = false;


  function show(next: Doc): void {
    doc = next;
    save(DOC_KEY, doc);
    for (const [d, b] of buttons) b.setAttribute("aria-pressed", String(d === doc));
    if (!viewer) return;
    unmount?.();
    tools.replaceChildren(group);
    host.replaceChildren();
    unmount = viewer.mountPdf(host, URLS[doc], { title: `${TITLE} (${doc})`, toolbarHost: tools });
    // the document switch sits just before the file actions (download, open)
    const file = tools.querySelector(".pdfv-bar > .pdfv-group:last-child");
    file?.before(group);
  }

  show(doc);
  // Honest wait: the note shows only while the viewer module is loading and goes the moment it mounts (D-024). Its
  // stylesheet comes in with it, so the lifted controls are never seen unstyled.
  loadFeature(PDF_VIEWER, [PDF_CSS])
    .then((m) => {
      if (closed) return;
      viewer = m as unknown as PdfViewer;
      note.remove();
      show(doc);
    })
    .catch((err: unknown) => {
      console.error("pdf viewer failed to load:", err);
      if (closed) return;
      note.textContent = "the pdf viewer did not load. ";
      const a = el("a", "chip", "open the pdf instead");
      a.href = URLS[doc];
      a.target = "_blank";
      a.rel = "noopener";
      note.append(a);
    });

  return () => {
    closed = true;
    unmount?.();
    tools.remove();
  };
}

export function openResume(): void {
  openOverlay({ id: ID, title: TITLE, icon: "/icons.svg#pi-file-pdf-fill", build, wide: true });
}

// ---- download ------------------------------------------------------------------------------------------------------

async function download(button: HTMLAnchorElement, signal: AbortSignal): Promise<void> {
  if (button.getAttribute("aria-busy") === "true") return;
  const label = button.querySelector<HTMLElement>("[data-ab-dl-text]");
  button.setAttribute("aria-busy", "true");
  if (label) label.textContent = "fetching";
  try {
    const res = await fetch(URLS.dark, { mode: "cors", signal });
    if (!res.ok) throw new Error(`${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    const a = el("a");
    a.href = url;
    a.download = FILE;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch (err) {
    if (!signal.aborted) window.open(URLS.dark, "_blank", "noopener");
  } finally {
    button.removeAttribute("aria-busy");
    if (label) label.textContent = "Download";
  }
}

// ---- arrow pointer -------------------------------------------------------------------------------------------------

function arrow(bar: HTMLElement, view: HTMLElement | null, target: HTMLElement): () => void {
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let frame = 0;
  let mx = 0;
  let my = 0;
  let over = false;
  let overView = false;
  let rgb = "136, 136, 136";

  const size = () => {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = () => {
    frame = 0;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!over || overView) return;
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = cx - mx;
    const dy = cy - my;
    const dist = Math.hypot(dx, dy);
    if (dist < 30) return;
    // v3's fade: strongest far away, fading out as the cursor reaches the button
    const alpha = dist < 100 ? Math.max(0.1, ((dist - 30) / 70) * 0.6) : Math.min(1, Math.max(0.4, (400 - dist) / 400));
    const angle = Math.atan2(dy, dx);
    const reach = Math.max(r.width, r.height) / 2 + 8;
    const ex = cx - reach * Math.cos(angle);
    const ey = cy - reach * Math.sin(angle);
    const bend = Math.min(100, dist * 0.3);
    const qx = (mx + ex) / 2 + (-dy / dist) * bend;
    const qy = (my + ey) / 2 + (dx / dist) * bend;

    ctx.strokeStyle = ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.quadraticCurveTo(qx, qy, ex, ey);
    ctx.stroke();

    // the head, turned along the curve's last tangent; a square dot marks the cursor end
    const t = Math.atan2(ey - qy, ex - qx);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 12 * Math.cos(t - Math.PI / 6), ey - 12 * Math.sin(t - Math.PI / 6));
    ctx.lineTo(ex - 12 * Math.cos(t + Math.PI / 6), ey - 12 * Math.sin(t + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(${rgb}, ${alpha * 0.7})`;
    ctx.fillRect(mx - 3, my - 3, 6, 6);
  };
  const request = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  const onMove = (e: PointerEvent) => {
    mx = e.clientX;
    my = e.clientY;
    request();
  };
  const start = (e: PointerEvent) => {
    if (!fine.matches || reduced.matches || e.pointerType !== "mouse") return;
    over = true;
    rgb = getComputedStyle(document.documentElement).getPropertyValue("--dynamic-hsl-average-rgb").trim() || rgb;
    if (!canvas) {
      canvas = el("canvas", "ab-arrow");
      canvas.setAttribute("aria-hidden", "true");
      ctx = canvas.getContext("2d");
      document.body.append(canvas);
      size();
    }
    document.addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", request, { passive: true });
    onMove(e);
  };
  const stop = () => {
    over = false;
    document.removeEventListener("pointermove", onMove);
    removeEventListener("scroll", request);
    request(); // one last frame clears the canvas
  };
  const enterView = () => {
    overView = true;
    request();
  };
  const leaveView = () => {
    overView = false;
    request();
  };
  const onResize = () => {
    size();
    request();
  };

  bar.addEventListener("pointerenter", start);
  bar.addEventListener("pointerleave", stop);
  view?.addEventListener("pointerenter", enterView);
  view?.addEventListener("pointerleave", leaveView);
  addEventListener("resize", onResize);
  return () => {
    stop();
    if (frame) cancelAnimationFrame(frame);
    bar.removeEventListener("pointerenter", start);
    bar.removeEventListener("pointerleave", stop);
    view?.removeEventListener("pointerenter", enterView);
    view?.removeEventListener("pointerleave", leaveView);
    removeEventListener("resize", onResize);
    canvas?.remove();
  };
}

// ---- mount -----------------------------------------------------------------------------------------------------------

export function mount(root: HTMLElement): () => void {
  const bar = root.querySelector<HTMLElement>("[data-ab-resume]");
  if (!bar) return () => {};
  const view = bar.querySelector<HTMLAnchorElement>("[data-ab-view]");
  const dl = bar.querySelector<HTMLAnchorElement>("[data-ab-download]");
  const ac = new AbortController();

  view?.addEventListener(
    "click",
    (e) => {
      if (modified(e)) return;
      e.preventDefault();
      openResume();
    },
    { signal: ac.signal },
  );
  dl?.addEventListener(
    "click",
    (e) => {
      if (modified(e)) return;
      e.preventDefault();
      void download(dl, ac.signal);
    },
    { signal: ac.signal },
  );
  const undoArrow = dl ? arrow(bar, view, dl) : () => {};

  return () => {
    ac.abort();
    undoArrow();
    closeOverlay(ID);
  };
}
