// Home widgets, v3's four cards: the GitHub heatmap, where I am, a booking calendar and the echopoint clicker.
// Mounted lazily into its host (lib/lazy.ts). The cards are square, so the grid's height follows its width alone.
// The heatmap's colours come from the chosen palette, not from the drift: the image URL changes only on mount and when
// the palette does, so the drift never refetches it.

import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "../lib/colour.js";
import { on } from "../lib/store.js";
import { currentColours, currentPalette } from "../shell/drift.js";

const ECHOPOINT = "https://echopoint.ujjwalvivek.com";
const CLICK_WS = "wss://echopoint.ujjwalvivek.com/v1/click";
const CAL_LINK = "https://cal.com/ujjwalvivek/sayhi";
const MAP_TILE = "/media/map-blr-dark.png";
const CLICKS_KEY = "echopoint_clicks"; // v3's key, unprefixed, so returning visitors keep their count
const RECONNECT_MS = 3000;

// Survives remounts within one visit, as v3's module cache did.
let globalClicks: number | null = null;

const icon = (id: string) => `<svg class="icon" aria-hidden="true"><use href="/icons.svg#${id}"/></svg>`;

function card(title: string, iconId: string, body: string, foot: string): string {
  return `<article class="w-card">
    <h3 class="w-title">${icon(iconId)}<span>${title}</span></h3>
    ${body}
    <div class="w-foot">${foot}</div>
  </article>`;
}

function footLink(label: string, href: string, text: string): string {
  return `<span class="w-foot-label">${label}</span>
    <a class="w-link" href="${href}" target="_blank" rel="noopener noreferrer">${icon("md-outline-link")}<span>${text}</span></a>`;
}

const TEMPLATE = `<div class="widgets">
  ${card(
    "Heatmap",
    "fa-github-square",
    `<div class="w-frame w-heatmap"><img class="w-calendar" alt="GitHub contributions calendar" decoding="async"></div>`,
    `<span class="w-foot-label">Commits</span><span class="w-foot-icon">${icon("io-git-commit-sharp")}</span><span data-total>-</span>`,
  )}
  ${card(
    "Where am i",
    "md-location-pin",
    `<div class="w-frame w-map"><img class="w-map-img" src="${MAP_TILE}" alt="Bengaluru map" width="640" height="640" decoding="async"><span class="w-map-label">BENGALURU</span></div>`,
    `<span class="w-foot-label">BLR-IN</span><span class="w-foot-icon" data-daytime></span><span data-clock></span>`,
  )}
  ${card(
    "Let's Talk",
    "pi-calendar-dots-fill",
    `<div class="w-frame w-cal"><div class="cal-grid" data-days></div><div class="cal-overlay" data-overlay inert></div></div>`,
    footLink("cal.com", "https://cal.com/ujjwalvivek/sayhi", "ujjwalvivek"),
  )}
  ${card(
    "Clicker",
    "tb-click",
    `<div class="w-frame w-clicker" data-clicker><button class="w-cta" type="button" data-click>
      <span class="w-count" data-global aria-live="polite">-</span>
      <span class="w-cta-text">CLICK ME</span>
      <span class="w-personal" data-personal></span>
    </button></div>`,
    footLink("serverless", ECHOPOINT, "echopoint"),
  )}
</div>`;

// ---- heatmap ----

// v3's generateShades(dominant, 6): the dominant's hue and saturation at lightness 20 to 80; levels 0 to 4 take the first five.
function heatmapUrl(dominant: string): string {
  const { h, s } = rgbToHsl(hexToRgb(dominant));
  const levels = [0, 1, 2, 3, 4].map((i) =>
    rgbToHex(hslToRgb({ h: Math.round(h), s: Math.round(s), l: Math.round(20 + (i / 5) * 60) })).slice(1),
  );
  const q = new URLSearchParams({
    user: "ujjwalvivek",
    bg: "none",
    borderWidth: "0",
    responsive: "1",
    tight: "1",
    cellRx: "0",
    zeroColor: "131313",
  });
  levels.forEach((c, i) => q.set(`level${i}`, c));
  q.set("textColor", dominant.replace(/^#/, ""));
  return `${ECHOPOINT}/svg/calendar?${q}`;
}

type Summary = { data?: { user?: Record<string, { contributionCalendar?: { totalContributions?: number }; restrictedContributionsCount?: number } | undefined> } };

// All years since 2016, private contributions included, as v3 counted them.
async function fetchTotal(signal: AbortSignal): Promise<number> {
  const res = await fetch(`${ECHOPOINT}/v1/store/github:ujjwalvivek:summary`, { signal });
  if (!res.ok) throw new Error(`summary ${res.status}`);
  const { data } = (await res.json()) as Summary;
  let total = 0;
  for (let y = 2016; y <= new Date().getFullYear(); y++) {
    const yr = data?.user?.[`y${y}`];
    if (yr) total += (yr.contributionCalendar?.totalContributions ?? 0) + (yr.restrictedContributionsCount ?? 0);
  }
  return total;
}

// ---- where am i ----

const IST = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// v3's time-of-day icon, read from Bengaluru's hour (v3 read the visitor's own hour beside an IST clock).
function daytimeIcon(hour: number): string {
  if (hour >= 5 && hour <= 7) return "fi-sunrise";
  if (hour >= 8 && hour <= 16) return "fi-sun";
  if (hour >= 17 && hour <= 19) return "fi-sunset";
  return "pi-moon-stars-fill";
}

// ---- let's talk ----

// Canonical times in UTC: 11:00 IST = 05:30 UTC, 15:00 IST = 09:30 UTC. Labels are shown in the visitor's timezone.
const SLOTS = [
  { utcH: 5, utcM: 30, durMin: 30 },
  { utcH: 9, utcM: 30, durMin: 30 },
];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const tzAbbr = () =>
  Intl.DateTimeFormat([], { timeZoneName: "short" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value ?? "";

// The next nine days that are not Sundays, starting today.
function nextDays(): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < 9) {
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function mountCal(root: HTMLElement): () => void {
  const grid = root.querySelector<HTMLElement>("[data-days]")!;
  const overlay = root.querySelector<HTMLElement>("[data-overlay]")!;
  const days = nextDays();
  const today = days[0]!.getTime() === new Date().setHours(0, 0, 0, 0) ? days[0]!.getTime() : -1;
  const tz = tzAbbr();
  let selected = -1;

  grid.innerHTML = days
    .map(
      (d, i) =>
        `<button class="cal-cell${d.getTime() === today ? " is-today" : ""}" type="button" data-i="${i}" aria-label="${DAY_ABBR[d.getDay()]} ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}"><span class="cal-day">${DAY_ABBR[d.getDay()]}</span><span class="cal-num">${d.getDate()}</span></button>`,
    )
    .join("");
  const cells = [...grid.querySelectorAll<HTMLButtonElement>(".cal-cell")];

  const open = (i: number) => {
    const sel = days[i];
    if (!sel) return;
    selected = i;
    cells.forEach((c, j) => c.classList.toggle("is-active", j === i));
    const now = Date.now();
    const date = fmtDate(sel);
    const slots = SLOTS.map((s) => {
      const start = new Date(Date.UTC(sel.getFullYear(), sel.getMonth(), sel.getDate(), s.utcH, s.utcM));
      const end = new Date(start.getTime() + s.durMin * 60_000);
      const label = `${fmtTime(start)} – ${fmtTime(end)}`;
      return start.getTime() <= now
        ? `<span class="cal-slot is-past" aria-disabled="true">${label}</span>`
        : `<a class="cal-slot" href="${CAL_LINK}?date=${date}&slot=${date}T${pad(s.utcH)}:${pad(s.utcM)}:00.000Z" target="_blank" rel="noopener noreferrer">${label}</a>`;
    }).join("");
    overlay.innerHTML = `<button class="cal-back" type="button" aria-label="Back">${icon("io-backspace-sharp")}</button>
      <div class="cal-date">${DAY_ABBR[sel.getDay()]}, ${MONTH_ABBR[sel.getMonth()]} ${sel.getDate()}</div>
      <div class="cal-tz">${tz}</div>
      <div class="cal-slots">${slots}</div>
      <a class="cal-book" href="${CAL_LINK}?date=${date}" target="_blank" rel="noopener noreferrer">Book on cal.com ${icon("md-open-in-new")}</a>`;
    overlay.inert = false;
    overlay.classList.add("is-open");
    overlay.querySelector<HTMLElement>(".cal-back")?.focus({ preventScroll: true });
  };

  const close = () => {
    if (selected < 0) return;
    const back = overlay.contains(document.activeElement);
    overlay.classList.remove("is-open");
    overlay.inert = true;
    cells[selected]?.classList.remove("is-active");
    if (back) cells[selected]?.focus({ preventScroll: true });
    selected = -1;
  };

  const onGrid = (e: MouseEvent) => {
    const cell = (e.target as Element).closest<HTMLElement>(".cal-cell");
    if (cell) open(Number(cell.dataset.i));
  };
  const onOverlay = (e: MouseEvent) => {
    if ((e.target as Element).closest(".cal-back")) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && selected >= 0) close();
  };
  grid.addEventListener("click", onGrid);
  overlay.addEventListener("click", onOverlay);
  overlay.addEventListener("keydown", onKey);
  return () => {
    grid.removeEventListener("click", onGrid);
    overlay.removeEventListener("click", onOverlay);
    overlay.removeEventListener("keydown", onKey);
  };
}

// ---- clicker ----

function readPersonal(): number {
  try {
    return parseInt(localStorage.getItem(CLICKS_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function mountClicker(root: HTMLElement): () => void {
  const box = root.querySelector<HTMLElement>("[data-clicker]")!;
  const button = root.querySelector<HTMLButtonElement>("[data-click]")!;
  const globalText = root.querySelector<HTMLElement>("[data-global]")!.firstChild as Text;
  const personalText = root.querySelector<HTMLElement>("[data-personal]")!.appendChild(document.createTextNode(""));
  let personal = readPersonal();
  let sock: WebSocket | null = null;
  let retry = 0;
  let alive = true;
  const posts = new AbortController();

  const showPersonal = () => (personalText.data = `you've clicked ${personal} time${personal !== 1 ? "s" : ""}`);
  const setGlobal = (n: unknown) => {
    if (typeof n !== "number" || !Number.isFinite(n)) return;
    globalClicks = n;
    globalText.data = n.toLocaleString();
  };
  if (globalClicks !== null) setGlobal(globalClicks);
  showPersonal();

  // The live count: a sync message on connect and after every click anywhere. Reconnects 3 s after a drop.
  const connect = () => {
    const s = new WebSocket(CLICK_WS);
    s.onmessage = (e) => {
      try {
        const msg = JSON.parse(String(e.data)) as { type?: string; global?: unknown };
        if (msg.type === "sync") setGlobal(msg.global);
      } catch {
        // not a message we know
      }
    };
    s.onclose = () => {
      if (alive) retry = window.setTimeout(connect, RECONNECT_MS);
    };
    s.onerror = () => s.close();
    sock = s;
  };
  connect();

  const click = () => {
    personal += 1;
    try {
      localStorage.setItem(CLICKS_KEY, String(personal));
    } catch {
      // counted for this visit only
    }
    showPersonal();
    if (globalClicks !== null) setGlobal(globalClicks + 1); // optimistic; the next sync corrects it
    if (sock?.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ type: "click", count: 1 }));
      return;
    }
    // Socket down: count it over HTTP instead.
    fetch(`${ECHOPOINT}/v1/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 1 }),
      signal: posts.signal,
    })
      .then((r) => r.json() as Promise<{ global?: unknown }>)
      .then((d) => setGlobal(d.global))
      .catch(() => {});
  };
  const press = () => box.classList.add("is-pressed");
  const release = () => box.classList.remove("is-pressed");
  const releases = ["pointerup", "pointerleave", "pointercancel"] as const;
  button.addEventListener("click", click);
  button.addEventListener("pointerdown", press);
  for (const t of releases) button.addEventListener(t, release);

  return () => {
    alive = false;
    clearTimeout(retry);
    posts.abort();
    if (sock) {
      sock.onclose = sock.onerror = sock.onmessage = null;
      sock.close();
      sock = null;
    }
    button.removeEventListener("click", click);
    button.removeEventListener("pointerdown", press);
    for (const t of releases) button.removeEventListener(t, release);
  };
}

// ---- mount ----

export function mount(host: HTMLElement): () => void {
  host.innerHTML = TEMPLATE;
  const undo: (() => void)[] = [];

  // Heatmap: built now and again only when the palette changes, never on drift. It takes the accent of whichever end
  // the drift is nearer to (root runs amber to violet), so each palette has two stable URLs the browser can cache.
  const calendar = host.querySelector<HTMLImageElement>(".w-calendar")!;
  const paint = () => {
    const { a, b } = currentPalette();
    const now = hexToRgb(currentColours().accent);
    const dist = (hex: string) => {
      const c = hexToRgb(hex);
      return (c.r - now.r) ** 2 + (c.g - now.g) ** 2 + (c.b - now.b) ** 2;
    };
    const url = heatmapUrl(dist(a.accent) <= dist(b.accent) ? a.accent : b.accent);
    if (calendar.src !== url) calendar.src = url;
  };
  paint();
  undo.push(on("palette", paint));

  const total = host.querySelector<HTMLElement>("[data-total]")!.firstChild as Text;
  const summary = new AbortController();
  fetchTotal(summary.signal)
    .then((n) => (total.data = String(n)))
    .catch(() => {});
  undo.push(() => summary.abort());

  // Clock: one text node, updated on the second; the icon only when the hour changes.
  const clock = host.querySelector<HTMLElement>("[data-clock]")!.appendChild(document.createTextNode(""));
  const daytime = host.querySelector<HTMLElement>("[data-daytime]")!;
  let iconId = "";
  let timer = 0;
  const tick = () => {
    const now = new Date();
    const parts = IST.formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    clock.data = `${get("hour")}:${get("minute")}:${get("second")}`;
    const next = daytimeIcon(Number(get("hour")));
    if (next !== iconId) {
      iconId = next;
      daytime.innerHTML = icon(next);
    }
    timer = window.setTimeout(tick, 1000 - (now.getTime() % 1000) + 5);
  };
  tick();
  undo.push(() => clearTimeout(timer));

  undo.push(mountCal(host));
  undo.push(mountClicker(host));

  return () => {
    undo.forEach((u) => u());
    host.replaceChildren();
  };
}
