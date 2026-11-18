// Blog list (ADR M3). Zola renders every card; this module only filters and reorders them as the visitor types.
// Search is v3's searchPost over title, description and tags: whole phrase first, then words, then a loose
// single-word match, ranked by score. Fourteen posts, so it reads the cards it is given; no index, no fetch.
// "/" focuses the box (D-023). A tag filters the list by that tag instead of leaving the page. The query is kept
// in ?q= so going back from a post returns to the same results.

import { handle } from "../shell/keymap.js";

type Card = { el: HTMLElement; rank: HTMLElement | null; title: string; desc: string; tags: string };

const STOPWORDS = new Set(
  ("the a an and or but in on at to for of with by as is are was were be been have has had do does did will would " +
    "could should may might must can this that these those i you he she it we they me him her us them my your his its our their").split(" "),
);
const SHORT_TERMS = new Set(["c#", "go", "js", "ai", "ml", "ui", "ux", "db"]);

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function meaningful(query: string, min: number): string[] {
  return words(query).filter((w) => SHORT_TERMS.has(w) || (w.length >= min && !STOPWORDS.has(w)));
}

// v3's scores, unchanged, so results come back in the same order they did.
export function score(query: string, card: Pick<Card, "title" | "desc" | "tags">): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const { title, desc, tags } = card;
  let s = 0;
  if (title.includes(q)) s += 100;
  if (desc.includes(q)) s += 50;
  if (tags.includes(q)) s += 75;
  if (s) return s;

  const terms = meaningful(q, 2);
  if (!terms.length) return 0;
  const tw = words(title);
  const dw = words(desc);
  const gw = words(tags);
  const field = (list: string[], term: string, exact: number, prefix: number) =>
    list.includes(term) ? exact : list.some((w) => w.startsWith(term)) ? prefix : 0;
  for (const term of terms) s += field(tw, term, 40, 30) + field(dw, term, 20, 15) + field(gw, term, 30, 20);
  if (s || q.length < 3) return s;

  // Loose match for one word: at least 80% of its letters in order, each within three characters of the last.
  const single = meaningful(q, 3);
  if (single.length !== 1) return 0;
  const term = single[0]!;
  const all = `${title} ${desc} ${tags}`;
  let hits = 0;
  let last = -1;
  for (const ch of term) {
    const at = all.indexOf(ch, last + 1);
    if (at !== -1 && at - last <= 3) {
      hits++;
      last = at;
    }
  }
  return hits >= Math.ceil(term.length * 0.8) ? 5 : 0;
}

export function mount(root: HTMLElement): () => void {
  const form = root.querySelector<HTMLFormElement>("[data-bl-search]");
  const input = root.querySelector<HTMLInputElement>("[data-bl-q]");
  const clear = root.querySelector<HTMLButtonElement>("[data-bl-clear]");
  const list = root.querySelector<HTMLElement>("[data-bl-posts]");
  const empty = root.querySelector<HTMLElement>("[data-bl-empty]");
  const emptyQ = root.querySelector<HTMLElement>("[data-bl-empty-q]");
  const end = root.querySelector<HTMLElement>("[data-bl-end]");
  if (!form || !input || !list) return () => {};

  const text = (el: Element, sel: string) => (el.querySelector(sel)?.textContent ?? "").toLowerCase();
  const cards: Card[] = [...list.querySelectorAll<HTMLElement>("[data-bl-post]")].map((el) => ({
    el,
    rank: el.querySelector<HTMLElement>("[data-bl-rank]"),
    title: text(el, "[data-bl-title]"),
    desc: text(el, "[data-bl-desc]"),
    tags: [...el.querySelectorAll("[data-bl-tag]")].map((t) => (t.textContent ?? "").toLowerCase().trim()).join(" "),
  }));
  const total = cards.length;
  const endText = end?.textContent ?? "";

  const apply = () => {
    const q = input.value.trim();
    const shown = q
      ? cards
          .map((card, i) => ({ card, i, s: score(q, card) }))
          .filter((r) => r.s > 0)
          .sort((a, b) => b.s - a.s || a.i - b.i)
          .map((r) => r.card)
      : cards;
    const visible = new Set(shown);
    // Matches first in score order, the rest after them hidden; with no query this is the date order Zola wrote.
    list.append(...shown.map((c) => c.el), ...cards.filter((c) => !visible.has(c)).map((c) => c.el));
    cards.forEach((c) => (c.el.hidden = !visible.has(c)));
    shown.forEach((c, i) => {
      if (c.rank) c.rank.textContent = String(i + 1).padStart(2, "0");
    });

    if (clear) clear.hidden = !input.value;
    form.classList.toggle("has-query", !!input.value);
    if (empty && emptyQ) {
      empty.hidden = !q || shown.length > 0;
      emptyQ.textContent = q;
    }
    if (end) end.textContent = q ? `console.log() ⇒ ${shown.length ? "PASSED" : "EMPTY"}. entries_matched(${shown.length}/${total})` : endText;

    const url = new URL(location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    if (url.href !== location.href) history.replaceState(history.state, "", url.href);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (input.value) input.value = "";
    else input.blur();
    apply();
  };
  const onSubmit = (e: Event) => {
    e.preventDefault();
    apply();
  };
  const onClear = () => {
    input.value = "";
    apply();
    input.focus();
  };
  // A tag link goes to its tag page without JS; here it filters the list by that tag instead.
  const onTag = (e: MouseEvent) => {
    const tag = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("[data-bl-tag]");
    if (!tag || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    input.value = (tag.textContent ?? "").trim();
    apply();
    form.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  input.addEventListener("input", apply);
  input.addEventListener("keydown", onKey);
  form.addEventListener("submit", onSubmit);
  clear?.addEventListener("click", onClear);
  list.addEventListener("click", onTag);
  const release = handle("search", () => {
    input.focus();
    input.select();
  });

  const initial = new URLSearchParams(location.search).get("q");
  if (initial) input.value = initial;
  if (input.value) apply(); // also covers a value the browser restored into the box

  return () => {
    release();
    input.removeEventListener("input", apply);
    input.removeEventListener("keydown", onKey);
    form.removeEventListener("submit", onSubmit);
    clear?.removeEventListener("click", onClear);
    list.removeEventListener("click", onTag);
  };
}
