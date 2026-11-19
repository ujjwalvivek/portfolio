# Budgets and checks

The budgets are in docs/ADR.md section 14. These scripts check them, all after a build, all without dependencies.

## In CI

sizes.mjs prints gzip sizes for every built page and exits 1 when a page has more than 30 KB of its own JS before interaction or more than 30 KB of CSS. JS before interaction is the module graph from the module script, the modulepreload links and the page modules on main's data-modules, following static imports and export-from. CSS is the page's stylesheet links: tokens, base and the page's own. Lazy JS and CSS (dynamic imports, data-lazy sections, stylesheets added from JS), preloaded fonts, vendor files and the game are printed but not counted. Pages with the same assets share one row; --all prints every page. The import regex has a self-test that runs first.

```
npm run sizes
```

check-urls.mjs resolves every v3 URL against public/ the way Cloudflare Pages does: _redirects first, then static files with Pages' trailing-slash and .html handling. A URL that 404s fails the check. Known gaps (listed in the script, with the reason) are printed as GAP and fail only with --strict, which CI passes on main, so they cannot reach production. URLs that are meant to be gone are printed as GONE. --git compares the script's list with git main's public/ and meta.json.

```
npm run check:urls
npm run check:urls -- --strict --git
```

## Local only

These drive a headless Chromium-based browser (Helium, Chromium or Chrome, or $BROWSER) over the DevTools protocol, and serve public/ themselves.

check-leaks.mjs soft-navigates home, about, blog, a post, projects and home again by clicking links, ten rounds by default. After each round it prints the JS heap after GC, DOM nodes, JS event listeners, detached nodes, listeners on window and document, and running animations. A second, instrumented pass lists every listener on long-lived targets, interval, pending timeout and observer by the file and line that created it, and names the call sites that grow between round 2 and the last. --heap adds a heap snapshot diff by constructor, --list prints every live call site. It exits 1 if a call site, the listener count or detached nodes grow.

```
npm run check:leaks
npm run check:leaks -- 25 --heap
```

check-drift.mjs counts style.setProperty calls on html on a long post: 3 s at rest, then 3 s of scrolling. It passes when writes at rest are at least 100 ms apart by frame time and none land while the page scrolls.

```
npm run check:drift
```
