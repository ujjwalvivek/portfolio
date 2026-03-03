---
title: "Finally, it happened"
date: 2026-03-03
summary: "I didn’t plan to build an engine. I just didn’t want to live with the shortcut anymore. What followed was months of building something I wasn’t sure anyone needed."
slug: log_0005_finally_it_happened
---

:::tip
I dont think I built this engine because I wanted an engine

I feel like I usually talk about how I built something to learn, the technical aspects, and code, and that’s true. But I think the real reason might be something way more personal.

If I’m being honest, I think I built it because the old version of the Dino bothered me more than it should have.

Similar to how Sekiro haunted me for years after I beat it sincerely, the old Dino game on my portfolio website haunted me. Or, maybe it was the unreleased game I made 5 years ago that never went on Steam (rip $100). Or maybe it was the fact that I had a lot of fun building those things, and I wanted to have that fun again. Just one more time.

So what's this Dino I'm referring to? The initial versions of my portfolio website had this fake system crash easter egg. Inside it was a tiny JavaScript game. Not much, just ~800 lines of code. It was scrappy. The Dino didn’t jump, rather he blinked forward because he thought he was a warlock. Well, mostly because I didn’t know how to do it properly and just made it work, partly because I was lazy, and partly because I thought it was funny.

And to my surprise, people loved it. It made people smile when they found it. It worked. It did what it needed to do. It was never meant to matter. That should have been enough.

But it stuck with me.

Every time I looked at it, I felt this itch. I knew it was a hack, a shortcut. Not in a clever way. In a *this is held together with duct tape* way. I started wanting to understand the layer under it.

Keeping aside my strong desire to make a perfect portfolio, I went underneath it.

I told myself I just wanted to understand WASM better. Or wGPU. Or Rust at a lower level. I understand C++. So, how difficult could it all be?

That sounds reasonable when you say it out loud.

What it actually felt like was sitting in front of a screen most nights trying to make something render, and when it didn’t, just staring at it. Just staring.

If I used Phaser, Pixi, Bevy and the likes, it would work. But it wouldn’t answer the itch.

There were days I wrote a lot. There were days I changed one thing. There were days I opened the project and questioned the whole thing, and closed it. Not dramatically, just practically. Out of pure exhaustion.

It reminded me of grinding a very specific difficult genre. Not the fun part. The part where you keep dying in the same place and you start questioning whether you’re even learning anything or just being stubborn.

No one asked for this engine. And that’s the part that makes it even more strange. There was no pressure except the kind you quietly put on yourself.

There’s a very specific eerie loneliness in building infrastructure no one asked for. You’re not building a game. You’re building the thing that lets you build the game. Which means there’s no payoff for months. Just scaffolding.

I’d publish a crate update. Then sit there wondering if I was just moving files around to feel productive.

None of it felt glamorous. Most of it felt slow. Somewhere in the middle of it, it stopped being exciting. It just became a thing I was carrying.

When I finally got to a point where it felt stable enough to call MVP1, I didn’t feel proud. Well, I did. But mostly, I was tired. Like I could finally let it go.

Giving your projects a name, a character is a weird thing. It makes it feel more real. It makes it feel like something you can talk about. It makes it feel like something you can be proud of. It makes it feel like something you can let go of.

Then I decided to port the old Dino, which felt like the real test.

That part made me nervous in a way I didn’t expect. Because if the engine felt awkward, I’d know immediately that I’d spent months building something that only worked in theory. The fault would be mine. No one else’s. I couldn’t blame it on a library or a framework. It would be on me.

So I used my own API docs. Didn’t go hunting for patterns. No external help. Just tried to write the game.

It worked. Not perfectly. But it made sense.

*~500 lines of code. 6MB WASM Artifact. 60 FPS. Runs literally everywhere.*

And today, I removed the old JavaScript version from my website and replaced it with a single import from the WASM package.

When I refreshed the page and saw it running, I didn’t smile or celebrate. I just leaned back.

It felt like finishing something long that didn’t need to be long.

And for the first time in a while, I closed VS Code without feeling like I had something unfinished staring back at me. Haunting me.

And I think that’s what this was really about.

I don’t know if Journey will turn into something bigger. I don’t know if anyone will care about the engine itself.

I just know that 5 Years after I rendered my first pixel in Unity, I finally feel like I'm beginning to understand the how. And my little Dino runs on it.

That matters to me more than I expected.

I’m still tired though.

For those who come after.

Feel free to check out the demos below. The first being the port of the old Dino game, and the second one is a more complex demo showcasing the engine’s capabilities.
:::

## The Elephant in the Room

:::dino-game
:::

## Dino Blink: A Journey Engine Game

<iframe src="/games/dino-blink.html" title="Dino Blink" width="100%" style="aspect-ratio: 2/1;" loading="lazy" caption="An ode to the past which started it all. Space is the button. Go crazy."></iframe>

## Journey Engine: A v1.1.2 Demo

<iframe src="https://journey.ujjwalvivek.com/?v=1.1.2" title="Journey Engine v1.1.2 Demo" width="100%" style="aspect-ratio: 16/9;" loading="lazy" caption="Use WASD to move, Shift to Run, and Alt to Dodge. Mouse clicks Attack and Parries."></iframe>

> I’m going to sleep.
