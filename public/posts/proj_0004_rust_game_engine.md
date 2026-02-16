---
title: "Engineered from Scratch: A High-Performance 2D Game Engine in Rust"
date: 2026-02-16
summary: A handcrafted, cross-platform game engine built from scratch to master systems design. Architected using Rust and wGPU with a custom Entity Component System (ECS) for maximum data locality. Features a fully decoupled rendering pipeline that targets desktop natively and the web via WebAssembly (WASM), delivering consistent 60 FPS performance without a heavy runtime.
slug: proj_0004_rust_game_engine
---

:::warning
v0.2.0 Live Demo

https://journey.ujjwalvivek.com - OR - SCROLL DOWN
:::

<iframe src="https://journey.ujjwalvivek.com" width="100%" height="500px"></iframe>

Use WASD to move, Shift to Run, and Alt to Dodge. Mouse clicks Attack and Parries. 

## Introduction

As a Technical Product Manager, the standard advice is almost always **Buy** (or in this case, use an existing engine like `Unity` or `Godot`). Why reinvent the wheel when you need to ship a product?

But sometimes, to truly understand the constraints your engineering team faces such as memory fragmentation, render pipeline bottlenecks, and cross-platform compilation hell, you have to build the wheel yourself.

**Project Journey** is my answer to that challenge. It is a custom 2D game engine written in **Rust**, utilizing **wGPU** for graphics and compiling to **WebAssembly (WASM)** for the browser.

### The 3D Background

This engine wasn't built in a vacuum. Before diving into the low-level world of Rust and wGPU, I spent years working in **Unity 3D**. 

I recently curated and open-sourced a collection of `44+ C# scripts` from a complex Multiplayer FPS project. Check it out here: [Game Sourcecode](https://github.com/ujjwalvivek/TheReckoning)

:::tip
So why build a new engine?

Because in Unity, I was hitting "Black Box" limitations. I knew *how* to use a `MeshRenderer`, but I didn't know how the GPU *received* that mesh. Building *Journey* was my way of opening the hood and learning to build the car myself.
:::

![Thumbnail](https://cdn.ujjwalvivek.com/posts/media/architecture_flowchart.webp)

### Architectural Choice and Data-Oriented Design (ECS)

The first major decision was the architecture. Standard Object-Oriented Programming **(OOP)** where a `Player` class inherits from a `Character` class—often leads to *cache misses* in high-performance computing. The CPU has to jump around memory to find data. I chose an **Entity Component System (ECS)** architecture to solve this.

* **Entities:** Just an ID (e.g., `Entity(42)`).
* **Components:** Pure data structs (e.g., `Position { x, y }`, `Velocity { dx, dy }`).
* **Systems:** Logic that iterates over arrays of data (e.g., "Update Position for every entity that has Velocity").

This ensures **Data Locality**. All `Position` data is stored contiguously in memory. The CPU pre-fetcher loves this, allowing us to process thousands of sprites without dropping a frame.

### Fighting the Borrow Checker with ECS

The beauty of Rust is its borrow checker, but it hates Game Development. In a naive OOP game, `Player` needs a reference to `World`, and `World` owns `Player`. Rust screams **Circular Reference!** and won't compile.

This forced me to decouple data completely.

In *Journey*, the `World` struct doesn't own objects; it owns **Columns of Data**. For example, instead of `Player` having a `Position`, the `World` has a `Vec<Position>` where each index corresponds to an entity. Systems then operate on these columns of data.

This meant writing a custom "System Runner" that could borrow `positions` mutably while borrowing `velocities` immutably, all without triggering a runtime panic. The result? Zero runtime overhead for safety. The compiler proves the game won't crash due to a dangling pointer before I even run it.

### wGPU Rendering Pipeline & Cross-Platform

For graphics, I avoided platform-specific APIs (like `DirectX` or `Metal`) and chose `wGPU`. This is the Rust implementation of the WebGPU standard.

It allows a "Write Once, Run Anywhere" graphics pipeline:
* **Desktop**: It runs on top of `Vulkan`, `Metal`, or `DX12` seamlessly.
* **Web**: It translates to `WebGL2` (or `WebGPU` where supported).

The challenge here was managing the **Buffer Lifecycle**. Unlike a high-level engine, I had to manually write the Vertex and Index buffers to the GPU memory and write custom WGSL shaders to tell the graphics card how to interpret those pixels.

Coming from high-level engines, drawing a sprite usually means `sprite.draw()`. In wGPU, drawing a single sprite required setting up a 400-line "Render Pipeline."

I had to manually define:

* **Bind Groups:** Telling the GPU exactly which texture slot to use.
* **Uniform Buffers:** Uploading the camera matrix (`orthographic_projection`) to the GPU every frame.
* **WGSL Shaders:** Writing the vertex and fragment shaders by hand.

Here is a snippet of the actual Shader code that runs on the GPU. It handles the coordinate conversion from "Game Space" to "Screen Space" (NDC):

```rust
//? shader.wgsl
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) tex_coords: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) tex_coords: vec2<f32>,
};

@vertex
fn vs_main(model: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    //? The "camera" uniform moves the world around the player
    out.clip_position = camera.view_proj * vec4<f32>(model.position, 1.0);
    out.tex_coords = model.tex_coords;
    return out;
}
```

This explicit control allows me to batch **10,000 sprites** into a single **Draw Call**, pretty neat!

### The Web Constraint of Porting to WASM

The biggest challenge was the game loop. In a native Rust application, you can block the thread with a `while !should_close` loop. But in the browser, if you block the main thread, the entire browser freezes or crashes. 

As a result, I had to re-architect the game loop to yield control back to the browser. 

Using `wasm-bindgen` and `winit`, the engine hooks into the browser's `requestAnimationFrame`. This allows the Rust code to calculate a frame, draw it, and immediately sleep until the browser asks for the next frame, hence maintaining responsiveness without burning the CPU. 

On another hand, rendering on the web introduced the **Pixel Ratio** problem. On high-DPI displays (like Retina screens), a canvas that is 800x600 CSS pixels might actually be 1600x1200 device pixels. 
If I didn't account for this, the game would look blurry on those screens. Or worse, game content being cut off because the canvas was too small.

So I had to account for device pixel ratios to ensure crisp rendering on high-DPI displays. This was a fun challenge that required `some` math to scale the canvas correctly.

### The Async Refactor

On Desktop, a game loop is simple:

```rust
//? Desktop Loop (Blocks the thread)
loop {
    handle_input();
    update();
    render();
}

```

If you run this in a browser, the tab crashes immediately. The browser needs to "breathe" to handle UI updates. I had to dive deep into the core engine loop and invert control using a closure:

```rust
//? Web Loop (Yields to browser)
event_loop.run(move |event, _, control_flow| {
    match event {
        Event::MainEventsCleared => {
            //? Request a redraw, then yield immediately
            window.request_redraw();
        }
        Event::RedrawRequested(_) => {
            //? Update & Render one frame
            engine.update();
            engine.render();
        }
        _ => {}
    }
});

```

This **Inversion of Control** was a difficult one. It required wrapping the entire `Engine` state in an `Option` to allow it to persist between browser frames without being dropped by Rust's strict ownership rules.

### Current Status & Roadmap

#### Phase 1,2: Core Game Systems Established.

### Phase 3: The Refinement

* [x] Write unit tests for critical engine and game systems.
* [x] Optimize the ECS for performance (e.g., using `Vec` of components instead of `HashMap`).
* [x] Optimize render pipeline to minimize draw calls (e.g., sprite batching).
* [ ] Ensure `engine/` has zero hardcoded game data.
* [ ] Document the `engine` API with examples for how to use it in `game`.

### Phase 4: The Combat

* [x] **State Machine:** Implement `PlayerState` enum (`Idle`, `Attack`, `ParryWindow`, `Stun`).
* [ ] **Hitbox Architecture:** Separate `Hurtbox` (Body) from `Hitbox` (Weapon).
* [ ] **Parry Logic:** Create a window where overlapping an enemy `Hitbox` triggers a "ParrySuccess" event instead of "Damage".
* [ ] **Enemies:** Implement enemy entities with their own `Hitbox` and `Hurtbox`.
* [ ] **Visual and Audio Feedback:** Add a "Clang" sound effect and a visual cue when a parry is successful.
* [ ] **Testing:** Create test cases for parry timing and hitbox interactions.

### One Final Lesson

#### The Zero-Cost Fallacy

As a PM, I often hear engineers talk about **Zero-Cost Abstractions**. Building this engine taught me that `Zero CPU Cost` often means `High Developer Cost`.

Writing raw wGPU pipelines took 10x longer than using a library like `macroquad`. Was it worth it?
* **For a Prototype?** No.
* **For a Platform?** Yes.

> Because I paid that upfront cost, I now have an **engine** that runs on a 5-year-old Android phone at 60 FPS. That is a product trade-off I can now articulate with data, not just intuition.

### Conclusion

Building Journey has been a lesson in strict resource management. When you don't have a Garbage Collector to clean up after you, every allocation matters.

For a Product Manager, this experience is invaluable. It reinforces that "performance" isn't just a buzzword. It's a series of deliberate architectural choices made effectively at day zero.

Check out the Source Code on [GitHub](https://github.com/ujjwalvivek/Journey). That tells the story better than this blog post ever could.

