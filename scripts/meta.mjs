// Writes public/posts/meta.json in v3's shape (ADR section 13), from the posts that carry extra.legacy.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";

const dir = "content/blog";
const field = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, "m"));
  return m ? JSON.parse(m[1].replace(/^(\d{4}-\d{2}-\d{2})$/, '"$1"')) : undefined;
};
const posts = [];
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".md") || f.startsWith("_")) continue;
  const src = readFileSync(`${dir}/${f}`, "utf8");
  const [, fm, body] = src.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n([\s\S]*)$/);
  const filename = field(fm, "legacy");
  if (!filename) continue;
  const words = body.trim().split(/\s+/).length;
  posts.push({
    id: field(fm, "id"),
    filename,
    title: field(fm, "title"),
    date: field(fm, "date"),
    description: field(fm, "description"),
    tags: field(fm, "tags") ?? [],
    readingTime: `${Math.max(1, Math.ceil(words / 200))} min read`,
    thumbnail: field(fm, "thumbnail") ?? null,
  });
}
posts.sort((a, b) => (a.date < b.date ? 1 : -1));
mkdirSync("public/posts", { recursive: true });
writeFileSync("public/posts/meta.json", JSON.stringify(posts, null, 2) + "\n");
console.log(`meta.json: ${posts.length} posts`);
