---
title: "ADR: What Made an LLM-Assisted Rust Migration Possible"
date: 2026-07-03
summary: "A Rust/egui to GPUI port postmortem on how a living ADR, a persistent memory bank, kept an LLM-assisted migration coherent across tools, tests, failed approaches, and human review while the product moved from experiment to released successor."
slug: log_0010_gpui_experiment
---

<!-- markdownlint-disable MD013 MD033-->

:::warning
I began this project with a deliberately small question

Could I learn GPUI, or at least get an idea of it, by building a tiny native playground? I guess, but what's the mental cost?
:::

I already had a working project hub called [DevHub](https://github.com/ujjwalvivek/devhub), built with egui. Asking an LLM to rewrite the port completely, and replacing it immediately would have turned an experiment into a migration before I even understood the new framework, and honestly, a hot pile of mess. The safer approach was to leave the existing application intact, create a separate workspace, and use `DevHub` only as a read-only behavioral reference.

<img src="https://github.com/ujjwalvivek/devhub/blob/main/web/public/images/legacy/shot-2.webp?raw=true" alt="Devhub">

A good four days later, the playground had become a complete GPUI successor with local and SSH project discovery, file browsing, content search, Markdown and code views, versioned persistence, themes, cancellation, native Windows integration, and cross-platform release automation. This sounds like a story about code-generation speed.

It is not.

<img src="https://github.com/ujjwalvivek/devhub/blob/main/web/public/images/gpui/shot-5.webp?raw=true" alt="Devhub-GPUI">

The code was the comparatively easy part. The difficult part was keeping a long-running LLM collaboration coherent while requirements changed rapidly, visual experiments failed, platform behavior contradicted assumptions, and the definition of parity kept becoming more precise. The project succeeded because its state lived in a continuously maintained architecture decision record, a.k.a. the **ADR**, referenced throughout the blog.

> The LLM supplied implementation throughput. I **retained** product judgement, native visual verification, and release authority.
>
> That division of responsibility became the *real* architecture of the project.

## Start With A Reversible Experiment

The first constraint was simple: the existing DevHub repository was *read-only*. It could be inspected and used as a behavioral reference, but it could **not** be modified, stripped of egui, or treated as the base of the new implementation. This prevented the most tempting migration mistake I often find myself making: beginning with a destructive framework replacement before the replacement had proved itself.

:::note
Think

**hypothesis -> implementation -> evidence -> correction**
:::

The GPUI workspace started with intentionally narrow goals:

- open a native window with Hello World
- render a static list and details layout
- move state into a GPUI entity
- respond to an interaction
- perform one background scan
- keep domain logic independent of the UI framework

The first useful experiment was a Devhub "**Lite**". At any point the experiment could have been discarded without affecting the working application. This was more than risk management. It gave the LLM a bounded problem. Instead
of asking it to reason simultaneously about a new UI framework, an existing codebase, Windows integration, SSH, persistence, and product design, each phase introduced **one** new class of uncertainty.

```text
DAY-1                    DAY-2                      DAY-3             DAY-4
   |                        |                          |                 |
 scaffold  -> state -> fixture UI -> real scan -> local workbench -> SSH parity
    8 tests                 |            |             |                 |
                            |            |             |                 |
                      hierarchy +        |      Zed launch +             |
                         hidden fixes    |          themes + FTUE        |
                                         |                               |
                                custom renderer rejected                 |
                                         |                               |
                                 gpui-component adopted                  |
                                         |                               |
                                 README images attempted                 |
                                         |                               |
                                  network path reverted                  |
                                                                         |
                                                            cancellation + remote ignore
                                                                pin/hide + release closure
                                                                         |
                                                                     60 tests
                                                                      v1.1.0
```

## ADR Becoming The Control Plane

Long LLM sessions have a predictable failure mode: context becomes compressed, earlier decisions become vague, and a plausible new answer quietly contradicts an old constraint. More prompting rarely fixes this. The remedy was a living document called [**ADR.md**](https://github.com/ujjwalvivek/devhub-gpui/blob/main/ADR.md).

It accumulated:

- the project intent and non-goals
- read/write boundaries
- architecture and dependency rules
- implementation phases and acceptance criteria
- Windows-specific risks
- validation commands
- a decision log
- a source-reuse ledger
- a functional-parity matrix
- known limitations and superseded approaches

The document was not merely a plan written before implementation. It changed with the project. When implementation and the ADR disagreed, the discrepancy had to be resolved explicitly. That made the ADR a shared control plane between human and LLM. A new agent could reconstruct not only what existed, but why it existed and which seemingly redundant code represented a hard-earned platform workaround. This distinction matters. Source code can tell an agent that a Windows titlebar has both GPUI hit regions and explicit click fallbacks. It cannot explain that each path had worked separately and then failed on the actual machine. The ADR can.

Almost as if the project discovered its instructions through failures rather than requiring a perfect setup on day one.

```text
Day 1            During the project              Mature form
 ------           ------------------              -----------

 user intent      repeated correction         AGENTS.md
     +               becomes a rule           (short, current)
 basic plan  ----------------------------->   - boundaries
     +                    |                   - commands
 model tools     rationale and history        - permissions
                          |
                          |
                          v
                        ADR.md
                        (long, durable)
                        - why
                        - failures
                        - reversals
                        - evidence

 In this project, ADR.md temporarily held both columns:

 +------------------------------------------------------+
 | plan + rules + decisions + history + validation      |
 |                 de facto agent handoff               |
 +------------------------------------------------------+
```

## Separate The Product From The Framework

The successor settled into two crates:

```text
devhub-core
  project model
  local and remote discovery
  config and cache persistence
  tree, file, README, and search operations
  cancellation states

devhub-gpui
  GPUI application state
  rendering and interaction
  background/foreground task coordination
  text and Markdown presentation
  platform-specific integration
```

`devhub-core` was required to remain independent of GPUI, egui, and Windows presentation APIs. That boundary paid for itself repeatedly. Filesystem tests, configuration migration, cache recovery, remote parsing, and cancellation could be validated without constructing a native window.

Platform-specific unsafe code was isolated in `platform.rs`. This kept Windows window movement, maximize/restore behavior, the native application chooser, and other operating-system details from leaking into domain code.

The old DevHub code could not be copied wholesale. Behaviors were inspected, reduced to their domain meaning, and rebuilt behind the new boundary. The source-reuse ledger recorded where a behavior came from and how it changed. The UI depends on the core; the core does not know that GPUI exists.

```text
 +---------------------------------------------------------------+
  |                         devhub-gpui                           |
  |                                                               |
  |  +--------------------+       +----------------------------+  |
  |  | GPUI application   |       | Presentation               |  |
  |  |--------------------|       |----------------------------|  |
  |  | entity state       |       | project list/details       |  |
  |  | actions/keybinds   |       | code + Markdown views      |  |
  |  | task generations   |       | themes/context menus       |  |
  |  | render composition |       | loading/error/empty states |  |
  |  +----------+---------+       +-------------+--------------+  |
  |             |                               |                 |
  |             +---------------+---------------+                 |
  |                             |                                 |
  |                 +-----------v-----------+                     |
  |                 | platform.rs           |                     |
  |                 |-----------------------|                     |
  |                 | Windows chrome        |                     |
  |                 | native Open In...     |                     |
  |                 | Zed process launch    |                     |
  |                 +-----------------------+                     |
  +-----------------------------+---------------------------------+
                                |
                                | typed domain API
                                v
  +---------------------------------------------------------------+
  |                         devhub-core                           |
  |                                                               |
  |  discovery    config/cache    workspace      cancellation     |
  |  ----------   ------------    ---------      ------------     |
  |  project      schema versions tree/read      shared token     |
  |  markers      atomic writes   README/search  bounded work     |
  |  Git metadata recovery        local/remote   no GPUI types    |
  +----------------------+----------------------+-----------------+
                         |                      |
                  +------v------+        +------v------+
                  | local FS    |        | OpenSSH     |
                  | ignore crate|        | POSIX tools |
                  +-------------+        +-------------+
```

## GPUI Does Not Make An Application Look Like Zed

One early misconception was that GPUI would naturally produce a Zed-like interface. Oh boy was I wrong. It does **not**. GPUI provides the rendering, state, layout, text, and interaction machinery used by Zed. Zed's visual language is a product layer built on top of it. The first UI looked like a generic dark dashboard. Native review made the difference concrete: Zed was darker, denser, flatter, sharper, compact, and more tightly integrated with its titlebar.

The successor therefore developed its own Zed-inspired visual rules:

- a near-black primary surface
- edge-to-edge panes
- one-pixel separators
- almost-square geometry
- compact rows and headers
- restrained accent use
- metadata presented as structure rather than decorative cards
- a client-drawn title strip

The important lesson was not how to imitate Zed. It was that framework choice does not substitute for design decisions. The LLM could implement tokens and geometry, but only native observation could determine whether the result felt coherent.

## Static Success Repeatedly Failed Native Review

> Several phases compiled, passed tests, and were still wrong.

The clearest example was the first document subsystem. It used a custom eager renderer for code and Markdown. On paper it supported the required features. In the running application, scrolling was slow and laggy, text selection was inaccurate, Markdown fidelity was poor, and some README/Code content ended abruptly. That phase was not patched indefinitely. It was rejected and marked as *superseded*.

The replacement used `gpui-component`: a rope-backed read-only code editor with Tree-sitter highlighting and a virtualized, selectable Markdown view.

The same pattern appeared in README images. Raster images, SVG badges, GIFs, relative repository paths, HTTP loading, and inline HTML tables created an expanding presentation problem. More code made the result less predictable and moved the application away from its purpose as an *offline* local and SSH project hub. The final decision was to remove network-backed image loading. README images became explicit offline placeholders while links remained usable. That reversal improved the product.

:::tip
It also produced one of the most reusable lessons:

When an LLM can keep generating fixes, the human must still intervene and **decide** whether the problem deserves more machinery.
:::

## Windows Native Chrome Was An Evidence Problem

Client-drawn Windows chrome exposed another weakness in purely code-based reasoning. A title region could look correct while failing to move the window. Window buttons could compile and render while minimize, maximize, restore, or Snap Layout behavior failed on the actual desktop.

The implementation accumulated fallbacks:

- GPUI window-control hit regions
- explicit minimize, zoom, and close handlers
- a native drag fallback using `ReleaseCapture`, `WM_NCLBUTTONDOWN`, and `HTCAPTION`
- a Windows-specific maximize/restore path using `IsZoomed`
- an explicit one-pixel application frame
- DWM corner hints

Some of this code appears redundant without its history. The ADR records **why** it exists. Compilation could verify API usage. It could **not** verify dragging, Snap Layout hover, resize hit testing, titlebar geometry, or the perceived sharpness of the window. Those remained human-observed gates.

## Background Work Needed Both Cancellation & Stale-Result Rejection

Discovery, tree loading, file reading, README loading, and search all happen in the background. Cancellation alone was not enough. A process can finish at the same moment it is cancelled. A slow result from an old selection can arrive after the user has selected a new project. The UI therefore used two complementary mechanisms:

1. shared cancellation tokens stop work cooperatively and kill in-flight SSH subprocesses
2. generation counters reject results that no longer belong to the current UI state

This pattern was also used to preserve the last known *good* project list when a scan was cancelled or all configured sources failed. A confirmed empty scan and a failed scan were treated as different states. The result was a UI that could "Stop" operations without allowing a late background task to rewrite the screen afterward.

```text
User selects Project A
          |
          v
 generation = 41 ---> spawn task A ---> local FS / SSH process
          |
          | user selects Project B before A completes
          v
 cancel token A
 generation = 42 ---> spawn task B -------+
          |                               |
          |                               v
          |                        result B (gen 42)
          |                               |
 result A arrives late                    |
      (gen 41)                            |
          |                               |
          v                               v
  41 != current 42                42 == current 42
  discard result                  apply + notify UI
```

## Parity Is A Product Decision

SSH was promoted from a deferred idea to a required product capability. It was also kept within a strict transport model.

The application uses the system `OpenSSH` client with non-interactive authentication, validated hosts and paths, connection deadlines, bounded output, and POSIX shell scripts. Remote ignore behavior delegates to `git check-ignore` on the host. The boundary is explicit: the remote environment must provide a POSIX shell and the required command-line tools. This does not pretend that every SSH server is equivalent.

Clear constraints were more valuable than a transport layer broad enough to be untestable. Late in the project, "port everything" needed a more precise definition. Literal source parity would have preserved every historical choice from the egui application. That was neither necessary nor desirable.

The successor had developed a clearer identity: it was a **Zed-first project hub** for local and SSH projects.

```text
    READ-ONLY REFERENCE
+--------------------------+
|  DevHub (egui)           |
|--------------------------|
|  behavior and features   |
|  existing user fallback  |
+------------+-------------+
             | inspect behavior,
             | selectively port
+------------v-------------+
|  DevHub GPUI             |
|  independent workspace   |
|--------------------------|
|  experiment -> successor |
+------------+-------------+
             | validated workflow,
             | release artifacts
+------------v-------------+
|  v1.1.0                  |
|  primary DevHub          |
|  egui retained as legacy |
+--------------------------+
```

The parity matrix therefore described the approved product workflow:

- configure local and SSH sources
- discover and cache projects
- filter and navigate large collections
- inspect metadata and README content
- browse trees, read files, and search content
- open local or remote projects in Zed
- persist configuration safely
- recover from partial failures
- cancel active work
- package and release the application

Features outside that workflow were explicit product decisions which prevented "parity" from becoming an infinite requirement.

## Validation Was Layered

The final static gate was intentionally repetitive:

```sh
cargo fmt --all -- --check
 cargo check --workspace --all-targets --locked
 cargo test --workspace --locked
 cargo clippy --workspace --all-targets --locked -- -D warnings
 cargo build --release --workspace --locked
```

The project finished with **60** passing tests: **47** in *devhub-core* and **13** in the *GPUI package*.

The tests covered behavior such as:

- local project detection and Git metadata
- hierarchical tree ordering and hidden-file policy
- bounded text reads and binary rejection
- configuration migration and future-version protection
- crash-safe writes
- malformed and missing cache recovery
- 10,000-project cache round trips
- filtering across 50,000 projects
- partial and total source failures
- stale-result rejection
- cancellation before filesystem or SSH work
- remote parser, quoting, validation, hierarchy, and ignore behavior
- offline Markdown image sanitization

Native gates covered what those tests could not: visual density, scrolling, selection accuracy, IME composition, keyboard navigation, titlebar controls, window movement, resizing, and interaction on a real SSH host.

```text
 +-----------------------+
  | Human native review   |
  |-----------------------|
  | visual quality        |
  | hit testing / IME     |
  | scrolling / selection |
  | real SSH workflow     |
  +-----------+-----------+
              ^
              |
  +-----------+-----------+
  | Release validation    |
  |-----------------------|
  | optimized build       |
  | platform artifacts    |
  | checksums / packaging |
  +-----------+-----------+
              ^
              |
  +-----------+-----------+
  | Static validation     |
  |-----------------------|
  | fmt / check / clippy  |
  | 60 automated tests    |
  +-----------+-----------+
              ^
              |
  +-----------+-----------+
  | Recorded requirement  |
  |-----------------------|
  | ADR acceptance gate   |
  +-----------------------+
```

:::note
The distinction was written into the project rules:

A successful static build or passing a lower layer does not certify native interaction or passing a higher layer.
:::

## Release Authority Stayed Human-Owned

The LLM was allowed to inspect, implement, test, and prepare release automation. It was not allowed to perform Git operations unless explicitly requested. That boundary provided a useful final checkpoint. Changes could be reviewed as a coherent unit before they became repository history or triggered external automation.

[**v1.1.0**](https://github.com/ujjwalvivek/devhub-gpui/releases/tag/v1.1.0) closed the approved parity experiment. The original egui repository was retained as the archived legacy implementation, while the GPUI successor became the primary DevHub.

## What I Would Repeat

For another substantial LLM-assisted migration, I would keep the same **7** operating principles:

- Preserve the working system
- Externalize project memory
- Use small acceptance gates
- Record rejected implementations
- Separate domain logic from framework code
- Define parity explicitly
- Retain human authority at irreversible boundaries

## What The LLM Actually Changed

The LLM made it practical to move quickly across Rust domain code, GPUI state, Windows APIs, POSIX shell scripts, persistence, tests, documentation, and CI. It could inspect an unfamiliar framework, apply a decision consistently across many files, and continue after interruptions using the repository record. But speed alone would have produced a larger pile of plausible code.

The work became a successful application because failures were observed, scope was challenged, rejected ideas were removed, and completion had an explicit definition. The most important artifact was the agreement that decisions had to survive outside the model's context window.

> The ADR was the **memory**. The tests were the **evidence**. The human remained the **editor**.

## There was no perfect agent setup

This project also moved through several closed-source and open-source models, used from both CLI and GUI environments. There was no carefully designed `AGENTS.md` at the beginning, no custom multi-agent framework, and no complete instruction system prepared in advance. I opened the available interface, described the next problem, inspected the result, and refined the working rules as the project exposed what it needed.

That is worth talking about, but the conclusion is not that the model was irrelevant or that any model can complete any software project. Different models varied in reasoning quality, implementation accuracy, and how much supervision they required. What remained stable was the engineering harness around them:

- access to the repository and relevant reference code
- tools for searching, patching, compiling, and testing
- explicit filesystem and Git authority boundaries
- short implementation phases with observable acceptance criteria
- a human available to reject incorrect product or native-UI behavior
- durable project context that survived a model or interface change

A capable but comparatively modest model can produce useful engineering work when the task is bounded, the tools are reliable, failures are visible, and the next decision does not depend on reconstructing the entire project from chat history. A stronger model can reduce supervision and handle larger ambiguous steps, but it does not remove the need for those conditions.

The model was one component in a feedback system, not the whole system.

```text
                        +------------------+
                         | Human judgment   |
                         |------------------|
                         | product scope    |
                         | visual review    |
                         | accept / reject  |
                         | Git + release    |
                         +--------+---------+
                                  |
                                  | next bounded goal
                                  v
 +---------------+       +--------+---------+       +----------------+
 | Living ADR    +------>| LLM + harness    +------>| Repository     |
 |---------------|       |------------------|       |----------------|
 | decisions     |       | inspect/search   |       | code           |
 | constraints   |       | patch/build/test |       | tests          |
 | failed paths  |       | explain results  |       | documentation  |
 | validation    |       +--------+---------+       +-------+--------+
 +-------^-------+                |                         |
         |                        | evidence                |
         |                        v                         |
         |               +--------+---------+               |
         +---------------+ Validation gates <---------------+
                         |------------------|
                         | fmt/check/test   |
                         | clippy/release   |
                         | native smoke     |
                         +------------------+

The outcome therefore belongs to the complete system:
model + tool harness + repository evidence + living decisions + human review
```

This project's ADR gradually accumulated both responsibilities. It was useful because the necessary instructions were discovered through the work. The project did not need a perfect agent configuration before it could begin. It needed a place to promote repeated corrections into durable rules.

For a future project, I would separate the mature result into two layers:

- a short `AGENTS.md`
- an ADR or decision log preserving rationale

The sophisticated part does not have to exist on day one. It can emerge from the project, provided each important correction is captured somewhere more durable than the conversation that produced it. Calling it merely "*AI-generated*" would erase most of what made the result repeatable.

## Links

- [Public repository](https://github.com/ujjwalvivek/devhub-gpui)
- [Release notes](https://github.com/ujjwalvivek/devhub-gpui/releases/tag/v1.1.0)
- [ADR](https://github.com/ujjwalvivek/devhub-gpui/blob/main/ADR.md)
- [Old Devhub](https://github.com/ujjwalvivek/devhub)
- [Website](https://devhub.ujjwalvivek.com)
