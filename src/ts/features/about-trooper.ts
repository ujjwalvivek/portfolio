// The stormtroopers on the intro (v3, after Yusuf Bakir's CodePen "Stormtrooper"). v3 drew each frame as a list of about
// 200 box-shadows and let the browser interpolate between the lists: shadow n slides from its place in one frame to its
// place in the next, with ease timing, and its colour blends along. That glide is the moonwalk. Here the same three
// lists, in v3's order, are replayed on a small canvas the same way, so it moves exactly as v3 did at a fraction of the
// size (v3's CSS was 83 KB). Colours are theme variables (about.css, --ab-px-*), read again as the palette drifts.
// The sprite lies on its side with its feet on the strip's dashed edge and faces up while it walks down.
// Wide screens only, never with reduced motion, and paused with the wallpaper off, as about.css and the code below decide.

// Each pixel is three characters: x and y in base 36 on v3's 8px grid, and a colour letter ("." is transparent).
const FRAMES = [
  "00.40a50a60a70a80a31a41a51a61a71a81a91a32a42a52b62f72f82d92d33a43b53b63a73a83f93fa3d24b34a44b54f64a74a84a94aa4b25a35a45a55a65a75a85a95fa5f26b36a46a56a66b76b86b96ba6d37b47b57b67b77b87b97aa7a48f58f68f78f88d39b49a59a69d79b89a99b3aa4aa5aa6ad7ab8ab9aa3ba4ba5ba6bd7bb8bd9bb3ca4ca5ca6cd7cb8cb9ca3db4da5df6dd7db8db9da3ef4ef5ef6ed7eb8ea9ea4fa5fb6fd7fb8fb9fbafb4ga5ga6gb7gd8gd9gdagdbgb4hf5ha6hb7hd8ha9hdahdbhd4if5ia6ib7id8ia9id5jf6jf7ja8ja9jd5kd6kb7ka8ka9kd5ld6lb7la8la9ld5mf6mb7ma8mf9mf5nf6nb7nf8nf5od6of7oa8oa5pd6pf7pb8pa4qd5qd6qd7qb8qa3rf4rd5rb6rc7rd8ra3sf4sd5sd6sc7sd8sb9sa3td4tf5tf6tb7tf8tb9taatabtdctd",
  "00.40a50a60a70a80a31a41b51a61a71a81a91a32a42a52a62f72f82f92d33a43b53b63a73a83f93fa3d24b34a44b54d64a74a84a94aa4b25a35a45a55a65a75a85a95da5f26b36b46b56b66b76b86b96ba6d37b47b57e67b77b87b97aa7a48e58f68f78f88f39a49a59f69a79a89a3aa4aa5aa6af7ab8aa9aa3bb4ba5ba6bd7bb8ba9ba3cb4ca5ca6cd7cb8cb9ca3db4db5da6dd7dd8db9da4ed5ef6ea7ea8ed9ed4ff5ff6fb7fa8fa9faafa5gf6gf7gf8gb9gbaga4hb5ha6ha7hf8hf9ha4ia5ia6ia7ib8id9idaia4ja5ja6ja7jb8jd9jdaja4kb5ka6kb7kb8kf9kdakdbka4lb5la6lb9lfaldblfclf5md6mfamfbmfcmf4nd5nf6nfandbndcnb4oa5ob6ob9odaodbob4pa5pb8pd9pdapb4qa5qb8qd9qbaqd4ra5rb8rd9rdarb4sa5sa6sa9sdasdbsb4tb5tb6tb7ta8td9tdatfbtfctddtd",
  "00.30a40a50a60a70a21a31b41a51a61a71a81a22a32a42a52f62f72f82d23a33b43b53a63a73f83f93d14b24a34b44d54a64a74a84a94b15a25a35a45a55a65a75a85d95f16a26b36b46b56b66b76b86b96d27a37b47e57b67b77b87a97a38e48f58f68f78f39b49a59f69a79a89a3aa4aa5aa6ad7ab8aa9ab4ba5ba6bd7bb8bb9ba4ca5ca6cd7cb8cd9cdacabca4db5da6da7dd8da9daadabda4ed5eb6ef7ea8ea9ef4fd5ff6fb7fa8ff9fd5gd6gf7gf8gf9gd4hd5ha6ha7ha8hb9hb4ib5ia6ia7ib8ib9ibaia4ja5ja6ja8jd9jbaja4ka5ka6ka8kd9kbaka4la5la6la8ld9lbala4mf5mf6mf8md9mfamf4na5na6nf8nf9nfanf4oa5ob6ob8od9ob3pa4pb5pb8pd9pb2qa3qb4qb8qd9qb1rd2ra3rb8rd9ra2sd3sa8sd9sbasa1td2td3tf4ta5td6td8tf9tfatdbtactd",
];
const CELL_W = 1.5; // v3's shadows were 12 x 8 boxes on an 8px grid, so neighbours overlap sideways
const SPRITE_W = 15; // upright width in grid units, 13 + 1.5 rounded up
const SPRITE_H = 30;
const SCALE = 8; // canvas pixels per grid unit
const CYCLE = 1000; // v3: anim 1s ease infinite, keyframes at 0, 33 and 66 per cent
const COLOURS = "abcdef";

type Px = { x: number; y: number; c: number }; // c: index into COLOURS, -1 transparent
const parse = (s: string): Px[] => {
  const out: Px[] = [];
  for (let i = 0; i + 2 < s.length; i += 3) {
    const c = s[i + 2] ?? ".";
    out.push({ x: parseInt(s[i] ?? "0", 36), y: parseInt(s[i + 1] ?? "0", 36), c: COLOURS.indexOf(c) });
  }
  return out;
};
const LISTS = FRAMES.map(parse);
const TRANSPARENT: Px = { x: 0, y: 0, c: -1 }; // CSS pads the shorter shadow list with this

// CSS "ease", cubic-bezier(0.25, 0.1, 0.25, 1), solved for x by Newton steps.
function ease(t: number): number {
  const bx = (u: number) => 3 * u * (1 - u) ** 2 * 0.25 + 3 * u * u * (1 - u) * 0.25 + u ** 3;
  const by = (u: number) => 3 * u * (1 - u) ** 2 * 0.1 + 3 * u * u * (1 - u) * 1 + u ** 3;
  let u = t;
  for (let i = 0; i < 6; i++) {
    const d = (bx(u + 1e-4) - bx(u)) / 1e-4 || 1;
    u = Math.min(1, Math.max(0, u - (bx(u) - t) / d));
  }
  return by(u);
}

type RGB = [number, number, number];

// Reads the six theme colours through a 1 x 1 canvas, which accepts any CSS colour syntax (color-mix, relative hsl).
function readColours(host: HTMLElement): RGB[] {
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const style = getComputedStyle(host);
  return [...COLOURS].map((k) => {
    if (!probe) return [255, 255, 255];
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = style.getPropertyValue(`--ab-px-${k}`).trim() || "#fff";
    probe.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  });
}

function draw(ctx: CanvasRenderingContext2D, time: number, colours: RGB[]): void {
  const phase = ((time % CYCLE) + CYCLE) % CYCLE / CYCLE; // 0..1 over the cycle
  const seg = Math.min(2, Math.floor(phase * 3));
  const t = ease(phase * 3 - seg);
  const from = LISTS[seg] ?? [];
  const to = LISTS[(seg + 1) % 3] ?? [];
  ctx.clearRect(0, 0, SPRITE_H * SCALE, SPRITE_W * SCALE);
  const n = Math.max(from.length, to.length);
  for (let i = 0; i < n; i++) {
    const a = from[i] ?? TRANSPARENT;
    const b = to[i] ?? TRANSPARENT;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    // premultiplied blend, as CSS does: a transparent end only fades the other colour in or out
    const ca = a.c < 0 ? null : colours[a.c];
    const cb = b.c < 0 ? null : colours[b.c];
    const alpha = (ca ? 1 - t : 0) + (cb ? t : 0);
    if (alpha <= 0) continue;
    const mix = (k: 0 | 1 | 2) => ((ca ? ca[k] * (1 - t) : 0) + (cb ? cb[k] * t : 0)) / alpha;
    ctx.fillStyle = `rgba(${mix(0) | 0},${mix(1) | 0},${mix(2) | 0},${alpha})`;
    // on its side: upright (x, y) goes to (y, SPRITE_W - x - CELL_W), head left, feet right, facing up
    ctx.fillRect(y * SCALE, (SPRITE_W - x - CELL_W) * SCALE, SCALE, CELL_W * SCALE);
  }
}

export function mount(root: HTMLElement): () => void {
  const strip = root.querySelector<HTMLElement>("[data-ab-trooper]");
  if (!strip) return () => {};
  const make = (mini: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = SPRITE_H * SCALE;
    canvas.height = SPRITE_W * SCALE;
    const wrap = document.createElement("div");
    wrap.className = mini ? "ab-soldier is-mini" : "ab-soldier";
    wrap.append(canvas);
    return { wrap, ctx: canvas.getContext("2d"), offset: mini ? 300 : 0 };
  };
  const soldiers = [make(false), make(true)];
  strip.replaceChildren(...soldiers.map((s) => s.wrap));

  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let colours = readColours(strip);
  let lastRead = 0;
  let raf = 0;
  let visible = false;
  let paused = 0; // time frozen while the wallpaper is off
  let pausedAt = 0;
  const frame = (now: number) => {
    raf = 0;
    if (!visible || still.matches) return;
    const off = document.body.classList.contains("bg-off");
    if (off && !pausedAt) pausedAt = now;
    if (!off && pausedAt) { paused += now - pausedAt; pausedAt = 0; }
    if (now - lastRead > 1000) { colours = readColours(strip); lastRead = now; }
    const t = (pausedAt || now) - paused;
    for (const s of soldiers) if (s.ctx) draw(s.ctx, t - s.offset, colours);
    raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(strip);
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    strip.replaceChildren();
  };
}
