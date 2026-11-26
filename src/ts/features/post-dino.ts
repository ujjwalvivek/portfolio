// Dino Blink, the original (v3 DinoGame, embedded mode). The dino doesn't jump, it blinks: while space is held it
// vanishes, and on release it reappears higher the longer it was held. Same rules, speeds and obstacles as v3.
// Changes from v3: keys act only while the game has focus (v3 took space from the whole page, so space could not
// scroll a post that had the game in it); one pointerdown replaces v3's touchstart plus click, which jumped twice;
// colours come from the palette instead of fixed aqua; the stage spans the post's width instead of v3's 400px, with
// obstacles entering at its right edge and the same spacing between them, so it plays the same with more to see.

const DINO_SRC = "https://cdn.ujjwalvivek.com/images/dino.svg";
const BASE_SPEED = 200;
const SPEED_INCREMENT = 20;
const BREAK_START = 2;
const BREAK_STEP = 6;
const BREAK_COUNT = 100;

type Obstacle = { x: number; height: number; passed: boolean; el: HTMLElement };

function speedFor(score: number): number {
  if (score < BREAK_START) return BASE_SPEED;
  const steps = Math.min(BREAK_COUNT, Math.floor((score - BREAK_START) / BREAK_STEP) + 1);
  return BASE_SPEED + steps * SPEED_INCREMENT;
}

const html = `
<div class="dino-bar"><span class="dino-dots" aria-hidden="true"><i></i><i></i><i></i></span>
  <span class="dino-name">DINO BLINK GAME</span>
  <span class="dino-tip" role="tooltip">// dev was too lazy to animate, so we blink now<br>// blink mains only. titans and hunters, cope</span></div>
<div class="dino-stage" tabindex="0" role="application" aria-label="Dino Blink. Space or tap to jump.">
  <div class="dino-start"><p><span class="dino-flicker">&gt;</span> dino doesn't jump. he just blinks ahead.<br>
    <span class="dino-flicker">&gt;</span> why you ask?<br>
    <span class="dino-flicker">&gt;</span> he thinks he's a warlock. he's not.<br>
    <span class="dino-blink">&gt;</span> click or tap to start, then <u>space</u>.</p></div>
  <div class="dino-player"><img src="${DINO_SRC}" alt="" width="32" height="32" draggable="false"></div>
  <div class="dino-ground"></div>
  <div class="dino-score">0</div>
  <div class="dino-over" hidden><div class="dino-over-row"><span class="dino-dead">D.E.A.D</span><span class="dino-final">score: <b>0</b></span></div>
    <div class="dino-hint">press <u>space</u> to restart</div><div class="dino-hint is-faint">⟬tip: open your đɘʋ ĉøŋşɸʟə⟭</div></div>
</div>`;

export function mount(host: HTMLElement): () => void {
  host.innerHTML = html;
  const stage = host.querySelector<HTMLElement>(".dino-stage")!;
  const start = host.querySelector<HTMLElement>(".dino-start")!;
  const player = host.querySelector<HTMLElement>(".dino-player")!;
  const img = player.querySelector<HTMLImageElement>("img")!;
  const scoreEl = host.querySelector<HTMLElement>(".dino-score")!;
  const over = host.querySelector<HTMLElement>(".dino-over")!;
  const finalEl = over.querySelector<HTMLElement>("b")!;

  let started = false;
  let dead = false;
  let jumping = false;
  let jumpStart: number | null = null;
  let dinoY = 0;
  let score = 0;
  let obstacles: Obstacle[] = [];
  let frame = 0;
  let last = 0;
  let landTimer = 0;

  const addObstacle = (x: number, height: number) => {
    const el = document.createElement("div");
    el.className = "dino-obstacle";
    el.style.height = `${height}px`;
    stage.insertBefore(el, scoreEl);
    obstacles.push({ x, height, passed: false, el });
  };
  const reset = () => {
    obstacles.forEach((o) => o.el.remove());
    obstacles = [];
    addObstacle(stage.clientWidth, 32);
    score = 0;
    dead = false;
    draw();
  };
  const draw = () => {
    for (const o of obstacles) o.el.style.transform = `translateX(${o.x}px)`;
    player.style.transform = `translateY(${dinoY}px)`;
    img.style.opacity = jumping ? "0" : "0.9";
    scoreEl.textContent = String(score);
    over.hidden = !dead;
    finalEl.textContent = String(score);
    start.hidden = started;
  };

  const land = (power: number) => {
    dinoY = -40 - power * 40;
    clearTimeout(landTimer);
    landTimer = window.setTimeout(() => {
      dinoY = 0;
      jumping = false;
      draw();
    }, 400 + power * 100);
    draw();
  };

  const loop = (now: number) => {
    const delta = Math.min(0.1, (now - last) / 1000);
    last = now;
    const speed = speedFor(score);
    for (const o of obstacles) o.x -= speed * delta;
    const tail = obstacles.at(-1);
    const w = stage.clientWidth;
    if (!tail || tail.x < w - 200 - Math.random() * 80) addObstacle(w + Math.random() * 100, 24 + Math.floor(Math.random() * 32));
    for (const o of obstacles) {
      if (!o.passed && o.x + 10 < 0) {
        o.passed = true;
        score += 1;
      }
    }
    obstacles = obstacles.filter((o) => (o.x > -20 ? true : (o.el.remove(), false)));
    if (obstacles.some((o) => o.x < 50 && o.x > 10 && dinoY > -30 && o.height > 20)) dead = true;
    draw();
    frame = dead ? 0 : requestAnimationFrame(loop);
  };
  const run = () => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(loop);
  };

  // Press: start, restart, or begin a blink. Release ends the blink with power from how long it was held.
  const press = (instant: boolean) => {
    if (!started) {
      started = true;
      draw();
      run();
      return;
    }
    if (dead) {
      reset();
      run();
      return;
    }
    if (jumping || jumpStart !== null) return;
    jumping = true;
    if (instant) land(1);
    else {
      jumpStart = Date.now();
      draw();
    }
  };
  const release = () => {
    if (jumpStart === null) return;
    const power = Math.min(Date.now() - jumpStart, 350) / 350;
    jumpStart = null;
    land(power);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code !== "Space" && e.key !== " ") return;
    e.preventDefault();
    if (!e.repeat) press(false);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.key === " ") release();
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    // The press hides the start or game-over overlay under the pointer, and the browser's own click focus would then
    // land on that hidden overlay and fall back to the page, so space would scroll. Cancel it; the stage focuses itself.
    e.preventDefault();
    stage.focus({ preventScroll: true });
    press(true);
  };
  stage.addEventListener("keydown", onKeyDown);
  stage.addEventListener("keyup", onKeyUp);
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("blur", release);

  reset();

  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(landTimer);
    stage.removeEventListener("keydown", onKeyDown);
    stage.removeEventListener("keyup", onKeyUp);
    stage.removeEventListener("pointerdown", onPointerDown);
    stage.removeEventListener("blur", release);
    host.innerHTML = "";
  };
}
