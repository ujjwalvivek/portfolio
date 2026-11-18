// Blog post (ADR M3, v3 BlogPost). The post is Zola's HTML; this brings its interactive parts to life:
// TOC scroll spy, code copy buttons, the image lightbox, click-to-load iframe covers and the dino game.

import { mount as mountToc } from "../features/post-toc.js";
import { mount as mountCode } from "../features/post-code.js";
import { mount as mountLightbox } from "../features/post-lightbox.js";
import { mount as mountEmbeds } from "../features/post-embed.js";
import { lazySection } from "../lib/lazy.js";

export function mount(root: HTMLElement): () => void {
  const post = root.querySelector<HTMLElement>("[data-post]");
  if (!post) return () => {};
  const md = post.querySelector<HTMLElement>("[data-markdown]") ?? post;
  const undo = [mountToc(post), mountCode(md), mountLightbox(md), mountEmbeds(md)];
  // The dino game loads only when its box nears the viewport (the box holds its height from the first paint).
  for (const host of post.querySelectorAll<HTMLElement>("[data-dino] .dino-host")) {
    undo.push(lazySection(host, "/js/features/post-dino.js", [], "200px 0px"));
  }
  return () => undo.forEach((u) => u());
}
