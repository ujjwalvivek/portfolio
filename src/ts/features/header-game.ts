// Home header (ADR D-012). The HTML header is there from the first byte; once the page has painted, the scene loads and,
// when its first frame is drawn, takes over the box. Leaving home parks and pauses the scene; coming back resumes it.

import { onMusic, toggleMusic } from "../shell/audio.js";
import { hideGame, showGame } from "../shell/game.js";

const AUDIO_ON =
  "M3 7h2v5H3zm4 0h2v13H7zm4-3h2v16h-2zm4 0h2v13h-2zM5 5h2v2H5zm4 15h2v2H9zm4-18h2v2h-2zm4 15h2v2h-2zm2-5h2v5h-2zm2-2h2v2h-2zM1 12h2v2H1z";
const AUDIO_OFF =
  "M12 7h2v1h1v1h2V8h1V7h2v2h-1v1h-1v2h1v1h1v2h-2v-1h-1v-1h-2v1h-1v1h-2v-2h1v-1h1v-2h-1V9h-1zM6 8V7h1V6h1V5h1V4h1V3h1v16h-1v-1H9v-1H8v-1H7v-1H6v-1H2V8zm1 2H4v2h3v1h1v1h1V8H8v1H7z";

export function mount(root: HTMLElement): () => void {
  const box = root.querySelector<HTMLElement>("[data-header-game]");
  const inner = box?.querySelector<HTMLElement>(".header-inner");
  if (!box || !inner) return () => {};
  let left = false;

  const start = () => {
    if (left) return;
    showGame(inner)
      .then(() => {
        if (left) return hideGame();
        box.classList.add("is-live");
      })
      .catch((err) => console.warn("Header scene unavailable, keeping the HTML header:", err));
  };
  // After first paint and once the browser is idle, so the scene never delays the page itself.
  const idle = (fn: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
  requestAnimationFrame(() => idle(start));

  const button = box.querySelector<HTMLButtonElement>("[data-music]");
  const path = button?.querySelector("path");
  const stop = onMusic((on) => {
    button?.setAttribute("aria-pressed", String(on));
    path?.setAttribute("d", on ? AUDIO_ON : AUDIO_OFF);
  });
  const click = () => void toggleMusic();
  button?.addEventListener("click", click);

  return () => {
    left = true;
    stop();
    button?.removeEventListener("click", click);
    box.classList.remove("is-live");
    hideGame();
  };
}
