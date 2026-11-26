// The engine cards' live numbers (v3 JourneyBadge, and its second card, now Substrate). Everything comes from echopoint's
// JSON store, which caches GitHub, npm and crates.io. Substrate has git tags but no GitHub releases, so its latest
// release row reads echopoint's npm:<name>:time entry instead. Each slot holds "-" from the HTML until its answer is in; a request
// that fails leaves its slots at "-" and marks the first timeline row "unavailable". Nothing is ever made up.
// Answers are kept for the visit, so coming back to the page draws at once.

const EP = "https://echopoint.ujjwalvivek.com/v1/store/";

type Repo = { description?: string | null; pushed_at?: string; stargazers_count?: number; license?: { spdx_id?: string | null } | null };
type Release = { name?: string | null; tag_name: string; published_at?: string | null; html_url?: string; draft?: boolean; author?: { login?: string } };
type Commit = { sha: string; message: string; url?: string; date: string; additions?: number; deletions?: number };
type Tag = { name: string };
type NpmTime = { latest?: string; published_at?: string };

const cache = new Map<string, Promise<unknown>>();
function json<T>(url: string): Promise<T> {
  let hit = cache.get(url);
  if (!hit) {
    hit = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return r.json();
    });
    hit.catch(() => cache.delete(url));
    cache.set(url, hit);
  }
  return hit as Promise<T>;
}
const store = <T>(key: string) => json<T>(EP + key);

const fmt = (n: number) => n.toLocaleString("en-US");
const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function link(text: string, href: string | undefined): Node {
  if (!href || !/^https:\/\//.test(href)) return document.createTextNode(text);
  const a = el("a", "", text);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

type Row = { main: Node[]; meta: Node[]; title?: string };

// Fills a timeline's fixed rows; rows without an item go blank but keep their height.
function fillRows(list: Element, rows: Row[]): void {
  list.querySelectorAll<HTMLElement>(".ab-tl-row").forEach((li, i) => {
    const row = rows[i];
    const main = li.querySelector<HTMLElement>(".ab-tl-main");
    const meta = li.querySelector<HTMLElement>(".ab-tl-meta");
    if (!main || !meta) return;
    li.hidden = false;
    main.replaceChildren(...(row?.main ?? [document.createTextNode(" ")]));
    meta.replaceChildren(...(row?.meta ?? [document.createTextNode(" ")]));
    if (row?.title) main.title = row.title;
    li.querySelector(".ab-tl-mark")?.toggleAttribute("hidden", !row);
  });
}
function failRows(list: Element): void {
  const first = list.querySelector(".ab-tl-main");
  if (first) first.textContent = "unavailable";
}

const releaseRows = (list: Release[]): Row[] =>
  list
    .filter((r) => !r.draft)
    .map((r) => {
      const name = r.name?.trim() || r.tag_name;
      const main: Node[] = [link(name, r.html_url)];
      if (name !== r.tag_name) main.push(el("span", "ab-tl-tag", r.tag_name));
      const when = r.published_at ? longDate(r.published_at) : "-";
      return { main, meta: [document.createTextNode(`${when} · ${r.author?.login ?? "-"}`)], title: name };
    });

function npmRows(name: string, t: NpmTime): Row[] {
  if (!t.latest) return [];
  const pkg = `@ujjwalvivek/${name}`;
  const v = t.latest;
  return [{
    main: [link(`v${v}`, `https://www.npmjs.com/package/${pkg}/v/${v}`)],
    meta: [document.createTextNode(`${t.published_at ? longDate(t.published_at) : "-"} · npm`)],
    title: `${pkg} ${v}`,
  }];
}

const commitRows = (list: Commit[]): Row[] =>
  [...list]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .map((c) => {
      const msg = String(c.message).split("\n")[0] ?? "";
      return {
        main: [link(msg, c.url)],
        meta: [
          document.createTextNode(`${shortDate(c.date)} · ${c.sha.slice(0, 7)} · `),
          el("span", "ab-add", `+${fmt(c.additions ?? 0)}`),
          document.createTextNode(` -${fmt(c.deletions ?? 0)}`),
        ],
        title: msg,
      };
    });

// One live value per badge slot: data-ab-live="kind:arg".
function live(kind: string, arg: string): Promise<string | null> {
  switch (kind) {
    case "updated":
      return store<Repo>(`github:${arg}:repo`).then((r) => (r.pushed_at ? ago(r.pushed_at) : null));
    case "stars":
      return store<Repo>(`github:${arg}:repo`).then((r) => (typeof r.stargazers_count === "number" ? fmt(r.stargazers_count) : null));
    case "license":
      return store<Repo>(`github:${arg}:repo`).then((r) => {
        const id = r.license?.spdx_id;
        return id && id !== "NOASSERTION" ? id : null;
      });
    case "npm":
      return store<{ version?: string }>(`npm:${arg}`).then((p) => (p.version ? `v${p.version}` : null));
    case "crates":
      return store<{ crate?: { default_version?: string; max_version?: string } }>(`crates:${arg}`).then((c) => {
        const v = c.crate?.default_version ?? c.crate?.max_version;
        return v ? `v${v}` : null;
      });
    case "release":
      return store<Release[]>(`github:${arg}:releases`).then((l) => l.find((r) => !r.draft)?.tag_name ?? null);
    case "tag":
      return store<Tag[]>(`github:${arg}:tags`).then((l) => l[0]?.name ?? null);
    default:
      return Promise.resolve(null);
  }
}

export function mount(host: HTMLElement): () => void {
  let gone = false;
  const when = <T>(p: Promise<T>, ok: (v: T) => void, fail?: () => void) =>
    p.then(
      (v) => {
        if (!gone) ok(v);
      },
      (err: unknown) => {
        console.warn("about: live data unavailable:", err);
        if (!gone) fail?.();
      },
    );

  for (const slot of host.querySelectorAll<HTMLElement>("[data-ab-live]")) {
    const [kind = "", arg = ""] = (slot.dataset.abLive ?? "").split(":");
    when(live(kind, arg), (v) => {
      if (v) slot.textContent = v;
    });
  }
  for (const p of host.querySelectorAll<HTMLElement>("[data-ab-desc]")) {
    when(store<Repo>(`github:${p.dataset.abDesc}:repo`), (r) => {
      if (r.description) {
        p.textContent = r.description;
        p.title = r.description;
      }
    });
  }
  for (const list of host.querySelectorAll<HTMLElement>("[data-ab-releases]")) {
    when(store<Release[]>(`github:${list.dataset.abReleases}:releases`), (l) => fillRows(list, releaseRows(l)), () => failRows(list));
  }
  for (const list of host.querySelectorAll<HTMLElement>("[data-ab-npm-latest]")) {
    const name = list.dataset.abNpmLatest ?? "";
    when(store<NpmTime>(`npm:${name}:time`), (t) => fillRows(list, npmRows(name, t)), () => failRows(list));
  }
  for (const list of host.querySelectorAll<HTMLElement>("[data-ab-commits]")) {
    when(store<Commit[]>(`github:${list.dataset.abCommits}:commits`), (l) => fillRows(list, commitRows(l)), () => failRows(list));
  }

  // Command boxes copy their text; the check shows for 2 s after a real copy (v3's cargo box copied nothing).
  const timers = new Set<number>();
  const onClick = (e: MouseEvent) => {
    const box = (e.target as Element | null)?.closest?.<HTMLElement>("[data-ab-copy]");
    const text = box?.dataset.abCopy;
    if (!box || !text) return;
    navigator.clipboard?.writeText(text).then(
      () => {
        if (gone) return;
        box.classList.add("is-copied");
        box.setAttribute("aria-label", `Copied: ${text}`);
        const t = window.setTimeout(() => {
          box.classList.remove("is-copied");
          box.removeAttribute("aria-label");
          timers.delete(t);
        }, 2000);
        timers.add(t);
      },
      () => {},
    );
  };
  host.addEventListener("click", onClick);

  return () => {
    gone = true;
    host.removeEventListener("click", onClick);
    timers.forEach((t) => clearTimeout(t));
  };
}
