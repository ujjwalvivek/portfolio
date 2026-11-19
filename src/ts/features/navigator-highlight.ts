// The GitHub navigator's syntax highlighter, behind one small adapter (ADR D-004, Q-02). Today it is Prism 1.30.0,
// vendored by scripts/vendor.mjs as a core plus one ES module per grammar, so opening a file fetches the core once and
// then only that language's grammar chain (a Rust file: core and rust, about 4 KB gzipped together).
//
// The adapter emits its own classes, not Prism's: each token becomes <span class="tok-ROLE"> where ROLE is one of the
// colour roles post.css gives Zola's highlighter (comment, keyword, string, function, number, type, variable, operator,
// punct, invalid, plus bold, italic and title for markup prose), so code reads the same across the site and swapping the
// library means rewriting this file only. Text is escaped here; nothing from the file reaches innerHTML unescaped.

import type { Prism, Token, TokenStream, PrismCore, PrismGrammar } from "../types/prism.js";

const BASE = "/vendor/prism@1.30.0-esm-1/";

// The grammars that are vendored, each with the grammars it needs loaded first (Prism's components.json "require").
const NEEDS: Record<string, string[]> = {
  clike: [], markup: [], css: [], javascript: ["clike"], typescript: ["javascript"], jsx: ["markup", "javascript"],
  tsx: ["jsx", "typescript"], rust: [], go: ["clike"], c: ["clike"], cpp: ["c"], csharp: ["clike"], python: [],
  bash: [], nasm: [], toml: [], json: [], yaml: [], markdown: ["markup", "yaml"], wgsl: [], zig: [], powershell: [],
  glsl: ["c"], hlsl: ["c"], lua: [], java: ["clike"], kotlin: ["clike"], swift: [], sql: [], docker: [], makefile: [],
  ini: [], batch: [], diff: [], latex: [], scss: ["css"], nix: [], ruby: ["clike"],
};

// file extension (or whole lower-cased name) -> [grammar, label shown in the editor footer]
const BY_EXT: Record<string, [string, string]> = {
  rs: ["rust", "rust"], go: ["go", "go"], c: ["c", "c"], h: ["c", "c"], cpp: ["cpp", "c++"], cc: ["cpp", "c++"],
  cxx: ["cpp", "c++"], hpp: ["cpp", "c++"], hh: ["cpp", "c++"], cs: ["csharp", "c#"], ts: ["typescript", "typescript"],
  mts: ["typescript", "typescript"], cts: ["typescript", "typescript"], tsx: ["tsx", "tsx"], js: ["javascript", "javascript"],
  mjs: ["javascript", "javascript"], cjs: ["javascript", "javascript"], jsx: ["jsx", "jsx"], asm: ["nasm", "nasm"],
  nasm: ["nasm", "nasm"], s: ["nasm", "assembly"], inc: ["nasm", "nasm"], py: ["python", "python"], pyw: ["python", "python"],
  sh: ["bash", "shell"], bash: ["bash", "bash"], zsh: ["bash", "zsh"], fish: ["bash", "fish"], html: ["markup", "html"],
  htm: ["markup", "html"], xml: ["markup", "xml"], svg: ["markup", "svg"], vue: ["markup", "vue"], svelte: ["markup", "svelte"],
  astro: ["markup", "astro"], xaml: ["markup", "xaml"], csproj: ["markup", "msbuild"], plist: ["markup", "plist"],
  css: ["css", "css"], scss: ["scss", "scss"], sass: ["scss", "sass"], toml: ["toml", "toml"], json: ["json", "json"],
  jsonc: ["json", "jsonc"], json5: ["json", "json5"], webmanifest: ["json", "json"], yml: ["yaml", "yaml"], yaml: ["yaml", "yaml"],
  md: ["markdown", "markdown"], markdown: ["markdown", "markdown"], wgsl: ["wgsl", "wgsl"], zig: ["zig", "zig"],
  ps1: ["powershell", "powershell"], psm1: ["powershell", "powershell"], psd1: ["powershell", "powershell"],
  glsl: ["glsl", "glsl"], vert: ["glsl", "glsl"], frag: ["glsl", "glsl"], comp: ["glsl", "glsl"], hlsl: ["hlsl", "hlsl"],
  shader: ["hlsl", "shaderlab"], lua: ["lua", "lua"], java: ["java", "java"], kt: ["kotlin", "kotlin"], kts: ["kotlin", "kotlin"],
  swift: ["swift", "swift"], sql: ["sql", "sql"], ini: ["ini", "ini"], cfg: ["ini", "ini"], conf: ["ini", "conf"],
  env: ["ini", "env"], bat: ["batch", "batch"], cmd: ["batch", "batch"], diff: ["diff", "diff"], patch: ["diff", "diff"],
  tex: ["latex", "latex"], cls: ["latex", "latex"], sty: ["latex", "latex"], nix: ["nix", "nix"], rb: ["ruby", "ruby"],
  mk: ["makefile", "makefile"], lock: ["toml", "lock"],
  dockerfile: ["docker", "dockerfile"], makefile: ["makefile", "makefile"], gnumakefile: ["makefile", "makefile"],
  justfile: ["makefile", "justfile"], ".gitconfig": ["ini", "git config"], ".editorconfig": ["ini", "editorconfig"],
  ".bashrc": ["bash", "bash"], ".zshrc": ["bash", "zsh"], ".profile": ["bash", "shell"], "package-lock.json": ["json", "json"],
};

export type Language = { grammar: string; label: string };

export function languageFor(fileName: string): Language | null {
  const name = fileName.toLowerCase();
  const whole = BY_EXT[name];
  if (whole) return { grammar: whole[0], label: whole[1] };
  if (name.startsWith("dockerfile")) return { grammar: "docker", label: "dockerfile" };
  const dot = name.lastIndexOf(".");
  const hit = dot > 0 ? BY_EXT[name.slice(dot + 1)] : undefined;
  return hit ? { grammar: hit[0], label: hit[1] } : null;
}

// ---- loading ------------------------------------------------------------------------------------------------------

let core: Promise<Prism> | null = null;
const installed = new Map<string, Promise<void>>();

function loadCore(): Promise<Prism> {
  if (!core) {
    core = (import(`${BASE}core.js`) as Promise<PrismCore>).then((m) => m.default);
    core.catch(() => (core = null));
  }
  return core;
}

function install(prism: Prism, grammar: string): Promise<void> {
  let hit = installed.get(grammar);
  if (!hit) {
    hit = Promise.all((NEEDS[grammar] ?? []).map((dep) => install(prism, dep)))
      .then(() => import(`${BASE}${grammar}.js`) as Promise<PrismGrammar>)
      .then((m) => m.default(prism));
    hit.catch(() => installed.delete(grammar));
    installed.set(grammar, hit);
  }
  return hit;
}

let prism: Prism | null = null; // the resolved core, so highlight() can stay synchronous

// Fetches the core and the language's grammar chain (a no-op once they are in). True when the grammar is ready;
// false for a language the highlighter does not have or when the vendored files cannot load.
export async function ready(lang: Language): Promise<boolean> {
  if (!(lang.grammar in NEEDS)) return false;
  try {
    const p = await loadCore();
    await install(p, lang.grammar);
    prism = p;
    return !!p.languages[lang.grammar];
  } catch {
    return false;
  }
}

// ---- tokens to roles ----------------------------------------------------------------------------------------------

const ROLE: Record<string, string> = {
  comment: "comment", prolog: "comment", doctype: "comment", cdata: "comment", shebang: "comment",
  keyword: "keyword", rule: "keyword", atrule: "keyword", important: "keyword", directive: "keyword",
  "directive-hash": "keyword", macro: "keyword", preprocessor: "keyword", "control-flow": "keyword", storage: "keyword",
  module: "keyword", attribute: "keyword", decorator: "keyword", annotation: "keyword",
  string: "string", char: "string", "attr-value": "string", regex: "string", "template-string": "string",
  url: "string", inserted: "string", code: "string", "code-snippet": "string",
  function: "function", "function-definition": "function", method: "function", "function-name": "function",
  number: "number", boolean: "number", constant: "number", symbol: "number", unit: "number", hexcode: "number",
  color: "number", "lifetime-annotation": "number", "attr-name": "number", entity: "number", null: "number",
  "class-name": "type", builtin: "type", type: "type", namespace: "type", "type-definition": "type", generic: "type",
  tag: "variable", variable: "variable", property: "variable", parameter: "variable", key: "variable", deleted: "variable",
  label: "variable", selector: "variable", register: "variable", "table": "variable", section: "variable",
  operator: "operator", "interpolation-punctuation": "operator", arrow: "operator", "template-punctuation": "operator",
  punctuation: "punct",
  title: "title", bold: "bold", italic: "italic", strike: "punct", blockquote: "comment", hr: "punct", list: "keyword",
  invalid: "invalid", error: "invalid",
};

function roleOf(t: Token): string | null {
  // the token's own type first, then its aliases (Prism's aliases name the generic role, e.g. register -> variable)
  const direct = ROLE[t.type];
  if (direct) return direct;
  const aliases = typeof t.alias === "string" ? [t.alias] : (t.alias ?? []);
  for (const a of aliases) if (ROLE[a]) return ROLE[a]!;
  return null;
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(stream: TokenStream): string {
  if (typeof stream === "string") return escape(stream);
  if (Array.isArray(stream)) {
    let out = "";
    for (const part of stream) out += render(part);
    return out;
  }
  const inner = render(stream.content);
  const role = roleOf(stream);
  return role ? `<span class="tok-${role}">${inner}</span>` : inner;
}

// Escaped HTML of `code` with role spans, or null if ready(lang) has not resolved true (the caller shows plain text).
export function highlight(code: string, lang: Language): string | null {
  const grammar = prism?.languages[lang.grammar];
  return prism && grammar ? render(prism.tokenize(code, grammar)) : null;
}

export function plain(code: string): string {
  return escape(code);
}
