# Content Security Policy

The policy and the other security headers live in static/_headers. Cloudflare Pages applies them; zola serve does not, so test them with a server that reads _headers (see Testing).

## The policy for /*

Every origin below was seen in a headless run of every page and feature, or is a fallback path in the code.

| Directive   | Sources                                                                 | Why |
| ----------- | ----------------------------------------------------------------------- | --- |
| default-src | 'self'                                                                  | |
| script-src  | 'self' 'wasm-unsafe-eval' challenges.cloudflare.com                    | The header game, the engine audio and substrate are wasm; Turnstile's api.js for terminal mail |
| style-src   | 'self'                                                                  | No 'unsafe-inline': the templates carry no style attributes and no style elements. Styles set from TS through el.style or setProperty are CSSOM writes and are allowed |
| img-src     | 'self' data: cdn.ujjwalvivek.com raw.githubusercontent.com              | Post images and covers, the dino sprite, navigator images and post screenshots from GitHub; data: for small CSS icons |
| font-src    | 'self' https://cdn.ujjwalvivek.com                                       | Subset fonts live on the CDN under fonts/<family>/s1/ |
| connect-src | 'self' echopoint (https and wss) cdn.ujjwalvivek.com api.github.com raw.githubusercontent.com api.emailjs.com | Widgets, langs, store and the click socket; resume PDF fetch; navigator fallbacks; terminal mail send |
| frame-src   | 'self' challenges.cloudflare.com www.youtube.com journey, baremetal and gogs on ujjwalvivek.com | Turnstile; post embeds; 'self' for /games/dino-blink.html |
| worker-src  | 'self'                                                                  | pdf.js runs its worker as a same-origin module worker (no blob:) |
| child-src   | 'self'                                                                  | Only for old browsers without worker-src |
| media-src, manifest-src | 'self'                                                      | |
| object-src  | 'none'                                                                  | |
| base-uri    | 'self'                                                                  | |
| form-action | 'self'                                                                  | No forms post anywhere; mail goes through fetch |
| frame-ancestors | 'none'                                                              | The site is never framed |

The audio worklet (/js/shell/audio-worklet.js) is governed by script-src 'self'.

## /games/*

The Dino Blink frame gets its own policy: the /* CSP is detached with `! Content-Security-Policy` and replaced with a stricter one that only allows the site itself, the site's font CDN for the no-WebGPU message, and frame-ancestors 'self' so posts can frame it. The game is vendored into /vendor/dino-blink@1.0.0/ by scripts/vendor.mjs, so nothing in the frame comes from another origin. Its inline style and scripts moved to dino-blink.css and dino-blink.js.

## Keeping it clean

- No style="" in templates, components or post markdown. Use a class, an nth-child rule, or set the value from TS through el.style. Markdown tables with :--- alignment make Zola emit style="text-align", so leave alignment markers out (thead th is already left-aligned in post.css).
- No inline script and no on*= handlers.
- innerHTML strings must not contain style attributes.
- A new external origin needs a line in the right directive. Check it with the local server and the console.

## Other headers

- X-Content-Type-Options: nosniff.
- Referrer-Policy: strict-origin-when-cross-origin.
- Permissions-Policy turns off camera, microphone, geolocation, payment, usb, serial, hid, midi, display-capture and browsing-topics. Fullscreen, autoplay, gamepad and the rest keep their defaults, so zen mode works and post embeds can still be granted them through the iframe allow attribute. Listing fullscreen=(self) would stop that delegation to the embeds.
- Cross-Origin-Opener-Policy: same-origin. Every popup (DuckDuckGo from the crash screen, VS Code and GitHub from the navigator, PDFs) opens with noopener and nothing reads window.opener; there is no OAuth popup.

## Testing

A small Node server that serves public/ and applies _headers the way Pages does (rules in order, values of a repeated header joined with a comma, ! detaches) plus a headless CDP run that records request origins, securitypolicyviolation events and console errors in the page, its frames and workers. Both were scratch tools for M7 and are not in the repo.
