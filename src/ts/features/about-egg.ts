// The hidden terminal behind About's easter egg (v3 TerminalFooter and TerminalCommands): a greeting, help / whoami /
// hint / clear, the text adventure that starts at "start", a few toys, and maximumfun / minimumfun, which switch the
// wallpaper on and off. Ctrl+L clears and the arrows walk the history (D-023); the root carries data-keys="off" so the
// site's single-key shortcuts stay quiet while typing. The terminal is one fixed height, so the page does not grow
// line by line. v3's glitch line effect (fixed-colour RGB splits) is not carried over; story lines that dimmed or
// alarmed in v3 are set dim or in the accent instead.
// "run exit" opens the crash screen (crash.ts, loaded only then), as in v3.

import { setWallpaper, wallpaperOn } from "../shell/wallpaper.js";

type Line = { kind: "in" | "out"; text: string };

const GREETINGS = [
  "Great Find! Welcome to the Terminal! Type 'help'.",
  "Now we're talking! Terminal ready. What will you 'help' create today?",
  "Nice! Magic happens here. 'help' yourself out with a command.",
  "Rare item acquired! Seek and you shall find 'help'.",
  "Still obscure? Hint: Not all commands are listed. 'help' yourself. ",
];

const STORY: Record<string, string> = {
  start: `[ SYSTEM BOOTING... ]
A faint glow hums on the terminal.

>> Type 'wake'
`,
  wake: `You awaken.

Somewhere between code and consciousness.

>> Type 'scan'
`,
  scan: `You see fragments. Logs. Memories. Systems you once trusted.

One fragment pulses softly: 'follow'

>> Type 'follow'
`,
  follow: `The fragment becomes a door labeled:

[ UNKNOWN / YOU ]

A riddle appears:
"I am the end of all beginnings,
and the beginning of all ends."

>> Type 'e', or 'ask', or 'ignore'
`,
  e: `ACCESS GRANTED.

The door opens into silence.

>> Type 'decrypt'
`,
  ask: `You ask: "Who wrote this riddle?"

The door flickers.

A voice replies:
"You did."

>> Type 'e' or 'ignore'
`,
  ignore: `You turn away.

The terminal dims.

But the prompt still lingers...

>> Type 'e'
`,
  decrypt: `Encrypted thoughts scroll across the screen.

Regrets. Versions. Untitled drafts.

Suddenly, a flashing prompt:
"INTRUDER DETECTED."

>> Type 'escape' or 'accept'
`,
  escape: `You run through recursive corridors.

The system glitches. You hear yourself thinking.

A message flickers:
"THIS LOOP HAS BEEN RUN BEFORE."

>> Type 'shutdown'
`,
  accept: `You sit still.

Letting the warnings pass.

No alarms. No running.

Just... stillness.

>> Type 'reflect' or 'escape'
`,
  reflect: `You begin to wonder:
Was this simulation really trying to trap you?

Or show you something?

...

>> Type 'run exit' or 'loop'
`,
  loop: `The story begins again.

But you remember this place.

And this time, the questions feel heavier.

>> Type 'wake'
`,
  shutdown: `System override denied.

Too many variables.

Too many unknowns.

A final prompt remains:

>> Type 'run exit', or 'wait', or 'retry'
`,
  retry: `Override failed.

The system laughs.

You can't brute-force truth.

>> Type 'run exit'
`,
  wait: `You wait.

And wait.

And the silence grows louder than the code ever was.

...

>> Type 'run exit' or 'reflect'
`,
  dream: `You let go of the keyboard.

And close your eyes.

And for a moment, you remember something that never happened.

...

>> Type 'run exit'
`,
  xyzzy: `A hollow voice says: "Nothing happens."

But deep down... something shifted.
`,
  look: `Code stretches infinitely.

But the answers aren't out there.
`,
  sing: `You hum a broken tune in binary.

Somehow, it comforts you.
`,
  cookies: `
      (\\_/)
      ( •_•)
     / >🍪   Gimme cookie!
    You found the cookie bunny!`,
  party: `🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
It's a party in your terminal!
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
`,
  cat: `
/\\_/\\
( o.o )
 > ^ <
Meow! You summoned the terminal cat.
`,
  rickroll: `Never gonna give you up,
Never gonna let you down,
Never gonna run around and desert you,
🎶 You got rickrolled in the terminal!`,
};

function tone(text: string): string {
  if (/The terminal dims|silence grows louder|You turn away/.test(text)) return " is-dim";
  if (/INTRUDER DETECTED|System override denied|Override failed/.test(text)) return " is-alert";
  if (/glitch/.test(text)) return " is-glitch";
  return "";
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function respond(cmd: string): string | null {
  const c = cmd.trim();
  const lower = c.toLowerCase();
  if (c === "") return "";
  if (lower === "run exit") {
    void import("./crash.js").then((m: { crash(reason?: string): void }) => m.crash());
    return null;
  }
  if (c === "help") return "Available commands: whoami, clear, hint";
  if (c === "whoami") return "You are a Creator! Keep Building and Exploring.";
  if (c === "hint") {
    let out = "Psst! Here's one especially for you :)\n\n>> Type 'start' to begin the journey.";
    if (!wallpaperOn()) out += "\n\n(Psst! This journey is more fun when chaos is cracked up to the max. Type 'maximumfun' to turn up the heat!)";
    out += "\n\n[Accessibility]: Some effects may be visually intense. For a calmer vibe, keep it cool or use 'minimumfun'. Use these commands anytime to switch your vibe!";
    return out;
  }
  if (c === "maximumfun") {
    if (wallpaperOn()) return "Madness Detected Already.\n\n>> Type 'start' to begin the journey. Good Luck!";
    setWallpaper(true);
    return "Madness 100.\n\n>> Type 'start' to begin the journey. Good Luck!";
  }
  if (c === "minimumfun") {
    if (!wallpaperOn()) return "Calmness Detected Already.\n\n>> Type 'start' to begin the journey. Good Luck!";
    setWallpaper(false);
    return "Calm 100.\n\n>> Type 'start' to begin the journey. Good Luck!";
  }
  return Object.hasOwn(STORY, lower) ? STORY[lower]! : `command not found: ${cmd}`;
}

export function mount(host: HTMLElement): () => void {
  const previous = [...host.childNodes];
  const root = el("div", "ab-term");
  root.dataset.keys = "off";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Terminal");

  const bar = el("div", "ab-term-bar");
  bar.append(el("span", "ab-term-title", "terminal"), el("span", "ab-term-meta", "ctrl+l clears"));
  const scroll = el("div", "ab-term-scroll");
  const log = el("div", "ab-term-log");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");
  const row = el("label", "ab-term-row");
  const input = el("input", "ab-term-input");
  input.type = "text";
  input.placeholder = "try out a command";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("aria-label", "Command");
  row.append(el("span", "ab-term-prompt", ">"), input);
  scroll.append(log, row);
  root.append(bar, scroll);

  const history: string[] = [];
  let at = -1;

  const print = (line: Line) => {
    const p = el("div", `ab-term-line is-${line.kind}${line.kind === "out" ? tone(line.text) : ""}`);
    if (line.kind === "in") p.append(el("span", "ab-term-prompt", "> "), document.createTextNode(line.text));
    else p.textContent = line.text;
    log.append(p);
    scroll.scrollTop = scroll.scrollHeight;
  };
  const clear = () => log.replaceChildren();

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      const cmd = input.value;
      input.value = "";
      at = -1;
      if (cmd.trim()) history.push(cmd);
      if (cmd.trim() === "clear") return clear();
      const out = respond(cmd);
      print({ kind: "in", text: cmd });
      if (out) print({ kind: "out", text: out });
    } else if (e.key === "l" && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      clear();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!history.length) return;
      e.preventDefault();
      if (e.key === "ArrowUp") at = at === -1 ? history.length - 1 : Math.max(0, at - 1);
      else at = at === -1 ? history.length - 1 : Math.min(history.length - 1, at + 1);
      input.value = history[at] ?? "";
    }
  };
  input.addEventListener("keydown", onKey);
  const focus = () => input.focus({ preventScroll: true });
  root.addEventListener("click", focus);

  print({ kind: "out", text: GREETINGS[Math.floor(Math.random() * GREETINGS.length)]! });
  host.replaceChildren(root);
  root.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  focus();

  return () => {
    input.removeEventListener("keydown", onKey);
    root.removeEventListener("click", focus);
    host.replaceChildren(...previous);
    host.classList.remove("is-open");
  };
}
