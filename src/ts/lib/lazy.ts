// Lazy sections (root's pattern, ADR principle 2 and 5). A section below the fold holds its final height from the first
// paint (set --hold on the host in CSS), loads its module and stylesheet together when it comes within reach of the
// viewport, and prefetches both once the page is idle so scrolling finds them ready.
//
// A feature module exports: mount(host: HTMLElement): () => void   (the returned function undoes everything)

export type Feature = { mount(host: HTMLElement): void | (() => void) };

const loaded = new Map<string, Promise<Feature>>();

function stylesheet(href: string): Promise<void> {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = link.onerror = () => resolve();
    document.head.append(link);
  });
}

export function loadFeature(module: string, styles: string[] = []): Promise<Feature> {
  let hit = loaded.get(module);
  if (!hit) {
    hit = Promise.all([import(module) as Promise<Feature>, ...styles.map(stylesheet)]).then(([m]) => m);
    hit.catch(() => loaded.delete(module));
    loaded.set(module, hit);
  }
  return hit;
}

const idle = (fn: () => void, timeout = 3000) =>
  typeof requestIdleCallback === "function" ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 1500);

// Mounts `module` into `host` when it nears the viewport. Returns a cleanup that unmounts it (or cancels the wait).
export function lazySection(host: HTMLElement, module: string, styles: string[] = [], margin = "500px 0px"): () => void {
  let undo: (() => void) | void;
  let gone = false;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    observer.disconnect();
    document.removeEventListener("focusin", onFocus);
    loadFeature(module, styles)
      .then((m) => {
        if (gone) return;
        host.classList.add("is-mounted");
        undo = m.mount(host);
      })
      .catch((err) => console.error(`${module} failed to load:`, err));
  };
  const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && start(), { rootMargin: margin });
  // Keyboard users tab faster than the page scrolls: once keyboard focus is anywhere before the section, it mounts, so
  // Tab reaches its controls instead of skipping past a section that is not there yet.
  const onFocus = (e: FocusEvent) => {
    const t = e.target as Element | null;
    if (!t?.matches?.(":focus-visible")) return;
    if (t === host || host.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING) start();
  };
  document.addEventListener("focusin", onFocus);
  observer.observe(host);
  idle(() => {
    if (!gone) void loadFeature(module, styles).catch(() => {});
  });
  return () => {
    gone = true;
    observer.disconnect();
    document.removeEventListener("focusin", onFocus);
    if (typeof undo === "function") undo();
  };
}

// Mounts every lazy section a page declares in its HTML:
//   <section class="lazy-host" data-lazy="/js/features/x.js" data-lazy-styles="/css/features/x.css"></section>
export function mountLazySections(root: HTMLElement): () => void {
  const undos = [...root.querySelectorAll<HTMLElement>("[data-lazy]")].map((host) =>
    lazySection(host, host.dataset.lazy!, (host.dataset.lazyStyles ?? "").split(/\s+/).filter(Boolean)),
  );
  return () => undos.forEach((u) => u());
}
