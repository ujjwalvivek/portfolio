---
title: "A Game of Game Engines: Benchmarking Two Technologies"
date: 2026-06-11
summary: "I built two game engines with opposite philosophies, then benchmarked them. Here's what I actually realized."
slug: log_0008_game_of_games
---

:::toc
:::

As you might have come to realize, I build things from personal pain. Always have.

## Journey Engine Specs

[Journey](https://journey.ujjwalvivek.com) started as a question I couldn't let go of.

- Can Rust, compiled to WebAssembly, actually hold a frame rate that a JavaScript runtime would blink on? Not in theory, but on real hardware.

I had to know, so I made a way to find out.

And, of course it took longer than I expected. It always does.

Journey is written in `Rust`. It compiles to `WASM` with a binary size of **1.5MB** (gzip) and native desktop from the same codebase. It has, to name a few:

- A fixed-timestep game loop
- Swept AABB physics with collision layers and a spatial grid
- Instanced sprite rendering
- A custom atmosphere system
- A `no_std` DSP audio engine I wrote from scratch
- A zero-allocation procedural music sequencer
- Screen shake
- Egui integration

:::note
Try Journey here

[https://journey.ujjwalvivek.com](https://journey.ujjwalvivek.com)
:::

## TinyTS Specs

[TinyTS](https://tinyts.ujjwalvivek.com) came later because Journey answered one question and opened another.

- What do you actually gain from a systems language if TypeScript can push over 50k entities at 60fps in a browser tab? What's the real cost of reaching for the low-level?

Theories aside, I wanted to measure it.

So I made the counterweight.

TinyTS is `TypeScript-first`. **140KB** minified. **40KB** gzip. Zero runtime dependencies. It has, to name a few:

- An ECS with pooling and serialization
- Swept AABB and spatial grid
- Verlet physics
- A full ADSR synthesizer with a music sequencer
- Procedural texture generation
- A particle system

TinyTs aims to be everything you'd reach for making a browser jam game, in a package smaller than most favicons.

:::note
Try TinyTS here

[https://tinyts.ujjwalvivek.com](https://tinyts.ujjwalvivek.com)
:::

## Benchmarking Criteria

These aren't the same engine in two languages. They're the same problem space explored with two completely different philosophies.

`Journey` is about `ceiling` and `consistency`. `TinyTS` is about `reach` and `developer experience.`

I needed to run them back-to-back to actually feel the difference.

This is **that** experiment.

## The Harness

The obvious approach is to open both engines side by side, eyeball the frame counter, and call it done.

I've done that before. It's useless. You end up arguing with yourself about whether the tab was focused or whether the GPU was still warm from the last run.

So I made a `sandboxed sequential benchmarking` harness.

It's a single HTML page that opens each engine in an isolated window, waits for it to run all conditions unattended, collects the results via `postMessage`, closes the window, and moves to the next engine. No interference in between runs.

:::note
Try GOGS here

[https://gogs.ujjwalvivek.com](https://gogs.ujjwalvivek.com)

[https://github.com/ujjwalvivek/gogs](https://github.com/ujjwalvivek/gogs)

[https://gogs.ujjwalvivek.com/?id=share-mqdmzuxt-6066](https://gogs.ujjwalvivek.com/?id=share-mqdmzuxt-6066) - **Benchmark Results**
:::

<iframe src="https://gogs.ujjwalvivek.com/?id=share-mqdmzuxt-6066" caption="The Benchmarking Tool - Full Run Results" cover="gogs"></iframe>

:::warning
If both engines ran in the same tab they'd share the JS event loop, the GPU command queue, and the browser's thermal budget. You'd be benchmarking the scheduler, not the engines.
:::

### Five Benchmark Suites

| Suite        | What it tests                                                     |
| ------------ | ----------------------------------------------------------------- |
| Particles    | Update + rect render + wall bounce, with and without spatial grid |
| Rendering    | Rect flood, mixed shapes, texture sprites, bloom post-FX          |
| Audio        | Polyphony stress, sequencer update at 120/180/240 BPM             |
| ECS + Verlet | Rope/point Verlet, entity churn, view queries, hierarchy          |
| Physics      | Swept AABB collision at scale                                     |

Each suite runs at multiple entity counts: **1k, 4k, 8k, 16k, 32k, 65k**.

The goal is to find where each engine starts to bend, and not just handle a comfortable load.

### One Caveat Before The Numbers

Journey reports frame time from inside its own loop-counter, its own delta. TinyTS uses browser wall-clock delta from `requestAnimationFrame`.

These are not the same unit. Engine-reported time excludes browser overhead. Wall-clock includes it.

Keep in mind, Journey's FPS and TinyTS's FPS are not directly comparable. I'll flag later when this changes how to read a result.

## Particles: Where Journey Seems To Win, But Doesn't Really

Simple particle update with wall bounce and no spatial grid:

| Entities | Journey FPS | Journey P95 | TinyTS FPS | TinyTS P95 |
| -------- | ----------- | ----------- | ---------- | ---------- |
| 1,024    | 143         | 7.3ms       | 60         | 21.1ms     |
| 8,192    | 143         | 7.5ms       | 60         | 21.1ms     |
| 16,384   | 143         | 7.3ms       | 60         | 21.0ms     |
| 32,768   | 143         | 7.5ms       | 21.1ms     | 21.1ms     |
| 65,536   | 141         | 8.9ms       | 60         | 21.4ms     |

<img src="https://cdn.ujjwalvivek.com/posts/media/gogs2.webp">

Journey at **141 FPS**. TinyTS at **60 FPS**. Clean win for Rust.

Except TinyTS is browser `requestAnimationFrame` capped. On a v-sync display it literally cannot report above v-sync capabilities.

Journey's WASM loop is uncapped. It runs as fast as the hardware allows and reports its own timing.

The FPS comparison is meaningless here. They have different ceilings. The P95 frame time is the honest number.

At 65k particles, Journey's P95 is **8.86ms**. TinyTS is **21.36ms**. Journey is more consistent under load. That's Rust's predictable memory layout versus V8's GC pauses showing up in variance, not mean FPS.

## The Spatial Grid: Where They Actually Meet

Add a spatial grid for particle overlap detection:

| Entities | Journey FPS | Journey P95 | TinyTS FPS | TinyTS P95 |
| -------- | ----------- | ----------- | ---------- | ---------- |
| 1,024    | 143         | 7.4ms       | 60         | 21.1ms     |
| 8,192    | 143         | 7.5ms       | 60         | 21.2ms     |
| 16,384   | 143         | 7.5ms       | 60         | 21.2ms     |
| 32,768   | **105**     | 10.9ms      | 60         | 21.1ms     |
| 65,536   | **36**      | 40.1ms      | **33**     | 44.3ms     |

<img src="https://cdn.ujjwalvivek.com/posts/media/gogs3.webp">

Journey and TinyTS, both collapse at 65k, and land at almost exactly the same number.

Journey collapse down to **36 FPS**. TinyTS down to **33 FPS**.

This is great. This means the language gap disappears entirely under extreme spatial query load.

At 65k entites, the architectural bottleneck shifts entirely to the CPU's processing throughput. The language choice no longer offers a competitive advantage.

`O(n^2)` is `O(n^2)` anywhere on this planet. When the algorithm is the bottleneck, the runtime stops mattering.

This was the first result that genuinely surprised me.

## The Browser Gap I Can't Possibly Fix

The `Chromium` vs `Firefox` gap is the most revealing data point in the whole experiment, because of what it says about the runtime.

### TinyTS on Chromium

| Condition      | Solid 60fps limit | Notes                                 |
| -------------- | ----------------- | ------------------------------------- |
| No collision   | ~90,000 entities  | Starts degrading to ~55fps after 100k |
| AABB collision | ~50,000 entities  | Full collision enabled                |
| Fast collision | ~54,000 entities  | A few thousand higher than full AABB  |

### TinyTS on Firefox

| Condition      | Solid 60fps limit | Notes                                  |
| -------------- | ----------------- | -------------------------------------- |
| No collision   | ~50,000 entities  | Falls down to ~30fps beyond 60k counts |
| AABB collision | ~20,000 entities  | Significant gap vs Chromium            |
| Fast collision | ~23,000 entities  | Minor improvement                      |

### Takeaway

**50,000** entities vs **90,000** entities. Same engine. Same algorithm.

That gap is `SpiderMonkey's` graphics implementation, Firefox's privacy fingerprinting guard rails tanking DPR and GPU detection, the engine falling back to safer slower paths because it can't trust the context it's been given.

I already have guard rails in TinyTS to handle exactly these scenarios. But there's a floor beneath which no engine-level fix reaches.

Journey doesn't notice. WASM sidesteps almost all of it. The engine gets linear memory and a predictable execution model regardless of which browser is running it. Firefox fingerprinting doesn't touch WASM execution.

## Bundle Size vs First Frame

| Metric                  | Journey     | TinyTS      |
| ----------------------- | ----------- | ----------- |
| Transfer size           | 1,443 KB    | **36 KB**   |
| WASM fetch              | 30.8ms      | N/A         |
| WASM compile            | 2.5ms       | N/A         |
| JS parse + execute      | N/A         | < 1ms       |
| **Time to first frame** | **2,006ms** | **2,545ms** |

<img src="https://cdn.ujjwalvivek.com/posts/media/gogs4.webp">

TinyTS transfers **40x** less data. And it's slower to first frame. This took me a while to make sense of.

Journey's startup is a predictable sequence. Fetch WASM, compile, instantiate, initialize wGPU surface, run. Each step is bounded. The GPU initialization is the long tail but it's synchronous and uninterruptible once it starts.

TinyTS's startup is cheaper at every individual step. But the WebGPU backend negotiation, adapter requests, device initialization, and pipeline compilation all happen asynchronously across multiple browser task boundaries.

Every `await` yields control back to the event loop. The accumulated scheduling latency adds up to something slower than a WASM binary that just runs.

The small bundle won the download race and lost the start-up race.

## Audio: Where The Comparison Breaks Down

| Voices | Journey FPS | TinyTS FPS |
| ------ | ----------- | ---------- |
| 4      | 143         | 60         |
| 8      | 143         | 60         |
| 16     | 139         | 60         |
| 32     | 91          | 60         |
| 64     | **48**      | 60         |

<img src="https://cdn.ujjwalvivek.com/posts/media/gogs5.webp">

Journey drops to **48fps** at **64** voices. TinyTS stays at **60fps**.

Looks like TinyTS handles audio better? It doesn't. They're not doing the same thing.

Journey is running [Resonance](https://crates.io/crates/journey-sound), my `no_std` DSP synthesis engine, on the main benchmark thread. Real oscillators. Real ADSR envelopes. Real PCM sample generation competing directly with game logic and rendering for CPU time. 64 voices means 64 synthesis pipelines running every frame.

While, TinyTS calls `playSound()` and hands off to the Web Audio API. The Web Audio API runs on a **separate thread** managed by the browser. TinyTS's main thread never touches the synthesis.

```rust
// This is running on the main thread, every frame, 64 times
let sample = voice.next_sample(); // oscillator + envelope math
buffer[i] = sample;               // into the PCM buffer
```

```typescript
// This schedules work on the audio thread and returns immediately
playSound({ wave: "sine", frequency: 440, attack: 0.01 });
```

Of course TinyTS stays at **60fps**. It's not doing the audio work on the main thread. Journey is. When Journey drops to **48fps** at **64** voices, it's because it's doing more real work in the benchmark than TinyTS is.

This isn't a flaw in either engine. It's a fundamental architectural difference that makes the numbers meaningless as a comparison. Journey does more work in the benchmark. TinyTS does less.

This comparison is invalid. It would require Journey routing Resonance output to a Web Audio sink, which defeats the point of the `no_std` DSP design.

I'm leaving the numbers in anyway because they correctly illustrate a real architectural difference.

If you need DSP synthesis on the main thread for determinism or WASM portability, you pay for it. If you can hand off to the browser audio thread, you don't.

## Memory: Predictable vs Efficient

| Metric               | Journey     | TinyTS       |
| -------------------- | ----------- | ------------ |
| Heap at idle         | 66.6 MB     | 7.7 MB       |
| Heap at 65k entities | 67.1 MB     | 33.9 MB      |
| **Heap after stop**  | **50.2 MB** | **115.1 MB** |

<img src="https://cdn.ujjwalvivek.com/posts/media/gogs6.webp">

Journey uses more memory during a run. But after the engine stops, Journey settles at 50MB. TinyTS spikes to 115MB and waits.

Journey's WASM linear memory releases when the module tears down. Predictable, bounded, immediate.

TinyTS's JS heap is at the mercy of V8's garbage collector. The 115MB spike isn't a leak, it's deferred cleanup. Eventually it settles. But "eventually" is not a number.

This is just JavaScript being JavaScript.

If you're shipping a game that runs for six hours, Journey's memory model is more predictable. If you're shipping a game jam entry that runs for twenty minutes, it doesn't matter.

## Are The Numbers Lying?

The frame numbers all over felt wrong the first time I saw it, especially a **144fps**. The numbers don't move. I'm spawning thousands of entities per second and the frame counter doesn't care.

It reads like a bug.

It isn't. It's what happens when you remove unpredictability from a runtime: No GC, deterministic memory layout, and your optimizations do hold when it needs to.

- The frame budget is yours, entirely, every frame.
- Cache misses are your fault, not the runtime's.

A spatial grid, in this case, in Rust doesn't degrade over time. There's no GC pressure accumulating in the background that eventually makes your broad-phase slower than it should be. The algorithm runs at full speed every time.

The benchmarking tool reveals this, paradoxically, by showing you nothing. The ceiling is so far above the load that the graph is just a flat line.

TinyTS does the opposite, and doesn't hide anything.

At 90,000 entities on Chromium you can really see V8 working hard. The frame rate doesn't drop off a cliff, it wears down gradually, and if you watch closely you can feel the GC starting to blink. That slow degradation is the fingerprint of a managed runtime doing its best.

That 90,000 figure is still genuinely impressive for a project thats been worked on a few months. The spatial grid is doing its job. The broad-phase is holding collision cost down long enough to get there.

That's optimization work showing up in the numbers.

But, **eventually** the GC wins.

## So What's Actually Running the Show?

I'd say, Rust, my optimizations, and then WASM.

:::info
Journey Native Numbers

The native benchmark has no WASM in the picture at all. 144fps, full collision, flat graph, that's pure Rust. Consistency is the proof. JS engines hit high peak FPS too. They don't _hold_ it because the GC eventually blinks.
:::

Talking about optimizations, a bad algorithm in Rust is still a bad algorithm.

The spatial grid and broad-phase are why 65,536 entities doesn't collapse the collision system. You give the language something worth running fast, and it runs it fast indefinitely.

And, WASM doesn't make anything faster. It makes sure the browser can't make things slower.

No JIT unpredictability. Linear memory. It carries Rust's guarantees into the browser. But the guarantees were always Rust's to give.

The clearest proof is in TinyTS's own numbers. A well-optimized TypeScript engine with a spatial grid hits 90,000 entities on Chromium. That's the optimization strategy working. Then GC blinks and you lose frames.

In Journey, the same strategy just **holds**.

## What The Numbers Can't Tell You

None of this captures what I feel day-to-day.

### Time to first triangle

`Journey`

```bash

rustup target add wasm32-unknown-unknown
cargo install wasm-pack
wasm-pack build --target web --release
npx serve pkg/
# now debug why your WASM didn't load
```

`TinyTS`

```html

<script type="module">
    import { engineStart } from "tinyts";
    engineStart({ size: { width: 640, height: 360 } });
</script>
```

One of these has you drawing something in five minutes. The other has you reading error messages for an afternoon. Both are valid. Neither shows up in a P95 chart.

### Iteration speed

|                     | Journey                                | TinyTS                               |
| ------------------- | -------------------------------------- | ------------------------------------ |
| Change → see result | `wasm-pack build` (seconds to minutes) | TypeScript transpiles (milliseconds) |
| Error feedback      | Rust compiler + WASM runtime           | Browser console                      |
| Hot reload          | No                                     | Yes                                  |

This is where TypeScript earns its place.

The iteration speed writing TinyTS was in a different dimension compared to Journey.

Hot reload. Type inference. A target runtime that is also your development environment.

The feedback loop between `I want to try something` and `I can see if it worked` is so much tighter that you take more swings. You explore more ideas. You're not afraid of the compile step.

Rust gives you something TypeScript cannot, which is, the certainty that when it runs, it runs correctly, at speed, every time. But you pay for that certainty in friction. Think of the borrow checker as a collaborator that doesn't forgive sloppiness.

For a long-running, deeply personal project like Journey, that's the right tradeoff. The ceiling matters more than the iteration speed.

For TinyTS, shipping an engine that a developer can drop into a `<script>` tag in five minutes and have something moving on screen, TypeScript is the right tool. 

The DX is the product, in a way that it isn't for Journey.

### Debuggability

Journey gives you a Rust panic with a WASM stack trace. Readable if you have DWARF debug symbols and a browser that knows what to do with them.

TinyTS gives you a JavaScript error in the browser console. Just works.

> Which one is better? Your choice.

## Honest Takeaway?

|                        | Journey | TinyTS |
| ---------------------- | ------- | ------ |
| Sustained performance  | Y       | N/A    |
| Memory predictability  | Y       | N/A    |
| Bundle size            | X       | Y      |
| First frame time       | X       | Y      |
| Time to first triangle | X       | Y      |
| Iteration speed        | N/A     | Y      |
| Debuggability          | N/A     | Y      |
| Audio on main thread   | Y       | X      |
| High entity variance   | Y       | N/A    |
| Extreme load (65k+)    | Tie     | Tie    |

The real value of running both is that, I can now feel the tradeoffs instead of arguing about them.

TypeScript will blink. Rust won't. TypeScript will ship faster. Rust will hold longer. Neither answer is wrong, they're answers to different questions.

**Neither engine won**.

Journey is the engine I reach for when I want to understand what the computer is actually doing. TinyTS is the engine I reach for when I want to prove an idea exists before I commit to understanding it.

I'm not saying Journey dominated. But one thing that stuck with me most was the spatial grid at **65k**, where they both collapsed to **36fps** and **33fps** respectively.

Because the language stopped mattering the moment the algorithm became the bottleneck.

After that we were just in the same hole together, in different clothes.
