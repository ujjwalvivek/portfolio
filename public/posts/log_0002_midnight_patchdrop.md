---
title: "Performance Case Study: Optimizing Canvas for Mobile"
date: "2025-07-13"
summary: "Initial load testing revealed significant thermal throttling on mobile devices due to uncapped Canvas re-renders. The goal is to maintain visual fidelity without melting the user's CPU. Here's an Optimization Report on the performance challenges of using Canvas for procedural backgrounds, and the midnight patch that saved the day."
slug: "log_0002_midnight_patchdrop"   
---

````javascript
> deploy  
[ WARN ] you might get ignored again  y/N
[ CONTINUE? ] Y  
[ PATCHING... ]
````

---

## Building My Site Was The Real Rollercoaster

If you've ever tried to make your website look "cool" with animated backgrounds, you know the pain. I started with a simple goal: make my site pop. What followed was a wild ride through browser quirks, overheating phones, the bleeding edge of web graphics, and an insightful launch.<br><br>Not that I was any stranger to web graphics, but `webGPU` still intimidated me.

---

## Enter Social Platforms

**Deployed v1.0** <br>Dropped it on a few subs, dev.to, x (Twittwer) <br>People showed up. <br><br>Didn't hold back. 

> "The animation gave me a headache." <br> <br>"Why is my browser screaming?" <br> <br>"Animations resets every visit. Please. My eyes." <br> <br>"Cool idea but it's cooking my phone." <br> <br>"Cant see shit, navigation is weird"

And... Thank you really! <br>Because this was the first time anyone actually ***used*** it.

---

## So I Planned For v1.1 Release On A Friday Midnight

So that I self sabotage my weekend plans? <br>Human brain is weird. <br>Not really. <br>But out of **respect** for the people who showed up; I patched.

### Here's Some Highlights 

#### Optimization Strategy: Frame Throttling

![webGPU](https://cdn.ujjwalvivek.com/posts/media/webgpu.svg)
`{the above svg is a prime example of how webkit doesnt play nice with anything.}`


I had recently discovered WebGPU, the new graphics API that lets you use the power of your graphics card.<br><br>It was like opening another secret door. The other one being webGL. That piece of tech still amazes me. <br><br>Trust me, I did not know what I was getting myself into. <br>The catch? WebGPU is new, and the documentation is… let's say "adventurous".<br><br>I couldnt rewrite my generator logic as shaders, yet.<br>

````javascript
I tried:
- Low Quality. Low Particle Density. Made wallpapers blurry.
- Tweaking numbers, understanding canvas optimizations
- Tried device detection, just to give their device a fighting chance.
- Throttle animation loops so they do not run faster than needed. 
- Reduce drawing complexity, and canvas resolution for mobile devices.
- Pause Animations when off focus (saving battery and heat).
````
Sources:
[MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

After a lot of trial and error (and a few existential crises), I got it working. My generators now run ~~buttery~~ smooth, even on mobile. It pulses, it moves, and my phone doesn't melt. Probably yours wont too. 

::::note
FPS capped at ~20/~30, enough for a smooth viewing experience <br><br>No resource hogging. No random heatups. Probably. <br><br>All while still being CPU-bound. For now. <br><br>WebGPU is something to look forward to. **A great success!**
::::

#### Low Chaos Mode™ - Accessibility Architecture

What about folks who get dizzy from motion? <br>Some users need less motion, more contrast, or just a calmer vibe.  <br><br>So I reduced motion detection accompanied by a zen-like **Low Chaos Mode™**. <br>No animations. No glitchiness. Just pure calm.

````javascript
useEffect(() => {
    if (prefersReducedMotion && !showPrompt) {
        window.alert(
            "Accessibility Notice:\n\nWe detected your system prefers reduced motion. Some backgrounds and animations may cause discomfort. For a calmer experience, consider enabling Low Chaos Mode."
        );
        setShowPrompt(true);
    }
}, [prefersReducedMotion, showPrompt]);
````

Reads `prefers-reduced-motion`, shows a low chaos mode™ prompt. Accessibility Gods, I see you

````javascript
        useEffect(() => {
        if (prefersReducedMotion && backgroundConfig.isAnimated) {
            setBackgroundConfig(prev => ({
                ...prev,
                isAnimated: false,
            }));
        }
    }, [prefersReducedMotion, backgroundConfig.isAnimated]);
````

Accessibility isn't optional. <br>A simple prompt can make a big difference. <br>Respect your users. If they want less motion, give them less motion. <br><br>And **Low Chaos Mode™** is now my favorite button.   <br><br>*(Also, don't test animated backgrounds on a 2015 laptop.or do. and pls let me know how that goes.)*

#### Less chaos on load, more chaos by design

* **Better Readability:**
    You can read text now. Probably. Maybe.
    Also, **Canvas blur on Safari is... better?** Let's pretend

* **Animations states are now saved in the configuration across navigation**: Sorry to that one guy who probably sat and watched it roll atleast 10 times.

* **`pdfjs`'s UI looked like Windows 98:** Now it fits the vibe™.

---

## Stuff That Broke My Brain

#### `requestAnimationFrame` stuttering like dial-up a staircase?

getting that smooth 30fps was a PITA.

#### iPads reporting as Macintosh on safari

How ironical. <br><br>Always combine user agent checks with feature detection (like 'ontouchstart' in window or navigator.maxTouchPoints > 1).<br><br>This way, you can reliably identify iPads even when they lie about being a Mac. <br><br>**In short:** <br>Don’t trust the user agent alone. Check for touch capability too!

````javascript
const isMobile = useMemo(() => {
if (typeof navigator === "undefined" || typeof window === "undefined") return false;
const ua = navigator.userAgent;
const isIpad = (
    /iPad/.test(ua) ||
    (ua.includes("Macintosh") && ('ontouchstart' in window || navigator.maxTouchPoints > 1))
);
const isIphoneOrAndroid = /iPhone|iPod|Android/i.test(ua);
return isIphoneOrAndroid || isIpad;
}, []);
````

---

### But Hey, Some Wins

* Found out that WebGPU is real… and terrifying
* Learned that accessibility isn't just a checkbox. 
* Other Accessibility features planned for future. Inclusivity is cool.
* My phone no longer becomes a stove. And maybe yours too.  
* The **Low Chaos Mode™** button is my personal chill pill.
* Custom vibes for every mood.

---

### So What's Next?

\-- v1.0 was chaos unleashed. <br>\-- v1.1 is chaos *tamed*; juust a little. <br>\-- v1.2? v2.0? <br>\-- No roadmap yet, but definetely migration to **webGPU** would be my next thing to crack.

---

::::note
**Try exploring around.<br>It still glitches. It still talks back.<br><br>But now? It listens a little too.**
::::

---

Want more code? More stories? Drop a [mail](mailto:hello@ujjwalvivek.com).  

````bash
git commit -m "try again"
````

---

