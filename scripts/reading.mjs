// Reading time per post, written to data/reading.json before Zola builds (templates load it) and used by meta.mjs.
//   prose   238 words a minute, the silent-reading rate for non-fiction in Brysbaert's 2019 meta-analysis
//           ("How many words do we read per minute?"), counted after markup, URLs and HTML are stripped
//   code    3 seconds a line of fenced code: it is scanned, not read word by word
//   images  12 seconds for the first, one second less for each after, never under 3 (Medium's rule)
// Rounded to the nearest minute, at least 1.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";

const WPM = 238;
const CODE_LINE_S = 3;

export function readingMinutes(markdown) {
  let text = markdown.replace(/^\+\+\+[\s\S]*?\+\+\+\n/, "");
  let codeLines = 0;
  text = text.replace(/^(```|~~~)[^\n]*\n([\s\S]*?)^\1\s*$/gm, (_, _f, body) => {
    codeLines += body.split("\n").filter((l) => l.trim()).length;
    return " ";
  });
  const images = (text.match(/!\[[^\]]*\]\([^)]*\)|<img\b/g) ?? []).length;
  const prose = text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/`([^`]*)`/g, "$1");
  const words = (prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’._-]*/gu) ?? []).length;
  let imageS = 0;
  for (let i = 0; i < images; i++) imageS += Math.max(3, 12 - i);
  const seconds = (words / WPM) * 60 + codeLines * CODE_LINE_S + imageS;
  return Math.max(1, Math.round(seconds / 60));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = {};
  for (const f of readdirSync("content/blog")) {
    if (!f.endsWith(".md") || f.startsWith("_")) continue;
    out[f.replace(/\.md$/, "")] = readingMinutes(readFileSync(`content/blog/${f}`, "utf8"));
  }
  mkdirSync("data", { recursive: true });
  writeFileSync("data/reading.json", JSON.stringify(out, null, 2) + "\n");
  console.log(`reading: ${Object.keys(out).length} posts`);
}
