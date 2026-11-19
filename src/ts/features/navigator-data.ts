// Where the GitHub navigator's data comes from. It shows one repo, github.com/ujjwalvivek/portfolio.
//
// v3 went through echopoint's /v1/github/contents proxy for every directory and file. That proxy now needs a token,
// so in a browser it answers 401 and v3's navigator cannot list anything.
//
// v4 asks echopoint first and GitHub second:
//   echopoint /v1/store/github:portfolio:{repo,commits,langs}   boot screen, from echopoint's store
//   echopoint /v1/store/github:portfolio:tree                   the whole file list with blob shas, refreshed by
//                                                               echopoint on push with its own token
//   echopoint /v1/github/blob?repo=portfolio&sha=<sha>          file bytes, cached at the edge for a year
// Until echopoint serves the tree key (it needs a deploy), or whenever it fails, the navigator falls back to
//   api.github.com /repos/<o>/<r>/git/trees/<ref>?recursive=1   one API call, kept in localStorage for 10 minutes
//                                                               and revalidated with its ETag
//   raw.githubusercontent.com/<o>/<r>/<ref>/<path>              file bytes; a CDN, outside the API quota
// Neither path puts a secret in the browser. Only the GitHub fallback counts against the visitor's 60 calls an hour.

const ECHOPOINT = "https://echopoint.ujjwalvivek.com";
const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";
export const OWNER = "ujjwalvivek";
export const REPO = "portfolio";
const FRESH_MS = 10 * 60 * 1000;
const CACHE_PREFIX = "ghnav:tree:";

export type Kind = "dir" | "file" | "link";
export type Entry = { name: string; path: string; kind: Kind; size: number; sha: string | null };

export type Repo = {
  name: string;
  description: string;
  branch: string;
  created: string | null;
  pushed: string | null;
  stars: number | null;
  forks: number | null;
  sizeKb: number | null;
  license: string | null;
};
export type Commit = { message: string; date: string | null; url: string | null };
export type Boot = { repo: Repo | null; commits: Commit[]; langs: [string, number][]; failed: string[] };

export type Quota = { limit: number; remaining: number; reset: number }; // reset: epoch seconds
let quota: Quota | null = null;
export const currentQuota = () => quota;

export class FetchError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
  }
}

function noteQuota(res: Response) {
  const limit = Number(res.headers.get("x-ratelimit-limit"));
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(limit) && limit > 0 && Number.isFinite(remaining)) quota = { limit, remaining, reset };
}

const clock = (epochSeconds: number) =>
  new Date(epochSeconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Turns a failed GitHub API answer into one short sentence.
async function apiError(res: Response, what: string): Promise<FetchError> {
  if ((res.status === 403 || res.status === 429) && (quota?.remaining === 0 || res.headers.get("retry-after"))) {
    return new FetchError(`GitHub rate limit reached.${quota?.reset ? ` Resets at ${clock(quota.reset)}.` : ""}`, res.status);
  }
  if (res.status === 404) return new FetchError(`${what} not found (404).`, 404);
  return new FetchError(`GitHub answered ${res.status} for ${what}.`, res.status);
}

function offline(err: unknown, what: string): FetchError {
  if (err instanceof FetchError) return err;
  if ((err as { name?: string } | null)?.name === "AbortError") return new FetchError("cancelled", -1);
  return new FetchError(`Could not reach ${what}.`);
}

// ---- boot screen (echopoint) --------------------------------------------------------------------------------------

async function store<T>(key: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${ECHOPOINT}/v1/store/${encodeURIComponent(key)}`, { signal });
  if (!res.ok) throw new FetchError(`${key}: ${res.status}`, res.status);
  return (await res.json()) as T;
}

type RawRepo = {
  name?: string; description?: string | null; default_branch?: string; created_at?: string; pushed_at?: string;
  stargazers_count?: number; forks_count?: number; size?: number; license?: { spdx_id?: string; name?: string } | null;
};
type RawCommit = { message?: string; date?: string; url?: string; commit?: { message?: string; author?: { date?: string } } };

function toRepo(r: RawRepo, name: string): Repo {
  return {
    name: r.name ?? name,
    description: r.description ?? "",
    branch: r.default_branch ?? "HEAD",
    created: r.created_at ?? null,
    pushed: r.pushed_at ?? null,
    stars: r.stargazers_count ?? null,
    forks: r.forks_count ?? null,
    sizeKb: r.size ?? null,
    license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : (r.license?.name ?? null),
  };
}

// Each part loads on its own, so one missing key no longer blanks the whole screen (v3 used Promise.all).
export async function boot(signal: AbortSignal): Promise<Boot> {
  const name = REPO;
  const [repo, commits, langs] = await Promise.allSettled([
    store<RawRepo>(`github:${name}:repo`, signal),
    store<RawCommit[]>(`github:${name}:commits`, signal),
    store<Record<string, number>>(`github:${name}:langs`, signal),
  ]);
  if (signal.aborted) throw new FetchError("cancelled", -1);
  const failed: string[] = [];
  if (repo.status === "rejected") failed.push("repository");
  if (commits.status === "rejected") failed.push("commits");
  if (langs.status === "rejected") failed.push("languages");
  return {
    repo: repo.status === "fulfilled" ? toRepo(repo.value, name) : null,
    commits:
      commits.status === "fulfilled" && Array.isArray(commits.value)
        ? commits.value.slice(0, 3).map((c) => ({
            message: (c.message ?? c.commit?.message ?? "no commit message").split("\n")[0]!,
            date: c.date ?? c.commit?.author?.date ?? null,
            url: c.url ?? null,
          }))
        : [],
    langs:
      langs.status === "fulfilled" && langs.value && typeof langs.value === "object"
        ? Object.entries(langs.value).filter((e): e is [string, number] => typeof e[1] === "number").sort((a, b) => b[1] - a[1])
        : [],
    failed,
  };
}

// ---- the file list (echopoint's store, else one GitHub API call) --------------------------------------------------

export type Tree = {
  ref: string;
  source: "echopoint" | "github";
  truncated: boolean;
  fetchedAt: number;
  fromCache: "fresh" | "revalidated" | "stale" | null; // null: fetched now
  note: string | null; // why a stale copy is shown
  dirs: Map<string, Entry[]>; // "" is the root; children sorted dirs first, then by name
  files: Map<string, Entry>; // every entry by path
};

type Item = [string, 0 | 1 | 2, number, (string | null)?]; // path, kind (file, dir, link), size, blob sha
type Cached = { at: number; etag: string; ref: string; truncated: boolean; items: Item[] };
const CACHE_KEY = CACHE_PREFIX + REPO;

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}
function writeCache(c: Cached) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    // storage full or blocked: the in-memory tree still works for this visit
  }
}

function build(c: Cached, source: Tree["source"], fromCache: Tree["fromCache"], note: string | null = null): Tree {
  const files = new Map<string, Entry>();
  const dirs = new Map<string, Entry[]>([["", []]]);
  const kinds: Kind[] = ["file", "dir", "link"];
  for (const [path, k, size, sha] of c.items) {
    const slash = path.lastIndexOf("/");
    const e: Entry = { name: path.slice(slash + 1), path, kind: kinds[k] ?? "file", size, sha: sha ?? null };
    files.set(path, e);
    if (e.kind === "dir" && !dirs.has(path)) dirs.set(path, []);
  }
  for (const e of files.values()) {
    const parent = e.path.includes("/") ? e.path.slice(0, e.path.lastIndexOf("/")) : "";
    let list = dirs.get(parent);
    if (!list) dirs.set(parent, (list = []));
    list.push(e);
  }
  for (const list of dirs.values())
    list.sort((a, b) => (a.kind === "dir") !== (b.kind === "dir") ? (a.kind === "dir" ? -1 : 1) : a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return { ref: c.ref, source, truncated: c.truncated, fetchedAt: c.at, fromCache, note, dirs, files };
}

let memory: Tree | null = null;
let blobsFromEchopoint = false; // set once echopoint served the tree, so its blob route has the same shas

// echopoint's copy of the tree. null when it does not have one yet (before the deploy) or cannot be reached.
async function echopointTree(signal: AbortSignal): Promise<Cached | null> {
  try {
    const data = await store<{ truncated?: boolean; items?: Item[] }>(`github:${REPO}:tree`, signal);
    if (!Array.isArray(data.items) || !data.items.length) return null;
    return { at: Date.now(), etag: "", ref: "HEAD", truncated: !!data.truncated, items: data.items };
  } catch (err) {
    if ((err as { name?: string } | null)?.name === "AbortError" || signal.aborted) throw new FetchError("cancelled", -1);
    return null;
  }
}

type RawTree = { truncated?: boolean; tree?: { path: string; type: string; size?: number; sha?: string }[] };

export async function loadTree(ref: string, signal: AbortSignal): Promise<Tree> {
  if (memory && Date.now() - memory.fetchedAt < FRESH_MS) return memory;

  const fromEcho = await echopointTree(signal);
  if (fromEcho) {
    blobsFromEchopoint = true;
    return (memory = build(fromEcho, "echopoint", null));
  }

  const cached = readCache();
  if (cached && cached.ref === ref && Date.now() - cached.at < FRESH_MS) return (memory = build(cached, "github", "fresh"));

  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (cached?.ref === ref && cached.etag) headers["if-none-match"] = cached.etag;
  let res: Response;
  try {
    res = await fetch(`${API}/repos/${OWNER}/${REPO}/git/trees/${encodeURIComponent(ref)}?recursive=1`, { signal, headers });
  } catch (err) {
    const e = offline(err, "GitHub");
    if (cached && e.status !== -1) return keep(cached, e);
    throw e;
  }
  noteQuota(res);
  if (res.status === 304 && cached) {
    cached.at = Date.now();
    writeCache(cached);
    return (memory = build(cached, "github", "revalidated"));
  }
  if (!res.ok) {
    const e = await apiError(res, `${OWNER}/${REPO}`);
    if (cached && e.status !== 404) return keep(cached, e);
    throw e;
  }
  const data = (await res.json()) as RawTree;
  const items: Item[] = (data.tree ?? []).map((n) => [n.path, n.type === "tree" ? 1 : n.type === "commit" ? 2 : 0, n.size ?? 0, n.type === "blob" ? (n.sha ?? null) : null]);
  const fresh: Cached = { at: Date.now(), etag: res.headers.get("etag") ?? "", ref, truncated: !!data.truncated, items };
  writeCache(fresh);
  return (memory = build(fresh, "github", null));
}

// GitHub is unreachable or out of quota but an older copy is at hand: use it and say how old it is.
// Not kept in memory, so the next command tries again.
function keep(cached: Cached, why: FetchError): Tree {
  return build(cached, "github", "stale", why.message);
}

// ---- file bytes (echopoint's blob route, else the raw CDN; streamed) ----------------------------------------------

export const rawUrl = (ref: string, path: string) =>
  `${RAW}/${OWNER}/${REPO}/${encodeURIComponent(ref)}/${path.split("/").map(encodeURIComponent).join("/")}`;
const blobUrl = (sha: string) => `${ECHOPOINT}/v1/github/blob?repo=${REPO}&sha=${sha}`;

const bytesCache = new Map<string, Uint8Array>(); // a few recent files, so cat then code costs one download
function remember(key: string, data: Uint8Array) {
  bytesCache.set(key, data);
  let total = 0;
  for (const v of bytesCache.values()) total += v.byteLength;
  for (const k of bytesCache.keys()) {
    if (total <= 4 * 1024 * 1024 || bytesCache.size <= 1) break;
    total -= bytesCache.get(k)!.byteLength;
    bytesCache.delete(k);
  }
}

async function readAll(res: Response, expected: number, progress?: (got: number, total: number) => void): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    got += value.byteLength;
    progress?.(got, Math.max(expected, got));
  }
  const out = new Uint8Array(got);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

// Progress counts the bytes as they arrive against the size from the tree (D-024: the bar is the download).
export async function fileBytes(
  ref: string, entry: Entry, signal: AbortSignal, progress?: (got: number, total: number) => void,
): Promise<Uint8Array> {
  const key = entry.sha ?? `${ref}:${entry.path}`;
  const hit = bytesCache.get(key);
  if (hit) return hit;

  if (blobsFromEchopoint && entry.sha) {
    try {
      const res = await fetch(blobUrl(entry.sha), { signal });
      if (res.ok) {
        const buf = await readAll(res, entry.size, progress);
        remember(key, buf);
        return buf;
      }
    } catch (err) {
      if (signal.aborted) throw new FetchError("cancelled", -1);
      // echopoint failed mid-way: fall through to GitHub's CDN
    }
  }

  let res: Response;
  try {
    res = await fetch(rawUrl(ref, entry.path), { signal });
  } catch (err) {
    throw offline(err, "raw.githubusercontent.com");
  }
  if (res.status === 404) throw new FetchError(`${entry.path} not found on ${ref} (404).`, 404);
  if (res.status === 429) throw new FetchError("GitHub file server rate limit reached. Try again in a minute.", 429);
  if (!res.ok) throw new FetchError(`GitHub file server answered ${res.status} for ${entry.path}.`, res.status);
  try {
    const buf = await readAll(res, entry.size, progress);
    remember(key, buf);
    return buf;
  } catch (err) {
    throw offline(err, "raw.githubusercontent.com");
  }
}
