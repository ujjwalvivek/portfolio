// The shortcut sheet, opened with "?". It reads the one keymap, so it can never disagree with it.

import { KEYS } from "../shell/keymap.js";
import { openOverlay } from "../shell/overlay.js";

export function openShortcuts(): void {
  openOverlay({
    id: "keys",
    title: "Keyboard",
    build(body) {
      const dl = document.createElement("dl");
      dl.className = "keys";
      for (const { keys, label } of KEYS) {
        const dt = document.createElement("dt");
        for (const k of keys.split(" ")) {
          const kbd = document.createElement("kbd");
          kbd.textContent = k;
          dt.append(kbd, " ");
        }
        const dd = document.createElement("dd");
        dd.textContent = label;
        dl.append(dt, dd);
      }
      body.append(dl);
    },
  });
}
