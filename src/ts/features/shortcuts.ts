// The shortcut sheet, opened with "?". It reads the one keymap, so it can never disagree with it (or with the palette
// footer and the command hint, which read it too). Ctrl reads Cmd on Apple keyboards.

import { KEYS, keycaps } from "../shell/keymap.js";
import { openOverlay } from "../shell/overlay.js";

export function openShortcuts(): void {
  openOverlay({
    id: "keys",
    title: "Keyboard",
    build(body) {
      const dl = document.createElement("dl");
      dl.className = "keys";
      for (const { keys, label, action } of KEYS) {
        const dt = document.createElement("dt");
        const caps = action ? keycaps(action) : keys.split(" ");
        caps.forEach((k, i) => {
          const kbd = document.createElement("kbd");
          kbd.textContent = k;
          // "g h" is a sequence (g, then h); "Ctrl K" is held together
          if (i > 0 && caps[0] === "g") dt.append(Object.assign(document.createElement("span"), { className: "keys-then", textContent: "then", style: "color: rgba(var(--text-color-rgb), 0.5)" }), " ");
          dt.append(kbd, " ");
        });
        const dd = document.createElement("dd");
        dd.textContent = label;
        dl.append(dt, dd);
      }
      body.append(dl);
    },
  });
}
