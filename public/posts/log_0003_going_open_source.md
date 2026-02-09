---
title: "Going Open Source: The Journey"
date: 2025-07-25
summary: I'll guide you through the guts of this thing, chatty road trip diary style. Expect snark, a few ASCII blueprints, and plenty of code confessions. Its a LONG read, but I swear it’ll be worth your time.
slug: log_0003_going_open_source
---

````javascript
> deploy  
[ WARN ] you are making the codes open source. continue?  y/N
[ CONTINUE? ] Y  
[ UPLOADING... ]
````

---

```bash
┏━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃   TABLE OF CONTENTS   ┃
 ┗━━━━━━━━━━━━━━━━━━━━━━━┛
   1. Re-Booting the Site (Why Open Source?)
   2. Procedural Background Generation
      ├─ Hologram Generator: Floating Wireframes & Data Streams
      ├─ Circuit Generator: Growing Electronic Trees
      ├─ Psychedelic Generator: My Personal Favorite
      └─ Vortex Generator: Quantum Threads & Entanglements
   3. Accessibility: Low-Chaos Mode
   4. Markdown Renderer & Custom Components
      └─ Prioritized Buttons
   5. Terminal Footer: Command Core
   6. System Crash Page & Draggable Components
   7. Theme System & Performance Tricks
   8. Final Thoughts
 ╔═════════════════════════════════════════════════════════════════════════════╗
 ║ Tip: Use Ctrl+F and the section names above to instantly jump around!       ║
 ╚═════════════════════════════════════════════════════════════════════════════╝
```


## Re-Booting the Site (Why Open Source?)

Welcome to the _Open Source Launch_! Remember when two posts ago I pushed my blog out of a fog of imposter syndrome, and last time I was literally patching on caffeine? Tonight, I'm doing the unthinkable.

Open-sourcing is like handing out schematics to your worst critics: `Here’s my codebase, enjoy!` Fear is at an all-time low (or maybe I just forgot what bugs are lurking).
But hey, if open source hasn't scared you off yet, welcome aboard.

:::tip
Grab a cup of whatever gets you through the night, and read along. I'll show you through the guts of this thing, chatty road trip diary style. Expect snark, and plenty of code confessions. Its a little longer read, you can always Bookmark and come back any time.
:::

## Procedural Background Generation

The swirling cubes, circuits, and cosmic art you saw behind this blog? All generated on the fly in `GlobalBackground.js`. Let’s zoom in on how each effect works.

```javascript
//high-level flow of the background system
     +----------------------+
     |   Generator Config   |
     | [Time]  [Density]    |
     +----------+-----------+
                |
         +------+------+
         |             |
   +-----v-----+ +-----v-----+ +------v------+ +------v------+
   | Hologram  | | Circuit   | | Psychedelic | |  Vortex     |
   +-----+-----+ +-----+-----+ +------+----- + +------+------+
         |             |             |                |
         +------+------+------+------+----------------+
                            |
                  +---------v--------+
                  |  Draw to Canvas  |
                  +------------------+
```

### Hologram Generator: Floating Wireframes & Data Streams

Whenever I see those cubes shimmer on the page, I still get goosebumps. Here’s the nitty-gritty.

<mark>**3D Cube Projection**</mark>

Each cube is defined by 8 vertices in 3D space. I rotate them around X, Y, and Z axes based on an object-specific time offset. Then I project each vertex into 2D screen coordinates with a pseudo-3D scaling and mapped to screen coordinates: 

$scale = \frac{perspective}{perspective + z + objZ}$

$(x',y')=[objX + newX\cdot\text{scale},\,objY + newY\cdot\text{scale}]$

where `objZ` is the cube's depth. This flattens the cube onto the canvas.

---

<mark>**Floating Grid**</mark>

I position up to `Math.floor(8 * density)` cubes in a 3×3 grid. Each cube's X/Y offset wiggles with `sin(objTime)`/`cos(objTime)` to give a gentle floating motion.

---

<mark>**Data Streams** </mark>

Some cubes emit horizontal, vertical, diagonal, or circular data streams. These streams spawn a handful of small circles in their path that fade and shrink, plus an occasional glitchy sparkle for that retro-cyber flair.

Below is a condensed snippet of the cube-drawing logic. It keeps each cube scaled by depth and rotated for that hologram feel:

```javascript
// Hologram rendering: For each cube, compute position & project vertices
const objectCount = Math.floor(8 * density); // number of cubes based on density
for (let obj = 0; obj < objectCount; obj++) {
  const objTime = time * speed * 0.001 + obj * 2.5;
  // Arrange cubes in a 3×3 grid and add a wavy offset
  const objX = width * 0.2 + (obj % 3) * width * 0.3 + Math.sin(objTime * 0.7) * 80;
  const objY = height * 0.2 + Math.floor(obj / 3) * height * 0.25 + Math.cos(objTime * 0.9) * 60;
  const objZ = Math.sin(objTime) * 100 + 200; // depth bobbing

  // Define the 8 vertices of a unit cube
  const vertices = [[-1,-1,-1], /* ... others ... */, [1,1,1]]; // ... omitted for brevity
  const projected = vertices.map(([x,y,z]) => {
    // Scale to cube size
    x *= cubeSize; y *= cubeSize; z *= cubeSize;
    // Rotate around X axis
    let newY = y * cosX - z * sinX;
    let newZ = y * sinX + z * cosX;
    y = newY; z = newZ;
    // (Rotation around Y and Z axes would follow here)
    // Perform perspective projection
    const scale = perspective / (perspective + z + objZ);
    return [objX + x * scale, objY + y * scale, scale];
  });

  // After projecting vertices, draw the cube edges with depth fade...
}
// (Hologram draw code continues...)
```

Notice how `ctx.globalAlpha` can fade based on distance. These little tricks make distant lines and stream trails dim out nicely. The result is a floating cube lattice that looks very **Tron**-like.

### Circuit Generator: Growing Electronic Trees

This effect sprouted unexpectedly; it’s literally a recursive **digital bonsai**. Starting from a root node, branches grow at random angles, and every few levels I plant a component (LED, resistor, or capacitor). Here's the core recursion:

```javascript
function drawCircuitBranch(x, y, angle, length, depth, energy, isMain) {
  if (depth > 9 || length < 8) return; // Stop recursion at a certain depth or small branch
  // Apply a little sway based on time and depth for organic motion
  const pulse = Math.sin(treePhase + depth * 0.3) * 0.2 + 1;
  const actualLen = length * pulse;
  const endX = x + Math.cos(angle) * actualLen;
  const endY = y - Math.sin(angle) * actualLen;

  // Draw this branch segment
  ctx.strokeStyle = isMain ? colors.primary : colors.accent;
  ctx.lineWidth = isMain ? 4 - depth : 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Every even depth, plant a component (LED/resistor/capacitor)
  if (depth % 2 === 0 && actualLen > 12) {
    drawComponent(endX, endY, (depth + treePhase) % 3);
  }

  // Recurse: add child branches (more branches if this is a main trunk)
  const branches = (isMain && depth < 3) ? 3 : 2;
  for (let i = 0; i < branches; i++) {
    drawCircuitBranch(
      endX, endY,
      angle + (i - 1) * 0.5 + Math.random() * 0.2,
      actualLen * 0.7, depth + 1, energy * 0.85, false
    );
  }
}
```

I limit recursion to depth 9 so it doesn’t run forever. On even depths, I call `drawComponent` to attach an LED or resistor at the tip. The trunk `isMain` sprouts 3 branches, side branches spawn 2. The randomness and decreasing length make each branch unique.

The helper for components looks like this:

```javascript
function drawComponent(x, y, type) {
  if (type === 0) {
    // LED with a glowing halo
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fill();
    // Glow effect
    ctx.globalAlpha = 0.3;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 12);
    grad.addColorStop(0, colors.primary);
    grad.addColorStop(1, colors.primary + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI*2);
    ctx.fill();
  }
  // (Resistor and capacitor drawing omitted for brevity)
}
```

Type 0 is an LED `drawn as a small circle plus a radial gradient glow`. I made up similar small graphics for resistors and capacitors. The branching plus the slight angle randomness gives it an unpredictable, organic feel.

>Like a little circuit bonsai growing on your screen.

### Psychedelic Generator: My Personal Favorite

If previous two weren't trippy enough, meet my psychedelic dream. Each layer is a ring of petals that pulse and warp. I build 4 to 5 layers of rotating, wavy petals; inner layers add swirling dot sub patterns. Here’s the gist:

```javascript
const layers = Math.floor(6 * density);
for (let L = 0; L < layers; L++) {
  const phase = time * 0.001 * speed + L * 0.8;
  const petals = 5 + L * 2;
  for (let p = 0; p < petals; p++) {
    const angle = (p / petals) * Math.PI * 2 + phase * (L % 2 ? -1 : 1);
    const radius = 50 + L * 30 + Math.sin(phase * 0.7) * 20;
    // Draw warped petal by sampling multiple points
    ctx.beginPath();
    for (let pt = 0; pt <= 20; pt++) {
      const warp = Math.sin(pt * 0.3 + phase * 3) * 0.2;
      const r = radius * (0.7 + warp);
      const x = cx + Math.cos(angle + pt * (Math.PI / petals) / 2) * r;
      const y = cy + Math.sin(angle + pt * (Math.PI / petals) / 2) * r;
      pt === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    // Fill petal with gradient (center to edge)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2);
    // ... imagine color stops based on theme ...
    ctx.fillStyle = grad;
    ctx.fill();
    // Outline the petal with alternating colors and wavy line
    ctx.strokeStyle = (L % 2 ? colors.accent : colors.secondary);
    ctx.lineWidth = 1 + Math.sin(phase * 4);
    ctx.stroke();
  }
}
```

<mark>**Summary**</mark>

Each _petal_ is drawn by moving a point along 21 sample coordinates with a sinusoidal warp. I fill it with a gradient that fades to transparent at the edges. I alternate stroke color by layer for contrast. The result is a living, breathing mandala that _pulses_ over time. (I even add random inner dots on the first layer for extra sparkle.)

### Vortex Generator: Quantum Threads & Entanglements

This one feels like quantum particle gossip `or my insomnia visualized`. On the first frame, I seed a bunch of **quantum nodes** with random positions, velocities, and an initial phase. Each tick, nodes drift around in wavy patterns and vary their **energy**. Then I connect nearby nodes with Bezier curves that pulse in strength.

```javascript
// On initial run, seed nodes randomly
if (!ctx.quantumNodes) {
  ctx.quantumNodes = Array.from({length: nodeCount}, () => ({
    x: Math.random() * w, 
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3, 
    vy: (Math.random() - 0.5) * 0.3,
    energy: Math.random(),
    phase: Math.random() * Math.PI * 2
  }));
}

// Update node positions each frame
ctx.quantumNodes.forEach(n => {
  const fx = Math.sin(t * 2 + n.phase) * 0.5;
  const fy = Math.cos(t * 1.7 + n.phase) * 0.5;
  n.vx = (n.vx + fx * 0.02) * 0.98;
  n.vy = (n.vy + fy * 0.02) * 0.98;
  n.x = (n.x + n.vx + w) % w; // wrap around edges
  n.y = (n.y + n.vy + h) % h;
  n.energy = (Math.sin(t * 3 + n.x * 0.01) + Math.cos(t * 2.5 + n.y * 0.01)) * 0.5 + 0.5;
});

// Compute entanglements between nodes
ctx.quantumNodes.forEach(a => {
  a.connections = [];
  ctx.quantumNodes.forEach(b => {
    if (a === b) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < maxDist) {
      const strength = (1 - dist / maxDist) * ((Math.sin(t * 5 + dist * 0.02) * 0.5) + 0.5);
      if (strength > 0.3) {
        a.connections.push({ target: b, strength });
      }
    }
  });
});

// Draw Bezier threads for each connection
ctx.quantumNodes.forEach(a => {
  a.connections.forEach(conn => {
    const midX = (a.x + conn.target.x) / 2 + Math.sin(t * 8 + conn.strength) * 30;
    const midY = (a.y + conn.target.y) / 2 + Math.cos(t * 6 + conn.strength) * 30;
    ctx.globalAlpha = conn.strength * 0.6 * ((a.energy + conn.target.energy) / 2);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 0.5 + conn.strength * 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(midX, midY, conn.target.x, conn.target.y);
    ctx.stroke();
  });
});
```

Each connection’s `strength` follows this formula:

${strength} = \Bigl(1 - \frac{\text{dist}}{\text{maxDist}}\Bigr)\times\Bigl(\sin(t \cdot 5 + \text{dist} \cdot 0.02)\cdot0.5 + 0.5\Bigr)$

Only when `strength > 0.3` do I actually draw a thread. The curves appear and vanish as nodes drift, giving a dynamic web of filaments. I scale the opacity and width by `strength` and the nodes’ average energy to make them glow variably. The net effect is a living **quantum entanglement** visualization.

---

After writing all that code, hitting **Enter** and watching the canvas spring to life still makes me grin. 
It’s pure math, recursion, and color theory. 

<mark>Hoping to see some more by the community!</mark>

## Accessibility: Low-Chaos Mode

Not everyone wants lights, lasers, and strobing stars. **Low-Chaos Mode** is my attempt to be kind to those who prefer a calmer vibe (or just hate animations). Flip the `minimumfun` switch, and two main things happen:

* The background visuals fade out (or go static).
* All flashy CSS animations (glitch, pulse, flicker) get stripped out.

In practice, I listen to the user’s `prefers-reduced-motion` setting or my own toggle and disable animations:

```javascript
const BackgroundProvider = ({ children }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // When user prefers reduced motion, disable background animations
  useEffect(() => {
    if (prefersReducedMotion && backgroundConfig.type !== 'none') {
      setBackgroundConfig(prev => ({
        ...prev,
        type: backgroundConfig.type,
        isAnimated: false,
      }));
    }
  }, [prefersReducedMotion, backgroundConfig.type]);

  // ...rest of provider...
};
```

<mark>**The idea is simple**</mark>

If your environment is set to minimal visuals, serve a plain background and no erratic CSS. The result is a much simpler, static page. If you flipped `maximumfun` in the last patch and it gave you a headache, `minimumfun` is your safety net.


## Markdown Renderer & Custom Components

My posts are written in Markdown, but I wanted some special features. So I set up a custom `react-markdown` renderer with plugins and custom components:

- **Custom `<CodeBlock>`:** syntax highlighting and a “Copy” button.
- **Admonitions:** colored tip/warning boxes.
- **KaTeX Math:** LaTeX math with `remark-math` and `rehype-katex`.
- **Related Posts:** Displays relevant posts at the end of an article.
- **Prioritized Buttons:** Chooses which action buttons to show for projects.

### Prioritized Buttons

On my **Projects** page, I ran into a problem: some projects had 3+ action buttons, which broke my layout. The solution was to pick the **primary** button and at most one or two secondaries. Here’s how I decide:

```javascript
const getButtonLayout = useCallback((project) => {
  const { contentLinks } = project;

  // Primary: Blog link (if it exists)
  const primary = contentLinks?.blogPost ? {
    type: 'primary', label: 'Blog', icon: <BsJournalText />, action: () => window.open(contentLinks.blogPost, '_blank')
  } : null;
  const secondary = [];
  // Secondary: up to 4 types of links, but we will only show 1 or 2 based on layout
  if (contentLinks?.websiteLink) secondary.push({ type:'secondary', label:'Web',    icon:<TbWorldWww/>, action:() => window.open(contentLinks.websiteLink, '_blank') });

  // Decide layout
  if (primary && secondary.length > 0) {
    return { layout: 'split', buttons: [primary, secondary[0]] };
  } else if (primary) {
    return { layout: 'fullPrimary', buttons: [primary] };
  } else if (secondary.length === 1) {
    return { layout: 'fullSecondary', buttons: [secondary[0]] };
  } else if (secondary.length >= 2) {
    return { layout: 'splitSecondary', buttons: [secondary[0], secondary[1]] };
  }

  // If no links, show a placeholder
  return {
    layout: 'wip',
    buttons: [{
      type: 'wip', label: 'WIP. Devlog Soon.', icon: <BsHourglassSplit/>, action: () => {}, className: 'wipBtn'
    }]
  };
}, []);
```

The `getButtonLayout` returns an object like `{layout: 'split', buttons: [...]}` which I then render in `ButtonGroup`. 

<mark>For example</mark>

If a project has a blog post and GitHub, it might show a **Blog** primary button and a **Code** secondary. This ensures two-column layouts stay neat, and if a project lacks, say, a blog link, it just shows two secondaries. It was a bit of logic drilling, but now every project row looks nicely uniform. Great Success!

![thumbnail](https://cdn.ujjwalvivek.com/posts/media/very_nice.webp)

## Terminal Footer (Command Core)

The little command line at the bottom of the about page? That's my pride and joy. `TerminalFooter.js` implements a mini-CLI with hidden commands, contextual hints, and even a storyline. It's basically the site's Easter egg hunt interface.

- **Command Architecture:** I start with fun random greetings (try 'help'). There’s a command parser that checks for known and **hidden** commands. Nice touch to set the mood.
- **Contextual Hints:** The `hint` command tailors its advice based on your current state (background on/off, etc.).
- **History Navigation:** Up/Down arrow keys to cycle through previous inputs.
- **Special Commands:** For example, `maximumfun` and `minimumfun` toggle the visual intensity, and `run exit` triggers the crash screen. Spoiler alert!

## System Crash Page & Draggable Components

I couldn’t resist adding some fun Easter eggs. If you type `run exit`, the site **crashes** with a playful overlay and a game. It’s a full break-the-glass moment with a hidden reward.

The embedded Dino game isn’t just a fun fallback, it _is_ the draggable window example. The whole game lives in a window component you can drag around. This lets you click the title bar and drag the window. 
I use `requestAnimationFrame` to avoid jerky motion. When you release the mouse `mouseup`, it stops tracking.

The game itself has *`different`* jump and collision logic. You'll see.

A snippet of the jump mechanic:
```javascript
// Calculate jump power on key release
const handleKeyUp = (e) => {
  if ((e.code === "Space" || e.key === " ") && isJumping && jumpStart !== null) {
    const duration = Math.min(Date.now() - jumpStart, 350);
    const power = duration / 350;
    setJumpPower(power);
    setJumpStart(null);
  }
};
// Apply jump effect
useEffect(() => {
  if (jumpPower > 0) {
    const jumpHeight = -40 - jumpPower * 40;
    setDinoY(jumpHeight);
    setTimeout(() => {
      setDinoY(0);
      setIsJumping(false);
      setJumpPower(0);
    }, 400 + jumpPower * 100);
  }
}, [jumpPower]);
```

Obstacles speed up as your score rises, and collision detection kills the game:

```javascript
useEffect(() => {
  if (gameOver || !gameStarted) return;
  for (let o of obstacles) {
    if (o.x < 50 && o.x > 10 && dinoY > -30 && o.height > 20) {
      setGameOver(true);
    }
  }
}, [obstacles, dinoY, gameOver]);

```

In the end, the crash overlay and Dino game were my way of poking fun at `errors` and having something to do while debugging. It’s a bit silly, but I think it fits the overall playful vibe.

## Theme System & Performance Tricks

The site’s theme light vs dark is baked into its DNA, and I sprinkled in some optimizations along the way. Especially with the heavy canvas backgrounds, I had to be mindful of performance, so I detect mobile devices and lower the max FPS to save battery. 

I also ensure to `cancelAnimationFrame` and `disconnect` observers on cleanup to avoid memory leaks.

Safari has a quirk where CSS variables don’t repaint on class change. Toggling overflow forces Safari to redraw with the new theme instantly.

On the other hand, I also took care not to screw up anyone’s privacy. There’s **no Google Analytics** or trackers. All fonts are served locally (no cross-site requests). The only external script is the PDF worker from unpkg, everything else is self-contained. 

>Phew, that was a lot. If you're still reading, Thank you! This took countless nights to prepare. Read on!

## Final Thoughts

Alright, that covers the entire codebase, from graphics to input to those hidden games. 

<mark>In summary</mark>

I’ve laid bare every skeleton in the closet. If you’ve read this far, **please** fork the repo and send a PR if you see anything amiss or have ideas. Issues and contributions live on GitHub, and trust me, every little fix or suggestion is welcome.

Looking back, I never imagined getting from [log_0000 Boot Sequence](https://ujjwalvivek.com/blog/log_0000_boot_sequence.md) to here so quickly. Each post has been an improvisation jam session, and now you can jam with me.

---
