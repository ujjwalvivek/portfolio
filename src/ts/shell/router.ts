// Soft navigation (ADR D-005). One document stays alive: same-origin page links fetch the next page, swap <main> and the
// breadcrumb, and remount the page's modules. The wallpaper, palette drift, bars and audio keep running.
// Without JS every link is an ordinary link, and any failure falls back to a full page load.

export type Cleanup = () => void;
export type PageModule = { mount(root: HTMLElement): void | Cleanup | Promise<void | Cleanup> };

const cache = new Map<string, Promise<string>>();
const CACHE_LIMIT = 24;
let cleanups: Cleanup[] = [];
let navigating = 0;

function main(): HTMLElement {
  return document.getElementById("main")!;
}

function key(url: URL): string {
  return url.pathname + url.search;
}

function routable(a: HTMLAnchorElement, e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  if ((a.target && a.target !== "_self") || a.hasAttribute("download") || a.dataset.router === "off") return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return null; // files: /games/dino-blink.html, /icons.svg, pdfs
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return null; // same-page anchor
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

function fetchPage(url: URL): Promise<string> {
  const k = key(url);
  let hit = cache.get(k);
  if (!hit) {
    hit = fetch(k, { headers: { Accept: "text/html" } }).then((r) => {
      if (!r.ok && r.status !== 404) throw new Error(`${r.status}`);
      return r.text();
    });
    hit.catch(() => cache.delete(k));
    cache.set(k, hit);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  }
  return hit;
}

async function mountModules(root: HTMLElement): Promise<void> {
  const specs = (root.dataset.modules ?? "").split(/\s+/).filter(Boolean);
  for (const spec of specs) {
    try {
      const mod = (await import(spec)) as PageModule;
      const cleanup = await mod.mount(root);
      if (typeof cleanup === "function") cleanups.push(cleanup);
    } catch (err) {
      console.error(`${spec} failed to mount:`, err);
    }
  }
}

function unmount(): void {
  for (const fn of cleanups.splice(0)) {
    try {
      fn();
    } catch (err) {
      console.error("cleanup failed:", err);
    }
  }
}

// Page stylesheets are listed on <main data-styles>; new ones are loaded before the swap so the page never shows unstyled.
function loadStyles(next: HTMLElement): Promise<unknown> {
  const hrefs = (next.dataset.styles ?? "").split(/\s+/).filter(Boolean);
  return Promise.all(
    hrefs
      .filter((href) => !document.querySelector(`link[rel="stylesheet"][href="${href}"]`))
      .map(
        (href) =>
          new Promise((resolve) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.onload = link.onerror = resolve;
            document.head.append(link);
          }),
      ),
  );
}

async function render(url: URL, push: boolean): Promise<void> {
  const ticket = ++navigating;
  let html: string;
  try {
    html = await fetchPage(url);
  } catch {
    location.href = url.href;
    return;
  }
  if (ticket !== navigating) return;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const next = doc.getElementById("main");
  if (!next) {
    location.href = url.href;
    return;
  }
  await loadStyles(next);
  if (ticket !== navigating) return;

  if (push) {
    history.replaceState({ ...history.state, scrollY }, "");
    history.pushState({ scrollY: 0 }, "", url.href);
  }

  const swap = () => {
    unmount();
    const current = main();
    current.replaceWith(document.adoptNode(next));
    for (const el of doc.querySelectorAll<HTMLElement>("[data-swap]")) {
      const here = document.querySelector(`[data-swap="${el.dataset.swap}"]`);
      if (here) here.replaceWith(document.adoptNode(el));
    }
    document.title = doc.title;
    const desc = doc.querySelector('meta[name="description"]')?.getAttribute("content");
    if (desc) document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
    const target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: push ? 0 : (history.state?.scrollY ?? 0), behavior: "instant" });
    main().focus({ preventScroll: true });
  };

  if ("startViewTransition" in document && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("is-swapping");
    const vt = document.startViewTransition(swap);
    void vt.finished.finally(() => document.documentElement.classList.remove("is-swapping"));
    await vt.updateCallbackDone;
  } else swap();
  await mountModules(main());
}

// Resolves once the new page is swapped in and its modules are mounted (callers that only navigate can ignore it).
export function navigate(path: string): Promise<void> {
  const url = new URL(path, location.href);
  if (!url.pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname += "/";
  return render(url, true);
}

export function startRouter(): void {
  history.scrollRestoration = "manual";
  history.replaceState({ scrollY: 0, ...history.state }, "");

  document.addEventListener("click", (e) => {
    const a = (e.target as Element | null)?.closest?.("a");
    if (!(a instanceof HTMLAnchorElement)) return;
    const url = routable(a, e);
    if (!url) return;
    e.preventDefault();
    if (key(url) === key(new URL(location.href)) && !url.hash) return;
    void render(url, true);
  });

  // Fetch a page as soon as the pointer or focus rests on its link, so the click finds it already loaded.
  const warm = (e: Event) => {
    const a = (e.target as Element | null)?.closest?.("a");
    if (!(a instanceof HTMLAnchorElement)) return;
    const url = routable(a, new MouseEvent("click"));
    if (url) void fetchPage(url).catch(() => {});
  };
  document.addEventListener("pointerover", warm, { passive: true });
  document.addEventListener("focusin", warm);

  addEventListener("popstate", () => void render(new URL(location.href), false));
  void mountModules(main());
}
