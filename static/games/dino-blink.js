// Dino Blink frame boot, moved out of inline scripts so the page runs under the site CSP.
// The game itself comes from jsDelivr; /games/* gets its own policy in _headers for that.
import init from "https://cdn.jsdelivr.net/npm/@ujjwalvivek/dino-blink@1.0.0/dino_blink.js";

// focusing the canvas must not scroll the parent post
const nativeFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function (options) {
  nativeFocus.call(this, { ...options, preventScroll: true });
};

let started = false;
document.body.classList.add("pre-start");

document.addEventListener("click", () => {
  if (started) return;
  started = true;
  document.body.classList.remove("pre-start");

  const canvas = document.querySelector("canvas");
  const target = canvas || document.body;

  const down = new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true });
  const up = new KeyboardEvent("keyup", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true });
  target.dispatchEvent(down);
  setTimeout(() => target.dispatchEvent(up), 80);
});

await init();
