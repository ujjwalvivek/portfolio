---
title: "I Wrote 5,000 Lines of Assembly Because I Was Angry"
date: 2026-06-14
summary: "A Wolfenstein-style DDA raycaster written in pure x86-64 assembly. No libc, FPU, or assets. Just syscalls, and a 69KB binary that runs at 60fps in a terminal."
slug: log_0009_baremetal
---

:::toc
:::

:::tip
It's been a while.

I've been battling through a series of personal problems,
which is either a valid excuse or exactly the problem, depending on who you ask.
:::

Well, Anyway.

I want to start this with a disclaimer.

This wasn't planned.

None of my projects are, honestly.

[Synclippy](https://synclippy.ujjwalvivek.com) happened because I couldn't AirDrop from Windows to my iPhone without installing three pieces of software that all wanted my email address.

[Journey](https://journey.ujjwalvivek.com) happened because I drew a portfolio idea in a notebook and couldn't build it yet.

[Echopoint](https://echopoint.ujjwalvivek.com) happened because I wanted my GitHub README to look exactly right and nothing existing did what I wanted.

Baremetal happened because I was ...**angry**.

Microsoft put me through a month-long interview process. Four rounds. I prepared. It went exceptionally well. One of them even used Synclippy, because they found it interesting.

I got the interview directly without a referral, or a phone screening, all of which made me think it was a special one. Had my hopes high up in the air. This was the second oppurtunity I had gotten after 800 applications. Stakes were high.

The rejection came through as you would expect. No emails, call, or a feedback even. Just a status change on a dashboard. Sucks.

I sat with that for about a day. Then I opened zed and started writing assembly. Just because going all the way down to the metal felt like the right response to feeling completely powerless.

I can't really paint a better picture, but yes, it was this **dramatic**.

Bullying silicon is a weird remedy to anger. Well, as long as it works, I mean, it's better than any other response.

## What Is Baremetal?

It's a Wolfenstein-3D-style DDA (a.k.a. [Digital Differential Analyzer](https://www.geeksforgeeks.org/computer-graphics/dda-line-generation-algorithm-computer-graphics/)) raycaster written entirely in x86-64 assembly (Intel syntax) that runs at a locked 60 FPS.

And there is not a single line of C anywhere in the source.

Sounds amazing. Right?

It's live at [baremetal.ujjwalvivek.com](https://baremetal.ujjwalvivek.com). WASD to move, E to open doors, Space to shoot.

<iframe src="https://baremetal.ujjwalvivek.com" title="Baremetal" width="100%" loading="lazy" caption="Baremetal running in a terminal output on web." cover="baremetal"></iframe>

The final binary is **69KB**. 

**14KB** of actual code. **280KB** of data and BSS, and the **5.6KB** sin/cos lookup tables.

The entire thing assembles and links in under a second. `nasm -f elf64 then ld -static`. No build system beyond a Makefile. Strip the `DWARF` debug symbols for production and it shrinks even further.

Great Success.

## Architecture Breakdown

To understand the architecture, you have to understand the constraints I gave myself. It was simple and brutal.

No libc, C runtime, or a standard library of any kind.

No memory allocator, and floating-point hardware either.

Entry point is `_start`. Every system call made manually with CPU registers and the Linux x86-64 ABI. All trigonometry is integer arithmetic using lookup tables and Q8 fixed-point. And, exactly nine syscalls: read, write, poll, ioctl, rt_sigaction, rt_sigreturn, nanosleep, clock_gettime, exit.

Everything or nothing.

Felt like a `Beating Minecraft in 100 days using only offhand` sorta thing. Weird and absurd.

The first thing I had to figure out was how to put the terminal into raw mode without `tcsetattr`. That's normally a one-liner in C. 

But, in assembly? It's about 40 lines of offsetting into a `termios` struct whose kernel layout differs from the documented one in ways that will make you question everything.

That set the tone for the next two months.

### Raw Mode

The terminal is an interesting rendering target.

You don't have pixels. You don't have `/dev/fb0`.

You have cells. Each cell is a character. There is a 256KB character buffer and a write head (`buf_pos`). Each character can have a foreground colour and a background colour set via ANSI escape codes.

#### Linear Framebuffer Approach

My first instinct was to treat it like a framebuffer, maintain a 2D grid of cells in memory, diff it against the previous frame, write only what changed.

This is how most terminal UIs work. I spent a week on this approach. 

And, spoiler alert.

It was slower. The intermediate grid caused cache thrashing. For a typical frame where only a few cells change, the framebuffer approach does about 8× more work than just writing escape sequences directly.

Appending escape sequences directly to the buffer is fundamentally faster than rendering into an intermediate 2D grid and then translating back to ANSI at the end of the frame.

So I scrapped over a thousand lines of LFB code, and the engine was healthier for it.

#### ANSI Escape Sequence Approach

I issued a `TCGETS` `ioctl` to copy the terminal's `termios` struct, clear the canonical flags, and write it back with `TCSETS`.

One ANSI escape sequence per cell change, written directly to a byte buffer, flushed with a single `write(1, buf, len)` syscall per frame.

And, synchronized with `ESC[?2026h / ESC[?2026l`, DEC private mode 2026, so the terminal paints the whole frame atomically without tearing.

```nasm

; Set VMIN=0 VTIME=0 for non-blocking reads
; allows keyboard polling without blocking
mov byte [rel termios_raw + CC_VMIN], 0
mov byte [rel termios_raw + CC_VTIME], 0

; per-frame output
ESC[H                            ; cursor home
ESC[?2026h                       ; sync begin (atomic paint)
  ... for each row:
    ESC[row;colH                 ; move cursor
    ESC[48;5;240m █              ; colored block
    ESC[48;5;238m ▓              ; darker block
    ... thousands more cells ...
ESC[?2026l                       ; sync end
write(1, frame_buffer, len)     ; single syscall
```

Sometimes the dumb approach is faster.

The existing ANSI cursor-move approach already renders flicker-free on real terminals with the existing sync markers. 

Anything more than that would be technical debt.

#### Handling Crashes

If a game crashes in raw mode, the terminal is left corrupted.

The terminal settings need to be cleanly restored before exiting, and a restorer trampoline cleans up the stack frame when returning from a signal.

However, the best part?

You don't need to implement the trampoline yourself, `glibc` provides it automatically.

But, since I'm a masochist, I implemented it myself in pure assembly.

```nasm

; Set up the sigaction struct
lea rax, [rel signal_handler]
mov [rel sigact + 0], rax           ; Handler address
mov qword [rel sigact + 8], SA_RESTORER
lea rax, [rel restorer_trampoline]
mov [rel sigact + 16], rax          ; Restorer address

; The trampoline itself
restorer_trampoline:
    mov rax, SYS_RT_SIGRETURN
    syscall
```

### DDA Raycaster

The raycasting algorithm is conceptually elegant. It's the same algorithm Carmack used in 1992.

For each column of the screen, cast a ray from the player's position into the world. Find where it hits a wall. Calculate the distance. Render a vertical slice character (`█▓▒░`) and color escape proportional to how close the wall is.

The problem is DDA uses a **lot** of trigonometry. And I'd banned floating point. 

Sometimes, the genius in me is surprising. 

#### Fixed-Point Math

The solution is fixed-point arithmetic.

Store everything as integers scaled by a factor, in my case Q8. 

And for sin and cos, I used lookup tables. 360 entries, stored as quadwords in `.data`, one per degree, values pre-multiplied by 1024 to avoid precision loss and rounding errors. Every angle calculation in the engine goes through these tables.

Zero FPU instructions.

```nasm

; Every angle is an integer 0–359
; indexing into 360-entry sin/cos lookup tables scaled by ×1024
sin_table[angle] = round(sin(angle°) * 1024)

; Shift right by 8 to get the integer map cell coordinate
sar rax, 8  ; rax now holds the integer map cell

; Multiply followed by a 10-bit right shift
imul rax, [cos_table + rdi*8]
sar  rax, 10         ; Q8 fixed-point
```

It's not elegant. But it works at a solid 60fps in a terminal and that feels like enough.

#### Raycasting Loop

Instead of stepping the ray forward by a tiny constant distance (which is slow and inaccurate), the algorithm finds the exact grid boundaries the ray crosses next.

I set up the ray's initial side distances and step delta vectors, then loop:

```nasm

.dda_loop:
    ; Compare X and Y side distances
    mov r8, [side_dist_x]
    cmp r8, [side_dist_y]
    jge .step_y

.step_x:
    ; Step along the X axis
    add qword [side_dist_x], r10  ; r10 = delta_dist_x
    add r12, rbx                  ; r12 = map_x, rbx = step_x
    mov rcx, 0                    ; side = 0 (X-wall)
    jmp .check_hit

.step_y:
    ; Step along the Y axis
    add qword [side_dist_y], r11  ; r11 = delta_dist_y
    add r13, rbp                  ; r13 = map_y, rbp = step_y
    mov rcx, 1                    ; side = 1 (Y-wall)

.check_hit:
    ; Lookup map grid cell
    ; ... (bounds check and cell collision detection)
```

When a hit occurs, the perpendicular distance to the wall is calculated as: (`perp_dist` = `side_dist` - `delta_dist`)

Using the perpendicular distance instead of the straight-line Euclidean distance naturally cancels out the "fisheye" lens distortion.

Which is good, meaning we don't need to do any expensive square-root or post-hoc cosine corrections.

#### Player Position

The world is a 32×32 grid stored as a 1024-byte array. Player position is also Q8, meaning the upper 56 bits are the integer cell coordinate, the lower 8 bits are the fractional offset within the cell.

The fractional part is crucial for the DDA raycaster.

Starting on a grid boundary causes `side_dist = 0` at the first step, which breaks the algorithm. The player spawns at `(15<<8) | 128`, placing them neatly in the center of cell (15,15), and saving me from that edge case.

### Enemy AI

The thing I'm most proud of isn't even the DDA raycaster. It's the enemy AI.

Writing a state machine in assembly is an exercise in register discipline.

You have no variables. You have 16 general-purpose registers and a stack.

Every function call is a potential register clobber. Every piece of state either lives in a named memory location in `.bss` or you're pushing and popping it constantly.

In short, it is, genuinely, a messy affair.

The enemies have four states: `chase`, `attack`, `hurt`, `dead`.

Chase activates when the player is within 16 cells [Manhattan distance](https://www.geeksforgeeks.org/data-science/manhattan-distance/). The enemy moves toward the player at speed 4 (Q8) with wall-sliding pathfinding. Attack triggers within ~0.75 cells, dealing 10 damage every 32 frames.

The transition logic is roughly ~100 lines of assembly. 

When you press Space to shoot, the engine computes the perpendicular wall distance at the center column via the Z-buffer. The hitscan detection uses dot and cross products computed in Q8 fixed-point to determine if the player's gun is pointing at an enemy within range. If `abs(cross) < 64` (about 0.25 cells) and the enemy is closer than the wall, the shot connects, without any entity component system or collision volumes.

It works. Enemies chase you. They hurt you. You can kill them. Their corpses stay on the floor as flattened oval sprites.

In a terminal. In assembly. In about 15 instructions.

Nice.

### Textures and Sprites

The block characters `█▓▒░` are the whole visual system.

Every visual element in BAREMETAL is math. There is not a single asset or a data file. The entire program is the binary produced by the assembler and linker.

To render the 3D world, the engine runs a Raycasting Pass followed by a Row-Major Emitter Pass.

The **Raycasting Pass** casts rays across the width of the terminal columns, calculating wall heights, shading tiers based on distance and point lights, and UV offsets. It stores these values in column-specific arrays.

The **Row-Major Emitter Pass** iterates row-by-row to emit the characters to the buffer. It uses the column-specific arrays to determine the correct character to emit at each position.

#### Procedural Textures

The world is rendered using procedural textures generated on-the-fly by the engine.

Ceilings are rendered using a procedural star field using a hash of the current row and column coordinates, while walls are shaded using ASCII blocks (`█▓▒░`) depending on proximity and light levels. Floors are shaded using a procedural carpet (`▒`) pattern with depth bands.

There are **5** distinct procedural wall and door shaders. Combined with **4** distance-shading tiers and per-type color escapes (20 total color pairs), you get a surprisingly rich depth gradient from a handful of ASCII characters and ANSI codes.

I needed only arithmetic determining which character and which colour goes in each cell.

#### World Props

Sprites are dynamic geometry rendered on the screen using the Painter's Algorithm. 

The engine supports dynamic ones like `barrels`, `pillars`, `ammunition keys`, and `hostile guards`.

Each frame, they're transformed into camera space, sorted by depth (bubble sort, cost is negligible), and rendered back-to-front. The renderer then checks the columns' Z-buffer before drawing sprite pixels to handle wall occlusion correctly.

```text

╭───────────────╮   ╭───────────────╮   ╭───────────────────────────╮
│ Game Timestep │ → │ Process Input │ → │ Update Physics & Enemy AI │
╰───────────────╯   ╰───────────────╯   ╰───────────────────────────╯
                                                        │
                                                        ▼
╭─────────────────────────╮   ╭──────────────────────────────────╮
│ Sort Sprites by Depth   │ ← │ Raycast Columns & Fill Z-Buffer  │
╰─────────────────────────╯   ╰──────────────────────────────────╯
            │
            ▼
╭──────────────────────────────────────────╮   ╭─────────────────────────────────────╮
│ Emit Frame: Sky, Procedural Walls, Floor │ → │ Render Sprites with Z-Buffer Checks │
╰──────────────────────────────────────────╯   ╰─────────────────────────────────────╯
                                                                            │
                                                                            ▼
                                   ╭────────────────────────╮   ╭────────────────────────────╮
                                   │ Atomic Write to stdout │ ← │ Overlay Gun HUD & Minimap  │
                                   ╰────────────────────────╯   ╰────────────────────────────╯
```

### Audio

Audio was the one thing I couldn't solve honestly.

I know how to write a DSP engine. I've done it twice, once in Rust for [Journey](https://github.com/ujjwalvivek/journey) and once in TypeScript for [TinyTS](https://github.com/ujjwalvivek/tinys). The math ports to assembly without much difficulty. ADSR envelopes, oscillators, a ring buffer mixer, none of that is conceptually hard.

The output path is the problem.

- PC speaker via `ioperm` requires root.
- ALSA via `/dev/snd/pcmC0D0p` requires audio group membership and violates the zero-dep thesis.
- The terminal bell byte `0x07` is blocked by browsers by default.
- Piping raw PCM to `aplay` requires `aplay` to exist.

Imagine me asking you to run `sudo ./baremetal` on your system. Yep, you're right.

None of these paths are reliable. The silence is actually fitting.

Sound is deferred to either a cross-platform web terminal audio API, which is highly unlikely. We might even get GTA6 before that.

Or, a companion Web Audio wrapper, which is a JS project, not an assembly one.

### Lighting System

Three point lights: 

- a static white light at the corridor center
- a pulsing red light in the northwest room
- and a muzzle flash that follows the player.

Each frame, the wall renderer computes the hit point for each column, checks it against each light's radius² (squared distance), and reduces the shade tier by `intensity / 2`.

It works, but I have mixed feelings. The lighting was premature. The complexity it adds to the wall shading path isn't justified by enemies or gameplay that actually benefit from it. It was a "because I could" feature at a time when I should have been focused on getting the core systems solid.

### Interactive Map Editor

Well, I should have made this sooner. It's a simple built-in map editor that lets you place walls and sprites on a grid, in 800 Lines of Assembly.

```text

┌────────────────────────────────┐
│................................│
│...████████..........████████...│
│...█......█..........█......█...│
│...█..P...D....+.....D..E...█...│
│...█......█..........█......█...│
│...████████..........████████...│
│................................│
└────────────────────────────────┘
 CURSOR: (16,4) | CELL: Empty | SPRITES: 1/8 | MSG: Saved successfully!
```

To make the grid readable, the editor draws colored representation glyphs. And when you draw in assembly, you have to write your own entity rules. 

To save levels, the editor dumps the current game state to a binary file named `level.bin`.

Despite no C filesystem library, I structure a `1192-byte` serialization block on the stack and invoke direct kernel system calls to write the data to disk.

### Putting A Linux Binary On Web

The game runs as a compiled Linux binary. It reads stdin, writes to stdout, and exits. That's it. No web server or JavaScript. Putting that in a browser should be impossible.

`ttyd` disagrees.

It's a small C utility that bridges a terminal process to a WebSocket connection.

It runs a command, and exposes stdin/stdout over WebSockets to an `xterm.js` running in the browser. From the game's perspective nothing changed, it's still just a terminal. From the user's perspective they're playing a Linux binary in a browser tab.

The rest of the stack is just routing.

`systemd` keeps the binary running as a daemon. A Cloudflare Tunnel exposes ttyd over HTTPS without opening ports. The game lives on a machine in my room and serves through Cloudflare's edge.

The one genuinely annoying problem was ttyd's title injection.

By default ttyd overwrites the page title dynamically with its own strings. You can't configure this away. I wrote a Cloudflare Worker that sits in front of ttyd, intercepts page loads, and freezes the title before ttyd can change it:

```javascript
Object.defineProperty(document, 'title', {
  value: 'BAREMETAL | 3D Raycaster',
  writable: false,
  configurable: false
});
```

Problem solved in five lines.

### Wrap Up

After 5,000 lines and two months, I wrapped it up.

The last feature was the map editor. It took four days to build and immediately became the most useful debugging tool in the project.

If I were doing it again, I'd rule out LFB earlier, delay lighting as a polish pass, and build the editor first.

But, then I stopped. Because more features were diminishing returns. The 16th thing I added had a fraction of the impact of the first. The engine was complete enough to be what it needed to be.

An angry response to a rejection letter that turned into a terminal game engine in pure assembly, that's fewer bytes than a single low-resolution JPEG.

I don't know if that's healthy. But the binary is 69kb and it runs at 60fps and it's ...nice.

That feels like something.

### Try It

The game is live: **[baremetal.ujjwalvivek.com](https://baremetal.ujjwalvivek.com)**

Source code: **[github.com/ujjwalvivek/baremetal](https://github.com/ujjwalvivek/baremetal)**

The build is two commands:

```bash

git clone https://github.com/ujjwalvivek/baremetal && cd baremetal
make && make run  # or, ./baremetal
```
