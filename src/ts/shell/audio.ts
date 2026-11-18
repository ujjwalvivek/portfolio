// Music from the game's AudioEngine (root's setup): an AudioWorklet fed by the engine, with a ScriptProcessor fallback
// for iOS and old browsers. Starts muted; the first toggle needs a user gesture, which the toggle itself is.
// Lives for the whole document, so the music keeps playing across pages.

import { loadGame, type AudioEngineLike } from "./game.js";

let ctx: AudioContext | null = null;
let engine: AudioEngineLike | null = null;
let starting: Promise<boolean> | null = null;
const listeners = new Set<(on: boolean) => void>();

export const musicOn = () => engine?.music_on() ?? false;
export function onMusic(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  fn(musicOn());
  return () => listeners.delete(fn);
}

function scriptNode(audio: AudioContext, eng: AudioEngineLike): void {
  const size = 4096;
  const buf = new Float32Array(size);
  const node = audio.createScriptProcessor(size, 0, 1);
  node.onaudioprocess = (e) => {
    eng.process(buf);
    e.outputBuffer.getChannelData(0).set(buf.subarray(0, e.outputBuffer.length));
  };
  node.connect(audio.destination);
}

async function workletNode(audio: AudioContext, eng: AudioEngineLike): Promise<void> {
  await audio.audioWorklet.addModule("/js/shell/audio-worklet.js");
  const node = new AudioWorkletNode(audio, "audio");
  node.connect(audio.destination);
  const buf = new Float32Array(4096);
  node.port.onmessage = (e) => {
    if (e.data !== "need_data") return;
    eng.process(buf);
    node.port.postMessage(buf.slice());
  };
  node.port.postMessage("need_data");
}

function start(): Promise<boolean> {
  starting ??= (async () => {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      if (ctx.state === "suspended") await ctx.resume();
      const game = await loadGame();
      engine = new game.AudioEngine(ctx.sampleRate);
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (!ios && ctx.audioWorklet && typeof AudioWorkletNode === "function") {
        try {
          await workletNode(ctx, engine);
        } catch (err) {
          console.warn("AudioWorklet unavailable, using ScriptProcessor:", err);
          scriptNode(ctx, engine);
        }
      } else scriptNode(ctx, engine);
      return true;
    } catch (err) {
      console.error("Audio failed to start:", err);
      starting = null;
      return false;
    }
  })();
  return starting;
}

export async function toggleMusic(): Promise<void> {
  if (!(await start()) || !engine) return;
  if (ctx?.state === "suspended") await ctx.resume();
  engine.toggle_music();
  for (const fn of listeners) fn(engine.music_on());
}
