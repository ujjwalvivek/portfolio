![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=Cloudflare&rightText=Workers&badgeColor=ff7b00) ![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=Javascript&badgeColor=003780&logo=javascript) ![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=Cloudflare&rightText=KV&badgeColor=ff7b00) ![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=CSS&badgeColor=9e0000&logo=css)

Echopoint is a telemetry aggregation service and dynamic SVG generation engine. It runs on the edge using Cloudflare Workers and provides a docs/dashboard for managing and previewing the generated assets.

## Quick Start: Using the SVGs

Echopoint generates dynamic SVGs on the fly via URL parameters. This is perfect for embedding real-time statistics and custom badges into GitHub READMEs, personal websites, or Notion pages.

You can use the live SVG builder at **[echopoint.ujjwalvivek.com](https://echopoint.ujjwalvivek.com)** to visually configure, preview, and copy the markdown for any endpoint.

### Example 1: A Custom Badge

Simply use markdown image syntax to embed a badge:

```markdown
![Custom Badge](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=Hello&rightText=World&badgeColor=ff7b00)
```

### Example 2: A GitHub Contribution Calendar

```markdown
![GitHub Calendar](https://echopoint.ujjwalvivek.com/svg/calendar?level0=1e1e2e&level1=cba6f7&level2=f38ba8&level3=fab387&level4=a6e3a1)
```

Just drop these URLs into any `<img>` tag or markdown file!

## What does it have?

- **Worker (`/src`):** A Cloudflare Worker that aggregates data from various sources (GitHub, npm, Crates.io, Docker Hub), caches it in a Cloudflare KV store via cron triggers, and exposes REST endpoints. It also contains the SVG generation engine (`/svg/*`) to render dynamic, customizable badges, GitHub contribution calendars, commit streaks, and language bars on the fly.
- **Dashboard (`/dashboard`):** A zero-dep SPA. It serves as interactive documentation, a live viewer for the aggregated KV store data, and a real-time playground to visually configure and preview the SVG endpoints.
- **Edge-Cached Telemetry:** Automatically fetches and caches stats from GitHub (contributions, repos, commits), npm (downloads, versions), Crates.io, and Docker Hub, ensuring zero-latency loads and eliminating rate limits.
- **Dynamic SVGs:** Generates fully customizable SVG badges and cards directly on the edge. Supports extensive parameterization for colors, text, layouts, and icons.
- **Unified Dashboard:** Contains an mdbook-style API reference, a live SVG builder with real-time preview, and a visual dump of all stored telemetry data.
- **Theming System:** The dashboard features multiple built-in color palettes (based on Catppuccin and Monochrome) alongside a procedural HSL dark-mode theme generator.

---

## Run Locally (2 Minutes)

If you want to run the backend engine or dashboard yourself:

### Prerequisites

```bash
- Node.js (v22+)
- Local Cloudflare Worker setup (Wrangler context)
```

### Running the Worker (Backend)

The worker manages the data aggregation and API endpoints.

```bash
npm install
npm run dev
npm run deploy
```

### Running the Dashboard (Frontend)

The dashboard is a separate frontend project located in the `dashboard/` directory.

```bash
cd dashboard
npm install
npm run dev
npm run build
```

## Environment Variables

The worker requires specific environment variables and secrets (like GitHub access tokens) to fetch data from external APIs. These are configured via `wrangler secret put` for sensitive keys. The dashboard uses `VITE_ECHOPOINT_URL` to point to the active worker URL.
