// AudioWorklet processor for the game's procedural music (root's audio.js). It plays back buffers the page fills from
// AudioEngine.process and asks for more before it runs dry. Runs in the audio worklet scope, not the page.

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

class SynthProcessor extends AudioWorkletProcessor {
  private queue: Float32Array[] = [];
  private idx = 0;
  private pending = false;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      if (e.data instanceof Float32Array) {
        this.queue.push(e.data);
        this.pending = false;
      }
    };
  }

  private ask(): void {
    if (this.pending) return;
    this.pending = true;
    this.port.postMessage("need_data");
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const ch = outputs[0]?.[0];
    if (!ch) return true;
    let buf = this.queue[0];
    if (!buf) {
      ch.fill(0);
      this.ask();
      return true;
    }
    for (let i = 0; i < ch.length; i++) {
      if (this.idx >= buf.length) {
        this.queue.shift();
        this.idx = 0;
        buf = this.queue[0];
        if (!buf) {
          ch.fill(0, i);
          this.ask();
          return true;
        }
      }
      ch[i] = buf[this.idx++]!;
    }
    if (this.queue.length <= 1) this.ask();
    return true;
  }
}

registerProcessor("audio", SynthProcessor);
