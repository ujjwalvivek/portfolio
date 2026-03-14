---
title: "How Synclippy Got Simpler (and Better)"
date: 2026-03-07
summary: "A technical story about how a clipboard sync project slowly turned into a distributed system, and why deleting most of that architecture made sense."
slug: log_0006_simpleclippy
---

<!-- markdownlint-disable MD001 MD034 MD024 MD051 MD007 MD027 MD032 -->

:::toc
:::

:::tip
Alright.

Enough sulking.

The last post ended with me saying I was going to sleep. That was true. Journey had taken months and months of work, and I was exhausted. I genuinely didn’t feel like opening VS Code again for a while.

That lasted about four days.

Then I did something again.
:::

This one is called **Synclippy**. It’s an old project I kept coming back to, but never quite finished enough to share. I finally got around to finishing it, and I think it’s in a pretty good shape for someone to find use out of this.

At the time the goal was ...well, *not short of ambitious*. Like **Airdrop-level** ambitious.

Copy something on one device. Paste it on another. Simple as that!

Sounds trivial, right? Well, it turns out that the deeper I went, the more the system started expanding in every direction.

The idea evolved into a universal clipboard sync tool. `Desktop apps`, `encryption layers`, `device pairing`, the whole thing. I even wrote a long blog post about the architecture [over here](https://ujjwalvivek.com/blog/proj_0005_the_synclippy.md) and convinced myself it made sense.

Eventually it started looking less like a tool and more like infrastructure. 

**Immediate red flag**. 

I just needed a place to temporarily drop things between devices. A snippet. A command. A small file.

:::note
Now?

It’s a tiny tool that spins up an ephemeral three-word room where you can drop text or files between devices. No accounts, no friction, nothing persistent. Everything lives in memory and then just evaporates after five minutes.

So the whole system collapsed into something much smaller:

```bash
-> Create a room.
 -> Share the link.
 -> Drop things in.
 -> Five minutes later the room disappears.
```

That’s it.
:::

> It’s stupidly simple. Solves the problem I actually had. And in a way thats non interruptive to my workflow.
> **Which is exactly why I like it.**

Anyway, if you want to try it, below are the links.

##### **Demo (Limited):** https://synclippy.ujjwalvivek.com

##### **Repo (Source):** https://github.com/ujjwalvivek/synclippy

If it ends up being useful to someone else, sweet. If not, at least I can stop emailing myself things.

## Alright, Let us Dive Deeper

Like most small tools, **Synclippy** started from an annoyance. Moving small bits of data between devices across different ecosystems is a *pain*.

Modern solutions exist of course. Like `AirDrop`, `Taildrop`, `Cloud`, `messaging apps`. But all of them felt slightly **heavier** than the problem.

> Heavier in the means of friction, setup cost, or just the mental overhead of using a different tool for something so small.

What I wanted was a **local-first frictionless** way. And that’s exactly the direction the first design took.

---

### Why Clipboard Sync Is Hard

Browsers expose clipboard APIs, but they are intentionally restricted. You cannot simply monitor the clipboard. Clipboard access requires **explicit user interaction**.

This is by design. The clipboard is one of the most sensitive surfaces in a system.

`Passwords`, `Financial data`, `Private messages`, all pass through it.

So browsers enforce strict rules, which immediately breaks the naive architecture.

The system I originally imagined looked something like this:

```bash
Device A
 Clipboard Monitor
       │
       ▼
 Encrypted Sync Channel
       │
       ▼
 Relay Server
       │
       ▼
 Device B
 Clipboard Writer
```

This requires:

- native clipboard access
- background monitoring
- device pairing
- encryption
- conflict resolution

> In other words, it requires **native clients** or **daemons**.

So the architecture expanded.

---

### The Architecture That Almost Happened

At one point the system looked roughly like this:

``` bash
┌─────────────────────────────────────────────────────────────────────────┐
 │                           FRONTEND LAYER                                │
 │-------------------------------------------------------------------------│
 │  ▸ React / Vue UI (Desktop & Web)                                       │
 │  ▸ Tauri WebView (Embedded Browser)                                     │
 └─────────────────────────────────────────────────────────────────────────┘
            │ uses
            ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            NATIVE LAYER                                 │
 │-------------------------------------------------------------------------│
 │  ▸ Rust Commands (High-perf logic)                                      │
 │  ▸ System Clipboard API                                                 │
 │  ▸ Local File-system Access                                             │
 └─────────────────────────────────────────────────────────────────────────┘
            │ communicates via
            ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                        COMMUNICATION LAYER                              │
 │-------------------------------------------------------------------------│
 │  ▸ WebSocket Client   ▸ HTTP Client                                     │
 │  ▸ AES / E2E Encryption Module                                          │
 └─────────────────────────────────────────────────────────────────────────┘
            │ talks to
            ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                              SERVER LAYER                               │
 │-------------------------------------------------------------------------│
 │  ▸ Go WebSocket Hub                                                     │
 │  ▸ REST API End-points                                                  │
 │  ▸ Device Pairing & Auth                                                │
 └─────────────────────────────────────────────────────────────────────────┘
            │ persists into
            ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                           STORAGE LAYER                                 │
 │-------------------------------------------------------------------------│
 │  ▸ SQLite (Local History)                                               │
 │  ▸ Redis (Cache)                                                        │
 │  ▸ Optional Cloud Bucket (S3 / R2)                                      │
 └─────────────────────────────────────────────────────────────────────────┘
```

The desktop clients would monitor clipboard changes and broadcast updates through an encrypted channel.

Devices would subscribe to each other. Clipboard data would propagate across the network.

:::warning
Well

Technically, it was all feasible. But the project had quietly crossed a boundary.

It was no longer a **tool**. It was a **distributed system**.
:::

### Then, The Realization

I stepped back and started observing my own workflow for a month.

When did I actually need clipboard sync?

The answer was interesting.

**Almost never.**

What I actually needed most of the time was much simpler:

```bash
put something somewhere -> grab it from another device
```

Not automatic synchronization. Just plain old temporary transfer.

The difference is subtle but important. 

Clipboard sync implies **state propagation**. 

Temporary transfer implies **ephemeral storage**.

That realization changed **everything**.

### Then, The Collapse

Once the problem changed, the architecture **shrank** immediately.

Instead of synchronizing clipboards, the system could simply create an ephemeral shared space.

`A Room`.

```bash
create room
 share link
 drop text or files
 room expires
```

That’s it.

The entire distributed clipboard idea collapsed into a much smaller model.

```bash
Client A ─────┐
               │
               ▼
         Synclippy Room
        (in-memory state)
               ▲
               │
 Client B ─────┘
```

:::note
Eureka!

Absolutely no synchronization protocols. No encryption layers. No device management. No native clients. Just a **short-lived room**.
:::

### Three Word IDs

Rooms are identified by human readable identifiers. Instead of UUIDs the server generates three words.

`oak-river-gentle`
`silver-cloud-ember`
`stone-valley-lantern`

Why three words? Because they are:

- easier to read, type, and share verbally.
- close to **493M combinations** (enough for a small tool)
- more memorable than random strings.

This idea appears in several systems (like *diceware passwords* or *memorable URLs*) and works surprisingly well.

### The Final Architecture

Once the idea stabilized, the architecture became **extremely small**.

```bash
   ┌─────────────┐
    │   Browser   │
    └──────┬──────┘
           │
           ▼
 ┌────────────────────┐
 │  Synclippy Server  │
 │  (Go).(Ephemeral)  │
 │                    │
 │  In-Memory Rooms   │
 │  WebSocket Hub     │
 │  File Storage      │
 └─────────┬──────────┘
           │
           ▼
      Temporary Files
```

Rooms exist entirely in memory.

```go
rooms := map[string]*Room{}
```

Each room contains:

```bash
Room
  ├─ note content
  ├─ uploaded files
  ├─ connected clients
  └─ expiration timestamp
```

When the TTL expires, the room disappears. No friction. Just memory lifecycle.

## The Hosting Problem

The plan was obvious, run the file on a `small VPS` or my `home Linux box`.

Except the Linux box was *dead*.

Not metaphorically dead. 

Literally powered off waiting for me to revive it. And I wasn’t in the mood to debug a server just to test a tiny tool.

The other option was spinning up a VPS, which felt ridiculous for something this small.

At that point I realized something. Everything was already sitting behind `Cloudflare`, which meant I technically already had a `compute platform` available.

So the obvious solution became the slightly **insane** one.

Instead of deploying the Go server anywhere, I rewrote the runtime for `Cloudflare Workers` and `Durable Objects`.

:::warning
Well

I could've used it *locally*, but that defeats the purpose. The whole point was to move things between ecosystems. If it only worked on my local network not utilizing the **Tailscale** infrastructure, it wouldn't solve the problem I set out to solve.
:::

### The Serverless Architecture

```bash
Browser
   │
   ▼
Cloudflare Worker
   │
   ▼
Durable Object (Room)
   │
   ├─ note content
   ├─ files
   └─ websocket clients
```

Each room maps to a `Durable Object` instance, which are basically *tiny single-threaded state containers* that run on Cloudflare's edge network. They are perfect for this use case where a single piece of state needs to coordinate multiple clients.

Which is exactly what a Synclippy room is.

```bash
room_id → durable object instance
```

WebSocket connections attach directly to the object, which becomes the synchronization hub for that room.

The funny part is that this solved *several* problems at once:

- no VPS required
- automatic global edge deployment
- per-room isolation
- built-in lifecycle control
- free tier is sufficient for personal use
- edge network is very low latency and reliable

But it also introduced a different problem I never anticipated.

### How to Run a Public Demo?

The public demo obviously couldn't allow **file uploads** and **unlimited rooms**. That would certainly become a *playground* for *malicious use*.

So the system now has **two modes**.

```bash
trial mode
 └─ restricted limits
 
 auth mode
 └─ full limits
```

Trial rooms are created by default. **Full access** is unlocked, only if the request carries a `small magic token` that I use privately.

> Now, the same deployment can act both as a **public demo**, and my **personal instance**, which felt like a nice accidental design outcome. Infrastructure win.

## Real-Time Synchronization

Text synchronization happens through `WebSockets`. When a client updates the note, the change is **broadcast** to all other clients connected to the room.

```bash
Client A edits text
        │
        ▼
 WebSocket Server
        │
   ┌────┴────┐
   ▼         ▼
Client B   Client C
```

Server, acting as a **relay** keeps every browser in the room synchronized. Files follow the same room lifecycle.

`Upload`:

```json
POST /api/upload?room=<room_id>
```

Each file is associated with the room expiration timestamp and the `constraints` keep the system from turning into an *accidental cloud storage*.

```json
File size: 50 MB
 Files per room: 5
 Total storage: 250 MB
```

When the room *expires*, all files **disappear**.

## The Security Model

> When the room *expires*, all files **disappear**. That's it. That's the security model.

```bash
No accounts
 No persistence
 Automatic expiration
```

Data lives for five minutes, then it's gone. There is no concept of user identity or permanent storage.

:::tip
Just made our life, a bit easier

Because this dramatically reduces the surface area of the system.
:::

## Okay, But Why?

The original architecture solved a **bigger** problem, `Clipboard synchronization`.

But that solution required:

- native clients
- encryption protocols
- background services
- device management

:::danger
But

that is an entirely different class of project.
:::

:::tip
Eventually

the final system solved something much smaller, `Ephemeral Transfers`. And in practice, that turned out to be the thing I actually needed
:::

## A Strange Side Effect

One unexpected side effect of working on Synclippy was how it quietly fed back into something completely different.

`Rust`.

The deeper I went into systems work over the past year, the more I kept running into the same questions:

##### How should state live in memory?

##### What owns what?

##### What lifecycle does this data follow?

Those questions **show up** everywhere.

They show up in small systems like Synclippy's Rooms. Likewise, they show up in much larger systems.

Around the same time I was experimenting with `WebAssembly`, `wGPU`, and `lower level rendering primitives`. That curiosity eventually turned into a much bigger rabbit hole which later became the [**Journey Engine**](https://github.com/ujjwalvivek/journey).

Looking back, the two projects share a *strange similarity*.

Both are really about **state coordination**.

```bash
Synclippy                Journey
 room state               world state
 ├─ note content          ├─ entities
 ├─ uploaded files        ├─ physics
 └─ connected clients     ├─ animation
                          └─ player inputs
```

:::tip
Different domains | Same fundamentals

Both systems revolve around managing evolving state over time.
:::

Working on small infrastructure tools like Synclippy ended up being surprisingly useful preparation for thinking about larger runtime systems.

> It kinda feels a lot like how *souls-like*, or any *action games* are designed. Every boss before the final boss *cumulatively* prepares you for the challenge ahead. You learn the mechanics in a safe environment, and then apply them in a much more complex context.

## Deployment

A single Go binary. Behind a reverse proxy, the system can run almost anywhere.

```bash
./synclippy-linux-amd64
```

Or a container.

```bash
docker run -p 8080:8080 ghcr.io/ujjwalvivek/synclippy
```

## Phew! That Was a Lot

The original version of **Synclippy** tried to make a much bigger problem work, but it ended up being a *distraction* from the actual problem I had.

Both are *valid* architectures, but the *latter* is much more aligned with the problem I actually had.

:::tip
Again

Tech isn't hard. Systems, Behaviours, and Questions are.
:::

## For The Curious

In case you read this far and dont wanna scroll up, here are the links again.

##### **Demo (Limited):** https://synclippy.ujjwalvivek.com

##### **Repo (Source):** https://github.com/ujjwalvivek/synclippy

See you in the next one!
