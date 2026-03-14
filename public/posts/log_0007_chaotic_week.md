---
title: "The Week I Pushed 140 Files To Main"
date: 2026-03-07
summary: "How  chaotic refactor led to a much cleaner architecture, and why sometimes you just have to push through the fear of breaking everything."
slug: log_0007_chaotic_week
---

<!-- markdownlint-disable MD001 MD034 MD024 MD051 MD007 MD027 MD032 MD022 MD012-->

:::warning
This update wasn’t planned to be big

I just wanted to clean up some of the internal architecture and maybe add a few features.
:::

At some point I was about ten files deep into refactoring when I suddenly realized something **terrifying**:

I was working **directly on `main`**.

No branch. No safety net.

I kept telling myself, one more file and I’ll commit… or fork… or branch.

That ...never happened.

By the time I stopped, the patch had grown to roughly:

```bash
140 files changed
~15k insertions
~5k deletions
```

It was nerve-wracking the whole time because I’ve already made this mistake before.

**Version 2.0** ended up stuck on `main` with almost **200 changed files**, which basically killed my momentum on the project for months.

This time I was determined not to let that happen again.

It was chaotic, but honestly enjoyable. The site was slowly reshaping itself as I worked through it.

## Why Such Madness?

Well, tbh over time my portfolio stopped being just a portfolio.

It slowly became a place where my projects expose **live telemetry** about themselves.

Something like download counts, commit streaks, language breakdowns, or really any small signals that show how a project is actually evolving.

It was challenging. At one point I almost gave up and just used **shields.io**.

It would have been the easy solution.

But I was curious how far I could push the telemetry idea myself. I already had the JSON data pipeline working, and that curiosity eventually turned into Echopoint.

### What's Echopoint?

Originally Echopoint was just a small `API telemetry aggregation service` returning JSON.

But JSON turned out to be the wrong abstract. And I didn’t want to build a frontend dashboard to visualize it.

:::warning
Spoiler Alert

I still did. Just not in the traditional way.
:::

What I really wanted were **embeddable artifacts**. Something that could be dropped into a README, a dashboard, or another page without writing frontend code.

Once SVG rendering entered the picture, it clicked.

Instead of returning data and expecting something else to render it, Echopoint could simply **produce the final artifact**.

That turned out to be a much cleaner model.

```bash
GitHub / NPM / Docker APIs
        │
        ▼
Cron Workers (every 2h)
fetch → normalize → store in KV
        │
        ▼
Edge API
extremely fast KV lookups
        │
        ▼
SVG Renderer
generates embeddable artifacts
```

So Echopoint slowly turned into an **SVG generation engine**.

It runs on a `free tier` of **Cloudflare Workers** and renders things like:

* GitHub contribution calendars
* language distribution bars
* commit streak badges
* project telemetry widgets

External data from GitHub, NPM and Docker Hub is cached in KV via cron jobs so requests stay fast.

Once the output became SVG, everything suddenly made sense. The same endpoints can power the site, README badges, or anything really.

## Terminal Experiments

Around the same time I had been building terminal interfaces for other tools.

The [Rust Engine](https://github.com/ujjwalvivek/journey), **Journey**,  includes a release automation tool that uses a small TUI written in Go, and that experience made me optimistic about trying the same approach on the site.

Those experiments became **TerminalMail v2**, and later **GitHub Navigator v2**.

> Terminal interfaces are surprisingly expressive when you lean into them instead of treating them like gimmicks.

## Where things stand now

After this patch the project finally feels like it can **breathe again**.

Most of the architecture is now organized the way I wanted it to be:

* page components split into proper modules
* telemetry systems consolidated
* Echopoint powering project badges
* TerminalMail, GitHubNavigator refactored
* various internal utilities cleaned up

And, here's the Dashboard: https://echopoint.ujjwalvivek.com

![SVG Generator](https://cdn.ujjwalvivek.com/posts/media/echopoint_gen.webp)

![API Overview](https://cdn.ujjwalvivek.com/posts/media/echopoint_api.webp)

## Future plans

Interestingly, Echopoint ended up sharing the same design philosophy as some of my other projects like Synclippy and Journey.

Small systems that expose useful signals or artifacts rather than hiding everything behind heavy interfaces. And honestly, those are the kinds of systems I enjoy building.

Nothing is ever really finished, but this version feels like a good place for the project to be.

> Happy that I'll get some good sleep tonight :)


