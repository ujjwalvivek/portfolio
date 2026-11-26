// Dino Blink frame boot, moved out of inline scripts so the page runs under the site CSP.
// The game itself is vendored by scripts/vendor.mjs, so the frame loads nothing from other origins.
import init from "/vendor/dino-blink@1.0.1/dino_blink.js";

// focusing the canvas must not scroll the parent post
const nativeFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function (options) {
  nativeFocus.call(this, { ...options, preventScroll: true });
};

// Dino Blink 1.0.x is built on journey-engine 1.1.2, whose wgpu has no WebGL fallback: with no WebGPU adapter it
// panics and the canvas stays black. So ask for an adapter first and say so instead.
function noGpu() {
  document.body.classList.remove("pre-start");
  document.querySelector("canvas")?.remove();
  const box = document.createElement("div");
  box.className = "no-gpu";
  box.innerHTML = "<p class=\"no-gpu-k\">no webgpu adapter found</p><p>This build of Dino Blink runs on WebGPU only. Open the post in a browser with WebGPU to play.</p>";
  document.body.replaceChildren(box);
}
const adapter = navigator.gpu ? await navigator.gpu.requestAdapter().catch(() => null) : null;

let started = false;
if (adapter) document.body.classList.add("pre-start");

document.addEventListener("click", () => {
  if (started || !adapter) return;
  started = true;
  document.body.classList.remove("pre-start");

  const canvas = document.querySelector("canvas");
  const target = canvas || document.body;

  const down = new KeyboardEvent("keydown", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true });
  const up = new KeyboardEvent("keyup", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true });
  target.dispatchEvent(down);
  setTimeout(() => target.dispatchEvent(up), 80);
});

if (!adapter) noGpu();
else await init().catch(noGpu);
