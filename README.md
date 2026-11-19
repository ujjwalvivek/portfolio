# TECH ISN'T THE HARD PART. <br> Systems, behaviour, and questions are.

![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=TypeScript&badgeColor=003780&logo=typescript) ![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=Rust&badgeColor=9e0000&logo=rust) ![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=Zola&badgeColor=006275&textColor=ffffff) ![Echopoint SVG](https://echopoint.ujjwalvivek.com/svg/badges/custom?leftText=WebGPU&badgeColor=9d00d6&textColor=ffffff)

Welcome, wanderer.

You’ve booted into a personal portfolio rendered as an interactive terminal and a markdown blog.  
Not just a portfolio. I like to call it an `experiment playground` rather.  

I build, break, and rebuild systems, across code, teams, and products.  
This is where I log those experiments, the questions they raise, and the answers they sometimes yield.

## Why this exists

- Capture design & engineering experiments as readable artifacts.
- Surface failures, fixes and small wins in a format that’s easy to iterate on.
- Give other builders practical, remixable patterns (`procedural wallpapers`, `pixel headers`, `keyboard-first UX`, `no-bundler TypeScript`).

## Quick facts (TL;DR)

- **Stack:** Zola for the pages, plain TypeScript compiled file by file (no bundler, no runtime dependencies)
- **Header:** a small game in Rust on my [Journey](https://github.com/ujjwalvivek/journey) engine, wasm and WebGPU with a WebGL2 fallback
- **Wallpaper:** [Substrate](https://github.com/ujjwalvivek/substrate) recipes, seven palettes that drift, a moods key to shuffle them
- **Primary UX:** command palette, keyboard shortcuts, GitHub explorer, terminal mail, an easter egg or two
- **Content:** markdown posts in `content/blog`, projects in `data/projects.toml`
- **Checks:** page budgets, v3 URL compatibility, a leak test and a drift test; a strict CSP with no inline code
- **Privacy:** no analytics, no popups
- **Docs:** decisions in [docs/ADR.md](docs/ADR.md), budgets in [docs/BUDGETS.md](docs/BUDGETS.md), the policy in [docs/CSP.md](docs/CSP.md)

How v4 compares with v3, in numbers: [Portfolio v4: 17 MB Down to 1.6 MB](https://ujjwalvivek.com/blog/log_0011_portfolio_v4/).

## Running Locally

Needs Node 22, [Zola 0.23.6](https://www.getzola.org/), and for the header game Rust with the `wasm32-unknown-unknown` target and wasm-pack.

```sh
git clone https://github.com/ujjwalvivek/portfolio.git
cd portfolio
npm ci
(cd game && wasm-pack build --release --target web --out-name game --out-dir ../static/game)
npm run build
zola serve
```

While working on the TypeScript, run `npm run ts:watch` next to `zola serve`. `npm run sizes` and `npm run check:urls` are the same checks CI runs before it deploys.

## Contributing

This is a personal log. PRs accepted selectively.

If you find a bug, open an issue with steps to reproduce. For small fixes, fork → branch → PR with a focused description and screenshots where applicable.

Or, just come say hi: [Mail Me!](mailto:hello@ujjwalvivek.com)

## License

MIT License `Do what you want, credit appreciated`

---

Happy building.

`v4.0.0 update`
