// Projects overlays (v3 notionOverlay). "Case Study" opens the case study (one of the site's own pages under /work/,
// once a Notion page) or a Notion page in an iframe, and "Docs" opens a PDF, each in
// the shell's overlay frame, so Esc, the ESC chip and a click outside close it (overlay.ts). Both buttons are real links
// in the HTML, so without JS, or with a modifier key, they open in a new tab instead.
// The PDF viewer belongs to another module and is imported only when a PDF is first opened.

import { closeOverlay, openOverlay } from "../shell/overlay.js";
import { loadFeature } from "../lib/lazy.js";

export type EmbedKind = "case" | "notion" | "pdf";
type PdfViewer = { mountPdf(host: HTMLElement, url: string, opts?: { title?: string }): () => void };

const ID = "projects-embed";
// Not a literal, so tsc leaves the specifier alone and does not need the viewer's source to compile this file.
const PDF_VIEWER: string = "/js/features/pdf-viewer.js";
const ICONS: Record<EmbedKind, string> = {
  case: "/icons.svg#ep-docs",
  notion: "/icons.svg#pi-notion-logo-fill",
  pdf: "/icons.svg#pi-file-pdf-fill",
};

function newTabLink(url: string, label: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.className = "chip pj-embed-out";
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = label;
  return a;
}

function frame(body: HTMLElement): void {
  body.classList.add("pj-embed-body");
  body.parentElement?.classList.add("pj-embed-card");
}

function page(body: HTMLElement, url: string, title: string, kind: "case" | "notion"): void {
  frame(body);
  const iframe = document.createElement("iframe");
  iframe.className = `pj-embed-frame is-${kind}`;
  iframe.src = url;
  iframe.title = title;
  iframe.allowFullscreen = true;
  body.append(iframe);
}

function pdf(body: HTMLElement, url: string, title: string): () => void {
  frame(body);
  const host = document.createElement("div");
  host.className = "pj-pdf-host";
  // Honest wait: shown only while the viewer module is actually loading, removed the moment it mounts (D-024).
  const note = document.createElement("p");
  note.className = "pj-embed-note";
  note.setAttribute("role", "status");
  note.textContent = "loading pdf viewer";
  body.append(note, host);

  let closed = false;
  let unmount: (() => void) | null = null;
  (import(PDF_VIEWER) as Promise<PdfViewer>)
    .then((m) => {
      if (closed) return;
      note.remove();
      unmount = m.mountPdf(host, url, { title });
    })
    .catch((err: unknown) => {
      console.error("pdf viewer failed to load:", err);
      if (closed) return;
      note.textContent = "the pdf viewer did not load. ";
      note.append(newTabLink(url, "open the pdf instead"));
    });
  return () => {
    closed = true;
    unmount?.();
  };
}

const CSS = "/css/features/projects-embed.css";

export function openEmbed(kind: EmbedKind, url: string, title: string): void {
  closeOverlay(ID);
  // the stylesheet first (cached after the first time), so the card never shows unstyled
  void loadFeature(import.meta.url, [CSS]).then(() => show(kind, url, title));
}

function show(kind: EmbedKind, url: string, title: string): void {
  openOverlay({
    id: ID,
    title,
    icon: ICONS[kind],
    build: (body) => {
      // "open in new tab" sits in the title bar, next to ESC
      body.parentElement?.querySelector(".overlay-head button.chip")?.before(newTabLink(url, "open in new tab"));
      return kind === "pdf" ? pdf(body, url, title) : page(body, url, title, kind);
    },
  });
}

export function closeEmbed(): void {
  closeOverlay(ID);
}
