// PDF viewer on pdf.js (ADR D-004), the v4 rebuild of v3's @react-pdf-viewer overlays (resume, project documents).
// pdf.js is vendored at /vendor/pdfjs (D-015) and imported on the first mount only. The caller owns the overlay chrome
// and the close button; mountPdf fills `host` with a toolbar, an optional thumbnail rail and the pages, and returns a
// cleanup that cancels every render, destroys the document and its worker, and drops observers and listeners.
//
// What it does, against v3: page-width fit by default; zoom out, scale, zoom in, fit; page n/N with a jump field;
// thumbnails; download and open in a new tab; text selection and find through pdf.js's text layer; links in the PDF
// work (web links open in a new tab, internal ones scroll). Pages draw lazily as they near the view, at the device's
// pixel ratio, and pages far off screen give their canvases back. Loading shows pdf.js's real byte progress (D-024).
// Keys while the viewer has focus: + - 0 zoom, PageUp PageDown Home End arrows scroll, left and right turn pages.

import type { PdfJs, PDFDocumentProxy, PDFDocumentLoadingTask, PDFPageProxy, RenderTask, TextLayer, RefProxy } from "../types/pdfjs.js";
import { loadFeature } from "../lib/lazy.js";

const PDFJS = "/vendor/pdfjs/pdf.min.mjs";
const WORKER = "/vendor/pdfjs/pdf.worker.min.mjs";
const CSS = "/css/features/pdf-viewer.css";

const CSS_UNITS = 96 / 72; // pdf.js convention: 100% is the page at its printed size on a 96 dpi screen
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
const MIN_ZOOM = ZOOMS[0]!;
const MAX_ZOOM = ZOOMS[ZOOMS.length - 1]!;
const MAX_CANVAS_PIXELS = 2 ** 24; // 16.7 M, iOS Safari's per-canvas ceiling; past it the backing store drops below DPR
const THUMB_WIDTH = 112;
const SETTLE_MS = 140; // a wheel or pinch zoom re-renders once it has been still this long; until then CSS scales

let lib: Promise<PdfJs> | null = null;
function loadLib(): Promise<PdfJs> {
  if (!lib) {
    lib = (import(PDFJS) as Promise<PdfJs>).then((m) => {
      m.GlobalWorkerOptions.workerSrc = WORKER;
      return m;
    });
    lib.catch(() => (lib = null));
  }
  return lib;
}
let live = 0;

type Slot = {
  n: number;
  page: PDFPageProxy | null;
  w: number; // page size in PDF points, rotation applied
  h: number;
  el: HTMLElement;
  canvas: HTMLCanvasElement | null;
  drawn: number; // the scale the canvas was drawn at, 0 for none
  task: RenderTask | null;
  text: TextLayer | null;
  layers: HTMLElement[];
  near: boolean;
  thumb: HTMLButtonElement;
  thumbCanvas: HTMLCanvasElement | null;
  thumbTask: RenderTask | null;
  thumbNear: boolean;
};

const SVG = {
  side: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 2.5h13v11h-13zM5.5 2.5v11"/></svg>',
  down: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v9M4 6.5l4 4 4-4M2 14.5h12"/></svg>',
  open: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 1.5h5v5M14.5 1.5 7 9M12.5 9.5v5h-11v-11h5"/></svg>',
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function fileName(url: string): string {
  try {
    const last = new URL(url, location.href).pathname.split("/").pop() ?? "";
    return decodeURIComponent(last) || "document.pdf";
  } catch {
    return "document.pdf";
  }
}

function kb(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function describe(err: unknown): string {
  const e = err as { name?: string; message?: string; status?: number } | null;
  if (e?.name === "InvalidPDFException") return "the file is not a readable PDF";
  if (e?.status === 404 || e?.name === "MissingPDFException") return "the file was not found (404)";
  if (typeof e?.status === "number" && e.status > 0) return `the server answered ${e.status}`;
  if (e?.name === "PasswordException") return "the file is password protected";
  return e?.message ? `could not load it: ${e.message}` : "could not load it";
}

function cancelled(err: unknown): boolean {
  return (err as { name?: string } | null)?.name === "RenderingCancelledException";
}

export function mountPdf(host: HTMLElement, url: string, opts: { title?: string } = {}): () => void {
  const name = fileName(url);
  const title = opts.title ?? name;
  const ac = new AbortController();
  const signal = ac.signal;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let gone = false;
  live++;

  // ---- DOM -------------------------------------------------------------------------------------------------------
  const root = el("div", "pdfv", { role: "region", "aria-label": title, "data-keys": "off" });
  root.hidden = true; // until its stylesheet is in, a few ms on the first mount

  const bar = el("div", "pdfv-bar", { role: "toolbar", "aria-label": "PDF controls" });
  const sideBtn = el("button", "pdfv-key pdfv-icon", { type: "button", title: "Thumbnails", "aria-pressed": "false", "aria-label": "Thumbnails" });
  sideBtn.innerHTML = SVG.side;
  const pageIn = el("input", "pdfv-pagein", { type: "text", inputmode: "numeric", "aria-label": "Page number", value: "1", size: "3", autocomplete: "off" });
  const pageOf = el("span", "pdfv-meta");
  pageOf.textContent = "/ -";
  const nav = el("div", "pdfv-group");
  nav.append(sideBtn, pageIn, pageOf);

  const outBtn = el("button", "pdfv-key", { type: "button", title: "Zoom out (-)", "aria-label": "Zoom out" });
  outBtn.textContent = "-";
  const scaleOut = el("output", "pdfv-scale", { "aria-live": "polite", "aria-label": "Zoom" });
  const inBtn = el("button", "pdfv-key", { type: "button", title: "Zoom in (+)", "aria-label": "Zoom in" });
  inBtn.textContent = "+";
  const fitBtn = el("button", "pdfv-key", { type: "button", title: "Fit to width (0)", "aria-pressed": "true" });
  fitBtn.textContent = "fit";
  const zoomG = el("div", "pdfv-group");
  zoomG.append(outBtn, scaleOut, inBtn, fitBtn);

  const dl = el("a", "pdfv-key pdfv-link", { href: url, download: name, title: `Download ${name}`, target: "_blank", rel: "noopener" });
  dl.innerHTML = `${SVG.down}<span class="pdfv-label">download</span>`;
  const op = el("a", "pdfv-key pdfv-link", { href: url, target: "_blank", rel: "noopener", title: "Open in a new tab" });
  op.innerHTML = `${SVG.open}<span class="pdfv-label">open</span>`;
  const fileG = el("div", "pdfv-group");
  fileG.append(dl, op);
  bar.append(nav, zoomG, fileG);

  // page and zoom controls wake up once the document is open
  const live_ = [sideBtn, pageIn, outBtn, inBtn, fitBtn];
  live_.forEach((c) => (c.disabled = true));
  scaleOut.textContent = "-";

  const body = el("div", "pdfv-body");
  const side = el("nav", "pdfv-side", { "aria-label": "Pages" });
  side.hidden = true;
  const thumbs = el("ol", "pdfv-thumbs");
  side.append(thumbs);
  const scroller = el("div", "pdfv-scroll", { tabindex: "0", "aria-label": `${title}, pages` });
  const pages = el("div", "pdfv-pages");
  scroller.append(pages);
  const state = el("div", "pdfv-state", { role: "status", "aria-live": "polite" });
  body.append(side, scroller, state);
  root.append(bar, body);
  host.append(root);

  // ---- states (every line here is real work in progress; D-024) ---------------------------------------------------
  const stateTitle = el("div", "pdfv-state-title");
  const stateMeta = el("div", "pdfv-meta");
  const track = el("div", "pdfv-track");
  const fill = el("div", "pdfv-fill");
  track.append(fill);
  state.append(stateTitle, stateMeta, track);

  function show(head: string, meta: string, frac: number | null) {
    state.hidden = false;
    stateTitle.textContent = head;
    stateMeta.textContent = meta;
    track.hidden = frac === null;
    if (frac !== null) fill.style.transform = `scaleX(${Math.min(1, Math.max(0, frac))})`;
  }
  function fail(err: unknown) {
    if (gone) return;
    root.classList.add("is-error");
    state.hidden = false;
    state.setAttribute("role", "alert");
    stateTitle.textContent = "CANNOT SHOW THIS PDF";
    stateMeta.textContent = describe(err);
    track.hidden = true;
    const direct = el("a", "pdfv-key pdfv-direct", { href: url, target: "_blank", rel: "noopener" });
    direct.textContent = "open the file directly";
    state.append(direct);
  }

  // ---- document ---------------------------------------------------------------------------------------------------
  let task: PDFDocumentLoadingTask | null = null;
  let doc: PDFDocumentProxy | null = null;
  let pdfjs: PdfJs | null = null;
  const slots: Slot[] = [];
  let zoom = 1;
  let fit = true;
  let current = 1;
  let firstDrawn = false;

  const scale = () => zoom * CSS_UNITS;

  // Reuse lazy.ts for the stylesheet: loading this very module again resolves at once from the module map, and
  // the stylesheet is added once and deduped against any other loader of it.
  void loadFeature(import.meta.url, [CSS]).finally(() => {
    if (gone) return;
    root.hidden = false;
    if (document.activeElement === document.body || document.activeElement?.contains(host)) scroller.focus({ preventScroll: true });
  });

  show("LOADING", "pdf.js", null);
  loadLib()
    .then((m) => {
      if (gone) return;
      pdfjs = m;
      show("LOADING", "document", null);
      task = m.getDocument({ url, disableWorkerRendering: true, enableXfa: false });
      task.onProgress = ({ loaded, total }) => {
        if (gone || doc) return;
        if (total > 0) show("LOADING", `document ${kb(loaded)} / ${kb(total)}`, loaded / total);
        else show("LOADING", `document ${kb(loaded)}`, null);
      };
      task.onPassword = () => {
        fail({ name: "PasswordException" });
        void task?.destroy();
      };
      return task.promise.then(open);
    })
    .catch((err) => {
      if (!gone) console.warn("pdf-viewer:", err);
      fail(err);
    });

  async function open(d: PDFDocumentProxy) {
    if (gone) return;
    doc = d;
    show("RENDERING", `page 1 of ${d.numPages}`, null);
    pageOf.textContent = `/ ${d.numPages}`;
    pageIn.setAttribute("aria-label", `Page number, of ${d.numPages}`);
    const first = await d.getPage(1);
    if (gone) return;
    const vp = first.getViewport({ scale: 1 });
    for (let n = 1; n <= d.numPages; n++) {
      const pageEl = el("div", "pdfv-page", { "data-page": String(n), role: "group", "aria-label": `Page ${n}` });
      const thumb = el("button", "pdfv-thumb", { type: "button", "aria-label": `Page ${n}` });
      thumb.dataset.page = String(n);
      const num = el("span", "pdfv-meta");
      num.textContent = String(n);
      thumb.append(num);
      const li = el("li");
      li.append(thumb);
      thumbs.append(li);
      pages.append(pageEl);
      // Other pages take page 1's size until they are fetched; mixed-size documents then settle as they near the view.
      slots.push({ n, page: n === 1 ? first : null, w: vp.width, h: vp.height, el: pageEl, canvas: null, drawn: 0, task: null, text: null, layers: [], near: false, thumb, thumbCanvas: null, thumbTask: null, thumbNear: false });
    }
    live_.forEach((c) => (c.disabled = false));
    slots[0]?.thumb.classList.add("is-current");
    if (fit) zoom = fitZoom();
    layout();
    slots.forEach((s) => {
      near.observe(s.el);
      keep.observe(s.el);
      thumbNear.observe(s.thumb);
    });
    lastWidth = scroller.clientWidth;
    resize.observe(scroller);
    updateZoomUi();
  }

  async function getPage(s: Slot): Promise<PDFPageProxy> {
    if (s.page) return s.page;
    const p = await doc!.getPage(s.n);
    s.page = p;
    const vp = p.getViewport({ scale: 1 });
    if (vp.width !== s.w || vp.height !== s.h) {
      s.w = vp.width;
      s.h = vp.height;
      sizeSlot(s);
    }
    return p;
  }

  function sizeSlot(s: Slot) {
    const k = scale();
    s.el.style.width = `${Math.floor(s.w * k)}px`;
    s.el.style.height = `${Math.floor(s.h * k)}px`;
    s.el.style.setProperty("--scale-factor", String(k));
    s.thumb.style.aspectRatio = `${s.w} / ${s.h}`;
  }

  function layout() {
    slots.forEach(sizeSlot);
  }

  function fitZoom(): number {
    const s = slots[0];
    if (!s) return 1;
    const pad = parseFloat(getComputedStyle(pages).paddingLeft) || 0;
    const avail = scroller.clientWidth - 2 * pad;
    const widest = Math.max(...slots.filter((x) => x.page).map((x) => x.w), s.w);
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, avail / (widest * CSS_UNITS)));
  }

  // ---- drawing: one render at a time, the visible pages nearest the current one first, thumbnails after ------------
  let busy = false;
  let settle = 0;

  function pump() {
    if (busy || !doc || gone || settle) return;
    const k = scale();
    const page = slots.filter((s) => s.near && s.drawn !== k).sort((a, b) => Math.abs(a.n - current) - Math.abs(b.n - current))[0];
    const thumb = !side.hidden ? slots.find((s) => s.thumbNear && !s.thumbCanvas && !s.thumbTask) : undefined;
    const job = page ? draw(page) : thumb ? drawThumb(thumb) : null;
    if (!job) return;
    busy = true;
    job
      .catch((err) => {
        if (!cancelled(err) && !gone) console.warn("pdf-viewer: render failed", err);
      })
      .finally(() => {
        busy = false;
        pump();
      });
  }

  async function draw(s: Slot) {
    const page = await getPage(s);
    if (gone) return;
    const k = scale();
    const vp = page.getViewport({ scale: k });
    const cssW = Math.floor(vp.width);
    const cssH = Math.floor(vp.height);
    let out = window.devicePixelRatio || 1;
    if (cssW * cssH * out * out > MAX_CANVAS_PIXELS) out = Math.sqrt(MAX_CANVAS_PIXELS / (cssW * cssH));
    const canvas = el("canvas", "pdfv-canvas", { "aria-hidden": "true" });
    canvas.width = Math.max(1, Math.floor(vp.width * out));
    canvas.height = Math.max(1, Math.floor(vp.height * out));
    const t = page.render({ canvas, viewport: vp, transform: [canvas.width / vp.width, 0, 0, canvas.height / vp.height, 0, 0] });
    s.task = t;
    try {
      await t.promise;
    } catch (err) {
      canvas.width = canvas.height = 0;
      throw err;
    } finally {
      if (s.task === t) s.task = null;
    }
    if (gone || !s.near) {
      canvas.width = canvas.height = 0;
      return;
    }
    if (s.canvas) {
      s.canvas.replaceWith(canvas);
      s.canvas.width = s.canvas.height = 0;
    } else s.el.prepend(canvas);
    s.canvas = canvas;
    s.drawn = k;
    s.el.classList.add("is-drawn");
    if (!s.text) void decorate(s, page);
    if (!firstDrawn) {
      firstDrawn = true;
      state.hidden = true;
    }
  }

  // The text layer (selection, find) and links. Both are laid out by CSS from --scale-factor, so a zoom only moves them.
  async function decorate(s: Slot, page: PDFPageProxy) {
    if (!pdfjs) return;
    const textEl = el("div", "textLayer");
    const text = new pdfjs.TextLayer({ textContentSource: page.streamTextContent({ includeMarkedContent: true }), container: textEl, viewport: page.getViewport({ scale: scale() }) });
    s.text = text;
    s.layers.push(textEl);
    s.el.append(textEl);
    const linksEl = el("div", "pdfv-links");
    s.layers.push(linksEl);
    s.el.append(linksEl);
    try {
      await text.render();
    } catch (err) {
      if (!gone) console.warn("pdf-viewer: text layer", err);
    }
    let annots: Awaited<ReturnType<PDFPageProxy["getAnnotations"]>> = [];
    try {
      annots = await page.getAnnotations({ intent: "display" });
    } catch {
      return;
    }
    if (gone || s.text !== text) return;
    const vp1 = page.getViewport({ scale: 1 });
    for (const a of annots) {
      if (a.subtype !== "Link" || (!a.url && !a.dest)) continue;
      const [x1, y1] = vp1.convertToViewportPoint(a.rect[0] ?? 0, a.rect[1] ?? 0);
      const [x2, y2] = vp1.convertToViewportPoint(a.rect[2] ?? 0, a.rect[3] ?? 0);
      const link = el("a", "pdfv-hit");
      link.style.left = `${(Math.min(x1, x2) / vp1.width) * 100}%`;
      link.style.top = `${(Math.min(y1, y2) / vp1.height) * 100}%`;
      link.style.width = `${(Math.abs(x2 - x1) / vp1.width) * 100}%`;
      link.style.height = `${(Math.abs(y2 - y1) / vp1.height) * 100}%`;
      if (a.url) {
        link.href = a.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.title = a.url.replace(/^mailto:/, "");
      } else {
        link.href = "#";
        link.title = "Go to the linked place";
        const dest = a.dest!;
        link.addEventListener("click", (e) => {
          e.preventDefault();
          void goToDest(dest);
        });
      }
      linksEl.append(link);
    }
  }

  async function drawThumb(s: Slot) {
    const page = await getPage(s);
    if (gone) return;
    const k = THUMB_WIDTH / s.w;
    const vp = page.getViewport({ scale: k });
    const out = window.devicePixelRatio || 1;
    const canvas = el("canvas", "pdfv-canvas", { "aria-hidden": "true" });
    canvas.width = Math.floor(vp.width * out);
    canvas.height = Math.floor(vp.height * out);
    const t = page.render({ canvas, viewport: vp, transform: [canvas.width / vp.width, 0, 0, canvas.height / vp.height, 0, 0] });
    s.thumbTask = t;
    try {
      await t.promise;
    } catch (err) {
      canvas.width = canvas.height = 0;
      throw err;
    } finally {
      s.thumbTask = null;
    }
    if (gone || !s.thumbNear) {
      canvas.width = canvas.height = 0;
      return;
    }
    s.thumb.prepend(canvas);
    s.thumbCanvas = canvas;
  }

  function release(s: Slot) {
    s.task?.cancel();
    s.task = null;
    if (s.canvas) {
      s.canvas.width = s.canvas.height = 0;
      s.canvas.remove();
      s.canvas = null;
    }
    s.text?.cancel();
    s.text = null;
    s.layers.forEach((l) => l.remove());
    s.layers = [];
    s.drawn = 0;
    s.el.classList.remove("is-drawn");
    s.page?.cleanup();
  }
  function releaseThumb(s: Slot) {
    s.thumbTask?.cancel();
    s.thumbTask = null;
    if (s.thumbCanvas) {
      s.thumbCanvas.width = s.thumbCanvas.height = 0;
      s.thumbCanvas.remove();
      s.thumbCanvas = null;
    }
  }

  const slotOf = (t: Element) => slots[Number((t as HTMLElement).dataset.page) - 1];
  // Draw within a screen of the view; give canvases back beyond three screens.
  const near = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = slotOf(e.target);
        if (s) s.near = e.isIntersecting;
      }
      pump();
    },
    { root: scroller, rootMargin: "100% 50%" },
  );
  const keep = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = slotOf(e.target);
        if (s && !e.isIntersecting) release(s);
      }
    },
    { root: scroller, rootMargin: "300% 100%" },
  );
  const thumbNear = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = slotOf(e.target);
        if (!s) continue;
        s.thumbNear = e.isIntersecting;
        if (!e.isIntersecting) releaseThumb(s);
      }
      pump();
    },
    { root: side, rootMargin: "200% 0px" },
  );

  // ---- zoom -------------------------------------------------------------------------------------------------------
  function updateZoomUi() {
    scaleOut.textContent = `${Math.round(zoom * 100)}%`;
    fitBtn.setAttribute("aria-pressed", String(fit));
    outBtn.disabled = zoom <= MIN_ZOOM + 1e-6;
    inBtn.disabled = zoom >= MAX_ZOOM - 1e-6;
  }

  // Zoom keeping the point under (ax, ay), in scroller coordinates, where it is. Layout changes at once (canvases
  // stretch); the re-render follows now, or once a continuous gesture settles.
  function setZoom(z: number, opt: { ax?: number; ay?: number; keepFit?: boolean; continuous?: boolean } = {}) {
    if (!doc || !slots.length) return;
    fit = !!opt.keepFit;
    z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    if (Math.abs(z - zoom) > 1e-4) {
      const ax = opt.ax ?? scroller.clientWidth / 2;
      const ay = opt.ay ?? 0;
      const cy = scroller.scrollTop + ay;
      const cx = scroller.scrollLeft + ax;
      const s = slotAt(cy);
      const fy = (cy - s.el.offsetTop) / s.el.offsetHeight;
      const fx = (cx - s.el.offsetLeft) / s.el.offsetWidth;
      zoom = z;
      for (const x of slots) x.task?.cancel();
      layout();
      scroller.scrollTop = s.el.offsetTop + fy * s.el.offsetHeight - ay;
      scroller.scrollLeft = s.el.offsetLeft + fx * s.el.offsetWidth - ax;
    }
    updateZoomUi();
    clearTimeout(settle);
    if (opt.continuous) {
      settle = window.setTimeout(() => {
        settle = 0;
        pump();
      }, SETTLE_MS);
    } else {
      settle = 0;
      pump();
    }
  }
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? ZOOMS.find((z) => z > zoom * 1.01) : [...ZOOMS].reverse().find((z) => z < zoom * 0.99);
    setZoom(next ?? (dir > 0 ? MAX_ZOOM : MIN_ZOOM));
  };
  const toFit = () => setZoom(fitZoom(), { keepFit: true });

  // ---- position ---------------------------------------------------------------------------------------------------
  function slotAt(y: number): Slot {
    let lo = 0;
    let hi = slots.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (slots[mid]!.el.offsetTop <= y) lo = mid;
      else hi = mid - 1;
    }
    return slots[lo]!;
  }
  function trackCurrent() {
    if (!slots.length) return;
    const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
    const n = atEnd ? slots.length : slotAt(scroller.scrollTop + scroller.clientHeight * 0.35).n;
    if (n === current) return;
    current = n;
    if (document.activeElement !== pageIn) pageIn.value = String(n);
    for (const s of slots) s.thumb.classList.toggle("is-current", s.n === n);
    if (!side.hidden) slots[n - 1]?.thumb.scrollIntoView({ block: "nearest" });
  }
  function goTo(n: number, top = 0, smooth = false) {
    const s = slots[Math.min(slots.length, Math.max(1, n)) - 1];
    if (!s) return;
    const gap = parseFloat(getComputedStyle(pages).rowGap) || 0;
    scroller.scrollTo({ top: s.el.offsetTop + top - (top ? 0 : gap), behavior: smooth && !reduced.matches ? "smooth" : "auto" });
  }
  async function goToDest(dest: string | unknown[]) {
    if (!doc) return;
    const arr = typeof dest === "string" ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(arr) || gone) return;
    const ref = arr[0];
    const index = typeof ref === "number" ? ref : await doc.getPageIndex(ref as RefProxy);
    const s = slots[index];
    if (!s || gone) return;
    let top = 0;
    const kind = (arr[1] as { name?: string } | undefined)?.name;
    if ((kind === "XYZ" || kind === "FitH" || kind === "FitBH") && typeof arr[kind === "XYZ" ? 3 : 2] === "number") {
      const page = await getPage(s);
      top = Math.max(0, page.getViewport({ scale: scale() }).convertToViewportPoint(0, arr[kind === "XYZ" ? 3 : 2] as number)[1]);
    }
    goTo(index + 1, top, true);
  }

  // ---- events -----------------------------------------------------------------------------------------------------
  let raf = 0;
  scroller.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), trackCurrent()));
    },
    { passive: true, signal },
  );

  let lastWidth = 0;
  const resize = new ResizeObserver(() => {
    if (scroller.clientWidth === lastWidth) return; // the first call on observe, and height-only changes
    lastWidth = scroller.clientWidth;
    if (fit && doc) setZoom(fitZoom(), { keepFit: true, continuous: true });
  });

  sideBtn.addEventListener(
    "click",
    () => {
      side.hidden = !side.hidden;
      sideBtn.setAttribute("aria-pressed", String(!side.hidden));
      root.classList.toggle("is-side", !side.hidden);
      if (!side.hidden) slots[current - 1]?.thumb.scrollIntoView({ block: "nearest" });
      else slots.forEach(releaseThumb);
      pump();
    },
    { signal },
  );
  thumbs.addEventListener(
    "click",
    (e) => {
      const b = (e.target as Element).closest<HTMLElement>(".pdfv-thumb");
      if (!b) return;
      goTo(Number(b.dataset.page), 0, true);
      if (root.classList.contains("is-narrow")) sideBtn.click();
    },
    { signal },
  );
  outBtn.addEventListener("click", () => step(-1), { signal });
  inBtn.addEventListener("click", () => step(1), { signal });
  fitBtn.addEventListener("click", toFit, { signal });

  const commitPage = () => {
    const n = parseInt(pageIn.value, 10);
    if (Number.isFinite(n) && slots.length) goTo(n);
    pageIn.value = String(Number.isFinite(n) && slots.length ? Math.min(slots.length, Math.max(1, n)) : current);
  };
  pageIn.addEventListener("change", commitPage, { signal });
  pageIn.addEventListener("focus", () => pageIn.select(), { signal });

  dl.addEventListener(
    "click",
    (e) => {
      if (!doc) return; // not loaded yet: the plain link opens the file
      e.preventDefault();
      void doc.getData().then((bytes) => {
        const href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
        const a = el("a", "", { href, download: name });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(href), 10000);
      });
    },
    { signal },
  );

  root.addEventListener(
    "keydown",
    (e) => {
      if (e.altKey || !doc) return;
      const mod = e.ctrlKey || e.metaKey;
      const inField = e.target === pageIn;
      if (inField && e.key !== "Enter") return;
      let done = true;
      const k = e.key;
      if (k === "Enter" && inField) commitPage();
      else if (k === "+" || k === "=") step(1);
      else if (k === "-" || k === "_") step(-1);
      else if (k === "0") toFit();
      else if (mod) done = false;
      else if (k === "PageDown" || (k === " " && !e.shiftKey && e.target === scroller)) scroller.scrollBy({ top: scroller.clientHeight * 0.9 });
      else if (k === "PageUp" || (k === " " && e.shiftKey && e.target === scroller)) scroller.scrollBy({ top: -scroller.clientHeight * 0.9 });
      else if (k === "ArrowDown") scroller.scrollBy({ top: 48 });
      else if (k === "ArrowUp") scroller.scrollBy({ top: -48 });
      else if (k === "Home") scroller.scrollTo({ top: 0 });
      else if (k === "End") scroller.scrollTo({ top: scroller.scrollHeight });
      else if (k === "ArrowRight" || k === "ArrowLeft") {
        const dir = k === "ArrowRight" ? 1 : -1;
        if (scroller.scrollWidth > scroller.clientWidth + 1) scroller.scrollBy({ left: dir * 48 });
        else goTo(current + dir);
      } else done = false;
      if (done) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { signal },
  );

  // Ctrl + wheel and trackpad pinch (which arrives as ctrl + wheel) zoom around the pointer.
  scroller.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = scroller.getBoundingClientRect();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      setZoom(zoom * Math.exp(-dy * 0.0025), { ax: e.clientX - r.left, ay: e.clientY - r.top, continuous: true });
    },
    { passive: false, signal },
  );

  // Two-finger pinch on touch screens: CSS scales the pages during the gesture, the zoom commits on release.
  let pinch: { d0: number; x: number; y: number; r: number } | null = null;
  const dist = (t: TouchList) => Math.hypot(t[0]!.clientX - t[1]!.clientX, t[0]!.clientY - t[1]!.clientY);
  scroller.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 2 || !doc) return;
      const r = scroller.getBoundingClientRect();
      const x = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2 - r.left;
      const y = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2 - r.top;
      pinch = { d0: dist(e.touches), x, y, r: 1 };
      pages.style.transformOrigin = `${scroller.scrollLeft + x}px ${scroller.scrollTop + y}px`;
    },
    { passive: true, signal },
  );
  scroller.addEventListener(
    "touchmove",
    (e) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (zoom * dist(e.touches)) / pinch.d0));
      pinch.r = z / zoom;
      pages.style.transform = `scale(${pinch.r})`;
    },
    { passive: false, signal },
  );
  const endPinch = () => {
    if (!pinch) return;
    const p = pinch;
    pinch = null;
    pages.style.transform = "";
    pages.style.transformOrigin = "";
    setZoom(zoom * p.r, { ax: p.x, ay: p.y });
  };
  scroller.addEventListener("touchend", endPinch, { passive: true, signal });
  scroller.addEventListener("touchcancel", endPinch, { passive: true, signal });

  // narrow hosts float the thumbnail rail over the pages
  const narrow = new ResizeObserver(([entry]) => {
    if (entry) root.classList.toggle("is-narrow", entry.contentRect.width < 640);
  });
  narrow.observe(root);

  // ---- cleanup ----------------------------------------------------------------------------------------------------
  return () => {
    if (gone) return;
    gone = true;
    live--;
    ac.abort();
    near.disconnect();
    keep.disconnect();
    thumbNear.disconnect();
    resize.disconnect();
    narrow.disconnect();
    clearTimeout(settle);
    cancelAnimationFrame(raf);
    for (const s of slots) {
      release(s);
      releaseThumb(s);
    }
    slots.length = 0;
    const t = task;
    task = null;
    doc = null;
    if (t) void t.destroy().catch(() => {}); // destroys the document and terminates its worker
    if (live === 0 && pdfjs) pdfjs.TextLayer.cleanup();
    root.remove();
  };
}
