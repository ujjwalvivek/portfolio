# TECH ISN'T THE HARD PART. Systems, behaviour, and questions are.

Welcome, wanderer.

You’ve booted into a personal portfolio rendered as an interactive terminal and a markdown blog.  
This isn’t just a portfolio. I like to call it an `experiment playground` rather.  

I build, break, and rebuild systems, across code, teams, and products.  
This is where I log those experiments, the questions they raise, and the answers they sometimes yield.

## Why this exists

- Capture design & engineering experiments as readable artifacts. 
- Surface failures, fixes and small wins in a format that’s easy to iterate on.
- Give other builders practical, remixable patterns (`backgrounds`, `markdown rendering`, `keyboard-first UX`, `js snippets`).

## Quick facts (TL;DR)
- **Stack:** React + client-rendered Markdown + custom CSS
- **Primary UX:** terminal-like interactions, Command Palette, GitHub navigator
- **Content:** markdown files in posts (see `meta.json`)
- **Design:** Global, procedural background engine with live color updates (`GlobalBackground`, `RealTimeColorChange`)
- **Privacy:** no analytics, no popups
- **Build:** compatible with Vercel/Netlify/GitHub Pages/Cloudflare Pages.

## Running Locally (2 Min)

```sh
git clone https://github.com/ujjwalvivek/portfolio.git
cd portfolio
npm ci
npm start
npm run build
```

## Testing & QA checklist
- Start app and verify routes: `/`, `/about`, `/projects`, `/blog`
- Open Command Palette, run commands, and confirm shortcuts
- Verify `GlobalBackground` themes and `RealTimeColorChange` behavior
- Test reduced-motion: system setting + `UsePrefersReducedMotion` module
- Mobile/responsive: ensure TopBar, Footer, and Terminal interactions are usable
- Run Lighthouse: aim for no critical accessibility regressions

## Contributing
This is a personal log. PRs accepted selectively.

If you find a bug, open an issue with steps to reproduce. For small fixes, fork → branch → PR with a focused description and screenshots where applicable.

Or, just come say hi: [Mail Me!](mailto:hello@ujjwalvivek.com)

## License

MIT License `Do what you want, credit appreciated` 

---

Happy building.

`v2.0.0 update`