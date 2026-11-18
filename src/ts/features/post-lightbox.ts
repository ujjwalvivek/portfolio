// Image lightbox (v3): click an image in the post to see it whole over a blurred page; a click anywhere or Esc closes it.

export function mount(md: HTMLElement): () => void {
  let box: HTMLElement | null = null;
  let returnFocus: HTMLElement | null = null;

  const close = () => {
    if (!box) return;
    box.remove();
    box = null;
    removeEventListener("keydown", onKey, true);
    returnFocus?.focus({ preventScroll: true });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    close();
  };
  const open = (img: HTMLImageElement) => {
    close();
    returnFocus = img;
    box = document.createElement("div");
    box.className = "post-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", img.alt || "Image");
    box.tabIndex = -1;
    const big = document.createElement("img");
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    box.append(big);
    box.addEventListener("click", close);
    document.body.append(box);
    addEventListener("keydown", onKey, true);
    box.focus({ preventScroll: true });
  };

  const images = [...md.querySelectorAll<HTMLImageElement>("img")].filter((img) => !img.closest("a, [data-embed], [data-dino]"));
  const handlers = images.map((img) => {
    img.classList.add("is-zoomable");
    img.tabIndex = 0;
    const onClick = () => open(img);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(img);
      }
    };
    img.addEventListener("click", onClick);
    img.addEventListener("keydown", onKeyDown);
    return () => {
      img.removeEventListener("click", onClick);
      img.removeEventListener("keydown", onKeyDown);
    };
  });

  return () => {
    handlers.forEach((h) => h());
    close();
  };
}
