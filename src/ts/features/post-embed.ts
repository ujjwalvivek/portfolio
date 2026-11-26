// Iframe covers (v3 IframeEmbed): an external embed shows its cover image until clicked, then loads the iframe in
// its place, in the same box. Without JS the cover is a link that opens the embed in a new tab.
// An embed marked data-gpu="webgpu" (older journey builds, whose wgpu has no WebGL fallback) is loaded only if the
// browser gives a WebGPU adapter; otherwise the box says so, instead of a demo that hangs on its loading screen.

type Gpu = { requestAdapter(): Promise<unknown> };
let adapter: Promise<boolean> | undefined;
const hasWebGpu = () =>
  (adapter ??= (async () => {
    const gpu = (navigator as Navigator & { gpu?: Gpu }).gpu;
    return gpu ? Boolean(await gpu.requestAdapter().catch(() => null)) : false;
  })());

function noGpu(cover: HTMLElement): void {
  const box = document.createElement("div");
  box.className = "embed-nogpu";
  const k = document.createElement("p");
  k.className = "embed-nogpu-k";
  k.textContent = "no webgpu adapter found";
  const p = document.createElement("p");
  p.textContent = "This build runs on WebGPU only. Open the post in a browser with WebGPU to try it.";
  box.append(k, p);
  cover.replaceWith(box);
}

export function mount(md: HTMLElement): () => void {
  // a ratio other than the CSS default 16/9 is set through the CSSOM, which the CSP allows (a style attribute it would not)
  md.querySelectorAll<HTMLElement>("[data-embed] [data-ratio]").forEach((f) => (f.style.aspectRatio = f.dataset.ratio ?? ""));
  const covers = [...md.querySelectorAll<HTMLAnchorElement>("[data-embed] [data-embed-cover]")];
  const onClick = async (e: MouseEvent) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const cover = e.currentTarget as HTMLAnchorElement;
    const figure = cover.closest<HTMLElement>("[data-embed]");
    const src = figure?.dataset.src;
    if (!figure || !src) return;
    e.preventDefault();
    if (figure.dataset.gpu === "webgpu" && !(await hasWebGpu())) return noGpu(cover);
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = figure.dataset.title || "Embedded demo";
    iframe.allow = "autoplay; fullscreen; gamepad; clipboard-write; encrypted-media; picture-in-picture";
    iframe.allowFullscreen = true;
    cover.replaceWith(iframe);
    figure.classList.add("is-live");
    iframe.focus({ preventScroll: true });
  };
  covers.forEach((c) => c.addEventListener("click", onClick));
  return () => covers.forEach((c) => c.removeEventListener("click", onClick));
}
