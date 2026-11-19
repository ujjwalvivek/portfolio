// Recent projects: "Case Study" and "Docs" open in the same overlay as on /projects (projects-embed.js, imported on the
// first click). They are real links in the HTML, so a modifier key or no JS opens them in a new tab instead.

type Embed = typeof import("./projects-embed.js");
const EMBED: string = "/js/features/projects-embed.js";

export function mount(root: HTMLElement): () => void {
  let embed: Embed | null = null;
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[data-ab-open]");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const kind = a.dataset.abOpen;
    if (kind !== "notion" && kind !== "pdf") return;
    e.preventDefault();
    void (import(EMBED) as Promise<Embed>)
      .then((m) => {
        embed = m;
        m.openEmbed(kind, a.href, a.dataset.abTitle ?? a.textContent ?? "");
      })
      .catch(() => window.open(a.href, "_blank", "noopener"));
  };
  const list = root.querySelector<HTMLElement>(".ab-recent");
  list?.addEventListener("click", onClick);
  return () => {
    list?.removeEventListener("click", onClick);
    embed?.closeEmbed();
  };
}
