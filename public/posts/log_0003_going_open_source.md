---
title: How Did I Build My Website
date: 2025-07-25
summary: Unlisted
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

================================================================================
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   TABLE OF CONTENTS         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   1. Re-Booting the Site (Why Open Source?)
   2. Procedural Background Generation
      ├─ Hologram Generator: Floating Wireframes & Data Streams
      ├─ Circuit Generator: Growing Electronic Trees
      ├─ Psychedelic Generator: My Personal Favorite
      └─ Vortex Generator: Quantum Threads & Entanglements
   3. Accessibility: Low-Chaos Mode
   4. Fuzzy Search & Filter Stack
   5. Markdown Renderer & Custom Components
      ├─ Custom Code Blocks & Copy
      ├─ Admonitions
      ├─ Mathematical Expressions (KaTeX)
      ├─ Related Posts
      └─ Prioritized Buttons
   6. PDF Viewer with Themed Toolbar
   7. Terminal Footer: Command Core
      ├─ Command System Architecture
      ├─ Context-Aware Responses
      └─ History & Input Management
   8. System Crash Page & Draggable Components
      ├─ Crash Overlay
      └─ Dino Game & Draggable Windows
   9. Theme System & Performance Tricks
  10. State Management & Data Flow
  11. Content Security
  12. Final Thoughts
================================================================================
 ╔═════════════════════════════════════════════════════════════════════════════╗
 ║ Tip: Use Ctrl+F and the section names above to instantly jump around!       ║
 ╚═════════════════════════════════════════════════════════════════════════════╝
```


## Re-Booting the Site (Why Open Source?)

Welcome to the _Open Source Launch_! Remember when two posts ago I pushed my blog out of a fog of imposter syndrome, and last time I was literally patching on caffeine? Tonight, I'm doing the unthinkable.

Ripping open the codebase, **open-sourcing everything**, and mapping the circuit with ASCII diagrams so retro you can almost hear the dial-up modem.

Open-sourcing is like handing out schematics to your worst critics: `Here’s my codebase, enjoy!` Fear is at an all-time low (or maybe I just forgot what bugs are lurking).
But hey, if open source hasn't scared you off yet, welcome aboard.

:::tip
Grab a cup of whatever gets you through the night, and follow along. I'll guide you through the guts of this thing, chatty road trip diary style. Expect snark, a few ASCII blueprints, and plenty of code confessions. Its a **LONG** read, but I swear it’ll be worth your time.
:::

:::note
Bookmark

And come back any time!
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

Each cube is defined by 8 vertices in 3D space. I rotate them around X, Y, and Z axes based on an object-specific time offset. Then I project each vertex into 2D screen coordinates with a pseudo-3D scaling: 

$scale = \frac{perspective}{perspective + z + objZ}$

and mapped to screen coordinates

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

Notice how `ctx.globalAlpha` can fade based on distance. For example:

```javascript
// Fade edges based on depth (scale)
ctx.globalAlpha = scale * opacity * 0.8;
// Fade data stream elements by their own alpha trail
ctx.globalAlpha = trailAlpha * opacity;

```

These little tricks make distant lines and stream trails dim out nicely. The result is a floating cube lattice that looks very **Tron**-like.
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

:::note
Fun Fact

This one is my favorite. Every time I watch it, I feel like I’m inside a 70’s sci-fi album cover.
:::
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

I hope this walkthrough (and random trig) gives you a better sense of how these effects come together on the canvas. 

<mark>Hoping to see some more by the community!</mark>

#### Theme-Adaptive Color System

Notice the color themes? All generators respect light/dark mode. I made a simple function to choose palettes:

```javascript
const getThemeColors = () => {
  if (darkMode) {
    return {
      quantum:   { primary: '#00ffff', secondary: '#ff00ff', accent: '#ffff00' },
      datastream:{ primary: '#00ff41', secondary: '#0080ff', accent: '#ff4500' }
    };
  } else {
    return {
      quantum:   { primary: '#4a90e2', secondary: '#7b68ee', accent: '#ff6b6b' },
      datastream:{ primary: '#28a745', secondary: '#007bff', accent: '#fd7e14' }
    };
  }
};
```

Every effect samples its colors from these `primary/secondary/accent`. 

>Toggle dark mode and watch the entire scene recolor instantly, even the PDF viewer buttons (coming up) obey this scheme.

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

And for the CSS classes:

```javascript
import { useBackground } from '../../Background/BackgroundContext';

const removeCSS = () => {
  const { backgroundConfig } = useBackground();

  // Only keep glitch/pulse if background isn't 'none'
  const safeCSS = backgroundConfig.type !== 'none'
    ? `/* no-op styles here */`
    : '';

  // (This function would remove certain keyframe classes based on safeCSS)
};

export default removeCSS;
```

<mark>**The idea is simple**</mark>

If your environment is set to minimal visuals, serve a plain background and no erratic CSS. The result is a much simpler, static page. If you flipped `maximumfun` in the last patch and it gave you a headache, `minimumfun` is your safety net.

## Fuzzy Search & Filter Stack

The Blog Listings have a search box and similarly, Project Listings have category filters. `Weird design choice? I know`. Here’s how they work under the hood.

First, the `<SearchBar>` component is a simple input that tracks its query and calls a handler:

```javascript
const SearchBar = ({ onSearch, placeholder = "Search posts..." }) => {
  const [query, setQuery] = useState('');
  return (
    <div className={styles.searchWrapper}>
      <input
        className={styles.searchInput}
        value={query}
        onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
        placeholder={placeholder}
      />
      {query && <button className={styles.clearButton} onClick={() => { 
          setQuery(''); onSearch(''); 
        }}>×</button>}
    </div>
  );
};
```

Each keystroke updates `query` and calls `onSearch(query)`. Easy.

Then comes the fuzzy logic. I wrote a tiny function that checks if all characters of `query` appear in order in the target text. It’s very forgiving (not **Levenshtein**, just subsequence matching):

```javascript
// Returns true if 'query' (in order) is found in 'text'
const fuzzySearch = (query, text) => {
  if (!query) return true;               // empty query matches all
  const q = query.toLowerCase(), t = text.toLowerCase();
  if (t.includes(q)) return true;        // quick substring check
  let idx = 0;
  for (let char of t) {
    if (char === q[idx]) idx++;
  }
  return idx === q.length;
};
```

Finally, in a `useEffect`, I filter the posts whenever `searchQuery` changes:

```javascript
useEffect(() => {
  if (!searchQuery.trim()) {
    // No query: show first page of all posts
    setFilteredPosts(posts);
    setVisibleCount(8);
  } else {
    // Filter posts by fuzzy matching title/description/tags
    const filtered = posts.filter(p => 
      fuzzySearch(searchQuery, `${p.title} ${p.description} ${p.tags.join(' ')}`)
    );
    setFilteredPosts(filtered);
    setVisibleCount(filtered.length);
  }
}, [searchQuery, posts]);
```

---

For project listings, I also made a neat terminal-style filter: `all`, `pm`, `dev`. I pre-calc two lists `pmProjects`, `devProjects` and then pick which to display:

```javascript
// Separate projects by ID prefix using useMemo
const { pmProjects, devProjects } = useMemo(() => ({
  pmProjects: sortProjectsById(
    ProjectsData.filter(p => p.id.startsWith('pm-'))
  ),
  devProjects: sortProjectsById(
    ProjectsData.filter(p => p.id.startsWith('dev-'))
  )
}), []);

// Pick sections based on filter state
const filteredSections = useMemo(() => {
  if (projectFilter === 'pm') {
    return [{ title: 'PM Projects', projects: pmProjects, section: 'pm' }];
  } else if (projectFilter === 'dev') {
    return [{ title: 'Dev Projects', projects: devProjects, section: 'dev' }];
  } else {
    return [
      { title: 'Dev Projects', projects: devProjects, section: 'dev' },
      { title: 'PM Projects',  projects: pmProjects,  section: 'pm' }
    ];
  }
}, [projectFilter, pmProjects, devProjects]);
```

The UI shows buttons like `--All`, `--PM`, `--Dev`. Clicking one sets `projectFilter`. Here's the JS for the buttons:

```javascript
<div className={styles.filterWrapper}>
  <span style={{ fontWeight: 500 }}>{'filter@uv ~ ⪢ eza'}</span>
  <div className={styles.filterButtons}>
    {['all', 'pm', 'dev'].map((filter) => (
      <button
        key={filter}
        className={`${styles.terminalBtn} ${projectFilter === filter ? styles.active : ''}`}
        onClick={() => setProjectFilter(filter)}
        style={{
          fontWeight: projectFilter === filter ? '800' : '400',
          background: projectFilter === filter ? 'var(--text-color)' : 'transparent',
          color: projectFilter === filter ? 'var(--background-color)' : 'var(--text-color)',
        }}
      >
        --{filter.charAt(0).toUpperCase() + filter.slice(1)}
      </button>
    ))}
  </div>
  <div className={styles.statusBar}>
    <span>Active filter: <span className={styles.activeFilter}>{projectFilter}</span></span>
    <span className={styles.projectCount}>{projectCount} entries found</span>
  </div>
</div>
```

This renders a row of terminal style buttons. The logic ensures that, say, "PM Projects" appears when `--PM` is active, etc. It was a bit of toggle gymnastics, but now switching filters is instantaneous and kept me from building a giant ugly table.


## Markdown Renderer & Custom Components

My posts are written in Markdown, but I wanted some special features. So I set up a custom `react-markdown` renderer with plugins and custom components:

- **Custom `<CodeBlock>`:** syntax highlighting and a “Copy” button.
- **Admonitions:** colored tip/warning boxes.
- **KaTeX Math:** LaTeX math with `remark-math` and `rehype-katex`.
- **Related Posts:** Displays relevant posts at the end of an article.
- **Prioritized Buttons:** Chooses which action buttons to show for projects.

### Custom Code Blocks & Copy

When rendering a fenced code block, I detect the language and wrap it in a UI with a copy button:

```javascript
 const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  const { darkMode } = React.useContext(ThemeContext);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If it's a code block with a language
  return !inline && match ? (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLanguage}>{match[1]}</span>
        <button onClick={handleCopy} className={styles.copyButton}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={darkMode ? atomDark : oneLight}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={className} {...props}>{children}</code>
  );
};
```

This component checks if we're in a fenced block `!inline && match`. If so, it renders a header showing the button. Clicking the button copies the code to clipboard and flashes **Copied!**. Otherwise, it just renders inline code normally.

### Admonitions

I support Markdown admonitions like `:::warning Danger ahead:::`. The renderer looks for a container directive with a class `warning`, `tip`, etc. and formats it:

```javascript
 const Admonition = ({ node, children }) => {
  const type = node.properties.className[0]; // e.g., 'warning'
  let title = type.charAt(0).toUpperCase() + type.slice(1);
  let content = children;
  
  // If first child is a short string, use it as a custom title
  if (Array.isArray(children) && typeof children[0]?.props?.children === 'string') {
    const text = children[0].props.children;
    if (text.length < 60 && !text.includes('\n') && children.length > 1) {
      title = text.trim();
      content = children.slice(1);
    }
  }

  return (
    <div className={`${styles.admonition} ${styles[type]}`}>
      <div className={styles.admonitionHeader}>
        <span className={styles.admonitionIcon}>{getAdmonitionIcon(type)}</span>
        <span className={styles.admonitionTitle}>{title}</span>
      </div>
      <div className={styles.admonitionContent}>{content}</div>
    </div>
  );
};
```

For example, `:::danger **Watch out!** This might explode.` will render a styled warning box with a header. I even detect if the first line is a custom title and adjust accordingly. The result is a nice colored panel with an icon. It looks pretty nice I'd say.

:::danger
Watch out!

This might explode.
:::

### Mathematical Expressions (KaTeX)

Math support comes from `remark-math` and `rehype-katex`. My configuration looks like:

```javascript
const remarkPlugins = [
  remarkGfm,      // GitHub-flavored markdown (tables, etc.)
  remarkMath,     // parse $...$ and $$...$$
  remarkDirective,
  () => (tree) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective') {
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = { className: ['remark-directive-container', node.name] };
      }
    });
  },
];

const rehypePlugins = [rehypeRaw, rehypeSlug, rehypeKatex];
```

With this, any LaTeX like `$E=mc^2$` or `$$\int_0^1 x^2 dx$$` renders with KaTeX beautifully. You can even write directives and other markdown extensions seamlessly.

$E=mc^2$
$$\int_0^1 x^2 dx$$

### Related Posts

At the bottom of each post, I automatically show a **Related Posts** section `up to 3 entries`. The logic filters the post metadata by shared tags:

```javascript
const [relatedPosts, setRelatedPosts] = useState([]);
useEffect(() => {
  const current = allPosts.find(p => p.filename === filename);
  const related = allPosts
    .filter(p => p.id !== current.id && p.tags.some(tag => current.tags.includes(tag)))
    .slice(0, 3); // take top 3
  setRelatedPosts(related);
}, [filename, allPosts]);
```

And the JSX to display them is trivial:

```javascript
const RelatedPosts = ({ posts }) => (
  <div className={styles.relatedContainer}>
    <h3>Related Posts</h3>
    <ul>
      {posts.map(p => (
        <li key={p.slug}>
          <Link to={`/blog/${p.filename}`}>{p.title}</Link>
        </li>
      ))}
    </ul>
  </div>
);
```

This shows a list of links under the post. No magic here, just another filter-and-slice.

### Prioritized Buttons

On my **Projects** page, I ran into a problem: some projects had 3+ action buttons, which broke my layout. The solution was to pick the **primary** button and at most one or two secondaries. Here’s how I decide:

```javascript
const getButtonLayout = useCallback((project) => {
  const { contentLinks } = project;
  // Primary: Blog link (if it exists)
  const primary = contentLinks?.blogPost ? {
    type: 'primary', label: 'Blog', icon: <BsJournalText />, action: () => window.open(contentLinks.blogPost, '_blank')
  } : null;

  // Secondary: up to 4 types
  const secondary = [];
  if (contentLinks?.notionEmbed) secondary.push({ type:'secondary', label:'Details', icon:<SiNotion/>, action:() => openNotion() });
  if (contentLinks?.pdfDocument) secondary.push({ type:'secondary', label:'Docs',   icon:<PiFilePdfFill/>, action:() => openPDF() });
  if (contentLinks?.figmaDesign) secondary.push({ type:'secondary', label:'Design', icon:<SiFigma/>, action:() => window.open(contentLinks.figmaDesign, '_blank') });
  if (contentLinks?.githubRepo) secondary.push({ type:'secondary', label:'Code',   icon:<VscGithubInverted/>, action:() => window.open(contentLinks.githubRepo, '_blank') });
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

If a project has a blog post and GitHub, it might show a **Blog** primary button and a **Code** secondary. This ensures two-column layouts stay neat, and if a project lacks, say, a blog link, it just shows two secondaries. It was a bit of logic drilling, but now every project row looks nicely uniform.

## PDF Viewer with Themed Toolbar

For PDFs, I used `react-pdf-viewer` but with my own toolbar and dark/light sync. I created a custom toolbar render function:

```javascript
const renderToolbar = (Toolbar) => (
  <Toolbar>
    {(slots) => {
      const { CurrentScale, ZoomIn, ZoomOut } = slots;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
          <ZoomOut>{(props) => (
            <button style={btnStyle} {...props}>Zoom Out</button>
          )}</ZoomOut>
          <div style={scaleStyle}>
            <CurrentScale>{(props) => <span>{`${Math.round(props.scale * 100)}%`}</span>}</CurrentScale>
          </div>
          <ZoomIn>{(props) => (
            <button style={btnStyle} {...props}>Zoom In</button>
          )}</ZoomIn>
        </div>
      );
    }}
  </Toolbar>
);
const defaultLayoutPluginInstance = defaultLayoutPlugin({ 
  renderToolbar, 
  sidebarTabs: (defaultTabs) => [],  // remove default sidebar
  theme: pdfTheme 
});
```

In JS, I set it up like this:

```javascript
<Worker workerUrl="https://unpkg.com/pdfjs-dist/build/pdf.worker.min.js">
  <Viewer
    theme={pdfTheme}
    plugins={[defaultLayoutPluginInstance]}
    fileUrl={pdfTheme === 'dark' ? 'file-dark.pdf' : 'file-light.pdf'}
    defaultScale={SpecialZoomLevel.PageWidth}
  />
</Worker>
```

<mark>The neat twist</mark>

Toggling the PDF viewer’s theme also toggles the entire site’s theme and vice versa. That way, if you switch to dark mode on the PDF, the website goes dark too. Meaning, no blinding white-on-black mismatch. Great Success!

![thumbnail](https://cdn.ujjwalvivek.com/posts/media/very_nice.jpg)


## Terminal Footer (Command Core)

The little command line at the bottom of the about page? That's my pride and joy. `TerminalFooter.js` implements a mini-CLI with hidden commands, contextual hints, and even a storyline. It's basically the site's Easter egg hunt interface.

- **Command Architecture:** I start with fun random greetings (try 'help'). There’s a command parser that checks for known and **hidden** commands.
- **Contextual Hints:** The `hint` command tailors its advice based on your current state (background on/off, etc.).
- **History Navigation:** Up/Down arrow keys to cycle through previous inputs.
- **Special Commands:** For example, `maximumfun` and `minimumfun` toggle the visual intensity, and `run exit` triggers the crash screen. Spoiler alert!

Here’s a glimpse of the startup messages:

```javascript
const greetings = [
  "Welcome to the Terminal! Type 'help'.",
  "Terminal ready. What will you 'help' create today?",
  "Magic happens here. 'help' yourself out with a command.",
  "Seek and you shall find 'help'.",
  "Hint: Not all commands are listed. 'help' yourself. "
];
```

Each time you load the site, it picks one. Nice touch to set the mood.

### Command System Architecture And Context Aware Reponses

The terminal checks your input against known commands. For example, here’s how the `hint` command works:

```javascript
if (cmd.trim() === "hint") {
  let output = `Psst! Here's one especially for you :)\n\n>> Type 'start' to begin the journey.`;
  // If no background is set, suggest turning chaos up
  if (backgroundConfig.type === "none") {
    output += `\n\n(Psst! This journey is more fun when chaos is maxed. Type 'maximumfun' to amp it up!)`;
  }
  output += `\n\n[Accessibility]: Some effects may be intense. Type 'minimumfun' for a calmer vibe.`;
  setOutput(output);
}
```

If you call `hint`, it whispers a tip and even checks the current background mode. If you're in total silence `none`, it encourages you to type `maximumfun`. Otherwise, it gently reminds you about `minimumfun`. The terminal _adapts_ its suggestions based on context. Why? Because a smart assistant should. 

### History & Input Management

I implemented full command history. Up-arrow recalls the last command:

```javascript
const handleKeyDown = (e) => {
  if (e.key === "ArrowUp") {
    const cmds = history.filter(h => h.type === 'input').map(h => h.text);
    if (cmds.length === 0) return;
    const idx = historyIndex === -1 ? cmds.length - 1 : Math.max(0, historyIndex - 1);
    setInput(cmds[idx] || "");
    setHistoryIndex(idx);
  }
};
```

This snippet grabs all past inputs, then picks the previous one when you hit ↑. The result is an authentic shell feel: no more retyping the same commands.

```bash
 [User input] --> [Parse command] --> [Show output / Update history]
      |                                    ^
      v                                    |
 [History array]                      [Context checks (e.g. 'hint')]

```

## System Crash Page & Draggable Components

I couldn’t resist adding some fun Easter eggs. If you type `run exit`, the site **crashes** with a playful overlay and, believe it or not, a game. It’s a full break-the-glass moment with a hidden reward.

### Crash Overlay

```javascript
 const CrashOverlay = ({ onRestart }) => {
  const [mockClose, setMockClose] = React.useState(false);

  return (
    <div className={styles.crashOverlay} onContextMenu={e => e.preventDefault()}>
      <div className={styles.crashWindow}>
        <div className={styles.crashWindowBar}>
          <span className={`${styles.crashDot} ${styles.red}`} 
                onClick={() => {
                  setMockClose(true);
                  setTimeout(() => setMockClose(false), 800);
                }} title="You wouldn't"/>
          {mockClose && <div className={styles.mockCloseMsg}>Nice try! Try harder.</div>}
        </div>
        <div className={styles.crashWindowContent}>
          <DinoGame />
        </div>
      </div>
    </div>
  );
};
```

This shows a full-screen **system error** window. The red close-dot is just for show, clicking it taunts you `Nice try! Try harder`. The content area embeds `<DinoGame />`, my very own Chrome-dino clone that you can actually play right here. I even snuck in a DuckDuckGo privacy link and a **BACK TO SAFE MODE** button. It’s basically a joke caught red-handed, with a mini-game consolation prize.
### Dino Game & Draggable Windows

The embedded Dino game isn’t just a fun fallback, it _is_ the draggable window example. The whole game lives in a window component you can drag around. Key bits include:

```javascript
const handleBarMouseDown = (e) => {
  setDragging(true);
  dragOffset.current = { x: e.clientX - windowPos.x, y: e.clientY - windowPos.y };
  window.addEventListener("mousemove", handleBarMouseMove);
  window.addEventListener("mouseup", handleBarMouseUp);
};
const handleBarMouseMove = (e) => {
  if (!draggingRef.current) return;
  windowPosRef.current = {
    x: e.clientX - dragOffset.current.x,
    y: e.clientY - dragOffset.current.y,
  };
  // Throttle with requestAnimationFrame for smoothness
  if (!handleBarMouseMove.raf) {
    handleBarMouseMove.raf = requestAnimationFrame(() => {
      setWindowPos({ ...windowPosRef.current });
      handleBarMouseMove.raf = null;
    });
  }
};
```

This lets you click the title bar and drag the window. I use `requestAnimationFrame` to avoid jerky motion. When you release the mouse `mouseup`, it stops tracking.

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

Obstacles speed up as your score rises:

```javascript
const getSpeedForScore = (score) => {
  let speed = BASE_SPEED;
  for (let i = 0; i < SPEED_BREAKPOINTS.length; i++) {
    if (score >= SPEED_BREAKPOINTS[i]) {
      speed = BASE_SPEED + (i + 1) * SPEED_INCREMENT;
    }
  }
  return speed;
};
```

And collision detection kills the game:

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

```bash
+-------------------+    +-----------------------+
| run "exit" command|--->| Render CrashOverlay   |
+-------------------+    +-----------------------+
                              |
                              v
                        [DinoGame embedded]
```


## Theme System & Performance Tricks

The site’s theme `light vs dark` is baked into its DNA, and I sprinkled in some optimizations along the way:

**CSS Variables:** Most colors live in CSS vars. For example:

```javascript
:root {
  --background-color: rgb(240, 240, 240);
  --text-color: rgb(12, 12, 12);
  /* ... more vars ... */
}
body.dark-mode {
  --background-color: rgb(0, 0, 0);
  --text-color: rgb(255, 255, 255);
  /* ... dark palette ... */
}
```

Switching themes just toggles `body.dark-mode`, which instantly reassigns all colors via these vars. It's atomic and easy. And then, I manage the theme with a simple provider. This persists the choice to `localStorage` and adds/removes the class on `<body>`.

```javascript
export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("darkMode");
      return saved ? JSON.parse(saved) : true; // default dark
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

<mark>**Safari Bug Fix**</mark>

Safari has a quirk where CSS variables don’t repaint on class change. I hit it with a quick reflow hack. Toggling `overflow` forces Safari to redraw with the new theme instantly.

```javascript
useEffect(() => {
  const html = document.documentElement;
  html.style.overflow = 'hidden';
  setTimeout(() => { html.style.overflow = ''; }, 1);
}, [darkMode]);
```

<mark>**Performance Tweaks** </mark>

The background animations can be heavy, so I detect mobile devices and lower the max FPS to save battery:

```javascript
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

const defaultFps = useMemo(() => {
  if (typeof navigator === "undefined") return 30;
  const ua = navigator.userAgent;
  const isMobile = isMobile;
  return isMobile ? 20 : 30;
}, []);
```

My animation loop then throttles itself to `defaultFps`. I also ensure to `cancelAnimationFrame` and `disconnect` observers on cleanup to avoid memory leaks:

```javascript
useEffect(() => {
  return () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    resizeObserver?.disconnect();
  };
}, [backgroundConfig, animate, isPreview, generators]);
```

>Phew, that was a lot. If you're still reading, Thank you! This took countless nights to prepare. Read on!

## State Management & Data Flow

The app’s state is mostly context-driven. At the top level, I wrap everything with the providers:

```javascript
function App() {
  return (
    <ThemeProvider>
      <BackgroundProvider>
        <Router>
          {showLanding ? (
            <LandingPage onEnter={handleEnter} />
          ) : (
            <AppContent />
          )}
        </Router>
      </BackgroundProvider>
    </ThemeProvider>
  );
}
```

This way, any component can access theme or background settings via hooks like `useTheme()` or `useBackground()`. No Redux needed, just context and hooks.

### Content Security

I also took care not to screw up anyone’s privacy. There’s **no Google Analytics** or trackers. All fonts are served locally (no cross-site requests). The only external script is the PDF worker from unpkg, everything else is self-contained.

```javascript
{
  "scripts": {
    "start": "cross-env BROWSER=none WDS_SOCKET_PORT=0 react-app-rewired start",
    "build": "react-app-rewired build",
    "test": "react-app-rewired test"
  }
}
```

:::tip
Note

I set `BROWSER=none` so the dev server doesn’t auto-open a browser, and fixed the `WDS_SOCKET_PORT` to avoid conflicts on some machines. The `cross-env` is there just to make environment variables work across platforms.
:::

## Final Thoughts

Alright, that covers the entire codebase, from graphics to input to those hidden games. 

<mark>In summary</mark>

I’ve laid bare every skeleton in the closet. If you’ve read this far, **please** fork the repo and send a PR if you see anything amiss or have ideas. Issues and contributions live on GitHub, and trust me, every little fix or suggestion is welcome.

Looking back, I never imagined getting from [log_0000 Boot Sequence](http://ujjwalvivek.com/blog/log_0000_boot_sequence.md) to here so quickly. Each post has been an improvisation jam session, and now you can jam with me.

:::warning
If you’ve made it this far

through the not so many ASCII diagrams and code, congrats. You’re practically a co-maintainer now. May your pull requests be ever in your favor! ⭐
:::

---
