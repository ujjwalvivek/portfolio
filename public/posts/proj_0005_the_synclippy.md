---
title: "System Architecture: Evaluating Web & Native Security Constraints"
date: 2025-07-22
summary: An architectural post-mortem on browser sandboxing limits, and the strategic pivot to a Rust-based (Tauri) local-first ecosystem.
slug: proj_0005_the_synclippy
---
:::tip
Architecture Migration (Active)

Currently executing a strategic pivot from **Web-Only** to **Hybrid Native (Tauri/Rust)** to resolve browser sandboxing constraints. <br/>
**Current Phase:** Architecture Analysis & Native Prototyping
**Next Milestone:** Native Desktop MVP (Q3 2026) <br/>
:::


[`Synclippy Repository`](https://github.com/ujjwalvivek/Synclippy)

![Thumbnail](https://cdn.ujjwalvivek.com/posts/media/tech_stack_1-1.webp)

## The Hypothesis

Picture this: 

You're working on a complex project, switching between your MacBook and Windows desktop. You copy a crucial code snippet on one machine, switch to the other, and... it's gone. So you start building a universal clipboard sync tool. Should be simple, right?

I started with the assumption that modern Web APIs (navigator.clipboard) were sufficient for background synchronization.

<mark>**Spoiler**: The web fought back, hard.</mark>

## The Web Clipboard API Trap

I started Synclippy with the naive assumption that modern web APIs could handle clipboard synchronization. After all, we have 
* `navigator.clipboard` 
* `WebSocket`
* `Service workers`

Surely that's enough? Right?

<mark>**Spoiler again**: It absolutely isn't.</mark>

## Research Time

### Technical Constraints & Blocker Analysis

The browser clipboard APIs are fundamentally **crippled by design**:

- Only supports `text/plain`, `text/html`, and `image/png`, and? That's it.
- Requires explicit user interaction (*clicks*) for every clipboard access.
- Cross-origin restrictions make it nearly unusable in many scenarios.
- Zero background clipboard monitoring meaning browsers simply won't allow it.
- Security sandboxing prevents the rich clipboard experiences anyone would expect.

This isn't a limitation I can code around. It's an architectural choice by browser vendors prioritizing security over functionality. 

**Verdict**: The Web Platform is architecturally incompatible with background system monitoring.

```bash

┌─────────────────────────────────────────────────────────────────┐
│                        COUNTERMEASURES                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Policies and    │    │ Technologies    │                     │
│  │ Practice        │    │                 │                     │
│  └─────────────────┘    └─────────────────┘                     │
│  ┌─────────────────┐                                            │
│  │ Users           │                                            │
│  └─────────────────┘                                            │
│  ┌────────────────────────────────────────────────────┐         │
│  │              SECURITY PRINCIPLES                   │         │
│  │  ┌─────────────────┐ ┌─────────────────┐           │         │
│  │  │ Confidentiality │ │ Integrity       │           │ ┌───┐   │
│  │  └─────────────────┘ └─────────────────┘           │ │ I │   │
│  │                        ┌───────────────────────────┘ │ N │   │
│  │  ┌─────────────────┐   │ ┌─────────────────────┐     │ F │   │
│  │  │ Availability    │   │ │ Information         │     │ O │   │
│  │  └─────────────────┘   │ │ States:             │     │   │   │
│  └────────────────────────┘ │ • Storage           │     │ S │   │
│                             │ • Processing        │     │ T │   │
│                             │ • Transmission      │     │ A │   │
│                             └─────────────────────┘     │ T │   │
│ Diagram illustrating key security principles, informa-  │ E │   │
│ tion states, and countermeasures for effective inform-  │ S │   │
│ ation security management.                              └───┘   │
└─────────────────────────────────────────────────────────────────┘

```
 

>Clipboard security vs. functionality is a deliberate trade-off.


### Comparative Analysis: 8 Architecture Candidates

As I researched alternatives, I fell into the fascinating world of clipboard synchronization approaches. There are **eight distinct architectures**, each with unique trade-offs:


```bash

Based on comprehensive analysis of 8 different approaches to clipboard synchronization
This is what the data shows ⇒
┌─────────────────────┬──────────┬─────────────┬────────────────┬────────────┐
│ Approach            │ Security │ Performance │ Cross-Platform │ Complexity │
├─────────────────────┼──────────┼─────────────┼────────────────┼────────────┤
│ Web-Only Clipboard  │    2     │      2      │       4        │     2      │
│ Native Desktop      │    4     │      4      │       2        │     3      │
│ Electron/Web        │    3     │      2      │       4        │     2      │
│ Tauri (Rust + Web)  │    4     │      4      │       4        │     3      │
│ Cloud-Based Sync    │    2     │      2      │       4        │     2      │
│ Local Network Only  │    4     │      4      │       3        │     4      │
│ Peer-to-Peer        │    3     │      3      │       3        │     4      │
└─────────────────────┴──────────┴─────────────┴────────────────┴────────────┘
Legend: 4 = Excellent, 3 = Good, 2 = Fair, 1 = Poor

```

- **Selected Architecture**: Tauri (Rust + Web). 
- **Rationale**: Optimal balance of Security (Sandboxed UI) and Performance (Native Backend).

## Tech Stack Transformation

**Current Stack Issues:**

- Pure web frontend hits clipboard API wall.
- Go backend can't access local clipboard from browser context.
- No native system integration possible.

**Evolved Stack (Planned):**

- **Desktop Helper Apps**: Tauri (Rust + Web UI); scores 94/100 in our analysis
- **Web Interface**: React for remote access and management
- **Backend**: Go with WebSocket for real-time sync (already partially implemented)
- **Architecture**: Hybrid local-first with optional cloud sync.

```bash
    Client A                                    Client B
    ┌─────────┐                              ┌─────────┐
    │ ░░░░░░░ │                              │ ░░░░░░░ │
    │ ░     ░ │                              │ ░     ░ │
    │ ░░░░░░░ │                              │ ░░░░░░░ │
    └─────┬───┘                              └───┬─────┘
          │ WS                                   │ WS
          └──────────┐                 ┌─────────┘
              ┌──────▼─────────────────▼─────┐
              │      WEBSOCKET SERVERS       │
              │  ┌───────┐ ┌───────┐ ┌───┐   │      ┌─────────────┐
              │  │ ████  │ │ ████  │ │ █ │   │─────►│ CONNECTION  │
              │  │ ████  │ │ ████  │ │ █ │   │      │ REGISTRY    │
              │  │ ████  │ │ ████  │ │ █ │   │      │             │
              │  └───────┘ └───────┘ └───┘   │      │ ████████    │
              └──────────────┬───────────────┘      └─────────────┘
                             ▼
              ┌──────────────────────────────┐
              │         AUCTION SERVICE      │
              │         ┌─────────────┐      │
              │         │  BUSINESS   │      │
              │         │    LOGIC    │      │
              │         └─────────────┘      │
              └─┬────────────┬───────────────┘
                ▼            ▼
    ┌─────────────┐    ┌────────────────┐
    │ AUCTION     │    │   AUCTION DB   │
    │ CACHE       │    │   ┌────────┐   │
    │ ████████    │    │   │ ████   │   │
    └─────────────┘    │   │ ████   │   │
                       │   │ ████   │   │
                       │   └────────┘   │
                       └────────────────┘

WebSocket client-server architecture diagram showing real-time
communication between clients, servers, and backend
services like auction cache and database.

```


## Security Architecture: Zero-Trust Principles

<mark>One critical finding</mark>

Clipboard data is **incredibly sensitive**. Users copy passwords, personal information, financial data, and confidential content. My local-first approach with optional cloud sync is not just a feature, it can become an **advantage**.

`Key security principles discovered:`

- End-to-end encryption for all network communication
- Local storage by default, cloud sync as opt-in
- Automatic expiration of sensitive clipboard items
- Device pairing with secure authentication
- Open source transparency

```bash
Synclippy Security Layers
┌─────────────────────────────────────────────────────┐
│                   USER LAYER                        │
│  • Authentication (Device Pairing)                  │
│  • Authorization (Access Control)                   │
└─────────────────────┬───────────────────────────────┘
┌─────────────────────▼───────────────────────────────┐
│                APPLICATION LAYER                    │
│  • Input Validation                                 │
│  • Content Filtering                                │
│  • Rate Limiting                                    │
└─────────────────────┬───────────────────────────────┘
┌─────────────────────▼───────────────────────────────┐
│                ENCRYPTION LAYER                     │
│  • AES-256 Content Encryption                       │
│  • TLS 1.3 Transport Security                       │
│  • Key Rotation & Management                        │
└─────────────────────┬───────────────────────────────┘
┌─────────────────────▼───────────────────────────────┐
│                 NETWORK LAYER                       │
│  • WebSocket Secure (WSS)                           │
│  • Local Network Isolation                          │
│  • Firewall Integration                             │
└─────────────────────┬───────────────────────────────┘
┌─────────────────────▼───────────────────────────────┐
│                STORAGE LAYER                        │
│  • Local SQLite Encryption                          │
│  • Secure Key Storage                               │
│  • Automatic Data Expiration                        │
└─────────────────────────────────────────────────────┘
```

## The Build vs. Buy Decision

Why not use existing tools? Existing solutions rely on centralized cloud relays. I identified a market gap for a Privacy-Centric, Peer-to-Peer alternative.

## What Now? We Pivot!

Instead of fighting web limitations, I'm **embracing hybrid architecture**

`3 Phases. Sounds doable? Not really.`

**Phase 1**: Native desktop apps using Tauri (Rust + Web UI)  
**Phase 2**: Web interface for remote management  
**Phase 3**: Rich content sync with full clipboard access

This isn't just about solving a technical problem, it's about **user empathy**. People don't want to think about clipboard sync; they want it to **just work**. Fr. 

## Why This Matters Beyond My Project

The clipboard sync challenge reveals a broader truth about modern development: **web technologies excel at UI/UX, but native access is still irreplaceable** for system-level functionality.

``` bash
Why Native Access is so Important
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

As evident, the future isn't web-only or native-only, it's **hybrid**. From what I understand, tools like Tauri prove you can have native capabilities with web development velocity.

## Lets Talk v2!

### Features

#### Current Goals

- **Real-time sync** between all connected devices
- **Native desktop apps** for Windows, macOS, and Linux
- **Web interface** for browser-based access
- **End-to-end encryption** for security
- **Clipboard history** with search functionality
- **Local-first** approach (no mandatory cloud)
- **Rich content support** - text, images, and files

#### Planned Features

- Modern, intuitive UI built with web technologies
- Smart clipboard history with categorization
- Device pairing with secure authentication
- Optional cloud sync with strong encryption
- Application-specific filtering
- Mobile app support (future)

```bash
Cross Platform Handshake Diagram
  ┌─────────┐    ┌─────────────┐    ┌─────────┐
  │  APPLE  │    │   WINDOWS   │    │ ANDROID │
  └────┬────┘    └──────┬──────┘    └────┬────┘
       └────────┬───────┴───┬────────────┘
  ┌─────────────▼───────────▼─────────────┐
  │           TAURI DESKTOP APP           │
  │    ┌─────────────────────────────┐    │
  │    │       WEB UI LAYER          │    │
  │    │   (React/Vue.js Frontend)   │    │
  │    └─────────────────────────────┘    │
  │    ┌─────────────────────────────┐    │
  │    │      RUST BACKEND           │    │
  │    │   • Clipboard Access        │    │
  │    │   • File System I/O         │    │
  │    │   • Network Communication   │    │
  │    └─────────────────────────────┘    │
  └─────────────────┬─────────────────────┘
         ┌──────────▼──────────┐
  ┌───────────┐         ┌─────────────┐
  │   IONIC   │         │   FLUTTER   │
  │ CAPACITOR │         │     (X)     │
  └───────────┘         └─────────────┘
         └──────────┬──────────┘
         ┌──────────▼──────────┐
         │   MOBILE BRIDGE     │
         └─────────────────────┘
```

### Architecture

```bash
privacy by default and instant LAN transfers with E2EE
               ┌────────────┐          ┌───────────┐
               │ Desktop    │  WebRTC  │ Desktop   │
┌──────────┐   │ App (Tauri)├─────────►│App (Tauri)│
│ Web UI   │◄──┤ + Rust     │          │ + Rust    │
└──────────┘   └────────────┘          └───────────┘
       ▲             ▲                      ▲
       │ REST / WS   │  Local-first, P2P    │
       └──────┬──────┘                      │
              │        Optional Cloud Relay │
              └─────────────────────────────┘
```

*Local-first* with optional cloud relay means **privacy by default** and **instant LAN transfers**. End-to-end encryption keeps sensitive clipboard data, passwords, crypto keys, love poems? All **safe from prying eyes**.

Ensures PII (Personally Identifiable Information) remains strictly local-first.

#### Technology Stack

- **Desktop Apps**: Tauri (Rust + Web UI) for native performance with modern UI
- **Web Interface**: React for familiar development experience
- **Backend**: Go with WebSocket support for real-time communication
- **Database**: SQLite for local storage, PostgreSQL for server deployments
- **Security**: End-to-end encryption with device pairing

![Thumbnail](https://cdn.ujjwalvivek.com/posts/media/tech_stack.webp)

### Repository Overhaul

```bash
Synclippy/
├── frontend/          # Web UI (React/Vue)
├── src-tauri/         # Tauri/Rust native layer
├── backend/           # Go WebSocket server
├── functions/         # Serverless functions (if needed)
├── docs/              # Documentation
├── mobile/            # Future mobile apps
├── assets/            # Images, icons, etc.
└── tools/             # Build and deployment scripts
```

:::note
The lesson? 

Sometimes the right path forward means **going deeper into the stack**, not staying in the comfortable web layer.
:::

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ujjwalvivek/Synclippy.git
cd Synclippy

# Install dependencies
npm install                    # Frontend dependencies
cd src-tauri && cargo build    # Rust/Tauri dependencies
cd ../backend && go mod tidy   # Go backend dependencies

# Run in development mode
npm run tauri dev              # Start desktop app
go run main.go                 # Start backend server (separate terminal)

```


## Current Status (July 2025)

| Component            | State         | Notes                              |
| -------------------- | ------------- | ---------------------------------- |
| Go WebSocket server  | **Prototype** | Handles text sync in web-only mode |
| Web UI               | **Prototype** | Hit browser API ceiling            |
| Tauri desktop app    | **Planned**   | Rust bindings drafted              |
| Mobile app (Flutter) | **Backlog**   | Awaiting stable core protocol      |

## Next Steps ToDo

<ul class="markdown"> 
<li> <input type="checkbox" id="task-1" /> 
<span>Research clipboard APIs and limitations</span> 
</li>  
<li> <input type="checkbox" id="task-2" /> 
<span>IMPLEMENT LOCAL NETWORK DISCOVERY and device pairing</span> 
</li> 
<li> <input type="checkbox" id="task-3" /> 
<span>Migrate existing Go backend to serve native apps</span> 
</li> 
<li> <input type="checkbox" id="task-4" /> 
<span>Build basic desktop app with clipboard monitoring</span> 
</li> 
<li> <input type="checkbox" id="task-5" /> 
<span>Implement local network discovery and device pairing</span> 
</li> 
<li> <input type="checkbox" id="task-6" /> 
<span>Create web management interface</span> 
</li> 
<li> <input type="checkbox" id="task-7" /> 
<span>Add remote clipboard history access</span> 
</li> 
<li> <input type="checkbox" id="task-8" /> 
<span>Basic user authentication</span> 
</li> 
<li> <input type="checkbox" id="task-9" /> 
<span>Implement secure device authentication</span> 
</li> 
<li> <input type="checkbox" id="task-10" /> 
<span>Remote device management</span> 
</li> 
<li> <input type="checkbox" id="task-11" /> 
<span>Rich content support (images, files, formatted text)</span> 
</li> 
<li> <input type="checkbox" id="task-12" /> 
<span>Advanced clipboard history with search and categorization</span> 
</li> 
<li> <input type="checkbox" id="task-13" /> 
<span>Encryption and security hardening</span> 
</li> 
<li> <input type="checkbox" id="task-14" /> 
<span>Optional cloud sync with strong encryption</span> 
</li> 
<li> <input type="checkbox" id="task-15" /> 
<span>Mobile app development, Flutter wrappers around Rust core.</span> 
</li> 
</ul>

## Get Involved

Star the repo, open issues, or hop into discussions. Let’s build a clipboard sync tool that actually works without compromises.

> **Frustration is often the first clue you’re onto something worth fixing.**

## License

The MIT License

---