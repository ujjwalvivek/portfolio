// Copies pinned third-party browser modules into static/vendor (D-015). Each one comes from its npm tarball,
// is checked against the registry's sha512 integrity, and only the files listed are kept. No npm install involved.
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const PACKAGES = [
  {
    name: "@ujjwalvivek/substrate",
    version: "2.0.2",
    integrity: "sha512-59V5LK0zSitLkHUu26fHosZYJVgS7lTyYM6EKcGFZbeuWmrONLMfCSq0L90qPej9xZNJKEfsYU5YZNoou1O1jg==",
    files: { "package/dist/index.js": "substrate/index.js" },
  },
  // PDF viewer (D-004). The modern ESM build only: no cmaps, standard fonts or wasm decoders, since the resume PDFs
  // embed their fonts and carry no JPX/JBIG2 images. pdf.js then falls back to built-in handling for anything else.
  {
    name: "pdfjs-dist",
    version: "6.5.438",
    integrity: "sha512-vg8Pw1x+AFKy4AMDvhuWl5cOYV8d698UoEANoFFhc79hqXDnZQqnOXoxw3HG907WHOg1JYOvLhP756boddFxpA==",
    files: {
      "package/build/pdf.min.mjs": "pdfjs/pdf.min.mjs",
      "package/build/pdf.worker.min.mjs": "pdfjs/pdf.worker.min.mjs",
      "package/LICENSE": "pdfjs/LICENSE",
    },
  },
];

// A tar archive is a run of 512-byte headers, each followed by the file's bytes padded to 512.
function untar(buf) {
  const out = new Map();
  for (let off = 0; off + 512 <= buf.length; ) {
    const header = buf.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    const field = (start, len) => header.subarray(start, start + len).toString("utf8").replace(/\0.*$/s, "").trim();
    const name = (field(345, 155) ? field(345, 155) + "/" : "") + field(0, 100);
    const size = parseInt(field(124, 12), 8) || 0;
    const type = field(156, 1);
    if (type === "0" || type === "") out.set(name, buf.subarray(off + 512, off + 512 + size));
    off += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

for (const pkg of PACKAGES) {
  const stamp = join("static/vendor", `.${pkg.name.replace(/\W/g, "_")}@${pkg.version}`);
  if (existsSync(stamp) && readFileSync(stamp, "utf8") === pkg.integrity) continue;

  const base = pkg.name.split("/").pop();
  const url = `https://registry.npmjs.org/${pkg.name}/-/${base}-${pkg.version}.tgz`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const tgz = Buffer.from(await res.arrayBuffer());
  const digest = "sha512-" + createHash("sha512").update(tgz).digest("base64");
  if (digest !== pkg.integrity) throw new Error(`${pkg.name}@${pkg.version}: integrity mismatch`);

  const files = untar(gunzipSync(tgz));
  for (const [from, to] of Object.entries(pkg.files)) {
    const data = files.get(from);
    if (!data) throw new Error(`${pkg.name}@${pkg.version}: ${from} not in the tarball`);
    const dest = join("static/vendor", to);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, data);
  }
  writeFileSync(stamp, pkg.integrity);
  console.log(`vendor: ${pkg.name}@${pkg.version}`);
}
