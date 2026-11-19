+++
title = "Portfolio v4: 17 MB Down to 1.6 MB, Every Toy Kept"
date = 2026-11-19
description = "Rewriting this site from React to Zola and plain TypeScript, with the numbers before and after. Most of the weight was fonts, the rest was React, and the header game and wallpaper now run on my own two engines."

[taxonomies]
tags = ["Zola", "TypeScript", "Performance", "Rust", "WebGPU", "Postmortem"]

[extra]
id = 16
thumbnail = "https://cdn.ujjwalvivek.com/posts/media/log_0011_thumb.webp"
+++

<!-- markdownlint-disable MD013 MD033-->

{% <note title="The short version"> %}
A fresh visit to the home page used to download 17.4 MB. It now downloads 1.6 MB. The largest paint went from 2.9 s to 0.26 s. Nothing fun was removed on the way.
{% </note> %}

<img src="https://cdn.ujjwalvivek.com/posts/media/log_0011_header.webp" alt="The header game on the home page in the root palette: the line Tech isn't the hard part, systems, behaviour and questions are, drawn in pixel letters over a starfield in amber, with small pixel figures standing on the ground below.">

v3 of this site was a React app. It worked, and it had everything I wanted on it: a terminal intro, a procedural wallpaper, a dino game in a post, a GitHub explorer, a crash screen, stormtroopers moonwalking across the about page. It also shipped 819 KB of JavaScript to every page, rendered nothing until React had booted, and had 1,995 packages in its lockfile.

v4 is the same site rebuilt on Zola with plain TypeScript, compiled file by file with no bundler. The pages arrive as finished HTML. Each feature is a small module that mounts when it is needed and cleans up after itself.

## How it was built

The whole rewrite ran off one living ADR in the repo, the same way as the [DevHub port](/blog/log_0010_gpui_experiment/). Every decision, budget, risk and milestone is written down there, with a dated log line each time something changed.

The building was done by Claude Code, in parallel streams on separate git worktrees: blog, projects, about, the command palette, the vibe switch, accessibility, CSP. I reviewed every stream on screen and sent most of them back at least once. The review was the real work. Agents kept removing the fun parts (the traffic lights on the crash screen, the egg terminal's motion) or adding cheerful copy I had to strip out again.

## The numbers

Measured on 2026-11-19 from this machine: three fresh-cache loads of each page, medians, Chromium at 1440 by 900. v3 was the live site, v4 its preview deploy, before the last round of design changes.

### Page weight, fresh visit

| Page | v3 | v4 |
| ---- | -- | -- |
| Home | 17,362 KB | 1,583 KB |
| About | 39,221 KB | 859 KB |
| Blog | 14,737 KB | 969 KB |
| Projects | 13,131 KB | 712 KB |
| A post | 14,523 KB | 758 KB |

### Paint and stability

| Page | First paint v3 / v4 | Largest paint v3 / v4 | Layout shift v3 / v4 |
| ---- | ------------------- | --------------------- | -------------------- |
| Home | 860 / 256 ms | 2,872 / 256 ms | 0.036 / 0.001 |
| About | 692 / 364 ms | 2,360 / 364 ms | 0.005 / 0.001 |
| Blog | 748 / 376 ms | 2,920 / 376 ms | **0.31** / 0.004 |
| Projects | 756 / 368 ms | 2,700 / 368 ms | 0.005 / 0.005 |
| A post | 788 / 372 ms | 1,956 / 480 ms | **0.31** / 0 |

Long tasks on the main thread, measured in a real window on my GPU, dropped from 330 to 740 ms per page on v3 to between 0 and 70 ms on v4.

### The code

| | v3 | v4 |
| - | -- | -- |
| Runtime dependencies | 40 | 0 |
| Packages in the lockfile | 1,995 | 21 |
| App code | 13,281 lines of JS | 8,492 lines of TS, 1,133 of Rust |
| CSS | 13,375 lines | 5,088 lines |
| JS before interaction | 819 KB on every page | 16 to 27 KB gzip, budgeted |

## Where the weight actually was

I expected React to be the villain. It was not, mostly.

{% <warning title="About 90% of the savings was fonts"> %}
v3 served the full JetBrains Mono and Monaspace files from the CDN: 12 to 14 MB on every fresh visit. Subsetting them to the glyphs the site uses, and serving them from the site itself, took that to about 600 KB.
{% </warning> %}

That fix alone would have taken v3 down to 1 to 3 MB. I want to be honest about it, because "rewrite made it 10x lighter" is the kind of claim that hides where the gain came from. The rewrite's own share is everything else:

- JavaScript from 819 KB to under 100 KB per page.
- The about page fetched 25.6 MB of SVG badges from my own echopoint service. v4 asks echopoint for 22 KB of JSON and draws the badges in the page's own type and colours.
- The largest paint lands with the first paint, because the HTML is already the page.
- The blog and post pages stopped jumping around while they loaded.
- JS memory on most pages went from 14 to 59 MB down to 2 to 4 MB.

One number went the other way. With the header game running on the GPU, the home page holds 43 MB of JS memory against v3's 19 MB. That is the game's wasm memory and GPU buffers. A leak test that walks the site 25 times through the soft router keeps the heap flat, so it is cost, not a leak.

## Both engines are mine now

The header is a small game written in Rust on [Journey](https://github.com/ujjwalvivek/journey), compiled to wasm and drawn with WebGPU, with a WebGL2 fallback. The wallpaper behind every page is [Substrate](https://github.com/ujjwalvivek/substrate), my procedural graphics engine. For v4 I added a recipe format to it and published it as 2.1.0, so the wallpaper is a recipe and the site only picks one.

The moods key in the status bar shuffles through every pairing of the two wallpapers and seven palettes. Shift V opens the full settings.

## What stayed

Every toy from v3 is still here: the crash screen with its traffic lights, the easter egg terminal, the stormtroopers, the dino, the GitHub explorer (now reading this repo through echopoint), the command palette, the music. Every v3 URL still resolves or redirects, and a check in CI fails the deploy if one stops.

There is also a strict content security policy now, with no inline scripts or styles anywhere, which v3 could not have had.
