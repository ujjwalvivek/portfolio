// Post TOC (v3 TableOfContents). Zola renders the list inside a <details>, so it opens and closes without JS.
// This adds the scroll spy: the link of the section being read is marked aria-current, and kept in view in the list.

export function mount(post: HTMLElement): () => void {
  const toc = post.querySelector<HTMLDetailsElement>("[data-toc]");
  if (!toc) return () => {};
  const links = new Map<string, HTMLAnchorElement>();
  for (const a of toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
    links.set(decodeURIComponent(a.hash.slice(1)), a);
  }
  const heads = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((h): h is HTMLElement => h !== null);
  if (!heads.length) return () => {};

  let current: HTMLAnchorElement | undefined;
  let frame = 0;
  const update = () => {
    frame = 0;
    // The active section is the last heading that has passed a line 40% of the way down the window.
    const line = innerHeight * 0.4;
    let active: HTMLElement | undefined;
    for (const h of heads) {
      if (h.getBoundingClientRect().top <= line) active = h;
      else break;
    }
    const link = active ? links.get(active.id) : undefined;
    if (link === current) return;
    current?.removeAttribute("aria-current");
    current = link;
    link?.setAttribute("aria-current", "true");
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  update();
  return () => {
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", onScroll);
    if (frame) cancelAnimationFrame(frame);
  };
}
