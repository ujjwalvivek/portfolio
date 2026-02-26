---
title: "Journey Engine v0.3.2: A Technical Post-Mortem"
date: 2026-02-26
summary: "A technical deep dive into building a dual-mode ASCII level editor, deterministic fixed-timestep physics, and browser-safe audio for a custom 2D Rust engine."
slug: log_0004_journey_updates
---

:::warning
v0.3.2 Live Demo

https://journey.ujjwalvivek.com - OR - SCROLL DOWN
:::

<iframe src="https://journey.ujjwalvivek.com" title="Journey Engine v0.3.2 Demo" width="100%" style="aspect-ratio: 16/9;"></iframe>

Use WASD to move, Shift to Run, and Alt to Dodge. Mouse clicks Attack and Parries.

## Introduction

There is a specific moment in Sekiro where you press the block button and the entire screen freezes for three frames. Metal clangs. Sparks fly. The enemy staggers. You know your timing was correct because the game told you so through every channel it could: `visual`, `audio`, and the `physics` of the world itself. That is the feeling I have been chasing for the past few weeks.

The problem is deceptively simple. How do you make a parry window feel identical on every hardware? The answer, it turns out, requires rethinking how time itself flows through the engine.

The **Journey engine** has been taking shape in the last few weeks of me developing it. This post covers the few of the hardest problems I solved in the last sprint: a level editor that just works, a cross-platform audio system that plays nice with the browser sandbox, a state machine that keeps a growing game manageable, and the small engineering details that separate "functional" from "feels right."

## Building a Two-Mode Editor for Journey

For Journey, I wanted something different. Something where the level file was human-readable, diffable, shareable, and editable without a GUI. What I ended up with is probably the simplest possible level format that could work: a plain text file where the visual shape of the characters is the level layout.

```json
=.......E.......................#..............................=
 =......._____...................#..............................=
 =..@............................#..*...........................=
 ========================.....===================================
```

This is the entire level description. The ASCII is the source of truth. The parser, literally 20 lines of code. WASM persistence uses `localStorage`. On native, the file writes to disk. The same string goes to both. Level sharing is copy-paste from a text file. The string is always persistent.

```rust
for (row, line) in level_data.lines().enumerate() {
    for (col, character) in line.chars().enumerate() {
        let x = (col as f32 * tile_size) + half_tile;
        let y = screen_height - ((total_rows - row) as f32 * tile_size) + half_tile;
        let center = Vec2::new(x, y);
        match character {
            '#' => /* Wall */,  '=' => /* Floor */,  '_' => /* OneWay platform */,
            '@' => /* Player spawn */,  'E' => /* Grunt enemy */,
            '*' => /* Grapple node */,  'O' => /* Exit */,
            '.' | _ => {}
        }
    }
}

pub fn validate_text_buffer(&self) -> Vec<String> {
    let mut warnings = Vec::new();
    let spawn_count = self.text_buffer.chars().filter(|&c| c == '@').count();
    match spawn_count {
        0 => warnings.push("No player spawn (@) found.".to_string()),
        n if n > 1 => warnings.push(format!("Multiple spawns: {n}. First used.")),
        _ => {}
    }
    // ...exit, floor checks
    warnings
}
```

Because the canonical level representation is a `String`, both editor modes operate on the same object. The text editor is a plain egui `TextEdit::multiline` bound to `self.text_buffer`. The visual paint editor converts mouse screen coordinates to `(row, col)`, does `chars[col] = selected_tile`, rejoins the lines, and calls `reload_from_str`. The live minimap in the text editor also reads directly from the string. It iterates `text_buffer.lines()`, paints, and updates on every keypress.

:::note
Why?

The thing I want to highlight here is not the cleverness of the parser, but the consequence of that simplicity.

It is not clever, it is almost trivially simple. There is no serialization layer, schema, or an import pipeline that can become a bottleneck. The iteration loop is under two seconds. That feedback speed compounds over hundreds of design iterations.
:::

:::danger
But what's the catch?

* No sub-tile precision (everything snaps to 16px grid).
* No metadata per tile (you cannot describe a "crumbling platform" vs. a "solid platform" with the current character set).
* No nested hierarchy (no rooms, no layers). These are real constraints that cap the complexity of levels this system can represent.
* The ASCII format does not scale. The parser is an implementation detail, not the API.
:::

:::tip
Verdict?

For a project demonstrating engine architecture, this is an acceptable trade-off. The simplicity of a single source of truth means the editor is robust by construction.

The complexity of a more expressive format would require a separate editor, a binary format, and a parser-serializer pair that could easily get out of sync. The risk of that complexity is not just engineering overhead, but silent data corruption. With the ASCII format, there is no conversion layer where bugs can hide.
:::

## Web Audio's Policies & Lazy Init

You cannot play sound until the user touches or clicks something in the browser tab. The Web Audio API's `AudioContext` starts in a "suspended" state, and any attempt to play before a gesture is silently swallowed.

For a native desktop game, this is irrelevant. But Journey targets both native and WASM. The engine needs to handle both cases without the game code caring which platform it is running on. The solution is a lazy initialization pattern wrapped around Kira's `AudioManager`.

```rust
pub struct AudioManager {
    inner: Option<KiraManager<DefaultBackend>>,
    is_initialized: bool,
    #[cfg(target_arch = "wasm32")]
    awaiting_user_gesture: bool,
}
```

A small state machine handles both platforms: in WASM `awaiting_user_gesture` blocks audio until the page clock sees a click, and `is_initialized` becomes the fast‑path once the `AudioManager` is built. That single boolean lets every sound effect skip an `Option::is_none()` check on the hot path while the cold path still handles the browser unlock and a possible retry after initialization.

> Choosing Kira directly instead of a wrapper keeps dependencies thin and leaves the WASM handshake under our control. The downside is a silent failure if Kira’s web build breaks, which we can mitigate with a development‑time warning on repeated `try_init()` failures.

## Scalable State Machine & Fixed Timestep Accumulator

Without structure, the `update()` function would become a minefield of nested `if` statements. The solution is a `GameState` enum:

```rust
pub enum GameState {
    Splash { timer: f32 },
    StartMenu { animation_progress: f32 },
    Options { return_state: MenuReturnState, tab: OptionsTab },
    LevelEditor { return_state: MenuReturnState },
    InGame,
    Paused,
}
```

Each variant carries only the data it needs. This is Rust making illegal states unrepresentable. The `update()` function becomes a clean `match` statement. Each branch is self-contained. Transitions are explicit. The code is easier to read, maintain, and extend.

`delta_time` as the elapsed wall-clock time works for camera smoothing and animation playback, but is catastrophic for combat timing. Floating-point accumulation drift means that two players pressing the button at the exact same "game moment" can get different results because their accumulators have drifted by different rounding errors.

The solution is a fixed-timestep accumulator. Wall-clock time feeds into an accumulator, and the game logic runs in discrete, equally-sized steps:

```rust
pub fn accumulate(&mut self, dt: f32) -> u32 {
    // Hitstop check
    if self.freeze_frames > 0 {
        self.freeze_frames -= 1;
        return 0;
    }
    self.accumulator += dt;
    (self.accumulator / self.fixed_dt) as u32
}
```

The game logic sees the same `fixed_dt` on every invocation, regardless of display performance. With the fixed timestep in place, I could define combat entirely in integer ticks. Every move in the game is described by a `MoveData` struct:

```rust
MoveData {
    id: MoveId::AttackHorizontal,
    startup_frames: 3,        //* 3 ticks before the hitbox appears
    active_frames: 3,         //* 3 ticks where the hitbox can deal damage
    recovery_frames: 8,       //* 8 ticks of cooldown
    cancel_window_pct: 0.40,  //* last 40% of recovery allows chaining
    // ...
}
```

This is the same frame-data model that fighting games have used since Street Fighter II, and it works because the underlying simulation is perfectly deterministic. But here is where it gets interesting. What happens when you want to change the tick rate at runtime, say for a slow-motion effect or a debug tool? Every frame count would be wrong. So the `MoveDatabase` scales all frame data on the fly:

```rust
pub fn scaled(&self, tick_rate: u32) -> ScaledMoveData {
    let ratio = tick_rate as f32 / BASE_TICK_RATE as f32;
    ScaledMoveData {
        startup_frames: (self.startup_frames as f32 * ratio).round() as u16,
        active_frames: (self.active_frames as f32 * ratio).round().max(1.0) as u16,
        // ...
    }
}
```

:::note
.max(1.0)?

The `.max(1.0)` on active frames is a small detail with large consequences. Without it, halving the tick rate to 30Hz would round a 1-frame active window down to zero, creating an attack that literally cannot hit anything.
:::

## Minkowski-Expanded Swept AABB

```rust
// engine/src/physics.rs - swept_collision()
let expanded_half = (obstacle.size + self.size) * 0.5;
let exp_min = obstacle.center - expanded_half;
let exp_max = obstacle.center + expanded_half;
```

The swept collision casts a *ray* from the mover's center against a Minkowski-expanded version of the obstacle. By inflating the obstacle by the mover's half-extents, the mover effectively becomes a point, and the problem reduces from swept-AABB-vs-AABB to ray-vs-AABB.

This is a well-known trick from `GJK-family algorithms`, but the implementation here is clean and branchless on the hot path. The `t_entry`/`t_exit` slab intersection gives the exact contact time in `[0, 1]` range, which the physics system uses for sub-frame resolution. Combined with the `normal` calculation, this gives pixel-perfect collision at any frame rate without the tunneling that plagues discrete detection.

The swept AABB implementation here is 50 lines and completely deterministic. It has exactly the behavior the game design requires: fast response, no jitter, tick-rate independent. That is worth more than the convenience of a pre-built library for this use case.

:::danger
Scalability?

If the game ever needs convex polygon collision, angular physics, or complex joint constraints, this implementation does not extend cleanly. That is an acceptable known constraint for a precision platformer.
:::

## The Details That Make It Feel Right

"Game feel" is not one thing. It is a hundred small things done correctly. The ASCII editor is the newest system, but it sits on top of two months of groundwork.

### Lissajous Screen Shake

:::tip
Formula:

(intensity) * exp(-decay * t) * sin(frequency * t * SHAKE_Y_FREQUENCY_RATIO)
:::

Uses a decaying sinusoid for the shake intensity, multiplied by a Lissajous curve for the X and Y offsets. That is standard. The irrational ratio means the X and Y oscillations never sync up, creating a Lissajous-like orbit that feels organic rather than mechanical. Still need to perfect the parameters, but it is already a huge improvement over the linear shake I had before.

### Combat Input Buffers

The buffer stamps each input with the tick it was pressed, prunes entries older than 333ms, and scans for the oldest action that the combat FSM can actually *transition to*. This bridges the impedance mismatch between variable-rate rendering (where inputs are sampled) and fixed-rate physics (where the FSM consumes them). This is the same technique fighting games have used for decades.

```rust
// game/src/combat/input_buffer.rs
if let Some(idx) = self
    .queue
    .iter()
    .position(|b| fsm::can_transition(state, b.action, move_db))
{
    Some(self.queue.remove(idx).unwrap().action)
}

// assets.rs - animation durations derived from combat data
fn attack_horizontal(db: &MoveDatabase) -> Animation {
    let frames = 4;
    let fd = db
        .get_base(crate::combat::MoveId::AttackHorizontal)
        .anim_frame_duration(frames);
    Animation::new("AttackHorizontal", 25, frames, fd, false)
}
```

The value was chosen to match the input buffer windows in *Celeste* and *Dead Cells* documentation, which are community-measured to be in the 100-400ms range. Starting at the middle of that range is a defensible default. A long buffer window can feel like "the game is playing itself" if the player presses many inputs rapidly. The window being configurable per-character (through `MoveDatabase`) means different movesets can have different buffer personalities without changing the architecture.

### Sprite Flipping

Instead of negating the sprite's scale on CPU (which requires shifting the anchor point), the UV origin shifts to the right edge of the sprite sheet frame and the width goes negative. The shader samples texels right-to-left. Position is always top-left, scale is always positive, and flip is a two-float sign change. One of those changes that makes a whole class of bugs structurally impossible.

```rust
// engine/src/sprite.rs - to_instance()
let (uv_offset, uv_size) = if self.flip_x {
    (
        Vec2::new(uv_offset.x + uv_size.x, uv_offset.y),
        Vec2::new(-uv_size.x, uv_size.y),
    )
} else {
    (uv_offset, uv_size)
};
```

This fix addresses a bug that would never appear in unit tests and only manifests visually at the moment of a direction change. The naive approach (negate X scale, shift X position by sprite width to compensate) works but introduces a second mutation to position. Every system that reads position ( collision queries, camera follow, audio panning ) now has to know whether to use raw position or "flip-corrected position". UV-flip keeps position semantically pure. It is a larger initial insight but a smaller surface area for bugs.

## What I Learned

The common thread across all of these decisions is the same:

* Take the simple option first.
* Take it all the way
* Know exactly what you are giving up

ASCII over binary. UV flip over scale negation. Custom swept AABB over Rapier. Lazy init with a sentinel flag over a full state machine. Each decision trades generality for control and complexity for maintainability.

:::tip
Building a Game Engine

The most interesting thing about building a game engine is not the hard algorithms. The swept AABB is textbook. The decaying sinusoid is two lines of math. What is hard is the accumulation of small decisions: how to represent a level, how to persist it across platforms, how to make an editor that stays in sync with the physics world, how to surface errors before they silently corrupt state.
:::

:::tip
Building a Game

On the other hand, building a game engine is an exercise in layered constraints. The browser constrains your audio. The fixed timestep constrains your input. The GPU constrains your draw calls. The trick is not removing constraints but building abstractions that hide them. The ASCII format worked because constraints force simplicity. The parser is fast enough to run on every keypress because it is just character matching. The minimap is correct by construction because it reads the same string the parser reads.
:::

:::warning
Two Highlights

The ASCII level file and the combat input buffer. One is so obvious in retrospect that you wonder why engines do not all do it. The other is so easy to get wrong that most games do.
:::

The engine is at a point where adding new features no longer requires fighting the simple, yet complex architecture. The state machine handles flow. The audio system handles platform quirks, music ducking, and WASM autoplay handling. The physics handles sub-frame precision.

The next sprint is about content: more enemies, more levels, more sounds worth playing, more reasons to hear that parry clang.

> If the last few weeks taught me anything, it is that game feel is not about what happens. It is about when it happens, measured in ticks.

## Journey Engine v0.3.2 - Changelogs

![Journey Engine v0.3.2](https://cdn.ujjwalvivek.com/posts/media/journey_v0.3.2.webp)

```bash

Engine & Physics

* Fixed-Timestep Physics: Game logic now runs on a deterministic fixed-rate accumulator to ensure identical physics, combat, and FSM results.
* Swept AABB Collision Detection: Implemented Minkowski-expanded ray casting for ccd.
* Game State Machine: Implemented a clean enum-based state machine managing the game screens.

Combat System

* Frame-Data Combat: Full Startup/Active/Recovery combat FSM implemented with integer tick-based timing, supporting attack cancels during recovery windows.
* Tick-Stamped Input Buffer: Combat inputs are now queued with tick timestamps and consumed within a configurable frame window to allow for leniency and precise input timing.

Level Editor

* Dual-Mode Level Editor: Press F12 to toggle a full-screen editor that operates on a single canonical ASCII string.
* Live Minimap: Added a color-coded minimap driven directly from the ASCII buffer that updates live on every keystroke.
* Level Validation & Legend: Added a validation pass that warns on missing elements before saving.
* Universal Persistence: Hot-reloading saves directly to `world.txt` on native builds, and seamlessly to `localStorage` on WASM web builds.

Audio & Visuals

* Cross-Platform Audio Engine: Integrated Kira audio supporting four independent sub-tracks with lazy WASM init, music ducking, and an `AudioResponse` trait for egui.
* Screen Shake System: Added a decaying sinusoidal screen shake with configurable variables.
* Additive Blend Pipeline: Added a secondary GPU render pipeline within the same render pass to support additive-blended sprites.

### Under the Hood

* UV-Space Sprite Flipping: Moved sprite horizontal flipping from scale-space to UV-space.
* O(1) Animation Lookups: `AnimationState` now caches `current_index` to avoid `O(n)` name-based lookups on every update.
* Audio Init Fast-Path: Added an `is_initialized` flag to the `AudioManager` so post-init SFX calls completely skip `Option::is_none()` branching.
* Dynamic Animation Scaling: Combat animation durations are now dynamically derived from FSM frame data instead of requiring manual specification.
* Dimensional Consistency: Normalized all configuration constants to a `PIXELS_PER_UNIT` base.

### Bug Fixes

* Fixed silent audio event loss from late code paths in `fixed_update` by consolidating all dispatches into a single drain point at the end of the tick.
* Fixed the sprite "ghost teleport" bug on horizontal flips by utilizing UV mirroring instead of negative scaling.
* Fixed the physics spiral-of-death on slow hardware frames by capping raw delta time at 100ms.
* Fixed the dash state stopping dead on wall contact by preventing dash states from restoring pre-collision X positions.
* Fixed camera Y clamping issues for maps containing geometry above the y=0 origin.
* Fixed grounded landings to correctly zero out the Y velocity for the dash state using grounding force.
* Fixed audio amplitude precision by keeping calculations in `f64` and only casting to `f32` at the final decibel construction.
```
