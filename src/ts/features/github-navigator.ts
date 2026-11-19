// The GitHub navigator (v3's "GitHub Terminal Explorer", ADR ledger M6): a shell over github.com/ujjwalvivek/portfolio
// with ls, cd, pwd, tree, find, cat and code, a read-only editor with syntax highlighting, and a boot screen of the
// repo's recent commits, stats and languages. open() is what the command palette calls; it is idempotent.
//
// Kept from v3: the layout (title bar with the copyable remote URL, Shell / Editor tabs, transcript of framed panels,
// live prompt uv@repo:~/path $, braille spinner while a command runs), every command and its output panel, the
// 50-line cat preview, the 1 MB editor limit, history on the arrows, Ctrl+L, Ctrl+S download, copy buffer, VS Code
// for the web, the empty-transcript line. Esc closes the editor, then the navigator (D-023; v3 used Ctrl+Q).
//
// Changed from v3: it works again (v3's contents proxy now needs a token; see navigator-data.ts for echopoint first,
// GitHub second), the whole file list comes in one request so tree and find are instant, rows open what they show,
// an explorer side bar, Tab completion, Ctrl+C cancels, images show as images, PDFs open in the site's PDF viewer,
// binaries say so, the boot screen shows what loaded even when one part fails, downloads show real byte progress,
// and GitHub's rate limit is shown when the GitHub path is in use (D-024: every spinner and bar is a request).

import { openOverlay, isOpen } from "../shell/overlay.js";
import { loadFeature } from "../lib/lazy.js";
import {
  OWNER, REPO, boot, loadTree, fileBytes, rawUrl, currentQuota, FetchError,
  type Boot, type Entry, type Tree,
} from "./navigator-data.js";
import { languageFor, ready, highlight, plain, type Language } from "./navigator-highlight.js";

const ID = "github-navigator";
const CSS = "/css/features/github-navigator.css";
const MAX_CAT_LINES = 50;
const MAX_EDITOR_BYTES = 1024 * 1024;
const MAX_HIGHLIGHT_BYTES = 256 * 1024; // above this the buffer shows as plain text, so a big file never stalls the page
const MAX_FIND = 40;
const MAX_TREE_NODES = 600;
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const IMAGE = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico"]);
const BINARY = new Set([
  "woff", "woff2", "ttf", "otf", "eot", "wasm", "zip", "gz", "tgz", "xz", "7z", "rar", "tar", "exe", "dll", "so", "dylib",
  "bin", "o", "a", "lib", "pdb", "class", "jar", "mp3", "mp4", "ogg", "wav", "flac", "webm", "mov", "glb", "gltf", "fbx",
  "blend", "psd", "unitypackage", "ktx2", "dds", "hdr", "exr", "sqlite", "db", "pyc", "iso", "img",
]);

const HELP: { title: string; rows: [string, string][] }[] = [
  { title: "navigation", rows: [["ls [path]", "List directory contents"], ["cd [dir]", "Enter a directory"], ["pwd", "Show current repo path"], ["tree [n]", "Render directory tree"]] },
  { title: "files", rows: [["cat [file]", "Preview file contents"], ["code [file]", "Open file buffer"], ["find [name]", "Search files and folders"]] },
  { title: "session", rows: [["help", "Show command reference"], ["clear", "Clear transcript"], ["exit", "Close the navigator"]] },
];
const KEYS_SHELL: [string, string][] = [["Tab", "complete"], ["↑ ↓", "history"], ["Ctrl+L", "clear"], ["Ctrl+C", "cancel"]];
const KEYS_EDITOR: [string, string][] = [["Ctrl+S", "Download buffer"], ["Esc", "Close buffer"]];

const FILE_ICON: Record<string, string> = {
  js: "tb-file-type-js", mjs: "tb-file-type-js", cjs: "tb-file-type-js", jsx: "tb-file-type-js", css: "tb-file-type-css",
  scss: "tb-file-type-css", html: "tb-file-type-html", htm: "tb-file-type-html", md: "ai-twotone-file-markdown",
  json: "bs-filetype-json", yml: "si-yaml", yaml: "si-yaml", sh: "tb-brand-powershell", ps1: "tb-brand-powershell",
  toml: "si-toml", license: "tb-license", txt: "tb-file-type-txt", rs: "fa-rust", go: "si-go", ts: "si-typescript",
  tsx: "si-typescript", wgsl: "si-webgpu", wasm: "si-webassembly", pdf: "pi-file-pdf-fill", sql: "tb-sql",
};
const LANG_ICON: Record<string, string> = {
  JavaScript: "fa-js", HTML: "si-html5", CSS: "si-csswizardry", Shell: "io-terminal-sharp", JSON: "si-json", YAML: "si-yaml",
  Markdown: "ri-markdown-fill", TOML: "si-toml", Rust: "fa-rust", Go: "si-go", TypeScript: "si-typescript", WGSL: "si-webgpu",
  PowerShell: "tb-brand-powershell",
};

// ---- small helpers ------------------------------------------------------------------------------------------------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function icon(id: string, cls = "icon"): SVGSVGElement {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("class", cls);
  s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", `/icons.svg#${id}`);
  s.append(u);
  return s;
}
const ext = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : name.toLowerCase());
const fileIcon = (e: { name: string; kind: string }) => (e.kind === "dir" ? "im-folder" : e.kind === "link" ? "fa-git" : (FILE_ICON[ext(e.name)] ?? "fa-file"));
const shellPath = (p: string) => `~/${p || "root"}`;
const absPath = (p: string) => `/${p || "root"}`;

function date(value: string | null, withTime = false): string {
  if (!value) return "unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
}
function size(bytes = 0): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
function parseLine(line: string): string[] {
  const args: string[] = [];
  let cur = "";
  let quote = "";
  let had = false;
  for (const ch of line) {
    if (!quote && (ch === '"' || ch === "'")) {
      quote = ch;
      had = true;
    } else if (quote && ch === quote) quote = "";
    else if (!quote && ch === " ") {
      if (cur || had) args.push(cur);
      cur = "";
      had = false;
    } else cur += ch;
  }
  if (cur || had) args.push(cur);
  return args;
}
function resolve(base: string, raw = ""): string {
  const parts = raw.startsWith("/") || raw === "~" || raw.startsWith("~/") ? [] : base.split("/").filter(Boolean);
  for (const seg of raw.replace(/^~\/?/, "").split("/").filter(Boolean)) {
    if (seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}
const quoteArg = (s: string) => (/[\s"']/.test(s) ? `"${s.replace(/"/g, "")}"` : s);
function binaryish(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 8000);
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return true;
  return false;
}

type Tone = "info" | "success" | "warning" | "error" | "muted";
type Buffer =
  | { kind: "text"; path: string; name: string; text: string; lang: Language | null; size: number; lines: number; plainReason: string }
  | { kind: "image" | "pdf" | "binary" | "large" | "link"; path: string; name: string; size: number };

// ---- the navigator ------------------------------------------------------------------------------------------------

let opening = false;

export function open(): void {
  if (isOpen(ID)) {
    document.querySelector<HTMLInputElement>(".ghn-input")?.focus({ preventScroll: true });
    return;
  }
  if (opening) return;
  opening = true;
  // the stylesheet first (a few ms, real work), so the window never draws unstyled
  void loadFeature(import.meta.url, [CSS])
    .catch(() => {})
    .finally(() => {
      opening = false;
      if (!isOpen(ID)) openOverlay({ id: ID, title: "Repository Navigator", icon: "/icons.svg#fa-github", build, foot });
    });
}

let footHook: ((foot: HTMLElement) => void) | null = null;
function foot(f: HTMLElement): void {
  footHook?.(f);
}

function build(body: HTMLElement, close: () => void): () => void {
  const session = new AbortController();
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };

  const repoName = REPO;
  let ref = "HEAD";
  let tree: Tree | null = null;
  let treeLoad: Promise<Tree> | null = null;
  let cwd = "";
  const history: string[] = [];
  let hIndex = 0;
  let busy: AbortController | null = null;
  let buffer: Buffer | null = null;
  let undoViewer: (() => void) | null = null;
  let objectUrl: string | null = null;
  let editorLoad: AbortController | null = null;

  // ---- frame -----------------------------------------------------------------------------------------------------
  const card = body.parentElement!;
  card.classList.add("ghn-card");
  body.classList.add("ghn-body");
  const head = card.querySelector<HTMLElement>(".overlay-head")!;
  const remote = el("button", "ghn-remote");
  remote.type = "button";
  remote.title = "Copy GitHub URL";
  const remoteValue = el("span", "ghn-remote-value");
  remote.append(remoteValue, el("span", "ghn-remote-label", "[remote]"));
  // compact two-line title: the window's name, and the remote under it
  const titles = el("div", "ghn-titles");
  const title = head.querySelector(".overlay-title");
  title?.replaceWith(titles);
  if (title) titles.append(title);
  titles.append(remote);

  const root = el("div", "ghn");
  root.dataset.keys = "off";

  const bar = el("div", "ghn-bar");
  const sideKey = el("button", "ghn-key ghn-icon");
  sideKey.type = "button";
  sideKey.title = "Explorer";
  sideKey.setAttribute("aria-label", "Explorer");
  sideKey.append(icon("ri-sidebar-unfold-line"));
  const tabs = el("div", "ghn-tabs");
  tabs.setAttribute("role", "tablist");
  const shellTab = el("button", "ghn-tab");
  shellTab.type = "button";
  shellTab.setAttribute("role", "tab");
  shellTab.append(icon("io-terminal-sharp"), el("span", "", "Shell"));
  const editorTab = el("button", "ghn-tab");
  editorTab.type = "button";
  editorTab.setAttribute("role", "tab");
  const editorTabLabel = el("span", "ghn-tab-label");
  const editorTabIcon = el("span", "ghn-tab-icon");
  editorTab.append(editorTabIcon, editorTabLabel);
  const ro = el("span", "ghn-badge", "read only");
  tabs.append(shellTab, ro, editorTab);
  const actions = el("div", "ghn-actions");
  const mkKey = (iconId: string, title: string, onClick: () => void) => {
    const b = el("button", "ghn-key ghn-icon");
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    b.append(icon(iconId));
    b.addEventListener("click", onClick);
    return b;
  };
  const saveKey = mkKey("ai-fill-save", "Download buffer (Ctrl+S)", () => download());
  const copyKey = mkKey("md-content-copy", "Copy buffer", () => void copyBuffer());
  const codeKey = mkKey("vsc-vscode", "Open in VS Code for the web", () => window.open(vscodeUrl(), "_blank", "noopener,noreferrer"));
  const ghKey = mkKey("fa-github", "Open on GitHub", () => window.open(blobUrl(), "_blank", "noopener,noreferrer"));
  const shutKey = mkKey("md-exit-to-app", "Close buffer (Esc)", () => closeEditor());
  actions.append(saveKey, copyKey, codeKey, ghKey, shutKey);
  const quotaOut = el("span", "ghn-quota");
  quotaOut.title = "GitHub API requests left this hour for your network";
  bar.append(sideKey, tabs, actions, quotaOut);

  const main = el("div", "ghn-main");
  const side = el("nav", "ghn-side");
  side.setAttribute("aria-label", "Files");
  const sideHead = el("div", "ghn-side-head");
  const sideTitle = el("span", "ghn-panel-title", "explorer");
  const sideMeta = el("span", "ghn-meta");
  sideHead.append(sideTitle, sideMeta);
  const sideList = el("ul", "ghn-tree-root");
  sideList.setAttribute("role", "tree");
  side.append(sideHead, sideList);

  const work = el("div", "ghn-work");
  const out = el("div", "ghn-out");
  const log = el("div", "ghn-log");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");
  const live = el("label", "ghn-live");
  const prompt = el("span", "ghn-prompt");
  const spin = el("span", "ghn-spin");
  spin.hidden = true;
  const input = el("input", "ghn-input");
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("aria-label", "Command");
  input.placeholder = "type a command, or pick one";
  live.append(prompt, spin, input);
  out.append(log, live);

  const editor = el("section", "ghn-editor");
  editor.hidden = true;
  editor.setAttribute("aria-label", "Editor");
  const edView = el("div", "ghn-ed-view");
  edView.tabIndex = 0;
  const edFoot = el("div", "ghn-ed-foot");
  const edInfo = el("div", "ghn-ed-info");
  const edStatus = el("span", "ghn-ed-status");
  edStatus.setAttribute("role", "status");
  const edKeys = el("div", "ghn-ed-keys");
  for (const [k, d] of KEYS_EDITOR) {
    const chip = el("span", "ghn-chip");
    chip.append(el("kbd", "", k), document.createTextNode(` ${d}`));
    edKeys.append(chip);
  }
  edFoot.append(edInfo, edStatus, edKeys);
  editor.append(edView, edFoot);
  work.append(out, editor);
  main.append(side, work);
  root.append(bar, main);
  body.append(root);

  const narrow = matchMedia("(max-width: 760px)");
  let sideOpen = !narrow.matches;
  const syncSide = () => {
    root.classList.toggle("is-side", sideOpen);
    sideKey.setAttribute("aria-pressed", String(sideOpen));
  };
  sideKey.addEventListener("click", () => {
    sideOpen = !sideOpen;
    syncSide();
  });
  syncSide();

  // ---- header and prompt -----------------------------------------------------------------------------------------
  const treeUrl = (): string => `https://github.com/${OWNER}/${repoName}${cwd ? `/tree/${ref}/${cwd}` : ""}`;
  const blobUrl = (): string => (buffer ? `https://github.com/${OWNER}/${repoName}/blob/${ref}/${buffer.path}` : treeUrl());
  const githubUrl = (): string => (buffer ? blobUrl() : treeUrl());
  const vscodeUrl = () => `https://vscode.dev/github/${OWNER}/${repoName}${buffer ? `/blob/${ref}/${buffer.path}` : ""}`;
  let copiedUntil = 0;
  const syncHead = () => {
    if (Date.now() < copiedUntil) return;
    remoteValue.textContent = githubUrl().replace("https://", "");
  };
  remote.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(githubUrl());
      copiedUntil = Date.now() + 900;
      remoteValue.textContent = "copied to clipboard";
      remote.classList.add("is-copied");
      later(() => {
        remote.classList.remove("is-copied");
        syncHead();
      }, 900);
    } catch (err) {
      push(message("error", "clipboard", [`Unable to copy URL: ${(err as Error).message}`]));
    }
  });
  const syncPrompt = () => {
    prompt.replaceChildren(
      el("span", "ghn-p-user", "uv"), el("span", "ghn-p-sep", "@"), el("span", "ghn-p-host", repoName),
      el("span", "ghn-p-sep", ":"), el("span", "ghn-p-path", shellPath(cwd)), el("span", "ghn-p-sep", "$"),
    );
    syncHead();
  };
  const syncQuota = () => {
    const q = currentQuota();
    quotaOut.hidden = !q;
    if (q) {
      quotaOut.textContent = `api ${q.remaining}/${q.limit}`;
      quotaOut.classList.toggle("is-low", q.remaining <= 5);
    }
  };

  // ---- transcript ------------------------------------------------------------------------------------------------
  const scrollDown = () => (out.scrollTop = out.scrollHeight);
  const push = (...nodes: (HTMLElement | null)[]) => {
    for (const n of nodes) if (n) log.append(n);
    log.querySelector(".ghn-empty")?.remove();
    scrollDown();
  };
  const clearLog = () => {
    log.replaceChildren(message("muted", "", ["Transcript cleared. Type `help` to rebuild context."]));
    log.firstElementChild?.classList.add("ghn-empty");
  };
  function panel(title: string, meta = "", tone: Tone = "info"): [HTMLElement, HTMLElement] {
    const sec = el("section", `ghn-panel is-${tone}`);
    if (title) {
      const h = el("header", "ghn-panel-head");
      h.append(el("span", "ghn-panel-title", title));
      if (meta) h.append(el("span", "ghn-meta", meta));
      sec.append(h);
    }
    const inner = el("div", "ghn-panel-body");
    sec.append(inner);
    return [sec, inner];
  }
  function message(tone: Tone, title: string, lines: string[], meta = ""): HTMLElement {
    const [sec, inner] = panel(title, meta, tone);
    for (const l of lines) inner.append(el("p", "ghn-line", l));
    return sec;
  }
  const echo = (cmd: string) => {
    const row = el("div", "ghn-echo");
    row.append(el("span", "ghn-echo-path", `${shellPath(cwd)} $`), el("span", "ghn-echo-cmd", cmd || " "));
    return row;
  };
  // a button that types and runs a command, so every listing doubles as navigation
  const runner = (cls: string, command: string) => {
    const b = el("button", cls);
    b.type = "button";
    b.addEventListener("click", () => void execute(command));
    return b;
  };
  const entryCommand = (e: Entry) => (e.kind === "dir" ? `cd ${quoteArg("/" + e.path)}` : `code ${quoteArg("/" + e.path)}`);

  function bootPanel(b: Boot): HTMLElement {
    const wrap = el("header", "ghn-boot");
    const section = (title: string) => {
      const s = el("section", "ghn-boot-sec");
      const h = el("div", "ghn-panel-head");
      h.append(el("span", "ghn-panel-title", title));
      s.append(h);
      wrap.append(s);
      return s;
    };
    const commits = section("recent commits");
    const cl = el("div", "ghn-list");
    for (const c of b.commits) {
      const row = el(c.url ? "a" : "div", "ghn-commit") as HTMLElement;
      if (c.url && row instanceof HTMLAnchorElement) {
        row.href = c.url;
        row.target = "_blank";
        row.rel = "noopener";
      }
      row.append(el("span", "ghn-commit-msg", c.message), el("span", "ghn-meta", date(c.date, true)));
      cl.append(row);
    }
    if (!b.commits.length) cl.append(el("p", "ghn-line ghn-dim", b.failed.includes("commits") ? "commits unavailable" : "no commits recorded"));
    commits.append(cl);

    const r = b.repo;
    const idn = section("repository");
    const box = el("div", "ghn-ident");
    box.append(el("h2", "ghn-ident-name", r?.name ?? repoName), el("p", "ghn-ident-desc", r?.description || "No repository description available."));
    const grid = el("div", "ghn-kv");
    const kv = (k: string, v: string) => grid.append(el("span", "ghn-meta", k), el("span", "ghn-kv-v", v));
    kv("branch", r?.branch ?? ref);
    kv("created", date(r?.created ?? null));
    kv("activity", date(b.commits[0]?.date ?? r?.pushed ?? null, true));
    box.append(grid);
    idn.append(box);

    const stats = section("statistics");
    const sl = el("div", "ghn-stats");
    const stat = (k: string, v: string) => {
      const s = el("div", "ghn-stat");
      s.append(el("span", "ghn-meta", k), el("span", "ghn-stat-v", v));
      sl.append(s);
    };
    stat("stars", r?.stars != null ? String(r.stars) : "-");
    stat("forks", r?.forks != null ? String(r.forks) : "-");
    stat("size", r?.sizeKb != null ? size(r.sizeKb * 1024) : "-");
    stat("license", r?.license ?? "-");
    stats.append(sl);

    const langs = section("languages");
    const ll = el("div", "ghn-list");
    const total = Math.max(1, b.langs.reduce((t, [, v]) => t + v, 0));
    for (const [name, bytes] of b.langs.slice(0, 4)) {
      const pct = Number(((bytes / total) * 100).toFixed(1));
      const row = el("div", "ghn-lang");
      const top = el("div", "ghn-lang-head");
      const label = el("span", "ghn-lang-name");
      label.append(icon(LANG_ICON[name] ?? "fa-file"), document.createTextNode(name));
      top.append(label, el("span", "ghn-meta", `${pct}%`));
      const track = el("div", "ghn-lang-track");
      const fill = el("div", "ghn-lang-fill");
      fill.style.setProperty("--pct", String(pct / 100));
      track.append(fill);
      row.append(top, track);
      ll.append(row);
    }
    if (!b.langs.length) ll.append(el("p", "ghn-line ghn-dim", "languages unavailable"));
    langs.append(ll);
    return wrap;
  }

  function listing(title: string, meta: string, items: Entry[]): HTMLElement {
    const [sec, inner] = panel(title, meta);
    const table = el("div", "ghn-table");
    const headRow = el("div", "ghn-table-head");
    headRow.append(el("span", "", "name"), el("span", "", "type"), el("span", "", "size"));
    table.append(headRow);
    for (const it of items) {
      const row = runner("ghn-row", entryCommand(it));
      row.title = it.kind === "dir" ? `cd /${it.path}` : `code /${it.path}`;
      const name = el("span", "ghn-row-name");
      name.append(icon(fileIcon(it)), el("span", "ghn-row-text", it.path.includes("/") && title.startsWith("search") ? it.path : it.name));
      row.append(name, el("span", "ghn-meta", it.kind === "dir" ? "dir" : it.kind === "link" ? "module" : "file"), el("span", "ghn-meta ghn-size", it.kind === "file" ? size(it.size) : "--"));
      table.append(row);
    }
    inner.append(table);
    return sec;
  }

  function help(): HTMLElement {
    const [sec, inner] = panel("command reference", "terminal and editor shortcuts");
    const grid = el("div", "ghn-help");
    for (const g of HELP) {
      const s = el("section", "ghn-help-group");
      s.append(el("span", "ghn-meta ghn-help-title", g.title));
      for (const [cmd, desc] of g.rows) {
        const row = el("div", "ghn-help-row");
        const c = runner("ghn-help-cmd", cmd.replace(/\s*\[.*$/, ""));
        c.textContent = cmd;
        row.append(c, el("span", "ghn-help-desc", desc));
        s.append(row);
      }
      grid.append(s);
    }
    const keys = el("div", "ghn-panel-foot");
    for (const [k, d] of [...KEYS_SHELL, ...KEYS_EDITOR]) {
      const chip = el("span", "ghn-chip");
      chip.append(el("kbd", "", k), document.createTextNode(` ${d}`));
      keys.append(chip);
    }
    inner.append(grid);
    sec.append(keys);
    return sec;
  }

  // ---- data ------------------------------------------------------------------------------------------------------
  async function ensureTree(signal: AbortSignal): Promise<Tree> {
    if (tree && tree.fromCache !== "stale") return tree;
    if (!treeLoad) {
      treeLoad = loadTree(ref, session.signal).finally(() => (treeLoad = null));
      treeLoad
        .then((t) => {
          tree = t;
          syncQuota();
          renderExplorer();
          if (t.truncated) push(message("warning", "file list", ["File list truncated by GitHub; some deep paths are missing."]));
          if (t.fromCache === "stale") push(message("warning", "file list", [t.note ?? "Could not reach GitHub.", `Showing a copy from ${Math.max(1, Math.round((Date.now() - t.fetchedAt) / 60000))} min ago.`], "cached"));
        })
        .catch(() => {});
    }
    const p = treeLoad;
    return await new Promise<Tree>((res, rej) => {
      const stop = () => rej(new FetchError("cancelled", -1));
      signal.addEventListener("abort", stop, { once: true });
      p.then(res, rej).finally(() => signal.removeEventListener("abort", stop));
    });
  }
  const childrenOf = (t: Tree, path: string) => t.dirs.get(path);

  // ---- commands --------------------------------------------------------------------------------------------------
  type Cmd = (args: string[], signal: AbortSignal) => Promise<HTMLElement | null | void>;
  const commands: Record<string, Cmd> = {
    async ls(args, signal) {
      const t = await ensureTree(signal);
      const target = args[0] ? resolve(cwd, args[0]) : cwd;
      const kids = childrenOf(t, target);
      if (!kids) {
        const f = t.files.get(target);
        if (f) return message("info", "file info", [`${f.name} | ${size(f.size)} | ${f.kind === "link" ? "submodule" : "file"}`], absPath(target));
        return message("error", "ls", [`No such file or directory: ${args[0]}`]);
      }
      return listing(target ? `listing ${shellPath(target)}` : "listing ~/root", `${kids.length} item(s)`, kids);
    },
    async cd(args, signal) {
      if (!args[0]) {
        cwd = "";
        syncPrompt();
        revealInExplorer("");
        return message("success", "directory", ["Changed to ~/root"]);
      }
      const t = await ensureTree(signal);
      const next = resolve(cwd, args[0]);
      if (!childrenOf(t, next)) {
        return message("error", "directory", [t.files.has(next) ? `${args[0]} is not a directory.` : `Unable to enter ${args[0]}: no such directory.`]);
      }
      cwd = next;
      syncPrompt();
      revealInExplorer(next);
      const row = message("success", "directory", [`Changed to ${shellPath(next)}`]);
      return row;
    },
    async pwd() {
      return message("info", "path", [absPath(cwd)]);
    },
    async tree(args, signal) {
      const t = await ensureTree(signal);
      const depth = Number.parseInt(args[0] ?? "", 10) || 3;
      const [sec, inner] = panel(`tree ${shellPath(cwd)}`, `max depth ${depth}`);
      const list = el("div", "ghn-treeout");
      let count = 0;
      let more = 0;
      const walk = (path: string, d: number, prefix: string) => {
        const kids = childrenOf(t, path) ?? [];
        kids.forEach((k, i) => {
          if (count >= MAX_TREE_NODES) {
            more++;
            return;
          }
          const last = i === kids.length - 1;
          count++;
          const row = runner("ghn-row ghn-tree-row", entryCommand(k));
          const lead = el("span", "ghn-tree-main");
          lead.append(el("span", "ghn-connector", prefix + (last ? "└─ " : "├─ ")), icon(fileIcon(k)), el("span", "ghn-row-text", k.name));
          row.append(lead, el("span", "ghn-meta ghn-tree-path", k.path));
          list.append(row);
          if (k.kind === "dir" && d + 1 < depth) walk(k.path, d + 1, prefix + (last ? "   " : "│  "));
        });
      };
      walk(cwd, 0, "");
      inner.append(list);
      if (more) sec.append(el("div", "ghn-panel-foot", `${more} more not shown; cd deeper or lower the depth.`));
      return sec;
    },
    async find(args, signal) {
      if (!args[0]) return message("warning", "find", ["Usage: find <filename>"]);
      const t = await ensureTree(signal);
      const q = args[0].toLowerCase();
      const prefix = cwd ? cwd + "/" : "";
      const hits = [...t.files.values()].filter((e) => e.path.startsWith(prefix) && e.name.toLowerCase().includes(q));
      if (!hits.length) return message("warning", "find", [`No files matching "${q}" found.`]);
      hits.sort((a, b) => a.path.localeCompare(b.path));
      const shown = hits.slice(0, MAX_FIND);
      return listing(`search results for "${q}"`, hits.length > MAX_FIND ? `${MAX_FIND} of ${hits.length} match(es)` : `${hits.length} match(es)`, shown);
    },
    async cat(args, signal) {
      if (!args[0]) return message("warning", "cat", ["Usage: cat <filename>"]);
      const t = await ensureTree(signal);
      const path = resolve(cwd, args[0]);
      const f = t.files.get(path);
      if (!f) return message("error", "cat", [`Unable to read ${args[0]}: no such file.`]);
      if (f.kind !== "file") return message("error", "cat", [`${args[0]} is not a file.`]);
      if (IMAGE.has(ext(f.name)) || BINARY.has(ext(f.name)) || ext(f.name) === "pdf")
        return message("warning", "cat", [`${f.name} is a binary file (${size(f.size)}).`, `Use code ${f.name} to view it.`]);
      if (f.size > MAX_EDITOR_BYTES) return message("warning", "cat", [`${f.name} is ${size(f.size)}; too large to preview here.`]);
      const bytes = await fileBytes(ref, f, signal);
      if (binaryish(bytes)) return message("warning", "cat", [`${f.name} is a binary file (${size(f.size)}).`]);
      const text = new TextDecoder("utf-8").decode(bytes);
      const lines = text.split("\n");
      const shown = lines.slice(0, MAX_CAT_LINES);
      const [sec, inner] = panel(args[0], `${shown.length} line(s) shown${lines.length > MAX_CAT_LINES ? ` of ${lines.length}` : ""}`);
      const lang = languageFor(f.name);
      const snippet = shown.join("\n");
      const html = lang && (await ready(lang)) ? highlight(snippet, lang) : null;
      const view = el("div", "ghn-cat");
      const gutter = el("pre", "ghn-gutter");
      gutter.textContent = shown.map((_, i) => i + 1).join("\n");
      const code = el("pre", "ghn-code");
      code.innerHTML = html ?? plain(snippet);
      view.append(gutter, code);
      inner.append(view);
      if (lines.length > MAX_CAT_LINES) {
        const footRow = el("div", "ghn-panel-foot");
        const link = runner("ghn-link", `code ${quoteArg("/" + path)}`);
        link.textContent = `code ${f.name}`;
        footRow.append(document.createTextNode("Use "), link, document.createTextNode(" for the full buffer."));
        sec.append(footRow);
      }
      return sec;
    },
    async code(args, signal) {
      if (!args[0]) return message("warning", "code", ["Usage: code <filename>"]);
      const t = await ensureTree(signal);
      const path = resolve(cwd, args[0]);
      const f = t.files.get(path);
      if (!f) return message("error", "editor", [`Unable to open ${args[0]}: no such file.`]);
      if (f.kind === "dir") return message("error", "editor", [`${args[0]} is not a file.`]);
      void openEditor(f);
      return message("success", "editor", [`Opened /${path}`], "buffer");
    },
    async help() {
      return help();
    },
    async clear() {
      clearLog();
      return null;
    },
    async exit() {
      close();
      return null;
    },
  };

  async function execute(line: string): Promise<void> {
    if (busy) return;
    if (buffer) closeEditor(false);
    push(echo(line));
    const trimmed = line.trim();
    if (!trimmed) return;
    if (history[history.length - 1] !== line) history.push(line);
    hIndex = history.length;
    const [name, ...args] = parseLine(trimmed);
    const cmd = name ? commands[name] : undefined;
    if (!cmd) {
      push(message("error", "command", [`Unknown command: ${name}`], "Use help"));
      return;
    }
    const ac = new AbortController();
    busy = ac;
    setBusy(true);
    try {
      const res = await cmd(args, ac.signal);
      if (ac.signal.aborted) return;
      if (res) push(res);
    } catch (err) {
      if (session.signal.aborted) return;
      const e = err as FetchError;
      if (e?.status === -1 || ac.signal.aborted) push(message("muted", "", ["^C cancelled"]));
      else push(message("error", name ?? "command", [e?.message ?? String(err)]));
    } finally {
      if (busy === ac) busy = null;
      setBusy(false);
      syncQuota();
    }
  }

  let spinTimer = 0;
  function setBusy(on: boolean) {
    if (session.signal.aborted) return;
    spin.hidden = !on;
    input.readOnly = on;
    root.classList.toggle("is-busy", on);
    window.clearInterval(spinTimer);
    if (on) {
      let f = 0;
      spin.textContent = SPINNER[0]!;
      spinTimer = window.setInterval(() => (spin.textContent = SPINNER[(f = (f + 1) % SPINNER.length)]!), 80);
    } else if (!buffer && root.contains(document.activeElement) === false) input.focus({ preventScroll: true });
    scrollDown();
  }

  // ---- explorer --------------------------------------------------------------------------------------------------
  const rowsByPath = new Map<string, HTMLButtonElement>();
  const expanded = new Set<string>();
  function renderExplorer() {
    rowsByPath.clear();
    sideList.replaceChildren();
    if (!tree) return;
    sideMeta.textContent = `${repoName} · ${tree.files.size}`;
    fillBranch(sideList, "", 0);
    markOpen();
  }
  function fillBranch(list: HTMLElement, path: string, depth: number) {
    for (const e of (tree && childrenOf(tree, path)) ?? []) {
      const li = el("li", "ghn-node");
      li.setAttribute("role", "none");
      const b = el("button", "ghn-node-row");
      b.type = "button";
      b.setAttribute("role", "treeitem");
      b.dataset.path = e.path;
      b.style.setProperty("--depth", String(depth));
      b.tabIndex = -1;
      const isDir = e.kind === "dir";
      if (isDir) b.setAttribute("aria-expanded", String(expanded.has(e.path)));
      b.append(el("span", "ghn-caret"), icon(isDir && expanded.has(e.path) ? "fa-reg-folder-open" : fileIcon(e)), el("span", "ghn-row-text", e.name));
      b.title = e.path;
      b.addEventListener("click", () => activateNode(e, b, li, depth));
      rowsByPath.set(e.path, b);
      li.append(b);
      if (isDir && expanded.has(e.path)) {
        const sub = el("ul", "ghn-branch");
        sub.setAttribute("role", "group");
        fillBranch(sub, e.path, depth + 1);
        li.append(sub);
      }
      list.append(li);
    }
    const first = sideList.querySelector<HTMLButtonElement>(".ghn-node-row");
    if (first && !sideList.querySelector('.ghn-node-row[tabindex="0"]')) first.tabIndex = 0;
  }
  function toggleDir(e: Entry, b: HTMLButtonElement, li: HTMLElement, depth: number, want?: boolean) {
    const open_ = want ?? !expanded.has(e.path);
    if (open_ === expanded.has(e.path)) return;
    if (open_) {
      expanded.add(e.path);
      const sub = el("ul", "ghn-branch");
      sub.setAttribute("role", "group");
      fillBranch(sub, e.path, depth + 1);
      li.append(sub);
    } else {
      expanded.delete(e.path);
      li.querySelector(":scope > .ghn-branch")?.remove();
      for (const k of [...rowsByPath.keys()]) if (k.startsWith(e.path + "/")) rowsByPath.delete(k);
    }
    b.setAttribute("aria-expanded", String(open_));
    b.querySelector("use")?.setAttribute("href", `/icons.svg#${open_ ? "fa-reg-folder-open" : "im-folder"}`);
    markOpen();
  }
  function activateNode(e: Entry, b: HTMLButtonElement, li: HTMLElement, depth: number) {
    focusNode(b);
    if (e.kind === "dir") toggleDir(e, b, li, depth);
    else if (!busy) {
      if (narrow.matches) {
        sideOpen = false;
        syncSide();
      }
      void openEditor(e);
    }
  }
  // opens every folder down to `path` (a directory, or "" for the root) and scrolls its row into view
  function revealInExplorer(path: string) {
    if (!tree || !path) return;
    const parts = path.split("/");
    for (let i = 1; i <= parts.length; i++) {
      const p = parts.slice(0, i).join("/");
      const f = tree.files.get(p);
      const b = rowsByPath.get(p);
      if (f?.kind === "dir" && b?.parentElement) toggleDir(f, b, b.parentElement, Number(b.style.getPropertyValue("--depth")) || 0, true);
    }
    rowsByPath.get(path)?.scrollIntoView({ block: "nearest" });
  }
  function markOpen() {
    for (const b of sideList.querySelectorAll('[aria-current="true"]')) b.removeAttribute("aria-current");
    if (buffer) rowsByPath.get(buffer.path)?.setAttribute("aria-current", "true");
  }
  function focusNode(b: HTMLButtonElement) {
    for (const r of sideList.querySelectorAll<HTMLButtonElement>('.ghn-node-row[tabindex="0"]')) r.tabIndex = -1;
    b.tabIndex = 0;
    b.focus({ preventScroll: false });
  }
  sideList.addEventListener("keydown", (ev) => {
    const cur = (ev.target as HTMLElement).closest<HTMLButtonElement>(".ghn-node-row");
    if (!cur || !tree) return;
    const rows = [...sideList.querySelectorAll<HTMLButtonElement>(".ghn-node-row")];
    const i = rows.indexOf(cur);
    const e = tree.files.get(cur.dataset.path ?? "");
    const li = cur.parentElement!;
    const depth = Number(cur.style.getPropertyValue("--depth")) || 0;
    let to: HTMLButtonElement | undefined;
    if (ev.key === "ArrowDown") to = rows[i + 1];
    else if (ev.key === "ArrowUp") to = rows[i - 1];
    else if (ev.key === "Home") to = rows[0];
    else if (ev.key === "End") to = rows[rows.length - 1];
    else if (ev.key === "ArrowRight" && e?.kind === "dir") {
      if (!expanded.has(e.path)) toggleDir(e, cur, li, depth, true);
      else to = rows[i + 1];
    } else if (ev.key === "ArrowLeft") {
      if (e?.kind === "dir" && expanded.has(e.path)) toggleDir(e, cur, li, depth, false);
      else to = li.parentElement?.closest(".ghn-node")?.querySelector<HTMLButtonElement>(":scope > .ghn-node-row") ?? undefined;
    } else return;
    ev.preventDefault();
    if (to) focusNode(to);
  });

  // ---- editor ----------------------------------------------------------------------------------------------------
  let statusTimer = 0;
  const status = (text: string, hold = 1800) => {
    edStatus.textContent = text;
    window.clearTimeout(statusTimer);
    if (hold) statusTimer = window.setTimeout(() => (edStatus.textContent = ""), hold);
  };
  function showEditor(b: Buffer) {
    buffer = b;
    root.classList.add("is-editing");
    editor.hidden = false;
    out.setAttribute("aria-hidden", "true");
    editorTabLabel.textContent = b.path;
    editorTabIcon.replaceChildren(icon(fileIcon({ name: b.name, kind: "file" })));
    shellTab.setAttribute("aria-selected", "false");
    editorTab.setAttribute("aria-selected", "true");
    const text = b.kind === "text";
    saveKey.disabled = !text;
    copyKey.disabled = !text;
    revealInExplorer(b.path.includes("/") ? b.path.slice(0, b.path.lastIndexOf("/")) : "");
    markOpen();
    rowsByPath.get(b.path)?.scrollIntoView({ block: "nearest" });
    syncHead();
  }
  function info(...parts: string[]) {
    edInfo.replaceChildren(...parts.filter(Boolean).map((p) => el("span", "ghn-ed-item", p)));
  }
  function resetView() {
    undoViewer?.();
    undoViewer = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    edView.replaceChildren();
    edView.className = "ghn-ed-view";
  }
  function stateCard(title: string, lines: string[], tone: Tone, links = true): HTMLElement {
    const box = el("div", `ghn-ed-state is-${tone}`);
    box.append(el("div", "ghn-panel-title", title));
    for (const l of lines) box.append(el("p", "ghn-line", l));
    if (links && buffer) {
      const row = el("div", "ghn-ed-links");
      const a = (label: string, href: string) => {
        const x = el("a", "ghn-key", label);
        x.href = href;
        x.target = "_blank";
        x.rel = "noopener";
        row.append(x);
      };
      a("open on github", blobUrl());
      a("vs code for the web", vscodeUrl());
      if (buffer.kind !== "link") a("raw file", rawUrl(ref, buffer.path));
      box.append(row);
    }
    return box;
  }

  async function openEditor(f: Entry): Promise<void> {
    editorLoad?.abort();
    const ac = new AbortController();
    editorLoad = ac;
    session.signal.addEventListener("abort", () => ac.abort(), { once: true });
    resetView();
    const x = ext(f.name);
    const kind: Buffer["kind"] = f.kind === "link" ? "link" : IMAGE.has(x) ? "image" : x === "pdf" ? "pdf" : BINARY.has(x) ? "binary" : f.size > MAX_EDITOR_BYTES ? "large" : "text";
    // a text file becomes a text buffer once it has arrived; until then nothing can be saved or copied
    showEditor({ kind: kind === "text" ? "binary" : kind, path: f.path, name: f.name, size: f.size });
    edView.focus({ preventScroll: true });

    if (kind === "link") {
      info("SUBMODULE");
      edView.append(stateCard("submodule", ["Submodule; no file to show."], "info"));
      return;
    }
    if (kind === "large") {
      info("READ ONLY", size(f.size));
      edView.append(stateCard("too large", [`File too large to display locally (${size(f.size)}).`, "Use VS Code for the web for the full remote viewer."], "warning"));
      return;
    }
    if (kind === "binary") {
      info("BINARY", size(f.size));
      edView.append(stateCard("binary file", [`Binary file, ${size(f.size)}.`], "info"));
      return;
    }
    if (kind === "image") {
      info("IMAGE", size(f.size));
      edView.classList.add("is-image");
      const fig = el("figure", "ghn-figure");
      const img = el("img", "ghn-img");
      img.alt = f.name;
      img.decoding = "async";
      const cap = el("figcaption", "ghn-meta", `loading ${size(f.size)}...`);
      img.addEventListener("load", () => {
        cap.textContent = `${img.naturalWidth} × ${img.naturalHeight} · ${size(f.size)}`;
        info("IMAGE", `${img.naturalWidth} × ${img.naturalHeight}`, size(f.size));
      }, { once: true });
      img.addEventListener("error", () => {
        if (ac.signal.aborted) return;
        resetView();
        edView.append(stateCard("cannot show this image", ["Could not load this image."], "error"));
      }, { once: true });
      img.src = rawUrl(ref, f.path);
      fig.append(img, cap);
      edView.append(fig);
      return;
    }
    if (kind === "pdf") {
      info("PDF", size(f.size));
      edView.classList.add("is-pdf");
      try {
        const viewer = (await import("./pdf-viewer.js")) as { mountPdf(host: HTMLElement, url: string, opts?: { title?: string }): () => void };
        if (ac.signal.aborted) return;
        undoViewer = viewer.mountPdf(edView, rawUrl(ref, f.path), { title: f.name });
      } catch {
        if (!ac.signal.aborted) edView.append(stateCard("cannot show this pdf", ["The PDF viewer did not load."], "error"));
      }
      return;
    }

    // text: stream the bytes with real progress, then decode and highlight
    const loading = el("div", "ghn-ed-state is-muted");
    const lt = el("div", "ghn-panel-title", "fetching");
    const lm = el("p", "ghn-line", `${f.path} · 0 B of ${size(f.size)}`);
    const track = el("div", "ghn-track");
    const fill = el("div", "ghn-fill");
    track.append(fill);
    loading.append(lt, lm, track);
    edView.append(loading);
    info("READ ONLY", size(f.size));
    try {
      const lang = languageFor(f.name);
      const grammar = lang ? ready(lang) : Promise.resolve(false); // the grammar loads while the file downloads
      const bytes = await fileBytes(ref, f, ac.signal, (got, total) => {
        lm.textContent = `${f.path} · ${size(got)} of ${size(total)}`;
        fill.style.transform = `scaleX(${Math.min(1, got / Math.max(1, total))})`;
      });
      if (ac.signal.aborted) return;
      if (binaryish(bytes)) {
        resetView();
        info("BINARY", size(bytes.length));
        edView.append(stateCard("binary file", [`Binary file, ${size(bytes.length)}.`], "info"));
        return;
      }
      const text = new TextDecoder("utf-8").decode(bytes);
      const okGrammar = await grammar;
      if (ac.signal.aborted) return;
      let html: string | null = null;
      let plainReason = "";
      if (!lang) plainReason = "plain text";
      else if (!okGrammar) plainReason = "highlighter unavailable";
      else if (bytes.length > MAX_HIGHLIGHT_BYTES) plainReason = `plain above ${size(MAX_HIGHLIGHT_BYTES)}`;
      else html = highlight(text, lang);
      const lineCount = text.split("\n").length;
      resetView();
      buffer = { kind: "text", path: f.path, name: f.name, text, lang, size: bytes.length, lines: lineCount, plainReason };
      saveKey.disabled = copyKey.disabled = false;
      const gutter = el("pre", "ghn-gutter");
      gutter.setAttribute("aria-hidden", "true");
      let nums = "";
      for (let i = 1; i <= lineCount; i++) nums += i === 1 ? "1" : `\n${i}`;
      gutter.textContent = nums;
      const code = el("pre", "ghn-code");
      code.innerHTML = html ?? plain(text);
      const sheet = el("div", "ghn-sheet");
      sheet.append(gutter, code);
      edView.append(sheet);
      edView.scrollTop = 0;
      info("READ ONLY", `${lineCount} LINE(S)`, lang?.label ?? "", size(bytes.length), plainReason);
    } catch (err) {
      if (ac.signal.aborted) return;
      resetView();
      edView.append(stateCard("cannot open this file", [(err as Error).message], "error"));
      push(message("error", "editor", [`Unable to open ${f.name}: ${(err as Error).message}`]));
    }
  }

  function closeEditor(refocus = true) {
    if (!buffer) return;
    editorLoad?.abort();
    resetView();
    buffer = null;
    root.classList.remove("is-editing");
    editor.hidden = true;
    out.removeAttribute("aria-hidden");
    shellTab.setAttribute("aria-selected", "true");
    editorTab.setAttribute("aria-selected", "false");
    edStatus.textContent = "";
    markOpen();
    syncHead();
    if (refocus) input.focus({ preventScroll: true });
    scrollDown();
  }
  function download() {
    if (buffer?.kind !== "text") return status("Nothing to download.");
    const blob = new Blob([buffer.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = el("a");
    a.href = url;
    a.download = buffer.name;
    document.body.append(a);
    a.click();
    a.remove();
    later(() => URL.revokeObjectURL(url), 1000);
    status(`Downloaded ${buffer.name}`);
  }
  async function copyBuffer() {
    if (buffer?.kind !== "text") return;
    try {
      await navigator.clipboard.writeText(buffer.text);
      status("Buffer copied to clipboard");
    } catch (err) {
      status(`Copy failed: ${(err as Error).message}`);
    }
  }
  shellTab.addEventListener("click", () => closeEditor());
  editorTab.addEventListener("click", () => edView.focus({ preventScroll: true }));

  // ---- keys ------------------------------------------------------------------------------------------------------
  function complete() {
    const v = input.value;
    const words = parseLine(v);
    const trailing = v.endsWith(" ");
    if (words.length <= 1 && !trailing) {
      const hits = Object.keys(commands).filter((c) => c.startsWith(words[0] ?? ""));
      if (hits.length === 1) input.value = hits[0] + " ";
      else if (hits.length > 1) push(message("muted", "", [hits.join("  ")]));
      return;
    }
    if (!tree) return;
    const word = trailing ? "" : (words[words.length - 1] ?? "");
    const slash = word.lastIndexOf("/");
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
    const stem = word.slice(slash + 1).toLowerCase();
    const dir = resolve(cwd, dirPart || ".");
    const cmd = words[0];
    const kids = (childrenOf(tree, dir) ?? []).filter((k) => k.name.toLowerCase().startsWith(stem) && (cmd !== "cd" || k.kind === "dir"));
    if (!kids.length) return;
    let common = kids[0]!.name;
    for (const k of kids) while (!k.name.toLowerCase().startsWith(common.toLowerCase())) common = common.slice(0, -1);
    const only = kids.length === 1 ? kids[0]! : null;
    const done = dirPart + (only ? only.name + (only.kind === "dir" ? "/" : " ") : common);
    const base = trailing ? v : v.slice(0, v.length - word.length);
    input.value = base + (/\s/.test(done.trim()) ? `"${done.trim()}"${done.endsWith(" ") ? " " : ""}` : done);
    if (!only && common.length <= stem.length) push(message("muted", "", [kids.slice(0, 60).map((k) => k.name + (k.kind === "dir" ? "/" : "")).join("  ")]));
  }

  input.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "c" && busy && input.selectionStart === input.selectionEnd) {
      e.preventDefault();
      busy.abort();
      return;
    }
    if (busy) {
      if (e.key === "Enter" || e.key === "Tab") e.preventDefault();
      return;
    }
    if (mod && e.key.toLowerCase() === "l") {
      e.preventDefault();
      clearLog();
    } else if (e.key === "Enter") {
      const line = input.value;
      input.value = "";
      void execute(line);
    } else if (e.key === "Tab" && !e.shiftKey) {
      if (!input.value.trim()) return; // an empty prompt lets Tab move focus as usual
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hIndex > 0) input.value = history[--hIndex] ?? "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIndex < history.length - 1) input.value = history[++hIndex] ?? "";
      else {
        hIndex = history.length;
        input.value = "";
      }
    }
  });
  out.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("button, a") || getSelection()?.toString()) return;
    input.focus({ preventScroll: true });
  });

  // Esc closes the editor before the navigator, Ctrl+S downloads the buffer (D-023). Capture phase on the document,
  // so it runs before the shell's Esc handler, and only while the navigator is the top overlay.
  const overlayEl = () => card.parentElement;
  const onTop = () => {
    const all = document.querySelectorAll(".overlay");
    return all[all.length - 1] === overlayEl();
  };
  const onDocKey = (e: KeyboardEvent) => {
    if (!onTop()) return;
    if (e.key === "Escape" && buffer) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeEditor();
    } else if (e.key === "Escape" && busy) {
      e.preventDefault();
      e.stopImmediatePropagation();
      busy.abort();
    } else if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "s" && buffer) {
      e.preventDefault();
      download();
    }
  };
  document.addEventListener("keydown", onDocKey, true);

  // ---- foot: quick commands --------------------------------------------------------------------------------------
  footHook = (f) => {
    f.classList.add("ghn-foot");
    // the quick commands sit in the prompt line itself, after the input, as clickable commands
    const q = el("span", "ghn-quick");
    for (const c of ["help", "ls", "tree 2", "cd ..", "clear"]) {
      const b = runner("ghn-qcmd", c);
      b.textContent = c;
      q.append(b);
    }
    live.append(q);
    const keys = el("div", "ghn-foot-keys");
    for (const [k, d] of KEYS_SHELL) {
      const chip = el("span", "ghn-chip");
      chip.append(el("kbd", "", k), document.createTextNode(` ${d}`));
      keys.append(chip);
    }
    f.append(keys);
  };

  // ---- boot ------------------------------------------------------------------------------------------------------
  syncPrompt();
  shellTab.setAttribute("aria-selected", "true");
  editorTab.setAttribute("aria-selected", "false");
  const connecting = message("muted", "boot", ["Connecting to echopoint..."]);
  push(connecting);
  const bootAc = new AbortController();
  busy = bootAc;
  setBusy(true);
  session.signal.addEventListener("abort", () => bootAc.abort(), { once: true });
  void (async () => {
    try {
      const b = await boot(bootAc.signal);
      if (session.signal.aborted) return;
      ref = b.repo?.branch ?? "HEAD";
      syncHead();
      connecting.remove();
      push(bootPanel(b));
      if (b.failed.length) push(message("warning", "echopoint", [`Not loaded: ${b.failed.join(", ")}.`]));
      await ensureTree(bootAc.signal);
    } catch (err) {
      if (session.signal.aborted) return;
      connecting.remove();
      const e = err as FetchError;
      if (e?.status === -1) push(message("muted", "", ["^C cancelled"]));
      else push(message("error", "file list", [e?.message ?? String(err)], "github"));
    } finally {
      if (busy === bootAc) busy = null;
      setBusy(false);
      syncQuota();
    }
  })();
  requestAnimationFrame(() => input.focus({ preventScroll: true }));

  return () => {
    session.abort();
    busy?.abort();
    editorLoad?.abort();
    resetView();
    document.removeEventListener("keydown", onDocKey, true);
    window.clearInterval(spinTimer);
    window.clearTimeout(statusTimer);
    for (const t of timers) window.clearTimeout(t);
    footHook = null;
  };
}
