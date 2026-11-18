// Code blocks (v3 CodeBlock): each <pre> gets a frame with corner brackets and a Copy button that reads
// "Copied!" for two seconds. The frame adds no size of its own, so wrapping after first paint moves nothing.

export function mount(md: HTMLElement): () => void {
  const timers = new Set<number>();
  const blocks: { pre: HTMLPreElement; frame: HTMLElement }[] = [];

  for (const pre of md.querySelectorAll<HTMLPreElement>("pre")) {
    if (pre.parentElement?.classList.contains("code-block")) continue;
    const frame = document.createElement("div");
    frame.className = "code-block";
    const corners = document.createElement("span");
    corners.className = "code-corners";
    corners.setAttribute("aria-hidden", "true");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "Copy";
    button.addEventListener("click", () => {
      const text = (pre.querySelector("code") ?? pre).textContent ?? "";
      navigator.clipboard
        .writeText(text.replace(/\n$/, ""))
        .then(() => (button.textContent = "Copied!"))
        .catch(() => (button.textContent = "Failed"))
        .finally(() => {
          const t = window.setTimeout(() => {
            button.textContent = "Copy";
            timers.delete(t);
          }, 2000);
          timers.add(t);
        });
    });
    pre.replaceWith(frame);
    frame.append(pre, corners, button);
    blocks.push({ pre, frame });
  }

  return () => {
    timers.forEach((t) => clearTimeout(t));
    for (const { pre, frame } of blocks) if (frame.isConnected) frame.replaceWith(pre);
  };
}
