<!-- markdownlint-disable MD013 MD036 -->

# Portfolio v4: Architecture Decision Record and Delivery Ledger

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Document       | ADR-000                                                                 |
| Status         | Living document; foundation decisions accepted, M0 not started          |
| Product        | ujjwalvivek.com, version 4                                              |
| Repository     | github.com/ujjwalvivek/portfolio, branch v4                             |
| Working copy   | marchy: ~/Projects/claude.proj/portfolio-v4/portfolio                   |
| This file      | docs/ADR.md on branch v4                                                |
| Related repos  | root (consumer sibling), substrate (wallpapers), journey (game engine)  |
| Created        | 2026-11-18                                                              |
| Last updated   | 2026-11-18                                                              |
| Replaces       | v3.0.0 (React, Create React App, deployed from main)                    |

## Navigation

- [Current checkpoint](#current-checkpoint)
- [0. Summary](#0-summary)
- [1. Governance](#1-governance)
- [2. Context: v3 as measured](#2-context-v3-as-measured)
- [3. Goals, non-goals, success criteria](#3-goals-non-goals-success-criteria)
- [4. Principles and invariants](#4-principles-and-invariants)
- [5. Precedents](#5-precedents)
- [6. Decision index](#6-decision-index)
- [7. Decision records](#7-decision-records)
- [8. Repositories and locations](#8-repositories-and-locations)
- [9. System architecture](#9-system-architecture)
- [10. Feature carry-over ledger](#10-feature-carry-over-ledger)
- [11. Wallpaper, recipe and palette contract](#11-wallpaper-recipe-and-palette-contract)
- [12. Header game specification](#12-header-game-specification)
- [13. URL compatibility](#13-url-compatibility)
- [14. Validation and budgets](#14-validation-and-budgets)
- [15. Milestone plan](#15-milestone-plan)
- [16. Risks and mitigations](#16-risks-and-mitigations)
- [17. Open questions](#17-open-questions)
- [18. Rejected alternatives](#18-rejected-alternatives)
- [19. Chronological decision log](#19-chronological-decision-log)

## Current Checkpoint

| Item                     | Current state                                                        |
| ------------------------ | -------------------------------------------------------------------- |
| Current milestone        | M3: blog (M0 to M2 accepted by Vivek; M2 on 2026-11-19)              |
| Next milestone           | M4: projects, after M3 review                                        |
| Accepted foundation      | Zola pages, TypeScript modules, substrate consumer, header game      |
| Immediate decision gate  | None for M0; Q-02 and Q-08 are needed later                          |
| Production               | v3 stays live from main until M8 cutover                             |
| Known blockers           | None                                                                 |
| Preview                  | https://v4.portfolio-1ar.pages.dev (branch v4)                       |

## 0. Summary

v4 rebuilds ujjwalvivek.com with the philosophy root already proves: few dependencies, each one earning its place, pages that arrive as real HTML, and the interesting parts loaded only where and when they are used. It keeps everything that makes the site an experimental playground. Nothing that was built up over v1 to v3 is dropped for being fun, odd or legacy; it is rebuilt to behave the same or better.

The shape:

```text
            Zola (build time)
   pages, posts, markdown, highlighting
                  |
           static HTML + CSS
                  |
   +--------------+------------------------+
   |              |                        |
 TS modules    substrate (vendored)    header game (wasm)
 per feature   one of 3 named recipes  Journey engine, home only
 tsc, 1:1      palette drift within    text as glowing pixels,
 no bundler    a palette's two ends    lemmings as characters
   |              |                        |
   +-------- one live document ------------+
        soft navigation keeps wallpaper,
        game, palette and audio alive
```

What leaves: React and its ecosystem, the client-side markdown pipeline and its Node polyfills, the v3 background engine (its work continues in substrate), the wasm topographic wallpaper, light mode, and the first-visit landing sequence.

## 1. Governance

### 1.1 Purpose

This file is the single place for v4's boundaries, decisions, architecture, carry-over ledger, milestones, budgets and risks. If the code and this file disagree, stop and either fix the code or record here why it must differ.

### 1.2 Status vocabulary

Decisions: Accepted (binding until superseded), Proposed (preferred, needs evidence or approval), Deferred (postponed, must not block milestones), Rejected, Superseded (names its replacement).

Milestones: Not started, In progress, Blocked, Complete. Complete means every exit gate passed, including Vivek's review on screen where the gate says so. A demo is not a completed milestone.

### 1.3 Change procedure

1. Add a new decision or amend a Proposed one. Do not erase old rationale.
2. Mark replaced decisions Superseded and link the replacement.
3. Update the affected architecture, ledger, milestone, budget and risk sections.
4. Add a dated line to section 19.
5. Record the evidence: commands, measurements, screenshots, or Vivek's acceptance.

## 2. Context: v3 as measured

Measured on 2026-11-18 from the live site and the v3 source (main at b65e18e).

| Item                           | v3                                                                   |
| ------------------------------ | -------------------------------------------------------------------- |
| First-load JS                  | one chunk, 2,704,052 bytes (813 KB gzip), on every route             |
| First-load CSS                 | 292,182 bytes (48 KB gzip)                                           |
| npm dependencies               | 45 runtime entries; 1,134 packages in node_modules                   |
| Unused dependencies            | d3, lodash, mermaid, rehype-react, ts-dedent, web-vitals, testing-library |
| Broken import                  | CalEmbed imports @calcom/embed-react, which is not installed         |
| Source size                    | about 22k lines of JS and CSS, 5.5k lines of posts                   |
| Background engine              | 5 wallpapers, 11 colour modes, 3 device tiers, about 3,500 lines     |
| Wasm wallpaper                 | 3.56 MB (1.41 MB gzip), wasm-opt off, egui and wgpu for a dot grid   |
| Fonts                          | 22 faces, font-display block                                         |
| First-visit delay              | landing sequence, about 2.9 s before content                         |
| Projects page delay            | fake 2 s "FETCHING" bar over static data                             |
| Markdown in the browser        | react-markdown, 8 remark/rehype plugins, gray-matter, Buffer/stream/util polyfills |
| KaTeX                          | shipped for one display equation across 14 posts                    |

For comparison, root: main.js 37,745 bytes (12 KB gzip), styles.css 18,949 bytes (4.9 KB gzip), no npm dependencies, Zola build. Its game wasm is 4,212,965 bytes (1.94 MB gzip). Root is light in structure and dependencies, not in bytes.

Bugs found in v3 that the rewrite must not carry over:

- terminal mail polls a stale turnstileToken closure, so the invisible verification path always times out after 10 s unless a token already existed;
- the adaptive quality value in the background engine is computed and never applied;
- the vortex wallpaper is O(n²) with shadowBlur on every connection line, every frame;
- the arrow pointer restarts its animation loop on every mouse move;
- command palette project results scroll to a data-project-id element that does not exist;
- About's recent projects shows only PM projects while the code names them dev;
- the Journey badge's cargo command box shows the npm copy state and copies nothing.

## 3. Goals, non-goals, success criteria

### 3.1 Goals

- Every page arrives as readable HTML with no loader in front of it.
- Each feature's code and styles load only on the page that uses it, after first paint unless it is the page's main content.
- The site stays a playground: terminals, games, easter eggs, the GitHub navigator, the PDF viewer, the clicker, the crash screen, the lemmings and the wallpaper picker all survive.
- The wallpaper is substrate, composed in layers like root, with at most three recipes.
- The home header becomes a live Journey scene in root's style.
- All client code is TypeScript.

### 3.2 Non-goals

- Zero dependencies as a rule. Dependencies are allowed where they earn their place (D-004).
- A light theme (D-010).
- A CPU wallpaper fallback (D-008).
- Changing root. Root stays a separate repository as it is now; it may later choose to consume shared pieces, but v4 does not require it.
- Supporting browsers without ES modules.

### 3.3 Success criteria

- Budgets in section 14 pass on every page.
- Every row of the carry-over ledger (section 10) is either Ported and reviewed, or Removed with a decision behind it.
- Every v3 URL still resolves (section 13).
- Vivek accepts the home header game on screen.

## 4. Principles and invariants

1. HTML first. Content never waits for JS, wasm, fonts or the network.
2. Load where used. A feature's module, styles and data are requested by the page that shows it, not by the site.
3. One live document. Navigation swaps page content; the wallpaper, header game, palette and audio keep running (D-005).
4. Consumers, not copies. The portfolio consumes substrate recipes and palettes by name. It does not define wallpapers.
5. Hold the space. Anything that loads late reserves its final size first, so nothing below it moves. Root's skeletons are the model.
6. Fun is a feature. A playful element is ported with the same care as content. If it was built incrementally, it stays or gets better.
7. No fake waiting, strictly. A delay, progress bar, spinner or "verifying" line exists only while real work is happening, and ends the moment that work ends. Animation is allowed; animation that stands between the visitor and something already available is not (D-024).
10. The design system is binding. Vivek's web system (ujjwalvivek.com) and the house style, mirrored at ~/Projects/_Engine/.devlogs/claude.proj/designsystem/systems/web (README.md, house-style.md, tokens.json), govern every surface: monospace first, borders not shadows, dashed = inert and solid 2px dominant = active or focus, keycaps with a 2px bottom edge, glass bars tinted by the dominant colour, UPPERCASE panel titles at 2px tracking, lowercase meta at 1px, UI sizes small (caption 0.8rem). Where it allows 2px corners, principle 9 wins: 0.
9. Square corners. No border-radius anywhere on the site (Vivek, 2026-11-18); base.css enforces it globally.
8. Behaviour parity, new code. A ported feature must do what it did in v3, minus its bugs; its implementation is free to change.

## 5. Precedents

### 5.1 Root

Takes: Zola, plain ES modules with modulepreload for the first graph, lazy sections mounted near the viewport with idle prefetch, localStorage caches for remote data, skeletons that reserve height, substrate background with a CSS glow and dot-grid backdrop when WebGPU is missing, the game canvas inside a cornered frame, EmailJS over REST with Turnstile loaded only for mail.

Does not take: root's palette is driven by the game's sky; v4 drives the palette from the page (D-009). Root loads substrate from jsDelivr at runtime; v4 vendors it (D-015). Root's warm and dusk pair is added to the portfolio's palettes as one more local palette, not shared through substrate (D-020).

### 5.2 Substrate

The v3 background engine's successor. Version 2.0.2 ships 34 WGSL primitives through one WebGPU renderer (183 KB, 46 KB gzip), plus a CPU reference build that already contains v3's wallpapers as quantum, holo, sacred and organic. The CPU build stays in substrate as a legacy item. The playground has presets but no recipe export; root's comment about pasting "copy json" refers to a lab that no longer exists. A recipe format has to be defined (D-007).

### 5.3 v3

Lessons: a single bundle made every feature everyone's cost; three separate copies of colour helpers drifted; device-tier heuristics grew to guard an engine that a GPU replaces; per-second React re-renders for clocks; fake progress bars read as slowness, not polish.

## 6. Decision index

| ID    | Decision                                                        | Status   | Date       |
| ----- | --------------------------------------------------------------- | -------- | ---------- |
| D-001 | Rewrite on branch v4 in the existing repo                       | Accepted | 2026-11-18 |
| D-002 | Zola renders pages and posts                                    | Accepted | 2026-11-18 |
| D-003 | TypeScript for all client code, tsc 1:1, no bundler or framework | Accepted | 2026-11-18 |
| D-004 | Dependency policy: justified, lazy, listed                      | Accepted | 2026-11-18 |
| D-005 | Soft navigation keeps one live document                         | Accepted | 2026-11-18 |
| D-006 | Retire the v3 background engine and wasm wallpaper              | Accepted | 2026-11-18 |
| D-007 | Recipes live in substrate, named and versioned                  | Accepted | 2026-11-18 |
| D-008 | No CPU fallback; CSS backdrop when WebGPU is missing            | Accepted | 2026-11-18 |
| D-009 | Palettes with two ends; the page drifts within them             | Accepted | 2026-11-18 |
| D-010 | Retire light mode                                               | Accepted | 2026-11-18 |
| D-011 | Wallpaper picker: recipes, palettes, sliders, pasted recipes    | Accepted | 2026-11-18 |
| D-012 | Home header becomes a Journey game                              | Accepted | 2026-11-18 |
| D-013 | Game code: copy now, shared crate later in journey              | Accepted | 2026-11-18 |
| D-014 | Feature-gate journey-engine to shrink web builds                | Accepted | 2026-11-18 |
| D-015 | Vendor substrate at build time                                  | Accepted | 2026-11-18 |
| D-016 | Keep every v3 URL working                                       | Accepted | 2026-11-18 |
| D-017 | Port page by page, header first                                 | Accepted | 2026-11-18 |
| D-018 | Carry-over rule for v3 features                                 | Accepted | 2026-11-18 |
| D-019 | Terminal mail over EmailJS REST with lazy Turnstile             | Accepted | 2026-11-18 |
| D-020 | Palettes are local to the portfolio; all v3 palettes conserved  | Accepted | 2026-11-18 |
| D-021 | Site-wide UI sounds from the game's audio engine                | Proposed | 2026-11-18 |
| D-022 | Font loading: preload used weights, stop blocking text          | Proposed | 2026-11-18 |
| D-023 | One sane keyboard layout                                        | Accepted | 2026-11-18 |
| D-024 | No fake loading anywhere                                        | Accepted | 2026-11-18 |
| D-025 | Cloudflare preview deploys for branch v4                        | Accepted | 2026-11-18 |
| D-026 | Parallel work streams run as subagents                          | Accepted | 2026-11-18 |
| D-027 | Palettes rebuilt as single hue families; the accent leads       | Proposed | 2026-11-18 |

## 7. Decision records

### D-001: Rewrite on branch v4 in the existing repo

**Status:** Accepted

**Decision.** v4 is built on a branch named v4 in github.com/ujjwalvivek/portfolio. main keeps serving v3 until the M8 cutover merge.

**Rationale.** Pushing to main deploys to Cloudflare Pages immediately, and so does a pull request against main. A branch keeps production safe while history stays in one repository.

**Consequences.** No pull request against main until M8. Commits follow the repo's own style (feat:, fix:, chore:, asset:, ci:, docs:), one line, authored as ujjwalvivek, no trailers. Branch v4 is pushed to GitHub as work lands; previews come from D-025.

### D-002: Zola renders pages and posts

**Status:** Accepted

**Decision.** Zola builds every page and post to static HTML: markdown, front matter, syntax highlighting as CSS classes, tables of contents, shortcodes for admonitions and embeds, and data files for projects. Pin Zola 0.23.6, the version on marchy and datacenter.

**Rationale.** Root already uses it; it is one binary; it removes the whole client markdown stack and its polyfills. Markdown is the one place a real dependency is wanted, and Zola is that dependency.

**Amendment 2026-11-18.** Zola 0.23 removed shortcodes in favour of Tera 2 components, and moved highlighting to [markdown.highlighting] (giallo, style class, theme one-dark-pro). Posts use components defined in templates/components/post.html: note, tip, warning, danger, info, toc, dino, embed. nasm falls back to plain text. Bare URLs do not autolink, so the eight in the posts are wrapped in angle brackets to keep v3's links. The three files not in v3's meta.json (log_0001, proj_0000, proj_0001) were never reachable in v3 and are left out. The one display equation turned out to be three inline expressions in log_0003, now inline MathML.

**Consequences.** The 14 posts are converted once: :::tip and the other directives become shortcodes, :::toc becomes a template feature, :::dino becomes a shortcode that mounts the dino module, the one display equation becomes static markup (MathML or an image), raw img and iframe stay as HTML. Grammars for nasm, C# and the custom terminalblock fence must be verified (R-05). Root's CI pins Zola 0.19.0; v4's CI pins 0.23.6.

### D-003: TypeScript for all client code, tsc 1:1, no bundler or framework

**Status:** Accepted

**Decision.** Client code is TypeScript in strict mode. tsc compiles each source file to one ES module under static/js. There is no bundler, no React and no UI framework. TypeScript is the only npm devDependency.

**Rationale.** Types pay for themselves in config objects, recipe and palette shapes, echopoint responses and DOM code. A 1:1 compile keeps the output readable and debuggable, the way root's hand-written modules are. A bundler would only be needed to merge files, and per-feature files are the point.

**Consequences.** Components that were React become small modules with a mount(host) function that returns a cleanup function. modulepreload tags list each page's first module graph. The React-only PDF viewer is rebuilt on pdf.js (D-004).

### D-004: Dependency policy

**Status:** Accepted

**Decision.** A dependency is allowed when writing it ourselves would be worse, and it is loaded only by the feature that uses it. The full list lives here:

| Dependency          | Kind            | Used by                       | Loaded                          |
| ------------------- | --------------- | ----------------------------- | ------------------------------- |
| Zola 0.23.6         | build binary    | pages, posts, highlighting    | build only                      |
| TypeScript          | npm devDep      | all client code               | build only                      |
| Rust, wasm-pack     | build toolchain | header game                   | build only                      |
| journey-engine and siblings | crates  | header game                   | home page, after first paint    |
| substrate           | vendored ES module | wallpaper and picker       | every page, after first paint   |
| pdf.js (pdfjs-dist) | vendored        | resume and document viewer    | when the viewer opens           |
| syntax highlighter  | vendored, tbd   | GitHub navigator only         | when the navigator opens (Q-02) |
| Turnstile           | remote script   | terminal mail                 | when mail is mounted            |

Removed: react, react-dom, react-router-dom, react-scripts, react-app-rewired, customize-cra, react-markdown, remark and rehype plugins, gray-matter, buffer, stream-browserify, util, process, katex, react-syntax-highlighter, react-icons, @emailjs/browser, dompurify, @react-pdf-viewer, postcss and its plugins, cssnano, autoprefixer, d3, lodash, mermaid, ts-dedent, web-vitals, testing-library.

**Rationale.** "Not everything needs a dependency" is the rule, not "nothing may have one". The list makes every exception visible.

**Consequences.** Icons become an inline SVG sprite of only the glyphs used. Echopoint SVGs are shown with plain img tags, as root does; an SVG in an img cannot run script, so DOMPurify has nothing to guard.

### D-005: Soft navigation keeps one live document

**Status:** Accepted

**Decision.** A small router intercepts same-origin link clicks, fetches the target page, swaps the main element and the page's module list, updates the title and history, and restores scroll. Without JS, links are ordinary links.

**Rationale.** With separate HTML pages, every navigation would rebuild the WebGPU device and pipelines, restart the header game and reset the palette drift. The wallpaper would flash on every click.

**Consequences.** Every page module must implement mount and cleanup and must not assume a fresh document. Global listeners belong to the shell, not to pages. The header game pauses when its page is not shown and resumes on return (section 12).

### D-006: Retire the v3 background engine and wasm wallpaper

**Status:** Accepted

**Decision.** Delete GlobalBackground, BackgroundConfig, BackgroundContext's wallpaper logic, the generators in ColorUtils, the capability probe and device tiers, JourneyBackground, and the portfolio-bg crate. The colour derivations that feed the --dynamic-* CSS variables survive in one module (section 11).

**Rationale.** That engine's work continues in substrate, which already carries its four wallpapers in the CPU build. A GPU renderer makes device tiers and adaptive quality unnecessary.

**Consequences.** About 3,500 lines and one Rust build leave the repo. The CI step that installs wasm-pack for the wallpaper is replaced by the header game's build.

### D-007: Recipes live in substrate, named and versioned

**Status:** Accepted

**Decision.** Substrate gains a recipe format (section 11.1), a small set of named recipes and an export that serves them. Consumers ask for a recipe by name and never define layers. The portfolio offers at most three recipes. Recipe one is root's current stack.

**Rationale.** One central location; root and the portfolio can share a recipe without either copying it; pasted recipes use the same format.

**Consequences.** This is a substrate change and release (milestone S1, in the substrate repo on datacenter). The playground gains "copy recipe" so a recipe can be built there and pasted into the site. Until S1 ships, the portfolio uses root's stack locally, marked temporary.

### D-008: No CPU fallback; CSS backdrop when WebGPU is missing

**Status:** Accepted

**Decision.** Without WebGPU the canvas is removed and root's CSS backdrop (breathing glow and dot grid) stays. The CPU build is never loaded.

**Rationale.** The CPU wallpapers are too heavy to be a good experience. Root's backdrop already looks intentional in Zen, which has no WebGPU on Linux.

**Consequences.** Firefox on Linux and Intel Macs, and older Safari, see the backdrop. The picker shows that the wallpaper is unavailable rather than offering CPU recipes.

### D-009: Palettes with two ends; the page drifts within them

**Status:** Accepted

**Decision.** A palette is a named pair of colour sets, end A and end B, each with primary, secondary, accent and background. The visitor chooses a palette. The page moves slowly between the two ends on its own clock and pushes the mixed colours to substrate, to the header game and to the --dynamic-* CSS variables. The game does not own the colour.

**Rationale.** Vivek wants palettes kept and a drift within each palette, not a sky that drives the site. The palette set is D-020 and section 11.3.

**Consequences.** The header game gains an export to receive the current colours (section 12). Reduced motion holds the palette at end A. CSS writes are throttled and paused while scrolling, as root does.

### D-010: Retire light mode

**Status:** Accepted

**Decision.** v4 is dark only. The theme toggle, every light variable, the theme lock and the light map tile go. The resume keeps its dark and light PDFs, because that is a choice of document, not of site theme.

**Rationale.** Substrate layers are glow composited over near-black. A light theme needs different compositing, not a different palette, so the wallpapers give no clear path to it.

**Consequences.** Reopen only if a recipe composited on a light background passes review on screen.

### D-011: Wallpaper picker evolves

**Status:** Accepted

**Decision.** The "vibe switch" overlay stays and gains: up to three recipes, the palette list, global speed, density and opacity sliders applied through substrate's effectiveLayerOptions, an animation toggle that renders one static frame, an FPS readout, and a paste field that accepts a recipe in the section 11.1 format.

**Rationale.** The picker was built over several iterations; it stays and gets better. Pasting a recipe from the playground fits the site.

**Consequences.** A pasted recipe is parsed as JSON, validated against the substrate schema and the known primitive names, limited in layer count, and never evaluated as code. It is saved locally and can be cleared.

### D-012: Home header becomes a Journey game

**Status:** Accepted

**Decision.** The home header box becomes a live Journey scene in root's style: the header text is drawn as glowing pixel dots that assemble, and the lemmings become characters in that scene. Specification in section 12.

**Rationale.** It carries the site's identity into the first thing a visitor sees, and it is Vivek's own engine.

**Consequences.** The home page loads a wasm game after first paint. Until D-014 lands, its size is root's size class (R-01). The header text is real HTML first and is replaced visually once the game is running.

### D-013: Game code: copy now, shared crate later in journey

**Status:** Accepted (copy); Deferred (extraction)

**Decision.** portfolio/game starts as a copy of root/game and diverges as needed. Root is not changed. Once both scenes run, the shared parts (dot text, embers, stars, palette input, audio engine) may be extracted into a crate in the journey workspace on marchy and published like journey-engine, journey-sound and journey-sequencer. Both games would then depend on it by version.

**Rationale.** Sharing does not mean nesting repositories. Root and the portfolio stay separate repos; a shared crate lives where the engine lives. Extracting before either game works would mean changing three repos before anything is visible.

**Consequences.** Some duplication between root/game and portfolio/game until extraction. Section 19 records when extraction happens.

### D-014: Feature-gate journey-engine to shrink web builds

**Status:** Accepted, released as journey-engine 1.4.0

**Decision.** Put egui and egui-wgpu, and the kira audio path, behind cargo features in journey-engine, default on, so a web scene can opt out. Add the image path too, and a scene() hook for scene params that does not need egui, and a web pause that stops requesting frames.

**Evidence 2026-11-18 (stream C, measured).** Root's game is 4,211,975 bytes, 1,929,082 gzip. egui's four bundled fonts are 1,407,752 bytes of it, egui code another ~355 KB; root uses egui for nothing. Gated builds: egui off 915,599 gzip; egui, kira and image off 814,913 gzip; the same without wgpu's WebGL path 162,918 gzip (drops WebGL2-only browsers). About 40 lines plus an audio stub. Builds were measured, not run in a browser.

**Rationale.** journey-engine has no features today; egui, egui-wgpu, kira, image and noise always compile in. Root's game is 4.2 MB of wasm and uses egui only to set scene parameters.

**Consequences.** A journey-engine release. Evidence required first: a size breakdown of the current header game wasm (twiggy or wasm-opt stats). Benefits root as well when it updates.

### D-015: Vendor substrate at build time

**Status:** Accepted (scripts/vendor.mjs, sha512-checked)

**Decision.** The build copies the pinned substrate dist into static/vendor and the site serves it from its own origin with long cache headers.

**Rationale.** No third-party runtime host, a simpler CSP, and one cache policy.

**Consequences.** Upgrading substrate is a version bump in the build. The copy is fetched from the npm tarball by version, with a checksum.

### D-016: Keep every v3 URL working

**Status:** Accepted

**Decision.** Every v3 route keeps resolving, either directly or by a 301 in static/_redirects. Section 13 lists them.

**Rationale.** Blog posts are linked as /blog/<file>.md from badges, ProjectsData, other repos and the web.

### D-017: Port page by page, header first

**Status:** Accepted

**Decision.** After the shared foundation, pages are ported one at a time: home header game, rest of home, blog, projects, about, then global features. Section 15.

**Rationale.** Vivek wants to see the lemmings header as early as possible, and each page becomes reviewable on its own.

### D-018: Carry-over rule for v3 features

**Status:** Accepted

**Decision.** Every v3 feature is in the section 10 ledger. Each is Ported with behaviour parity, Improved, or Removed by a named decision. Nothing disappears silently.

### D-019: Terminal mail over EmailJS REST with lazy Turnstile

**Status:** Accepted

**Decision.** Port terminal mail with the same steps, sidebar, help bar and terminal cat. Send through EmailJS's REST endpoint as root does, and load Turnstile only when mail mounts. Wait for the Turnstile callback with a promise, not by polling state.

**Rationale.** Removes the SDK and the global Turnstile script; fixes the stale-token bug.

### D-020: Palettes are local to the portfolio; all v3 palettes conserved

**Status:** Accepted; the literal v3 colour values are superseded by D-027 (names and character kept)

**Decision.** Palettes are defined in the portfolio, not in substrate. Every v3 colour mode survives: cyber, ocean, fire, spark, forest, synthwave, sunset, midnight, aurora, neon and custom. Root's warm and dusk pair is added as a twelfth palette named root. Recipes stay central in substrate (D-007); palettes are a consumer concern.

**Rationale.** Vivek: all portfolio palettes must be conserved, and palettes can be a local consumer thing.

**Consequences.** Each v3 mode already has two colour sets in ColorUtils, one written for dark mode and one for light mode. With light mode retired (D-010), those two sets become the palette's two ends: end A is the old dark set, end B the old light set, both over the dark background #0a0a0a. This keeps the original colour data exactly. Whether every pair drifts well on a dark background is checked on screen in M0; a pair that does not is retuned by hand and the change recorded here. Custom takes the visitor's colour as end A and derives end B from it (section 11.3).

### D-021: Site-wide UI sounds from the game's audio engine

**Status:** Proposed

**Decision.** Hover and click sounds and the music toggle come from the header game's AudioEngine, as on root, and stay available on every page while the document lives.

**Consequences.** The audio engine must be usable without the scene being visible, or split from it (section 12).

### D-022: Font loading

**Status:** Proposed

**Decision.** Keep JetBrains Mono, Monaspace Neon and Monaspace Krypton. Declare only the weights the CSS uses, preload the two that render first-screen text, and use font-display swap.

**Rationale.** 22 faces with font-display block hide text until fonts arrive, which breaks principle 1.

### D-023: One sane keyboard layout

**Status:** Accepted

**Decision.** One shortcut per action, single keys or one chord, no timed sequences after a modifier. Single-key shortcuts are ignored while typing in an input or a terminal.

| Key              | Action                                              | v3 equivalent                              |
| ---------------- | --------------------------------------------------- | ------------------------------------------ |
| Ctrl+K or Cmd+K  | open or close the command palette                   | Ctrl+K then P, Ctrl+Alt+K, Shift+right-click |
| g then h, a, b, p | go to home, about, blog, projects                   | Alt+1 to 4, Ctrl+K then 1 to 4             |
| /                | focus search (blog list), else open the palette     | none                                       |
| v                | open the vibe switch (wallpaper picker)             | footer click only                          |
| z                | toggle fullscreen (zen)                             | Ctrl+K then Z                              |
| m                | toggle music                                        | header button only                         |
| ?                | show the shortcut sheet                             | palette footer list                        |
| Esc              | close the top overlay                               | Esc                                        |

Inside the GitHub navigator's editor: Ctrl+S downloads the buffer, Esc closes it. Inside terminals: Ctrl+L clears, arrows walk history. The picker keeps arrows, Enter and Esc.

**Rationale.** v3 had six ways to reach the palette and several that collide with the browser on Linux: Alt+1 to 9 switches tabs in Chrome and Firefox, Ctrl+Q quits Firefox, and Shift+right-click is Firefox's way to force the native context menu. Ctrl+K is the common web convention for a command palette, so taking it is a deliberate trade.

**Consequences.** The command hint, the palette footer and the shortcut sheet all read from one keymap module, so the layout is written once.

### D-024: No fake loading anywhere

**Status:** Accepted

**Decision.** Remove every artificial wait found in v3, and treat any new one as a defect:

- the first-visit landing sequence (about 2.9 s);
- the initial loader that waited for React and fonts;
- the Projects page 2 s FETCHING bar and its placeholder stats;
- terminal mail's 1 s pauses before "security verification completed" and "proceeding without verification";
- the command hint's 2 s delay before it appears (the hint itself is Q-07).

Real loading keeps honest indicators: the GitHub navigator while it fetches, mail while it sends, skeletons while badges and SVGs arrive.

**Rationale.** Vivek: fake loading is friction; strict discipline.

### D-025: Cloudflare preview deploys for branch v4

**Status:** Accepted

**Decision.** A workflow deploys pushes to v4 to the existing Pages project as a preview branch (wrangler pages deploy with --branch=v4), giving a stable preview URL for review on a phone. Production still deploys only from main.

**Consequences.** Uses the repo's existing Cloudflare secrets. The preview must not be linked from production pages.

### D-026: Parallel work streams run as subagents

**Status:** Accepted

**Decision.** Independent streams run as subagents, each in its own git worktree or its own repository, with a written brief that names the files it owns, the decisions it must follow and its exit gate. The main session keeps the critical path (M0 then M1), integrates results, and updates this file. Section 15.1 lists the streams.

**Rationale.** Several pieces of work do not touch each other's files: the substrate recipe format, the engine size measurement, the post conversion and the v3 reference captures. Running them side by side shortens the plan without risking conflicts.

**Consequences.** A stream never edits files another stream owns. Results come back as commits on a stream branch and are merged into v4 by the main session after review. Subagents do not push to main and do not merge their own work.

### D-027: Palettes rebuilt as single hue families; the accent leads

**Status:** Proposed (built and on the local server for Vivek's review)

**Decision.** Every palette keeps its v3 name and character but is rebuilt on root's rule: each end is one hue family, with a vivid accent, primary and secondary as dim tints of that hue, and a near-black background with a trace of it. The two ends are neighbouring hues taken from the palette's own v3 colours (fire: orange-red to amber; neon: acid green to chartreuse; cyber: pink to violet). The page's leading colour (--dynamic-dominant-color) is the accent itself, no longer the most saturated of three; the header's haze, second line and lemmings use it too. Root's pair stays exactly as root has it.

**Rationale.** v3 palettes mixed unrelated hues (neon: green, red, orange). Picking one colour from them gave different answers on different surfaces, the wallpaper drawing with the primary, the page and scene with the pick, and the pick flipped as the drift mixed ends whose saturation order differed. With one hue family per end there is nothing to pick, and the drift is a smooth mix of the same slot.

**Consequences.** palettes.ts generates each end from the accent's hue, saturation and lightness. colour.ts no longer derives a dominant colour. Section 11.3's table of literal v3 values is historical.

## 8. Repositories and locations

| Repo      | Role                     | Where work happens                                                     | Notes                                               |
| --------- | ------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------- |
| portfolio | v4 itself                | marchy, ~/Projects/claude.proj/portfolio-v4/portfolio, branch v4      | datacenter copy stays on main until cutover         |
| root      | reference, unchanged     | marchy clone at portfolio-v4/root for reading                          | datacenter copy is one commit behind origin (e6dc7d3) |
| substrate | recipes, palettes (S1)   | datacenter, /mnt/datapool/1/_DataPC/_Devlogs/ujjwalvivek.com/substrate | npm @ujjwalvivek/substrate 2.0.2                    |
| journey   | engine, optional D-014   | marchy, ~/Projects/_Engine/journey                                     | crates journey-engine 1.3.0 and siblings            |

This ADR lives in the portfolio repo as docs/ADR.md on branch v4 and is kept current during development. The portfolio-v4 folder itself is gitignored in devlogs.marchy.

Tools: Zola 0.23.6 and wasm-pack on both machines; bun 1.4.4 and node on both; tsc comes from the repo's devDependency.

## 9. System architecture

### 9.1 Repository layout on branch v4

```text
config.toml              Zola config, highlighting as classes
content/
  _index.md              home
  about.md
  projects.md
  blog/_index.md
  blog/*.md              the 14 posts, converted
data/projects.toml       ProjectsData
templates/
  base.html              shell: head, top bar, footer, wallpaper canvas, router
  index.html about.html projects.html
  blog/list.html blog/post.html
  shortcodes/            note tip warning danger info embed dino math
src/ts/                  TypeScript sources
  shell/                 router, palette drift, wallpaper, audio bridge, shortcuts
  pages/                 one entry per page: home about projects blog post
  features/              terminal-mail github-navigator command-palette pdf-viewer
                         vibe-switch widgets badges langs-bar dino lemmings-legacy
                         easter-egg crash-overlay arrow-pointer tooltips search
  lib/                   colour, echopoint client, storage, dom helpers
static/
  js/                    tsc output, not committed
  css/                   tokens.css base.css and one file per page and feature
  game/                  wasm-pack output, not committed
  vendor/                substrate, pdf.js, highlighter; fetched at build, not committed
  media/                 map tiles and local images
  _redirects _headers
game/                    Rust crate for the header scene (D-013)
tsconfig.json package.json
.github/workflows/       build on every push; deploy only from main
```

### 9.2 Build

```sh
npm ci
npx tsc -p .
(cd game && wasm-pack build --release --target web --out-name game --out-dir ../static/game)
node scripts/vendor.mjs        # substrate, pdf.js, highlighter by pinned version and checksum
zola build
```

scripts/vendor.mjs is the one build script; it runs on Node without dependencies.

### 9.3 Runtime

- base.html renders the shell and the page HTML. It modulepreloads shell/main.js and the page's entry.
- shell/main.js starts the router, palette drift, and, after first paint, the wallpaper. The home entry starts the header game after first paint.
- Each page entry mounts its features. Features below the fold mount when they come within 500 px of the viewport and prefetch when the page is idle, as root does.
- Every mount returns a cleanup. The router runs cleanups before swapping main.

### 9.4 CSS

The 34 CSS modules become plain CSS files, one per page or feature, each scoped by a feature class prefix. tokens.css holds what index.css held, minus light mode. Duplicate keyframe names (11 found) are merged into base.css. The --dynamic-* variables remain the contract between the palette and the design (285 uses of --dynamic-dominant-color-rgb in v3).

## 10. Feature carry-over ledger

| v3 feature                           | v4 fate                                                        | Milestone |
| ------------------------------------ | -------------------------------------------------------------- | --------- |
| Landing sequence                     | Removed (friction)                                             | M0        |
| Initial loader and old Safari screen | Removed; HTML first. Old Safari gets plain pages               | M0        |
| Top bar with breadcrumbs and logo    | Ported                                                         | M0        |
| Footer status bar                    | Ported; light/dark item removed (D-010)                        | M0        |
| Tech stack overlay                   | Ported                                                         | M0        |
| Background on/off toggle             | Ported, one control in the shell and the picker                | M0        |
| Header text with glitch              | Improved: header game (D-012); glitch kept for no-wasm fallback | M1        |
| Lemmings canvas                      | Improved: characters inside the header game                    | M1        |
| Home nav (ReadLogs, About, Projects) | Ported                                                         | M2        |
| Intro terminal text, starship prompt | Ported; age clock and uptime update text nodes, not a tree     | M2        |
| Recent logs                          | Ported, rendered by Zola                                       | M2        |
| Widgets: heatmap, map, cal, clicker  | Ported; clicker keeps the echopoint WebSocket                  | M2        |
| Terminal mail and terminal cat       | Ported, D-019                                                  | M2        |
| Blog list, search, lazy list         | Ported; search runs over a Zola-built index                    | M3        |
| Blog post window chrome, TOC, code copy, lightbox, iframe covers, admonitions, related posts | Ported | M3 |
| Dino game embed in posts             | Ported as a shortcode and module                               | M3        |
| KaTeX                                | Removed; one equation as static markup                         | M3        |
| Projects table, cards, tooltips, filters, status bar | Ported                                        | M4        |
| Projects fake 2 s FETCHING bar       | Removed (D-024)                                                | M4        |
| Notion and PDF overlays on Projects  | Ported                                                         | M4        |
| About hero, intro, stormtrooper      | Ported                                                         | M5        |
| Journey and TinyTS badges            | Ported; img tags for echopoint SVGs                            | M5        |
| Langs bar                            | Ported                                                         | M5        |
| Recent projects                      | Ported; dev/PM selection fixed                                 | M5        |
| Resume bar, arrow pointer, resume PDF viewer | Ported; viewer rebuilt on pdf.js with the same toolbar, page-width default, thumbnails and dark/light document switch | M5 |
| Easter egg terminal and story        | Ported                                                         | M5        |
| Command palette and chords           | Ported; shortcuts replaced by D-023                            | M6        |
| Command hint toast                   | Open (Q-07); its 2 s delay is removed (D-024)                  | M6        |
| GitHub navigator                     | Ported with a lazy highlighter (Q-02)                          | M6        |
| Crash overlay ("run exit")           | Ported                                                         | M6        |
| Wallpaper picker (vibe switch)       | Improved, D-011                                                | M6        |
| Five wallpapers                      | Removed; at most three substrate recipes (D-006, D-007)        | M0, S1    |
| Eleven colour modes (palettes)       | Conserved, each with two ends, plus root's pair (D-020)        | M0        |
| Journey topographic wasm wallpaper   | Removed (D-006)                                                | M0        |
| Capability probe, device tiers       | Removed (D-006)                                                | M0        |
| Light mode and theme toggle          | Removed (D-010)                                                | M0        |
| CalEmbed                             | Removed, dead and broken import                                | M0        |
| /bg-test route                       | Redirects to home and opens the picker                         | M6        |
| PWA manifest and shortcuts           | Ported, light entries removed                                  | M8        |

## 11. Wallpaper, recipe and palette contract

### 11.1 Recipe format (lands in substrate, S1)

```json
{
  "recipe": 1,
  "name": "root",
  "layers": [
    { "name": "digital-rain", "opacity": 1, "speed": 0.03, "density": 3,
      "params": { "cellSize": 20, "trailLength": 10, "glyphDensity": 0.6, "flicker": 15 } }
  ]
}
```

recipe is the format version. layers are bottom to top, as in root's background.js. Substrate validates names against its primitives and params against each primitive's descriptor, and converts to a scene. Root's current six-layer stack becomes the recipe named root.

### 11.2 Recipes in v4

At most three. Recipe one is root. The other two are composed in the playground and reviewed on screen in S1. Each is judged as a composition of layers, not as a single primitive.

### 11.3 Palettes

A palette is { name, a: {primary, secondary, accent, background}, b: {...} }, defined in the portfolio (D-020). Background is #0a0a0a at both ends unless a pair is retuned.

| Palette   | End A (v3 dark set)               | End B (v3 light set)              |
| --------- | --------------------------------- | --------------------------------- |
| cyber     | #ff0080 #8000ff #00ffff           | #d63384 #6f42c1 #0dcaf0           |
| ocean     | #00aaff #0066aa #00ffff           | #0d6efd #0a58ca #17a2b8           |
| fire      | #ff4500 #ff6600 #ffff00           | #fd7e14 #dc3545 #ffc107           |
| spark     | #00ff41 #0080ff #ff4500           | #28a745 #007bff #fd7e14           |
| forest    | #90ee90 #8fbc8f #f0e68c           | #6b8e23 #9acd32 #deb887           |
| synthwave | #ff6ec7 #7209b7 #00f5ff           | #e91e63 #9c27b0 #00bcd4           |
| sunset    | #ff6b35 #f7931e #ffcd3c           | #ff5722 #ff9800 #ffc107           |
| midnight  | #1e3a8a #3730a3 #6366f1           | #1565c0 #1976d2 #42a5f5           |
| aurora    | #10b981 #06b6d4 #8b5cf6           | #059669 #0891b2 #7c3aed           |
| neon      | #39ff14 #ff073a #ff9f00           | #4caf50 #f44336 #ff9800           |
| root      | root warm: #404040 #808080 #ffaa00, bg #030303 | root dusk: #3d3752 #7f78a0 #b794ff, bg #040309 |
| custom    | the chosen colour, as v3 (colour, colour at 50%, colour at 38%) | the same hue at lower lightness, derived |

Colours are primary, secondary, accent. Values are copied from v3 ColorUtils.getThemeColors and root's background.js. Which palette is the default for a first visit is decided on screen in M0; v3 defaulted to custom #d63031.

### 11.4 Drift

The page holds t between 0 and 1 and moves it slowly back and forth (period to be tuned in M0, root's drift is the reference feel). Each step mixes a and b, calls substrate's setPalette, sends the colours to the header game, and, at most every 100 ms and not while scrolling, writes the CSS variables. Reduced motion holds t at 0.

### 11.5 CSS variables

From the mixed palette, one colour module computes what v3's ColorUtils computed: --dynamic-dominant-color (most saturated of primary, secondary and accent), --dynamic-hsl-average, --dynamic-rgb-average, each with an -rgb variant. Names stay, so ported CSS needs no rewrite.

## 12. Header game specification

- **Frame.** The header box holds a canvas in root's cornered frame, with a reserved height so the page does not move.
- **HTML first.** The h1 and h2 ("TECH ISN'T THE HARD PART", "SYSTEMS, BEHAVIOUR, & QUESTIONS ARE") are real text, styled with v3's glitch. Once the game's first frame is drawn, the text is hidden visually but kept for screen readers and search.
- **Text as dots.** The text assembles from glowing pixel dots, as root's wordmark does. Root's font has 21 glyphs; the header needs a full uppercase set plus apostrophe, comma and ampersand. Line breaks follow the canvas aspect so phones get more, shorter lines.
- **Lemmings.** v3's two blockers and four walkers, using the 10 by 10 sprites and frames already in Lemming.js, become actors in the scene. Proposed behaviour, to be tuned in review: walkers walk along the ground and the tops of letters, blockers turn walkers around, a walker that hits a letter knocks dots loose and they drift back into place.
- **Palette.** An exported function receives the current palette colours each drift step (D-009).
- **Lifecycle.** Exported pause and resume; the router pauses the scene when home is not shown. The canvas is hidden, never removed, because removing a wgpu canvas kills its surface.
- **Reduced motion.** The text assembles once and the actors stand still.
- **Fallback.** Without wasm or a graphics context, the HTML header stays, glitch included.
- **Audio.** Root's AudioEngine comes with the copy (D-021).
- **Size.** Measured at M1 and recorded in section 19. D-014 is the lever.

## 13. URL compatibility

| v3 URL                      | v4                                                    |
| --------------------------- | ----------------------------------------------------- |
| /                           | /                                                     |
| /about                      | /about/ (Zola), /about redirects                      |
| /projects                   | /projects/                                            |
| /blog                       | /blog/                                                |
| /blog/<file>.md             | 301 to the post's Zola path; path keeps the file stem |
| /bg-test                    | 301 to /?vibe                                         |
| /posts/meta.json            | kept as a Zola-generated JSON for external readers    |
| /games/dino-blink.html      | kept as a static file                                 |
| /media/*                    | kept                                                  |

## 14. Validation and budgets

### 14.1 Budgets (Proposed, confirmed at M0)

| Measure                                     | Budget                                   |
| ------------------------------------------- | ---------------------------------------- |
| Own JS on any page before interaction       | 30 KB gzip                               |
| CSS on any page                             | 30 KB gzip                               |
| substrate                                   | its own size, about 46 KB gzip, after first paint |
| Header game wasm                            | recorded at M1; target set after D-014 evidence |
| Layout shift from late content              | none visible; skeletons hold final size  |
| Text visible without waiting on fonts or JS | always                                   |

### 14.2 Checks per milestone

- Build: tsc with no errors, zola build with no warnings, wasm-pack release build.
- Sizes: a script prints gzip sizes per page and fails above budget.
- Links: every v3 URL in section 13 checked against the built site.
- Browsers: Helium (WebGPU) and Zen (no WebGPU on Linux) on marchy, plus a phone.
- Review: Vivek sees the page on screen before a page milestone closes.

## 15. Milestone plan

### 15.1 Work streams (D-026)

| Stream | Owner         | Work                                                                 | Owns                                   | Starts            | Exit gate                                      |
| ------ | ------------- | -------------------------------------------------------------------- | -------------------------------------- | ----------------- | ---------------------------------------------- |
| A      | main session  | M0, M1, then M2 onward; integration; this ADR                         | everything not owned below             | now               | per milestone                                  |
| B      | subagent      | S1: recipe format, validator, two new recipes, playground copy recipe | substrate repo, branch recipes         | now               | recipes reviewed on screen by Vivek; release   |
| C      | subagent      | engine size evidence for D-014: build root's game, size breakdown by crate | report only; no code changes        | now               | written breakdown added to section 19          |
| D      | subagent      | convert the 14 posts to Zola syntax with the shortcode names in 9.1   | content/blog on branch v4-posts        | now               | every post builds; diff list of changed markup |
| E      | subagent      | v3 reference captures: every page and post, desktop and phone widths  | portfolio-v4/v3-reference, outside git (199 MB) | done 2026-11-18 | 18 routes, desktop and phone PNG plus DOM; INDEX.md |
| F      | subagent      | self-contained features once M0's mount contract exists: PDF viewer on pdf.js, GitHub navigator | src/ts/features/<feature> on its own branch | after M0 | feature mounts in the shell; parity review     |

Streams work in their own worktree (portfolio-v4/wt-<stream>) or their own repository, on their own branch. The main session merges a stream into v4 after review. A stream that needs a decision stops and reports instead of deciding.

### M0: Foundation

**Status:** Not started

Work: Zola skeleton, tsconfig and package.json (TypeScript only), tokens.css from index.css without light mode, base.html shell with top bar, footer and tech stack overlay, router (D-005), palette drift with all twelve palettes (D-020), substrate wallpaper with root's stack as a temporary local recipe, CSS backdrop fallback, vendor script, keymap module (D-023), CI that builds on every push, deploys previews from v4 (D-025) and production only from main.

Exit gates: the shell renders on Helium with the wallpaper and on Zen with the backdrop; navigating between empty pages keeps the wallpaper running without a flash; every palette reviewed on screen with drift on; the preview URL works on a phone; budgets for the shell pass.

### M1: Home header game

**Status:** Not started

Work: copy root/game into game/, extend the font, lay out the header text by aspect, add the lemmings as actors, palette input, pause and resume, reduced motion, HTML fallback.

Exit gates: Vivek accepts the header on screen in Helium and Zen and on a phone; wasm size recorded; the page does not move when the game arrives.

### M2: Rest of home

Home nav, intro terminal text, recent logs, widgets (heatmap, map, cal, clicker), terminal mail. Exit: parity review against v3 home, minus the removed rows.

### M3: Blog

Convert the 14 posts, shortcodes, highlighting theme, TOC, code copy, lightbox, iframe covers, dino embed, equation, related posts, list with search and lazy loading, meta.json, redirects. Exit: every post reviewed against v3 rendering; URLs resolve.

### M4: Projects

data/projects.toml, table and cards, tooltips, filters, Notion and PDF overlays. No FETCHING bar (D-024). Exit: parity review.

### M5: About

Hero, intro, stormtrooper, badges, langs bar, recent projects, resume bar, arrow pointer, pdf.js viewer, easter egg terminal. Exit: parity review; PDF viewer accepted on screen.

### M6: Global features

Command palette and chords, command hint, GitHub navigator, crash overlay, vibe switch with recipes, palettes, sliders and paste. Exit: every shortcut works from every page; pasted recipes are validated and saved.

### S1: Substrate recipes (substrate repo, parallel from M1)

Recipe format and validator, named recipes (root plus two), playground "copy recipe", release 2.1.0. Then the portfolio switches from its temporary local recipe to the named ones. Palettes stay in the portfolio (D-020). Root is untouched.

### J1: journey-engine features (journey repo, optional, after M1)

Only if D-014 is accepted on the M1 size evidence. Features, release, rebuild the header game, record the new size.

### M7: Hardening

Budgets on every page, accessibility pass (keyboard, focus, reduced motion, screen reader on the header), CSP without unsafe-inline where possible and without localhost, cross-browser pass.

### M8: Cutover

Merge v4 into main, deploy, verify live, tag v4.0.0, update the root list and ProjectsData entry dev-12, write the devlog post.

## 16. Risks and mitigations

| ID   | Risk                                                        | Mitigation                                                                 |
| ---- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| R-01 | Header game wasm is about 2 MB gzip on every home visit      | Load after first paint, HTML header first, measure at M1, D-014            |
| R-02 | Substrate (WebGPU) and the game (wgpu) on one page           | Root already runs both on Helium; test Zen where the game takes the WebGL2 path |
| R-03 | Soft navigation leaks listeners or state between pages      | mount and cleanup contract; a leak check that navigates in a loop          |
| R-04 | Behaviour lost in the rewrite                                | section 10 ledger is the checklist; parity review per page                 |
| R-05 | Zola grammars missing nasm, C# or the terminalblock fence    | check in M3; add sublime-syntax files or keep plain blocks                 |
| R-06 | Post conversion changes rendering                           | review every post against v3 before M3 closes                              |
| R-07 | Recipe format churn in substrate                            | version field from day one; validator rejects unknown versions             |
| R-08 | Drift writes to CSS cause jank                               | throttle to 100 ms, skip while scrolling, as root does                     |
| R-09 | Datacenter copies drift from GitHub                          | work from GitHub remotes; pull on datacenter before touching it            |

## 17. Open questions

| ID   | Question                                                                 | Needed by |
| ---- | ------------------------------------------------------------------------ | --------- |
| Q-01 | Answered 2026-11-18: palettes stay local, all conserved (D-020)         | closed    |
| Q-02 | Which syntax highlighter for the GitHub navigator (small Prism core with a few languages, or another)? | M6 |
| Q-03 | Answered 2026-11-18: yes, preview deploys for v4 (D-025)                  | closed    |
| Q-04 | Answered 2026-11-18: ADR moved to docs/ADR.md now                         | closed    |
| Q-05 | Answered 2026-11-18: all fake loading goes (D-024)                        | closed    |
| Q-06 | Answered 2026-11-18: one sane layout (D-023)                              | closed    |
| Q-07 | Keep the first-visit command hint toast, now shown without a delay?       | M6        |
| Q-08 | Exact header wording and line breaks on phones                           | M1 |

## 18. Rejected alternatives

- **Fully TypeScript build with an npm markdown library.** Rejected for Zola: one binary already used by root, no npm dependency tree for content.
- **Keep React and split chunks.** Rejected: smaller first load, but the framework, the client markdown stack and the polyfills would stay.
- **Separate pages without soft navigation.** Rejected: the wallpaper and header game would restart on every click (D-005).
- **CPU wallpaper fallback.** Rejected: too heavy to be a good experience (D-008).
- **Root nested inside the portfolio repo to share code.** Rejected: sharing happens through a published crate (D-013).
- **Game sky drives the site palette, as on root.** Rejected: the page owns the palette (D-009).

## 19. Chronological decision log

- 2026-11-18: v3 measured (section 2). Local working copy agreed; portfolio and root cloned to portfolio-v4, branch v4 created in the portfolio clone, nothing pushed.
- 2026-11-18: Vivek: markdown may be a dependency, Zola is fine, zero is not strict. Fun and legacy features stay; incrementally built features stay or improve. Landing sequence goes. D-002, D-004, D-018.
- 2026-11-18: Vivek: substrate succeeds the background engine; the portfolio becomes a consumer like root; at most three composed wallpapers, root's first; the CPU wallpapers stay in substrate as legacy; light/dark may go if the wallpapers give no clear path. D-006, D-007, D-008, D-010.
- 2026-11-18: Vivek: header box becomes a game like root's, text as glowing pixels, lemmings as characters; recipes live in substrate; palettes stay with drift between their two ends, not the game's sky; root and portfolio stay separate repos; port page by page with the header first. D-009, D-012, D-013, D-017.
- 2026-11-18: Found that substrate's playground has no recipe export; the format is defined in S1.
- 2026-11-18: Vivek: conserve every v3 palette, palettes stay local (D-020); preview deploys yes (D-025); all fake loading goes (D-024); one sane keyboard layout (D-023); docs move into the repo now; parallel streams as subagents (D-026). ADR moved to docs/ADR.md on branch v4.
- 2026-11-18: M0 built and deployed to the v4 preview: Zola 0.23.6 shell, TypeScript 7.0.2 (tsc, only devDependency), 12 palettes with drift, soft navigation with view transitions, substrate 2.0.2 vendored with root's stack, CSS backdrop fallback, keymap, vibe switch (M0 cut), tech stack overlay, CI with preview deploys. Shell per page: 11 KB JS, 4.5 KB CSS gzip.
- 2026-11-18: Stream B done: substrate recipe format v1, validator, recipeToScene, recipes export (root plus candidates nebula and signal, not yet seen on screen), playground copy recipe, version 2.1.0 on branch recipes; not tagged or published. The playground still pins substrate 2.0.1, so the candidates need that pin raised before review there.
- 2026-11-18: Stream D done and merged (see D-002 amendment). Stream C done (see D-014 evidence).
- 2026-11-18: M1 first cut on preview: header scene copied from root, full uppercase font, palette fed from the page, lemmings as actors. Vivek's first review: lemmings must drop through gaps between words and keep the middle occupied; fixed with one ledge per word, edge turns on the ground, timed re-drops onto words weighted by width, six lemmings. wgpu panics when navigator.gpu exists without an adapter; the page now hides WebGPU from the engine in that case so it uses WebGL2.
- 2026-11-18: Stream E done: 18 routes captured (desktop, phone, DOM) plus the landing sequence, 57 files, 199 MB, kept outside git. Found on the live v3 site: log_0010 links a devhub screenshot (github blob URL, shot-2.webp) that does not load; fix in M3.
- 2026-11-18: J1 done. Vivek approved 0.81 MB and a release. journey-engine 1.4.0 published: optional egui, audio and image features, GameApp::scene hook, engine::set_paused for the web, WebGL2 fallback when WebGPU has no adapter, lints and formatting for Rust 1.100 (the first tag failed CI on rustfmt 1.100 and was moved; nothing had published). Header game on 1.4.0 with default-features off: 2,115,662 bytes, 823,561 gzip (was 4.2 MB, 1.93 MB). Lemmings now crumble into pixel dust when they vanish and drop back in once it settles. Footer separators removed (Vivek). Drift sync checked: wallpaper and scene get the same colours from one clock each frame; the game leans on the accent, the root stack on primary and secondary, so the game's change reads stronger. Vivek: keep as is.
- 2026-11-18: Vivek accepted M1 (and the shell). Follow-ups shipped: a poof now knocks nearby lemmings up and away and jolts nearby letters, which spring back; lemmings fall at their own random heights, drift and weight, with a new random seed per visit; the scene's haze and fog follow the palette's dominant colour (they used the accent at low strength, so palette changes barely showed and fire read olive); reduced motion gets the full haze.
- 2026-11-18: Haze mismatch on neon (Vivek): the dominant pick flipped on near-ties (three fully saturated colours) and the haze used it while the wallpaper draws mostly with the primary. Dominant now needs a 6-point saturation margin to switch; the haze follows the primary when it has colour and the accent when it is grey, blended continuously. Checked on neon, fire and root.
- 2026-11-18: Vivek: picking one colour still looks wrong on neon; better palettes are fine. D-027 proposed and built: one hue family per end, accent leads everywhere. Checked headless on neon and cyber and in the vibe switch.
- 2026-11-18: Vivek: no rounded corners anywhere (principle 9). Vibe switch now uses v3's palette swatches and its ON/OFF lettered switch.
- 2026-11-18: Vivek: adhere to the design systems (principle 10). Shell brought in line: 2px solid dominant focus, keycap style, no depth shadows, active and inert borders, meta-label case. Header frame's bottom brackets now sit on the dashed border like the top pair (they were clipped inside it).
- 2026-11-19: M2 built: nav, intro (starship shades via CSS relative colours, word glow, age version), recent logs rendered by Zola, widgets (stream, 8132f1a) and terminal mail (stream, 8c2f74d) as lazy features with held heights (widgets square cards: (W-3rem)/4, W, 4W+3rem by breakpoint; mail 420px at every width). Fixes from Vivek's review: autoscroll to the bottom (engine focused its canvas), a 150px gap at the top (the inline icon SVG laid out), heatmap month labels clipped (echopoint tight mode), widget footer icons off-centre. Awaiting Vivek's review of M2.
- 2026-11-19: M2 accepted by Vivek after fixes: the heatmap is drawn from echopoint's summary data as cells, root's way, so it follows the palette and drift with no image refetch; terminal mail has a full solid frame; intro highlights take the dominant colour. M3 started as two streams: blog list (wt-bloglist, branch v4-bloglist) and post page (wt-post, branch v4-post).
