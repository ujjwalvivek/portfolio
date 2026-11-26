// Case study page (templates/case.html), the document shown in the projects overlay's frame where Notion used to be.
// It has no shell, so this does the little the shell would: colours, the TOC scroll spy and the image lightbox.
//   colours  framed (same origin), the page copies the palette variables the parent's drift writes on its <html>,
//            and follows them as they change, so the frame drifts in step with the site. Opened on its own, it runs
//            the drift itself.
//   Esc      a key pressed inside the frame never reaches the parent, so Esc is passed up to close the overlay.

import { mount as mountToc } from "../features/post-toc.js";
import { mount as mountLightbox } from "../features/post-lightbox.js";

function followParentColours(): boolean {
  let host: HTMLElement;
  try {
    if (window.parent === window) return false;
    host = window.parent.document.documentElement;
  } catch {
    return false; // another origin framed us: run on our own
  }
  const mine = document.documentElement.style;
  const copy = () => {
    for (const name of Array.from(host.style)) {
      if (name.startsWith("--")) mine.setProperty(name, host.style.getPropertyValue(name));
    }
  };
  copy();
  new MutationObserver(copy).observe(host, { attributes: true, attributeFilter: ["style"] });
  return true;
}

function passEscapeUp(): void {
  if (window.parent === window) return;
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    // the lightbox handles its own Esc first and prevents it; anything left closes the overlay
    try {
      window.parent.document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    } catch {
      // another origin: nothing to tell
    }
  });
}

if (!followParentColours()) {
  void import("../shell/drift.js").then((m) => m.startDrift());
}
passEscapeUp();

const post = document.querySelector<HTMLElement>("[data-post]");
if (post) {
  const md = post.querySelector<HTMLElement>("[data-markdown]") ?? post;
  mountToc(post);
  mountLightbox(md);
}
