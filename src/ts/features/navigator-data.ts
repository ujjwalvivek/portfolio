// Where the GitHub navigator's data comes from, and what it costs.
//
// v3 went through echopoint for everything: four store keys for the boot screen and the /v1/github/contents proxy for
// every directory and file, one request per folder (tree and find walked the whole repo that way). The proxy has since
// been put behind a token, so in a browser it now answers 401 and v3's navigator cannot list anything; and its
// github:portfolio:user key is gone, which put v3's boot screen into "limited mode" on every open.
//
// v4 asks each source only for what it is good at:
//   echopoint /v1/store/github:<repo>:{repo,commits,langs}   boot screen; echopoint's cache, no GitHub quota
//   echopoint /v1/config                                     the public repos the `repo` command can switch to
//   api.github.com /repos/<o>/<r>/git/trees/<ref>?recursive=1 the whole file list with sizes, in ONE request
//   raw.githubusercontent.com/<o>/<r>/<ref>/<path>           file bytes; a CDN, outside the API quota
// So ls, cd, tree, find and tab completion are local after one API call per repo. GitHub allows 60 unauthenticated
// API calls an hour per IP; the tree is kept in localStorage for 10 minutes and revalidated with its ETag after that,
// and the quota GitHub reports is shown in the navigator. Raw file fetches stream, so large files show real progress.

const ECHOPOINT = "https://echopoint.ujjwalvivek.com";
const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";
export const OWNER = "ujjwalvivek";
const FRESH_MS = 10 * 60 * 1000;
const CACHE_PREFIX = "ghnav:tree:";

export type Kind = "dir" | "file" | "link";
export type Entry = { name: string; path: string; kind: Kind; size: number };

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

// Turns a failed GitHub API answer into a sentence a visitor can act on.
async function apiError(res: Response, what: string): Promise<FetchError> {
  if ((res.status === 403 || res.status === 429) && (quota?.remaining === 0 || res.headers.get("retry-after"))) {
    const at = quota?.reset ? ` It resets at ${clock(quota.reset)}.` : "";
    return new FetchError(`GitHub's limit of ${quota?.limit ?? 60} requests an hour for your network is used up.${at}`, res.status);
  }
  if (res.status === 404) return new FetchError(`${what} was not found on GitHub (404).`, 404);
  let detail = "";
  try {
    detail = ((await res.json()) as { message?: string }).message ?? "";
  } catch {}
  return new FetchError(`GitHub answered ${res.status} for ${what}${detail ? `: ${detail}` : ""}.`, res.status);
}

function offline(err: unknown, what: string): FetchError {
  if (err instanceof FetchError) return err;
  if ((err as { name?: string } | null)?.name === "AbortError") return new FetchError("cancelled", -1);
  return new FetchError(`Could not reach ${what}; check the connection.`);
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
export async function boot(name: string, signal: AbortSignal): Promise<Boot> {
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

// The repo's metadata straight from GitHub, for a repo echopoint does not track (costs one API call).
export async function repoFromGitHub(name: string, signal: AbortSignal): Promise<Repo> {
  let res: Response;
  try {
    res = await fetch(`${API}/repos/${OWNER}/${encodeURIComponent(name)}`, { signal, headers: { accept: "application/vnd.github+json" } });
  } catch (err) {
    throw offline(err, "GitHub");
  }
  noteQuota(res);
  if (!res.ok) throw await apiError(res, `${OWNER}/${name}`);
  return toRepo((await res.json()) as RawRepo, name);
}

export async function publicRepos(signal: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch(`${ECHOPOINT}/v1/config`, { signal });
    if (!res.ok) throw new FetchError(`echopoint answered ${res.status}`, res.status);
    const cfg = (await res.json()) as { github?: { repos?: { name?: string; owner?: string; private?: boolean; tracked?: boolean }[] } };
    return (cfg.github?.repos ?? [])
      .filter((r) => r.name && r.owner === OWNER && !r.private && r.tracked !== false)
      .map((r) => r.name!)
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    throw offline(err, "echopoint");
  }
}

// ---- the file list (one GitHub API call) --------------------------------------------------------------------------

export type Tree = {
  repo: string;
  ref: string;
  truncated: boolean;
  fetchedAt: number;
  fromCache: "fresh" | "revalidated" | "stale" | null; // null: fetched now
  note: string | null; // why a stale copy is shown
  dirs: Map<string, Entry[]>; // "" is the root; children sorted dirs first, then by name
  files: Map<string, Entry>; // every entry by path
};

type Cached = { at: number; etag: string; ref: string; truncated: boolean; items: [string, 0 | 1 | 2, number][] };

function readCache(repo: string): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + repo);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}
function writeCache(repo: string, c: Cached) {
  try {
    localStorage.setItem(CACHE_PREFIX + repo, JSON.stringify(c));
  } catch {
    // storage full or blocked: the in-memory tree still works for this visit
  }
}

function build(repo: string, c: Cached, fromCache: Tree["fromCache"], note: string | null = null): Tree {
  const files = new Map<string, Entry>();
  const dirs = new Map<string, Entry[]>([["", []]]);
  const kinds: Kind[] = ["file", "dir", "link"];
  for (const [path, k, size] of c.items) {
    const slash = path.lastIndexOf("/");
    const e: Entry = { name: path.slice(slash + 1), path, kind: kinds[k] ?? "file", size };
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
  return { repo, ref: c.ref, truncated: c.truncated, fetchedAt: c.at, fromCache, note, dirs, files };
}

const memory = new Map<string, Tree>();

type RawTree = { truncated?: boolean; tree?: { path: string; type: string; size?: number }[] };

export async function loadTree(repo: string, ref: string, signal: AbortSignal): Promise<Tree> {
  const held = memory.get(repo);
  if (held && Date.now() - held.fetchedAt < FRESH_MS) return held;
  const cached = readCache(repo);
  if (cached && cached.ref === ref && Date.now() - cached.at < FRESH_MS) {
    const t = build(repo, cached, "fresh");
    memory.set(repo, t);
    return t;
  }

  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (cached?.ref === ref && cached.etag) headers["if-none-match"] = cached.etag;
  let res: Response;
  try {
    res = await fetch(`${API}/repos/${OWNER}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(ref)}?recursive=1`, { signal, headers });
  } catch (err) {
    const e = offline(err, "GitHub");
    if (cached && e.status !== -1) return keep(repo, cached);
    throw e;
  }
  noteQuota(res);
  if (res.status === 304 && cached) {
    cached.at = Date.now();
    writeCache(repo, cached);
    const t = build(repo, cached, "revalidated");
    memory.set(repo, t);
    return t;
  }
  if (!res.ok) {
    const e = await apiError(res, `${OWNER}/${repo}`);
    if (cached && e.status !== 404) return keep(repo, cached, e);
    throw e;
  }
  const data = (await res.json()) as RawTree;
  const items: Cached["items"] = (data.tree ?? []).map((n) => [n.path, n.type === "tree" ? 1 : n.type === "commit" ? 2 : 0, n.size ?? 0]);
  const fresh: Cached = { at: Date.now(), etag: res.headers.get("etag") ?? "", ref, truncated: !!data.truncated, items };
  writeCache(repo, fresh);
  const t = build(repo, fresh, null);
  memory.set(repo, t);
  return t;
}

// GitHub is unreachable or out of quota but an older copy is at hand: use it and say how old it is.
// Not kept in memory, so the next command tries GitHub again.
function keep(repo: string, cached: Cached, why?: FetchError): Tree {
  return build(repo, cached, "stale", why?.message ?? "GitHub could not be reached.");
}

// ---- file bytes (raw CDN, streamed) --------------------------------------------------------------------------------

export const rawUrl = (repo: string, ref: string, path: string) =>
  `${RAW}/${OWNER}/${encodeURIComponent(repo)}/${encodeURIComponent(ref)}/${path.split("/").map(encodeURIComponent).join("/")}`;

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

// `expected` is the blob size from the tree; progress counts the bytes as they arrive (D-024: the bar is the download).
export async function fileBytes(
  repo: string, ref: string, path: string, expected: number, signal: AbortSignal, progress?: (got: number, total: number) => void,
): Promise<Uint8Array> {
  const key = `${repo}@${ref}:${path}`;
  const hit = bytesCache.get(key);
  if (hit) return hit;
  let res: Response;
  try {
    res = await fetch(rawUrl(repo, ref, path), { signal });
  } catch (err) {
    throw offline(err, "raw.githubusercontent.com");
  }
  if (res.status === 404) throw new FetchError(`${path} was not found on the ${ref} branch (404).`, 404);
  if (res.status === 429) throw new FetchError("GitHub's file server is rate limiting this network; try again in a minute.", 429);
  if (!res.ok) throw new FetchError(`GitHub's file server answered ${res.status} for ${path}.`, res.status);
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    remember(key, buf);
    return buf;
  }
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.byteLength;
      progress?.(got, Math.max(expected, got));
    }
  } catch (err) {
    throw offline(err, "raw.githubusercontent.com");
  }
  const out = new Uint8Array(got);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  remember(key, out);
  return out;
}
