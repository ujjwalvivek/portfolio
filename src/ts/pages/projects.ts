// Projects (ADR M4). Zola renders every row, the counts and the stats; this module only:
//   filters the rendered rows (--all, --pm, --dev), keeping the choice in ?filter= so back and reload return to it;
//   marks the row named in the hash (/projects/#dev-3, also the command palette's target) and makes sure the filter
//   shows it, fixing v3's palette link to a data-project-id that did not exist;
//   mounts the tooltips and opens the PDF overlay.

import { mountTips } from "../features/projects-tip.js";
import { closeEmbed, openEmbed, type EmbedKind } from "../features/projects-embed.js";

type Filter = "all" | "pm" | "dev";
const FILTERS: readonly Filter[] = ["all", "pm", "dev"];
const isFilter = (v: string | null | undefined): v is Filter => !!v && (FILTERS as readonly string[]).includes(v);

export function mount(root: HTMLElement): () => void {
  const section = root.querySelector<HTMLElement>("[data-pj]");
  const list = root.querySelector<HTMLElement>("[data-pj-list]");
  if (!section || !list) return () => {};

  const rows = [...list.querySelectorAll<HTMLElement>("[data-project-id]")];
  const buttons = [...section.querySelectorAll<HTMLButtonElement>("[data-pj-filter]")];
  const active = section.querySelector<HTMLElement>("[data-pj-active]");
  const count = section.querySelector<HTMLElement>("[data-pj-count]");
  const endCount = section.querySelector<HTMLElement>("[data-pj-end-count]");

  const apply = (filter: Filter) => {
    let shown = 0;
    for (const row of rows) {
      const hide = filter !== "all" && row.dataset.pjGroup !== filter;
      row.hidden = hide;
      if (!hide) shown++;
    }
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.pjFilter === filter));
    if (active) active.textContent = filter;
    if (count) count.textContent = String(shown);
    if (endCount) endCount.textContent = String(shown);

    const url = new URL(location.href);
    if (filter === "all") url.searchParams.delete("filter");
    else url.searchParams.set("filter", filter);
    if (url.href !== location.href) history.replaceState(history.state, "", url.href);
  };

  const target = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    for (const row of rows) row.classList.toggle("is-target", !!id && row.dataset.projectId === id);
    const row = id ? rows.find((r) => r.dataset.projectId === id) : undefined;
    if (!row) return;
    if (row.hidden) apply("all");
    row.scrollIntoView({ block: "center", behavior: "instant" });
  };

  const onFilter = (e: MouseEvent) => {
    const f = (e.target as Element | null)?.closest<HTMLElement>("[data-pj-filter]")?.dataset.pjFilter;
    if (isFilter(f)) apply(f);
  };
  const onOpen = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-pj-open]");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openEmbed(a.dataset.pjOpen as EmbedKind, a.href, a.dataset.pjTitle ?? a.textContent ?? "");
  };

  section.addEventListener("click", onFilter);
  list.addEventListener("click", onOpen);
  addEventListener("hashchange", target);
  const undoTips = mountTips(section);

  const initial = new URLSearchParams(location.search).get("filter");
  if (isFilter(initial) && initial !== "all") apply(initial);
  if (location.hash) target();

  return () => {
    section.removeEventListener("click", onFilter);
    list.removeEventListener("click", onOpen);
    removeEventListener("hashchange", target);
    undoTips();
    closeEmbed();
  };
}
