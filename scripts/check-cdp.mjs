// Shared by the local browser checks (check-leaks, check-drift): a static server for public/ that resolves paths the way
// Cloudflare Pages does, and a headless Chromium driven over the DevTools protocol. No dependencies.
// The browser is $BROWSER, else the first of Helium, Chromium or Chrome found on PATH or in /opt.
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".wasm": "application/wasm", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain",
};

export function serve(root = "public") {
  const isFile = (p) => existsSync(p) && statSync(p).isFile();
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const path = decodeURIComponent(url.pathname);
    let file = join(root, path);
    if (path.endsWith("/")) file = join(file, "index.html");
    else if (!isFile(file) && isFile(join(file, "index.html"))) {
      res.writeHead(308, { Location: path + "/" + url.search }).end();
      return;
    }
    if (!isFile(file)) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] }).end(isFile(join(root, "404.html")) ? readFileSync(join(root, "404.html")) : "");
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })),
  );
}

function findBrowser() {
  if (process.env.BROWSER) return process.env.BROWSER;
  for (const p of ["/opt/helium-browser-bin/helium", "/usr/bin/chromium", "/usr/bin/google-chrome-stable", "/usr/bin/google-chrome"]) if (existsSync(p)) return p;
  for (const name of ["helium", "chromium", "google-chrome"]) {
    try {
      return execFileSync("which", [name], { encoding: "utf8" }).trim();
    } catch {}
  }
  throw new Error("no Chromium-based browser found; set BROWSER");
}

export async function launch({ width = 1440, height = 900 } = {}) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "v4-check-"));
  const proc = spawn(
    findBrowser(),
    ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, "--no-first-run", "--mute-audio", "about:blank"],
    { stdio: "ignore" },
  );
  let targets;
  for (let i = 0; i < 75 && !targets; i++) {
    await wait(200);
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch {}
  }
  if (!targets) throw new Error("browser did not start");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const subs = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    } else if (m.method) for (const fn of subs.get(m.method) ?? []) fn(m.params);
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    }).then((m) => {
      if (m.error) throw new Error(`${method}: ${m.error.message}`);
      return m.result;
    });
  const on = (event, fn) => {
    if (!subs.has(event)) subs.set(event, []);
    subs.get(event).push(fn);
  };
  const off = (event, fn) => subs.set(event, (subs.get(event) ?? []).filter((f) => f !== fn));
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const close = () => {
    ws.close();
    proc.kill();
    setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
  };
  return { send, on, off, evaluate, close };
}

// Navigates and waits for a load event, then until no further commit or load has come for `settle` ms. Headless Chromium
// commits the first navigation of a fresh profile twice (about 5 s apart, on every page, app code or not), so a
// fixed wait after the first commit is not enough.
export async function open(c, url, settle = 7000, max = 40000) {
  let last = 0;
  let loaded = false;
  c.on("Page.loadEventFired", () => ((loaded = true), (last = Date.now())));
  c.on("Page.frameNavigated", (p) => {
    if (!p.frame.parentId) last = Date.now();
  });
  await c.send("Page.enable");
  await c.send("Page.navigate", { url });
  const start = Date.now();
  while ((!loaded || Date.now() - last < settle) && Date.now() - start < max) await wait(250);
  if (!loaded) throw new Error(`${url} never fired load`);
}
