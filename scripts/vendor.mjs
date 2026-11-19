// Copies pinned third-party browser modules into static/vendor (D-015). Each one comes from its npm tarball,
// is checked against the registry's sha512 integrity, and only the files listed are kept. No npm install involved.
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const PACKAGES = [
  {
    name: "@ujjwalvivek/substrate",
    version: "2.1.0",
    integrity: "sha512-+IlqQ2yZdDRfU9c2Ph1RVUiq1C18P9szFb/pPlUV8wd5xjvrrcUUN69ribBqH8ylC/p5wEtR3BYzCOcQwOqx8Q==",
    files: { "package/dist/index.js": "substrate/index.js", "package/dist/recipes.js": "substrate/recipes.js" },
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
  // Syntax highlighter for the GitHub navigator (D-004, Q-02): Prism's core and one file per grammar, so opening a
  // file loads the core and only that language's grammar chain. Prism's files are classic scripts that share a global
  // Prism; each is wrapped into an ES module here so nothing touches window: the core is run against a stand-in global
  // with no document (manual mode, no DOMContentLoaded or worker hooks) and exports Prism, and each grammar exports a
  // function that installs it into the Prism it is given.
  {
    name: "prismjs",
    version: "1.30.0",
    integrity: "sha512-DEvV2ZF2r2/63V+tK8hQvrR2ZGn10srHbXviTlcv7Kpzw8jWiNTqbVgjO3IY8RxrrOUF8VPMQQFysYYYv0YZxw==",
    rev: "esm-1",
    files: {
      "package/components/prism-core.min.js": {
        to: "prism/core.js",
        wrap: (src) =>
          `// prismjs 1.30.0 core, wrapped as an ES module by scripts/vendor.mjs. MIT, see LICENSE.\n` +
          `const Prism = (function (window, self, WorkerGlobalScope, module, global) {\n${src}\nreturn Prism;\n})({ Prism: { manual: true, disableWorkerMessageHandler: true } });\n` +
          `export default Prism;\n`,
      },
      ...Object.fromEntries(
        "clike markup css javascript typescript jsx tsx rust go c cpp csharp python bash nasm toml json yaml markdown wgsl zig powershell glsl hlsl lua java kotlin swift sql docker makefile ini batch diff latex scss nix ruby"
          .split(" ")
          .map((lang) => [
            `package/components/prism-${lang}.min.js`,
            { to: `prism/${lang}.js`, wrap: (src) => `export default function (Prism) {\n${src}\n}\n` },
          ]),
      ),
      "package/LICENSE": "prism/LICENSE",
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
  const mark = pkg.integrity + (pkg.rev ? ` ${pkg.rev}` : "");
  if (existsSync(stamp) && readFileSync(stamp, "utf8") === mark) continue;

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
    // a file is copied as it is, or, given { to, wrap }, rewritten by wrap(text) on the way
    const spec = typeof to === "string" ? { to } : to;
    // The folder carries the version (substrate@2.1.0/index.js): /vendor/* is cached for a year as immutable, so a new
    // version must live at a new URL or returning visitors would keep the old file.
    const [dir, ...rest] = spec.to.split("/");
    const dest = join("static/vendor", `${dir}@${pkg.version}${pkg.rev ? `-${pkg.rev}` : ""}`, ...rest);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, spec.wrap ? spec.wrap(data.toString("utf8")) : data);
  }
  writeFileSync(stamp, mark);
  console.log(`vendor: ${pkg.name}@${pkg.version}`);
}
