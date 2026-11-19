// The shortcut sheet, opened with "?". It reads the one keymap, so it can never disagree with it (or with the palette
// footer and the command hint, which read it too). Ctrl reads Cmd on Apple keyboards.
// A two-column table: every key cell has the same three slots (key, joiner, key), so the keycaps line up whether the
// row is one key, a held pair ("Ctrl + K") or a sequence ("g then h").

import { KEYS, keycaps } from "../shell/keymap.js";
import { openOverlay } from "../shell/overlay.js";

export function openShortcuts(): void {
  openOverlay({
    id: "keys",
    title: "Keyboard",
    build(body) {
      const table = document.createElement("table");
      table.className = "keys";
      const tbody = table.createTBody();
      for (const { keys, label, action } of KEYS) {
        const caps = action ? keycaps(action) : keys.split(" ");
        const row = tbody.insertRow();
        const th = document.createElement("th");
        th.scope = "row";
        const cell = document.createElement("span");
        cell.className = "keys-cell";
        const kbd = (k: string) => Object.assign(document.createElement("kbd"), { textContent: k });
        cell.append(kbd(caps[0] ?? ""));
        if (caps.length > 1) {
          // "g h" is a sequence (g, then h); "Ctrl K" is held together
          const join = caps[0] === "g" ? "then" : "+";
          cell.append(Object.assign(document.createElement("span"), { className: "keys-join", textContent: join }), kbd(caps[1]!));
        }
        th.append(cell);
        const td = row.insertCell();
        td.textContent = label;
        row.append(th, td);
      }
      body.append(table);
    },
  });
}
