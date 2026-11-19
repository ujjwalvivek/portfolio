// The stormtroopers on the intro (v3, after Yusuf Bakir's CodePen "Stormtrooper"). v3 drew each pixel as a box-shadow
// in fixed colours, about 83 KB of CSS; here the same three walk frames are 15 x 30 grids, one letter per pixel, drawn
// as an SVG whose fills are theme variables (about.css, .ab-px-*), so the troopers follow the palette.
// The sprite is turned on its side with its feet on the strip's dashed edge. It faces up while it walks down: v3's moonwalk.
// Wide screens only, and not with reduced motion, as about.css decides; the DOM is built either way, it is tiny.

const W = 15;
const H = 30;
const FRAMES = [
  "....aaaaa.........aaaaaaa........aabffdd........abbaaffd......babfaaaab......aaaaaaaff......baaabbbbd.......bbbbbbaa........ffffd.........baadbab........aaadbba........aaadbdb........aaadbba........bafdbba........fffdbaa.........abdbbbb........aabddddb.......fabdaddd.......fabdad..........ffaad..........dbaad..........dbaad..........fbaff..........fbff...........dfaa...........dfba..........dddba.........fdbcda.........fddcdba........dffbfbaadd..",
  "....aaaaa.........abaaaaa........aaafffd........abbaaffd......babdaaaab......aaaaaaadf......bbbbbbbbd.......bbebbbaa........effff.........aafaaa.........aaafbaa........baadbaa........baadbba........bbaddba.........dfaadd.........ffbaaaa.........fffbba........baaffa.........aaabdda........aaabdda........babbfdda.......bab..fdff.......df...fff......dff...ddb......abb..ddb.......ab..ddb........ab..dbd........ab..ddb........aaa..ddb.......bbbaddffdd.",
  "...aaaaa.........abaaaaa........aaafffd........abbaaffd......babdaaaab......aaaaaaadf......abbbbbbbd.......abebbbaa........effff..........bafaaa.........aaadbab.........aadbba.........aadbddaa.......baadaaaa.......dbfaaf.........dfbafd..........dfffd.........daaabb.........baabbba........aaa.dba........aaa.dba........aaa.dba........fff.dff........aaf.fff........abb.db........abb..db.......abb...db......dab....da.......da....dba.....ddfadd.ffdad..",
];

// One path per colour per frame, with horizontal runs merged.
function frame(rows: string): string {
  const paths = new Map<string, string>();
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      const c = rows[y * W + x] ?? ".";
      let run = 1;
      while (x + run < W && rows[y * W + x + run] === c) run++;
      if (c !== ".") paths.set(c, (paths.get(c) ?? "") + `M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  return [...paths].map(([c, d]) => `<path class="ab-px-${c}" d="${d}"/>`).join("");
}

// matrix(0 -1 1 0 0 15): head to the left, feet to the right, facing up (against the walk).
function sprite(): string {
  const frames = FRAMES.map((f) => `<g class="ab-frame">${frame(f)}</g>`).join("");
  return `<svg viewBox="0 0 ${H} ${W}" aria-hidden="true" focusable="false"><g transform="matrix(0 -1 1 0 0 ${W})">${frames}</g></svg>`;
}

export function mount(root: HTMLElement): () => void {
  const strip = root.querySelector<HTMLElement>("[data-ab-trooper]");
  if (!strip) return () => {};
  const svg = sprite();
  strip.innerHTML = `<div class="ab-soldier">${svg}</div><div class="ab-soldier is-mini">${svg}</div>`;
  return () => strip.replaceChildren();
}
