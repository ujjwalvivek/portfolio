// Terminal mail (ADR D-019): a small TUI that walks a visitor through a subject, a body and an optional way to reply,
// then sends it through EmailJS's REST endpoint. v3's steps, prompts, sidebar, help bar and terminal cat; root's plain-DOM
// logic. Turnstile loads only when this mounts, and the send waits for its token with a promise. No artificial pauses
// (D-024): every line in the log appears the moment the work behind it is done.
//
// The EmailJS keys and the Turnstile site key are public by design.

const SERVICE_ID = "service_1uxgvw6";
const TEMPLATE_ID = "terminal_mail";
const PUBLIC_KEY = "7NdaPgOh1ikiQfrW9";
const TURNSTILE_SITE_KEY = "0x4AAAAAABmjbZtkf8GEbgrw";
const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_WAIT_MS = 10000;

type Step = "subject" | "body" | "contact_preference" | "contact_method" | "contact_info" | "ready_to_send" | "sending" | "complete";
type LineType = "user" | "system" | "prompt" | "success" | "error" | "warn" | "info";
type SideKey = "subject" | "body" | "contact" | "review" | "send";

const PROMPTS: Record<Step, { prompt: string; hint: string }> = {
  subject: { prompt: "subject", hint: "What's the subject of your message?" },
  body: { prompt: "body", hint: 'Type your message. Type "done" when finished.' },
  contact_preference: { prompt: "contact", hint: "Should I be able to contact you back? (y/n)" },
  contact_method: { prompt: "method", hint: 'Type "email" or "social"' },
  contact_info: { prompt: "info", hint: "Enter your contact details" },
  ready_to_send: { prompt: "send", hint: 'Type "send" to transmit your message' },
  sending: { prompt: "...", hint: "Processing..." },
  complete: { prompt: "done", hint: "Type 'reset' for new message" },
};

const SIDEBAR: SideKey[] = ["subject", "body", "contact", "review", "send"];
const SIDEBAR_OF: Record<Step, SideKey> = {
  subject: "subject",
  body: "body",
  contact_preference: "contact",
  contact_method: "contact",
  contact_info: "contact",
  ready_to_send: "review",
  sending: "send",
  complete: "send",
};
const JUMPABLE: SideKey[] = ["subject", "body", "contact"];

const HINTS: Partial<Record<Step, [string, string][]>> = {
  body: [['"done"', "finish body"]],
  contact_preference: [["y", "yes"], ["n", "no"]],
  contact_method: [['"email"', "email"], ['"social"', "social"]],
  ready_to_send: [['"send"', "transmit"]],
  sending: [["...", "transmitting"]],
  complete: [['"reset"', "new message"]],
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOCIAL_RE = /^(twitter|instagram|telegram|discord|linkedin)@[\w._-]+$/i;
const INTRO: [string, LineType][] = [
  ["encrypted connection established", "system"],
  [" ", "system"],
];

// The slice of Cloudflare's Turnstile API this uses.
type TurnstileOptions = {
  sitekey: string;
  size?: string;
  execution?: "render" | "execute";
  callback?: (token: string) => void;
  "error-callback"?: () => boolean | void;
  "expired-callback"?: () => void;
};
type Turnstile = {
  render(el: HTMLElement, opts: TurnstileOptions): string | undefined;
  execute(id: string): void;
  reset(id: string): void;
  remove(id: string): void;
};
declare global {
  interface Window { turnstile?: Turnstile }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// The script is global and cannot be unloaded, so it is fetched once per document; null when it cannot load.
let turnstileScript: Promise<Turnstile | null> | null = null;
function loadTurnstile(): Promise<Turnstile | null> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileScript ??= new Promise((resolve) => {
    const s = el("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => resolve(window.turnstile ?? null);
    s.onerror = () => {
      s.remove();
      turnstileScript = null;
      resolve(null);
    };
    document.head.append(s);
  });
  return turnstileScript;
}

type Verdict = { token: string } | { failed: "error" | "timeout" } | { unavailable: true };

// The invisible widget. Rendered at mount with execution "execute", so no challenge runs for a visitor who only scrolls
// past; it starts when the input first gets focus, and the send awaits whichever result comes first.
function verifier(holder: HTMLElement, log: (text: string, type: LineType) => void) {
  let api: Turnstile | null = null;
  let widget: string | null = null;
  let token = "";
  let running = false;
  let used = false;
  let gone = false;
  let waiter: ((v: Verdict) => void) | null = null;

  const settle = (v: Verdict) => {
    const w = waiter;
    waiter = null;
    w?.(v);
  };

  const ready = loadTurnstile().then((t) => {
    if (gone || !t) return;
    api = t;
    try {
      widget =
        t.render(holder, {
          sitekey: TURNSTILE_SITE_KEY,
          size: "invisible",
          execution: "execute",
          callback: (tok) => {
            running = false;
            token = tok;
            settle({ token: tok });
          },
          "error-callback": () => {
            running = false;
            token = "";
            settle({ failed: "error" });
          },
          "expired-callback": () => {
            token = "";
            log("reissuing token...", "warn");
          },
        }) ?? null;
    } catch (err) {
      console.warn("Turnstile initialization failed:", err);
      widget = null;
    }
  });

  const run = () => {
    if (!api || widget == null || running || token) return;
    running = true;
    try {
      if (used) api.reset(widget);
      used = true;
      api.execute(widget);
    } catch (err) {
      console.warn("Turnstile execute failed:", err);
      running = false;
      api = null;
      settle({ unavailable: true });
    }
  };

  return {
    // Start the challenge early (on first focus) so the token is usually there by the time "send" is typed.
    warm() {
      void ready.then(run);
    },
    async verdict(): Promise<Verdict> {
      await ready;
      if (gone || !api || widget == null) return { unavailable: true };
      if (token) return { token };
      return new Promise<Verdict>((resolve) => {
        const timer = setTimeout(() => settle({ failed: "timeout" }), TURNSTILE_WAIT_MS);
        waiter = (v) => {
          clearTimeout(timer);
          resolve(v);
        };
        run();
      });
    },
    // Tokens are single use: forget this one and let the next send ask for a fresh one.
    spend() {
      token = "";
      running = false;
    },
    destroy() {
      gone = true;
      settle({ unavailable: true });
      if (api && widget != null) {
        try {
          api.remove(widget);
        } catch {
          // the widget may already be gone with its holder
        }
      }
      api = null;
      widget = null;
    },
  };
}

export function mount(host: HTMLElement): () => void {
  let step: Step = "subject";
  let subject = "";
  let body: string[] = [];
  let needsContact = false;
  let method: "" | "email" | "social" = "";
  let info = "";
  let sending = false;
  let commands: string[] = [];
  let cursor = -1;
  let spinTimer = 0;
  let spinIndex = 0;
  let flashTimer = 0;
  let gone = false;
  const aborter = new AbortController();

  // ---- DOM ----------------------------------------------------------------------------------------------------------
  const root = el("div", "tm");
  root.dataset.keys = "off";

  const header = el("div", "tm-header");
  const dots = el("div", "tm-dots");
  dots.setAttribute("aria-hidden", "true");
  dots.append(el("i", "tm-dot tm-dot-close"), el("i", "tm-dot tm-dot-min"), el("i", "tm-dot tm-dot-max"));
  const title = el("div", "tm-title");
  title.innerHTML = '<svg class="tm-title-icon" aria-hidden="true"><use href="/icons.svg#ri-terminal-box-fill"/></svg>';
  title.append("terminalmail@ujjwalvivek");
  const status = el("span", "tm-status is-ready");
  status.setAttribute("role", "status");
  status.setAttribute("aria-label", "ready");
  header.append(dots, title, status);

  const termBody = el("div", "tm-body");

  const side = el("div", "tm-panel tm-side");
  side.append(el("div", "tm-panel-head", "jump back"));
  const sideBody = el("div", "tm-panel-body tm-side-body");
  const stepList = el("div", "tm-steps");
  const stepButtons = new Map<SideKey, HTMLButtonElement>();
  for (const key of SIDEBAR) {
    const b = el("button", "tm-step");
    b.type = "button";
    b.dataset.step = key;
    b.append(el("span", "tm-marker", "○"), el("span", "tm-step-label", key));
    stepButtons.set(key, b);
    stepList.append(b);
  }
  const catCanvas = el("canvas", "tm-cat");
  catCanvas.setAttribute("aria-hidden", "true");
  const companion = el("div", "tm-companion");
  companion.append(catCanvas);
  sideBody.append(stepList, companion);
  side.append(sideBody);

  const compose = el("div", "tm-panel tm-compose is-focus");
  compose.append(el("div", "tm-panel-head", "compose"));
  const output = el("div", "tm-output");
  output.setAttribute("role", "log");
  output.setAttribute("aria-live", "polite");
  const composeBody = el("div", "tm-panel-body");
  composeBody.append(output);
  compose.append(composeBody);

  const row = el("div", "tm-input-row");
  const prompt = el("span", "tm-prompt");
  const input = el("input", "tm-input");
  input.type = "text";
  input.name = "terminalInput";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "terminal input");
  // the wrapper lets the phone layout keep a 16px field (iOS zooms the page on smaller ones) and shrink it visually
  const inputWrap = el("div", "tm-input-wrap");
  inputWrap.append(input);
  row.append(prompt, inputWrap);

  termBody.append(side, compose, row);

  const help = el("div", "tm-help");
  const preview = el("div", "tm-preview");
  const previewSubject = el("span", "tm-value");
  const previewBody = el("span", "tm-value");
  const previewContact = el("span", "tm-value");
  for (const [label, value] of [["Subject", previewSubject], ["Body", previewBody], ["Contact", previewContact]] as const) {
    const field = el("div", "tm-field");
    field.append(el("span", "tm-label", label), value);
    preview.append(field);
  }
  const hints = el("div", "tm-hints");
  help.append(preview, hints);

  const holder = el("div", "tm-turnstile");
  holder.hidden = true;

  root.append(header, termBody, help, holder);
  host.replaceChildren(root);

  // ---- log and view -------------------------------------------------------------------------------------------------
  const say = (message: string, type: LineType = "system") => {
    output.append(el("div", `tm-line ${message.trim() ? "tm-l-" + type : "tm-blank"}`, message));
    output.scrollTop = output.scrollHeight;
  };
  const intro = () => {
    output.replaceChildren();
    for (const [text, type] of INTRO) say(text, type);
  };

  const waiting = () => el("span", "tm-waiting", "waiting...");
  const value = (node: HTMLElement, content: Node) => node.replaceChildren(content);

  const spinner = el("span", "tm-spinner", SPINNER[0]);
  const promptParts = [el("span", "tm-tilde", "~"), el("span", "tm-slash", "/"), el("span", "tm-step-name"), el("span", "tm-caret", " >")] as const;

  function render() {
    const active = SIDEBAR_OF[step];
    const activeIndex = SIDEBAR.indexOf(active);
    SIDEBAR.forEach((key, i) => {
      const b = stepButtons.get(key)!;
      const done = i < activeIndex;
      b.classList.toggle("is-active", key === active);
      b.classList.toggle("is-done", done);
      b.disabled = sending || !done || !JUMPABLE.includes(key);
      b.firstElementChild!.textContent = done || key === active ? "●" : "○";
    });

    const cfg = PROMPTS[step];
    input.placeholder = cfg.hint;
    input.disabled = sending;
    if (sending) {
      prompt.replaceChildren(spinner);
      if (!spinTimer) {
        spinTimer = window.setInterval(() => {
          spinIndex = (spinIndex + 1) % SPINNER.length;
          spinner.textContent = SPINNER[spinIndex]!;
        }, 80);
      }
    } else {
      clearInterval(spinTimer);
      spinTimer = 0;
      promptParts[2].textContent = cfg.prompt;
      prompt.replaceChildren(...promptParts);
    }
    status.className = `tm-status ${sending ? "is-sending" : "is-ready"}`;
    status.setAttribute("aria-label", sending ? "sending" : "ready");

    value(previewSubject, subject ? document.createTextNode(subject) : waiting());
    value(previewBody, body.length ? document.createTextNode(`${body.length} line${body.length === 1 ? "" : "s"}`) : waiting());
    // "none requested" only once the visitor has actually answered n (v3 showed it as soon as a subject existed)
    const declined = !needsContact && (step === "ready_to_send" || step === "sending" || step === "complete");
    value(previewContact, info ? document.createTextNode(`${method}: ${info}`) : declined ? el("span", "tm-dim", "none requested") : waiting());

    hints.replaceChildren(
      ...(HINTS[step] ?? []).map(([key, label]) => {
        const hint = el("span", "tm-hint");
        hint.append(el("kbd", "tm-key", key), el("span", "tm-hint-label", label));
        return hint;
      }),
    );
  }

  const go = (next: Step) => {
    step = next;
    render();
  };

  function flash(cls: "is-success" | "is-error") {
    root.classList.remove("is-success", "is-error");
    void root.offsetWidth;
    root.classList.add(cls);
    clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => root.classList.remove(cls), 700);
  }

  // ---- steps --------------------------------------------------------------------------------------------------------
  function reset() {
    step = "subject";
    subject = "";
    body = [];
    needsContact = false;
    method = "";
    info = "";
    sending = false;
    commands = [];
    cursor = -1;
    verify.spend();
    root.classList.remove("is-success", "is-error");
    intro();
    render();
  }

  function jump(key: SideKey) {
    if (key === "subject") {
      say(" ", "prompt");
      say("editing subject...", "system");
      go("subject");
    } else if (key === "body") {
      body = [];
      say(" ", "prompt");
      say("editing body...", "system");
      go("body");
    } else if (key === "contact") {
      method = "";
      info = "";
      needsContact = false;
      say(" ", "prompt");
      say("editing contact (y/n)...", "system");
      go("contact_preference");
    } else return;
    input.value = "";
    input.focus();
  }

  function submit() {
    const text = input.value.trim();
    if (!text) return;
    commands.push(text);
    cursor = -1;
    const lower = text.toLowerCase();
    if (step !== "body" || lower === "done") say(text, "user");
    input.value = "";
    if (lower === "reset") return reset();
    switch (step) {
      case "subject":
        if (text.length < 3) return say("minimum 3 characters", "error");
        subject = text;
        say(" ", "prompt");
        say("type your message (you can add multiple lines)", "prompt");
        return go("body");
      case "body":
        if (lower === "done") {
          if (!body.length) return say("minimum one line", "error");
          say(" ", "prompt");
          say("should i be able to contact you back? (y/n)", "prompt");
          return go("contact_preference");
        }
        body.push(text);
        say(`+ ${text}`, "info");
        return render();
      case "contact_preference":
        if (lower === "n" || lower === "no") {
          needsContact = false;
          say(" ", "prompt");
          say('ready! type "send" to transmit your message', "prompt");
          return go("ready_to_send");
        }
        if (lower === "y" || lower === "yes") {
          needsContact = true;
          say(" ", "prompt");
          say('perfect! choose one. type "email" or "social"', "prompt");
          return go("contact_method");
        }
        return say("invalid. choose one y/n", "error");
      case "contact_method":
        if (lower === "email") {
          method = "email";
          say(" ", "prompt");
          say("what's your email?", "prompt");
          return go("contact_info");
        }
        if (lower === "social") {
          method = "social";
          say(" ", "prompt");
          say("enter your socials as platform@username, like twitter@ujjwalvivekx", "prompt");
          say("Supported: twitter, instagram, telegram, discord, linkedin", "info");
          return go("contact_info");
        }
        return say('invalid. choose "email" or "social"', "error");
      case "contact_info":
        if (method === "email" && !EMAIL_RE.test(text)) {
          say(" ", "prompt");
          return say("enter a valid email address", "error");
        }
        if (method === "social" && !SOCIAL_RE.test(text)) {
          say(" ", "prompt");
          return say("use format platform@username", "error");
        }
        info = text;
        say(" ", "prompt");
        say('ready! type "send" to transmit your message', "prompt");
        return go("ready_to_send");
      case "ready_to_send":
        if (lower === "send") return void send();
        say(" ", "prompt");
        return say('invalid. type "send"', "error");
      default:
        say("invalid input", "error");
    }
  }

  async function send() {
    // the input is disabled while sending, which drops focus; hand it back after, but only to someone who was typing
    const refocus = document.activeElement === input;
    const done = (next: Step) => {
      sending = false;
      go(next);
      if (refocus) input.focus();
    };
    sending = true;
    go("sending");
    const verdict = await verify.verdict();
    if (gone) return;
    if ("failed" in verdict) {
      say(verdict.failed === "timeout" ? "timeout. try again..." : "failed. try again...", "error");
      return done("ready_to_send");
    }
    const token = "token" in verdict ? verdict.token : "";
    say(" ", "prompt");
    if (token) say("security verification completed", "success");
    else say("proceeding without verification", "warn");
    say("transmitting encrypted message...", "system");
    try {
      const res = await fetch(EMAILJS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: aborter.signal,
        body: JSON.stringify({
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: PUBLIC_KEY,
          template_params: {
            subject,
            message: body.join("\n"),
            from_name: "Website Visitor",
            reply_to: method === "email" ? info : "noreply@terminal.local",
            contact_info: needsContact ? `${method}: ${info}` : "No contact requested",
            "cf-turnstile-response": token,
          },
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      if (gone) return;
      say(" ", "prompt");
      say("thank you for reaching out!", "success");
      if (needsContact) say(`i'll get back to you on ${info}`, "info");
      say(" ", "system");
      say('type "reset" to send another message', "prompt");
      flash("is-success");
      done("complete");
    } catch (err) {
      if (gone) return;
      console.error("EmailJS error:", err);
      say('failed. type "send" to retry', "error");
      flash("is-error");
      done("ready_to_send");
    } finally {
      verify.spend();
    }
  }

  // ---- input --------------------------------------------------------------------------------------------------------
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      if (!commands.length) return;
      cursor = Math.max(-1, Math.min(commands.length - 1, cursor + (e.key === "ArrowUp" ? 1 : -1)));
      input.value = cursor >= 0 ? commands[commands.length - 1 - cursor]! : "";
    } else if (e.key === "l" && e.ctrlKey && !e.altKey && !e.metaKey) {
      // D-023: Ctrl+L clears the screen; the message so far is kept
      e.preventDefault();
      output.replaceChildren();
    }
  };
  const onComposeClick = () => {
    if (!getSelection()?.toString() && !input.disabled) input.focus();
  };
  const onStepClick = (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLButtonElement>(".tm-step");
    if (b && !b.disabled) jump(b.dataset.step as SideKey);
  };
  const onFocus = () => verify.warm();

  input.addEventListener("keydown", onKey);
  input.addEventListener("focus", onFocus, { once: true });
  compose.addEventListener("click", onComposeClick);
  stepList.addEventListener("click", onStepClick);

  const verify = verifier(holder, say);
  intro();
  render();
  const stopCat = startCat(catCanvas);

  return () => {
    gone = true;
    aborter.abort();
    clearInterval(spinTimer);
    clearTimeout(flashTimer);
    input.removeEventListener("keydown", onKey);
    input.removeEventListener("focus", onFocus);
    compose.removeEventListener("click", onComposeClick);
    stepList.removeEventListener("click", onStepClick);
    stopCat();
    verify.destroy();
    root.remove();
  };
}

// ---- the terminal cat -----------------------------------------------------------------------------------------------
// v3's pixel cat that wanders and naps in the sidebar. It animates only while it is on screen, and reads the page's
// colours from the CSS variables on every frame it draws, so it follows the palette drift.

const CAT_FONT: Record<string, string[]> = {
  T: ["xxx", ".x.", ".x.", ".x.", ".x."],
  E: ["xxx", "x..", "xx.", "x..", "xxx"],
  R: ["xx.", "x.x", "xx.", "x.x", "x.x"],
  M: ["x.x", "xxx", "x.x", "x.x", "x.x"],
  I: ["xxx", ".x.", ".x.", ".x.", "xxx"],
  N: ["x.x", "xxx", "xxx", "xxx", "x.x"],
  A: [".x.", "x.x", "xxx", "x.x", "x.x"],
  L: ["x..", "x..", "x..", "x..", "xxx"],
  C: [".xx", "x..", "x..", "x..", ".xx"],
};
const CAT_HEAD = ["xx...xx........x", "x.xxx.x........x", "x.....x.......x.", "x.x.x.xxxxx..x..", "x.....x....xxx..", ".x...x.....x....", "..xxxx.....x....", "....xxxxxxx....."];
const CAT_ART = {
  sleeping: CAT_HEAD,
  walk1: [...CAT_HEAD, ".....x.x.xxx....", ".....x.x.x.x...."],
  walk2: [...CAT_HEAD, "....x.x.xxx.....", "...x..x.x..x...."],
  zSmall: ["xx", ".x.", ".xx"],
  zMed: ["xxx.", "..x.", ".x..", ".xxx"],
  zLarge: ["xxxx.", "..x..", ".x...", ".xxxx"],
};

type RGB = [number, number, number];
function readRGB(style: CSSStyleDeclaration, name: string, fallback: RGB): RGB {
  const m = style.getPropertyValue(name).match(/(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/);
  return m ? [+m[1]!, +m[2]!, +m[3]!] : fallback;
}

function startCat(canvas: HTMLCanvasElement): () => void {
  const size = 110;
  const px = 2;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  type CatState = { type: "walk"; x: number; t: number; dir: "left" | "right" } | { type: "sleep"; t: number };
  let state: CatState = { type: "walk", x: 0, t: 0, dir: "left" };
  let colorT = 0;
  let textRGB: RGB = [238, 231, 215];
  let dominantRGB: RGB = [136, 136, 136];
  let pixelRGB: RGB = textRGB;
  let raf = 0;
  let nextFrame = 0;
  let nextTint = 0;

  const readColours = () => {
    const css = getComputedStyle(document.documentElement);
    textRGB = readRGB(css, "--text-color-rgb", textRGB);
    dominantRGB = readRGB(css, "--dynamic-dominant-color-rgb", dominantRGB);
  };

  const dot = (x: number, y: number) => ctx.fillRect(x * px, y * px, px, px);
  const art = (x0: number, y0: number, rows: string[], flip = false) =>
    rows.forEach((r, y) => {
      const chars = flip ? [...r].reverse() : [...r];
      chars.forEach((ch, x) => ch === "x" && dot(x + x0, y + y0));
    });
  const text = (x0: number, y0: number, str: string) => {
    let off = 0;
    for (const ch of str) {
      const glyph = CAT_FONT[ch];
      glyph?.forEach((r, y) => [...r].forEach((c, x) => c === "x" && dot(x0 + x + off, y0 + y)));
      off += 4;
    }
  };

  // One step of v3's animation: returns how long until the next one (100 ms walking, 500 ms asleep).
  function frame(): number {
    ctx!.clearRect(0, 0, size, size);
    ctx!.fillStyle = `rgb(${pixelRGB.join(",")})`;
    text(4, 6, "TERMINAL CAT");
    if (state.type === "sleep") {
      art(20, 32, CAT_ART.sleeping);
      if (state.t >= 1) art(28, 27, CAT_ART.zSmall);
      if (state.t >= 2) art(32, 22, CAT_ART.zMed);
      if (state.t >= 3) art(36, 18, CAT_ART.zLarge);
      state.t = (state.t + 1) % 4;
      if (Math.random() < 0.1) state = { type: "walk", x: 0, t: 0, dir: "left" };
      return 500;
    }
    art(20 + state.x, 30, state.t < 4 ? CAT_ART.walk1 : CAT_ART.walk2, state.dir === "right");
    state.t++;
    if (state.t > 8) state.t -= 8;
    state.x += state.dir === "left" ? -1 : 1;
    if (state.dir === "left" && state.x < -10) state.dir = "right";
    if (state.dir === "right" && state.x > 10) state.dir = "left";
    if (state.x === 0 && Math.random() < 0.5) state = { type: "sleep", t: 0 };
    return 100;
  }

  const ease = (t: number) => {
    const s = t * t;
    return s / (2 * (s - t) + 1);
  };
  // v3's background tween: towards the text colour while asleep, back to the dominant colour while walking.
  function tint() {
    const before = colorT;
    colorT = state.type === "sleep" ? Math.min(colorT + 0.05, 1) : Math.max(colorT - 0.05, 0);
    const t = ease(before);
    canvas.style.backgroundColor = `rgb(${dominantRGB.map((a, i) => Math.round((textRGB[i]! - a) * t + a)).join(",")})`;
    pixelRGB = colorT < 0.5 ? textRGB : dominantRGB;
  }

  function loop(now: number) {
    raf = requestAnimationFrame(loop);
    if (now < nextTint && now < nextFrame) return;
    readColours();
    if (now >= nextTint) {
      tint();
      nextTint = now + 30;
    }
    if (now >= nextFrame) nextFrame = now + frame();
  }

  if (reduced) {
    // one still frame: the cat asleep, redrawn only when it comes back on screen (the palette may have moved)
    const still = () => {
      readColours();
      state = { type: "sleep", t: 3 };
      colorT = 1;
      canvas.style.backgroundColor = `rgb(${textRGB.join(",")})`;
      pixelRGB = dominantRGB;
      frame();
    };
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && still());
    io.observe(canvas);
    return () => io.disconnect();
  }

  const io = new IntersectionObserver((entries) => {
    const visible = entries.some((e) => e.isIntersecting);
    if (visible && !raf) {
      nextFrame = nextTint = 0;
      raf = requestAnimationFrame(loop);
    } else if (!visible && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(canvas);
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    raf = 0;
  };
}
