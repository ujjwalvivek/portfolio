// The home header scene (ADR D-012, section 12). Started as a copy of root's hero game (ADR D-013): the same LED dots,
// embers, stars, light sweep, bloom and audio engine. What differs:
//   - the text is the site's header, drawn with a full uppercase 3x5 font;
//   - the colours come from the page (set_palette), which drifts within the chosen palette; the scene owns no sky drift;
//   - v3's lemmings are actors: they drop in, walk across the tops of the letters (pressing the dots under their feet),
//     fall off the ends, are turned around by blockers on the ground, and leave at the sides to drop in again;
//   - the page can pause the scene while home is not shown, and ask for reduced motion.

use cadence::{EuclideanPattern, MarkovChain, Transport};
use core::f32::consts::TAU;
use core::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use engine::{BloomSettings, Context, GameAction, GameApp, RenderLayer, SkyParams, Vec2};
use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------------------------------------------------
// Page interface

// primary, secondary, accent, background, dominant, hsl average: six RGB colours, 0..1.
static PALETTE: [AtomicU32; 18] = [const { AtomicU32::new(0) }; 18];
static PALETTE_SET: AtomicBool = AtomicBool::new(false);
static PAUSED: AtomicBool = AtomicBool::new(false);
static REDUCED: AtomicBool = AtomicBool::new(false);

#[wasm_bindgen]
pub fn set_palette(colours: &[f32]) {
    for (slot, v) in PALETTE.iter().zip(colours.iter()) {
        slot.store(v.to_bits(), Ordering::Relaxed);
    }
    PALETTE_SET.store(true, Ordering::Relaxed);
}

#[wasm_bindgen]
pub fn set_paused(paused: bool) {
    PAUSED.store(paused, Ordering::Relaxed);
}

#[wasm_bindgen]
pub fn set_reduced_motion(reduced: bool) {
    REDUCED.store(reduced, Ordering::Relaxed);
}

#[derive(Clone, Copy)]
struct Pal {
    primary: [f32; 3],
    accent: [f32; 3],
    background: [f32; 3],
    dominant: [f32; 3],
    average: [f32; 3],
}

fn palette() -> Pal {
    if !PALETTE_SET.load(Ordering::Relaxed) {
        // root's warm end, until the page sends colours
        return Pal {
            primary: [0.25, 0.25, 0.25],
            accent: [1.0, 0.67, 0.0],
            background: [0.012, 0.012, 0.012],
            dominant: [1.0, 0.67, 0.0],
            average: [0.6, 0.5, 0.3],
        };
    }
    let c = |i: usize| {
        [
            f32::from_bits(PALETTE[i * 3].load(Ordering::Relaxed)),
            f32::from_bits(PALETTE[i * 3 + 1].load(Ordering::Relaxed)),
            f32::from_bits(PALETTE[i * 3 + 2].load(Ordering::Relaxed)),
        ]
    };
    Pal { primary: c(0), accent: c(2), background: c(3), dominant: c(4), average: c(5) }
}

fn mix(a: [f32; 3], b: [f32; 3], t: f32) -> [f32; 3] {
    [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

fn scale(a: [f32; 3], s: f32) -> [f32; 3] {
    [a[0] * s, a[1] * s, a[2] * s]
}

// ---------------------------------------------------------------------------------------------------------------------
// Scene constants

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HeaderAction {
    MoveLeft,
    MoveRight,
    Jump,
}

impl GameAction for HeaderAction {
    fn count() -> usize {
        3
    }
    fn index(&self) -> usize {
        *self as usize
    }
    fn from_index(i: usize) -> Option<Self> {
        match i {
            0 => Some(Self::MoveLeft),
            1 => Some(Self::MoveRight),
            2 => Some(Self::Jump),
            _ => None,
        }
    }
}

const W: f32 = 640.0;
const H: f32 = 360.0;
const ASSEMBLE: f32 = 1.2;
const NUM_EMBERS: usize = 120;
const NUM_STARS: usize = 260;

const LINE1: &str = "TECH ISN'T THE HARD PART";
const LINE1_Y: f32 = 112.0;
const LINE1_BLOCK: f32 = 5.0;
const LINE2: &str = "SYSTEMS, BEHAVIOUR, & QUESTIONS ARE";
const LINE2_Y: f32 = 172.0;
const LINE2_BLOCK: f32 = 3.0;
const GROUND: f32 = H - 4.0;

// Lemmings: sprite pixels are drawn at this size, and v3's 15 animation steps per second are kept.
const PX: f32 = 1.6;
const SPRITE: f32 = 10.0 * PX;
const STEP: f32 = 1.0 / 15.0;
const GRAVITY: f32 = 260.0;

// ---------------------------------------------------------------------------------------------------------------------
// Font: 3x5, every character the header needs.

const FONT: &[(char, [&str; 5])] = &[
    ('A', ["111", "101", "111", "101", "101"]),
    ('B', ["110", "101", "110", "101", "110"]),
    ('C', ["111", "100", "100", "100", "111"]),
    ('D', ["110", "101", "101", "101", "110"]),
    ('E', ["111", "100", "111", "100", "111"]),
    ('F', ["111", "100", "111", "100", "100"]),
    ('G', ["111", "100", "101", "101", "111"]),
    ('H', ["101", "101", "111", "101", "101"]),
    ('I', ["111", "010", "010", "010", "111"]),
    ('J', ["001", "001", "001", "101", "111"]),
    ('K', ["101", "110", "100", "110", "101"]),
    ('L', ["100", "100", "100", "100", "111"]),
    ('M', ["111", "111", "101", "101", "101"]),
    ('N', ["101", "111", "111", "111", "101"]),
    ('O', ["111", "101", "101", "101", "111"]),
    ('P', ["111", "101", "111", "100", "100"]),
    ('Q', ["111", "101", "101", "111", "001"]),
    ('R', ["110", "101", "110", "101", "101"]),
    ('S', ["111", "100", "111", "001", "111"]),
    ('T', ["111", "010", "010", "010", "010"]),
    ('U', ["101", "101", "101", "101", "111"]),
    ('V', ["101", "101", "101", "101", "010"]),
    ('W', ["101", "101", "101", "111", "111"]),
    ('X', ["101", "101", "010", "101", "101"]),
    ('Y', ["101", "101", "010", "010", "010"]),
    ('Z', ["111", "001", "010", "100", "111"]),
    ('\'', ["010", "010", "000", "000", "000"]),
    (',', ["000", "000", "000", "010", "100"]),
    ('.', ["000", "000", "000", "000", "010"]),
    ('&', ["010", "101", "010", "101", "011"]),
];

fn text_width(text: &str, block: f32, spacing: f32) -> f32 {
    text.chars().count() as f32 * (3.0 + spacing) * block - spacing * block
}

// ---------------------------------------------------------------------------------------------------------------------
// Lemming sprites, from v3 (codepen.io/burlapjack/pen/ZBWPVW). 0 empty, 1 white, 2 dominant colour, 3 hsl average.

const WALKER: [[&str; 10]; 8] = [
    ["0000000000", "0003333000", "0003310000", "0000111000", "0000120000", "0000120000", "0000120000", "0000220000", "0001220000", "0000110000"],
    ["0000303000", "0003330000", "0003310000", "0000111000", "0000120000", "0001220000", "0001220100", "0000220100", "0002201000", "0001100000"],
    ["0000000000", "0003030000", "0003330000", "0000310000", "0000111000", "0001120000", "0001220000", "0011222000", "0002222000", "0011001100"],
    ["0000000000", "0000330000", "0003313000", "0003111000", "0000120000", "0000120000", "0001220000", "0000220000", "0012222000", "0010011000"],
    ["0000000000", "0003333000", "0003310000", "0000111000", "0000120000", "0000210000", "0000120000", "0000220000", "0001220000", "0000110000"],
    ["0000303000", "0003330000", "0003310000", "0000111000", "0000120000", "0000210000", "0000210100", "0000220100", "0002201000", "0001100000"],
    ["0000000000", "0003030000", "0003330000", "0000310000", "0000111000", "0000210000", "0000210000", "0000221000", "0002222000", "0011001100"],
    ["0000000000", "0000330000", "0003313000", "0003111000", "0000120000", "0000120000", "0000210000", "0000220000", "0012222000", "0010011000"],
];

const BLOCKER_BASE: [&str; 10] =
    ["0003330000", "0033333000", "0033111000", "1000110001", "1111221111", "0000220000", "0000220000", "0002222000", "0002002000", "0011001100"];

// v3 animated the blocker by swapping rows 0, 1, 2 (head) and 8, 9 (feet) on certain of its 16 frames.
fn blocker_rows(frame: usize, rows: &mut [[u8; 10]; 10]) {
    let set = |rows: &mut [[u8; 10]; 10], r: usize, s: &str| {
        for (i, ch) in s.bytes().enumerate() {
            rows[r][i] = ch - b'0';
        }
    };
    match frame {
        0 => {
            set(rows, 0, "0003330000");
            set(rows, 1, "0033333000");
            set(rows, 2, "0033111000");
            set(rows, 8, "0002002000");
            set(rows, 9, "0011001100");
        }
        1 => {
            set(rows, 0, "0000330000");
            set(rows, 1, "0033333000");
            set(rows, 2, "0033311000");
        }
        2 => {
            set(rows, 0, "0000330000");
            set(rows, 1, "0003333000");
            set(rows, 2, "0033311000");
            set(rows, 8, "0002002100");
            set(rows, 9, "0011001000");
        }
        3 => {
            set(rows, 0, "0000330000");
            set(rows, 1, "0003333000");
            set(rows, 2, "0003311000");
        }
        4 | 12 => {
            set(rows, 8, "0002002000");
            set(rows, 9, "0011001100");
        }
        6 | 14 => {
            set(rows, 0, "0000330000");
            set(rows, 1, "0003333000");
            set(rows, 2, "0003113000");
            set(rows, 8, "0002002100");
            set(rows, 9, "0011001000");
        }
        8 => {
            set(rows, 0, "0000333000");
            set(rows, 1, "0003333300");
            set(rows, 2, "0001113300");
            set(rows, 8, "0002002000");
            set(rows, 9, "0011001100");
        }
        9 => {
            set(rows, 0, "0000330000");
            set(rows, 1, "0003333300");
            set(rows, 2, "0001133300");
        }
        10 => {
            set(rows, 0, "0000330000");
            set(rows, 1, "0003333000");
            set(rows, 2, "0001133300");
            set(rows, 8, "0002002100");
            set(rows, 9, "0011001000");
        }
        11 => {
            set(rows, 0, "0000330000");
            set(rows, 1, "0003333000");
            set(rows, 2, "0001133000");
        }
        _ => {}
    }
}

fn parse_rows(src: &[&str; 10]) -> [[u8; 10]; 10] {
    let mut rows = [[0u8; 10]; 10];
    for (r, s) in src.iter().enumerate() {
        for (i, ch) in s.bytes().enumerate() {
            rows[r][i] = ch - b'0';
        }
    }
    rows
}

#[derive(Clone, Copy, PartialEq)]
enum Pose {
    Walk { ledge: usize },
    Fall { vy: f32 },
}

struct Walker {
    x: f32, // left edge
    y: f32, // feet
    dir: f32,
    frame: usize,
    pose: Pose,
    ground: f32, // seconds spent on the ground
    stay: f32,   // how long this one stays down before dropping onto the letters again
}

struct Blocker {
    x: f32,
    frame: usize,
    rows: [[u8; 10]; 10],
}

// A surface a lemming can stand on: [x0, x1] at height y.
#[derive(Clone, Copy)]
struct Ledge {
    x0: f32,
    x1: f32,
    y: f32,
}

// ---------------------------------------------------------------------------------------------------------------------
// Dots, embers, stars (root's)

#[derive(Clone, Copy)]
struct Dot {
    x: f32,
    y: f32,
    from_x: f32,
    from_y: f32,
    size: f32,
    delay: f32,
    phase: f32,
    accent: bool,
    press: f32,
}

#[derive(Clone, Copy)]
struct Ember {
    origin_x: f32,
    origin_y: f32,
    phase: f32,
    phase_speed: f32,
    drift_x: f32,
    speed: f32,
    size: f32,
    life: f32,
    lifetime: f32,
    shade: f32,
}

#[derive(Clone, Copy)]
struct Star {
    x: f32,
    y: f32,
    phase: f32,
    speed: f32,
}

fn rand_range(rng: &mut u32, lo: f32, hi: f32) -> f32 {
    *rng = rng.wrapping_mul(1664525).wrapping_add(1013904223);
    let t = (*rng >> 9) as f32 / 8388607.0;
    lo + t * (hi - lo)
}

fn spawn_ember(rng: &mut u32, cx: f32, cy: f32, sx: f32, sy: f32, life: f32) -> Ember {
    Ember {
        origin_x: cx + rand_range(rng, -sx, sx),
        origin_y: cy + rand_range(rng, -sy, sy),
        phase: rand_range(rng, 0.0, 1.0),
        phase_speed: rand_range(rng, 0.4, 1.2),
        drift_x: rand_range(rng, -6.0, 6.0),
        speed: rand_range(rng, 15.0, 35.0),
        size: rand_range(rng, 1.5, 3.5),
        life,
        lifetime: rand_range(rng, 2.0, 5.0),
        shade: rand_range(rng, 0.0, 1.0),
    }
}

// Lays the text out as dots and returns one ledge per word, so lemmings walk the tops of words and drop through the gaps.
fn push_text(dots: &mut Vec<Dot>, rng: &mut u32, text: &str, y: f32, block: f32, sub_n: usize, dot: f32, accent: bool) -> Vec<Ledge> {
    let spacing = 1.5;
    let advance = (3.0 + spacing) * block;
    let width = text_width(text, block, spacing);
    let x0 = ((W - width) / 2.0).round();
    let sub = block / sub_n as f32;
    for (i, c) in text.chars().enumerate() {
        let Some((_, glyph)) = FONT.iter().find(|(ch, _)| *ch == c) else { continue };
        let x_off = x0 + i as f32 * advance;
        for (cy, row) in glyph.iter().enumerate() {
            for (cx, bit) in row.chars().enumerate() {
                if bit != '1' {
                    continue;
                }
                for sy in 0..sub_n {
                    for sx in 0..sub_n {
                        let px = x_off + cx as f32 * block + sx as f32 * sub + (sub - dot) / 2.0;
                        let py = y + cy as f32 * block + sy as f32 * sub + (sub - dot) / 2.0;
                        dots.push(Dot {
                            x: px,
                            y: py,
                            from_x: px + rand_range(rng, -70.0, 70.0),
                            from_y: py - rand_range(rng, 50.0, 190.0),
                            size: dot,
                            delay: (px / W) * 0.6 + rand_range(rng, 0.0, 0.35),
                            phase: rand_range(rng, 0.0, 1.0),
                            accent,
                            press: 0.0,
                        });
                    }
                }
            }
        }
    }
    let mut ledges = Vec::new();
    let mut start: Option<usize> = None;
    let chars: Vec<char> = text.chars().collect();
    for i in 0..=chars.len() {
        let space = i == chars.len() || chars[i] == ' ';
        match (space, start) {
            (false, None) => start = Some(i),
            (true, Some(s0)) => {
                ledges.push(Ledge { x0: x0 + s0 as f32 * advance, x1: x0 + (i - 1) as f32 * advance + 3.0 * block, y });
                start = None;
            }
            _ => {}
        }
    }
    let _ = width;
    ledges
}

// ---------------------------------------------------------------------------------------------------------------------

pub struct HeaderGame {
    dots: Vec<Dot>,
    embers: Vec<Ember>,
    stars: Vec<Star>,
    ledges: Vec<Ledge>,
    walkers: Vec<Walker>,
    blockers: Vec<Blocker>,
    walker_rows: [[[u8; 10]; 10]; 8],
    step_clock: f32,
    rng: u32,
    time: f32,
}

impl HeaderGame {
    fn drop_in(&mut self, i: usize) {
        let ledges = self.ledges.clone();
        let rng = &mut self.rng;
        // Drop above a word, chosen in proportion to its width, so arrivals spread over the whole header.
        let total: f32 = ledges.iter().map(|l| l.x1 - l.x0).sum();
        let mut pick = rand_range(rng, 0.0, total);
        let mut ledge = ledges[0];
        for l in &ledges {
            ledge = *l;
            pick -= l.x1 - l.x0;
            if pick <= 0.0 {
                break;
            }
        }
        let x = rand_range(rng, ledge.x0, ledge.x1) - SPRITE / 2.0;
        let w = &mut self.walkers[i];
        w.x = x;
        w.y = -rand_range(rng, 10.0, 80.0);
        w.dir = if rand_range(rng, 0.0, 1.0) < 0.5 { -1.0 } else { 1.0 };
        w.frame = 0;
        w.pose = Pose::Fall { vy: 0.0 };
        w.ground = 0.0;
        w.stay = rand_range(rng, 6.0, 14.0);
    }

    fn step_walkers(&mut self) {
        let ledges = self.ledges.clone();
        let blockers: Vec<f32> = self.blockers.iter().map(|b| b.x).collect();
        let mut respawn = Vec::new();
        for (i, w) in self.walkers.iter_mut().enumerate() {
            if let Pose::Walk { ledge } = w.pose {
                w.frame = (w.frame + 1) % 8;
                w.x += w.dir * PX;
                let centre = w.x + SPRITE / 2.0;
                if ledge == usize::MAX {
                    // ground: turn at the frame's edges and at blockers; after a while, drop back onto the letters
                    if w.x <= 0.0 {
                        w.dir = 1.0;
                    } else if w.x >= W - SPRITE {
                        w.dir = -1.0;
                    }
                    w.ground += STEP;
                    if w.ground > w.stay {
                        respawn.push(i);
                        continue;
                    }
                    for &bx in &blockers {
                        let ahead = if w.dir > 0.0 { w.x + SPRITE } else { w.x };
                        if ahead > bx + 2.0 && ahead < bx + SPRITE - 2.0 {
                            w.dir = -w.dir;
                            w.x += w.dir * PX * 2.0;
                        }
                    }
                } else {
                    let l = ledges[ledge];
                    if centre < l.x0 || centre > l.x1 {
                        w.pose = Pose::Fall { vy: 0.0 };
                    }
                }
            }
        }
        for i in respawn {
            self.drop_in(i);
        }
    }

    fn update_falls(&mut self, dt: f32) {
        let ledges = self.ledges.clone();
        for w in self.walkers.iter_mut() {
            if let Pose::Fall { vy } = w.pose {
                let nvy = vy + GRAVITY * dt;
                let ny = w.y + nvy * dt;
                let centre = w.x + SPRITE / 2.0;
                let mut landed = None;
                for (li, l) in ledges.iter().enumerate() {
                    if w.y <= l.y && ny >= l.y && centre >= l.x0 && centre <= l.x1 {
                        landed = Some((li, l.y));
                        break;
                    }
                }
                if let Some((li, y)) = landed {
                    w.y = y;
                    w.pose = Pose::Walk { ledge: li };
                } else if ny >= GROUND {
                    w.y = GROUND;
                    w.pose = Pose::Walk { ledge: usize::MAX };
                } else {
                    w.y = ny;
                    w.pose = Pose::Fall { vy: nvy };
                }
            }
        }
    }

    // Dots under a lemming's feet sink a little and spring back.
    fn press_dots(&mut self, dt: f32) {
        let feet: Vec<(f32, f32)> = self
            .walkers
            .iter()
            .filter(|w| matches!(w.pose, Pose::Walk { ledge } if ledge != usize::MAX))
            .map(|w| (w.x + SPRITE / 2.0, w.y))
            .collect();
        let decay = (-dt * 6.0).exp();
        for d in self.dots.iter_mut() {
            d.press *= decay;
            for &(fx, fy) in &feet {
                if (d.x - fx).abs() < 5.0 && d.y >= fy - 1.0 && d.y < fy + 7.0 {
                    d.press = d.press.max(1.8);
                }
            }
        }
    }

    fn draw_sprite(ctx: &mut Context<HeaderAction>, rows: &[[u8; 10]; 10], x: f32, y_top: f32, flip: bool, pal: &Pal) {
        let white = [0.93, 0.9, 0.84];
        for (r, row) in rows.iter().enumerate() {
            for (c, &v) in row.iter().enumerate() {
                if v == 0 {
                    continue;
                }
                let col = match v {
                    1 => white,
                    2 => pal.dominant,
                    _ => pal.average,
                };
                let cx = if flip { 9 - c } else { c };
                ctx.draw_rect_layer(
                    RenderLayer::World,
                    Vec2::new(x + cx as f32 * PX, y_top + r as f32 * PX),
                    Vec2::new(PX + 0.3, PX + 0.3),
                    [col[0], col[1], col[2], 1.0],
                );
            }
        }
    }
}

impl GameApp for HeaderGame {
    type Action = HeaderAction;

    fn internal_resolution() -> (u32, u32) {
        (640, 360)
    }

    fn wasm_ready_event() -> Option<&'static str> {
        Some("header:first-frame")
    }

    fn init(ctx: &mut Context<HeaderAction>) -> Self {
        ctx.show_perf_hud = false;
        ctx.bloom = BloomSettings { enabled: true, threshold: 0.62, intensity: 0.5, radius: 2.0 };
        let mut rng = 20260918u32;

        let mut dots = Vec::new();
        let mut ledges = push_text(&mut dots, &mut rng, LINE1, LINE1_Y, LINE1_BLOCK, 3, 1.3, false);
        ledges.extend(push_text(&mut dots, &mut rng, LINE2, LINE2_Y, LINE2_BLOCK, 2, 1.2, true));

        let mut embers = Vec::with_capacity(NUM_EMBERS);
        for i in 0..NUM_EMBERS {
            let (cx, cy, sx, sy) = if i % 2 == 0 { (W / 2.0, LINE1_Y + 14.0, 260.0, 14.0) } else { (W / 2.0, LINE2_Y + 8.0, 230.0, 8.0) };
            embers.push(spawn_ember(&mut rng, cx, cy, sx, sy, i as f32 / NUM_EMBERS as f32));
        }
        let stars = (0..NUM_STARS)
            .map(|_| Star {
                x: rand_range(&mut rng, 0.0, W),
                y: rand_range(&mut rng, 0.0, H),
                phase: rand_range(&mut rng, 0.0, 1.0),
                speed: rand_range(&mut rng, 0.15, 0.7),
            })
            .collect();

        // v3 placed two blockers and four walkers; here the blockers hold the ground and the walkers start on the letters.
        let blockers = [W * 0.3, W * 0.72]
            .iter()
            .map(|&x| Blocker { x, frame: 0, rows: parse_rows(&BLOCKER_BASE) })
            .collect();
        let walker_rows = [0, 1, 2, 3, 4, 5, 6, 7].map(|i| parse_rows(&WALKER[i]));

        let mut game = HeaderGame {
            dots,
            embers,
            stars,
            ledges,
            walkers: Vec::new(),
            blockers,
            walker_rows,
            step_clock: 0.0,
            rng,
            time: 0.0,
        };
        for i in 0..6 {
            game.walkers.push(Walker { x: 0.0, y: 0.0, dir: 1.0, frame: 0, pose: Pose::Fall { vy: 0.0 }, ground: 0.0, stay: 8.0 });
            game.drop_in(i);
            // stagger the first arrivals so they land after the letters have assembled
            game.walkers[i].y -= 120.0 + i as f32 * 90.0;
        }
        game
    }

    fn update(&mut self, ctx: &mut Context<HeaderAction>) {
        if PAUSED.load(Ordering::Relaxed) {
            return;
        }
        let dt = ctx.delta_time.min(0.05);
        if REDUCED.load(Ordering::Relaxed) {
            // assembled at once, nothing moves; lemmings stand where they would have landed
            self.time = self.time.max(ASSEMBLE + 1.0);
            let ledges = self.ledges.clone();
            for w in self.walkers.iter_mut() {
                if matches!(w.pose, Pose::Fall { .. }) {
                    let centre = w.x + SPRITE / 2.0;
                    match ledges.iter().position(|l| centre >= l.x0 && centre <= l.x1) {
                        Some(li) => {
                            w.y = ledges[li].y;
                            w.pose = Pose::Walk { ledge: li };
                        }
                        None => {
                            w.y = GROUND;
                            w.pose = Pose::Walk { ledge: usize::MAX };
                        }
                    }
                }
            }
            return;
        }
        self.time += dt;

        self.step_clock += dt;
        while self.step_clock >= STEP {
            self.step_clock -= STEP;
            if self.time > ASSEMBLE {
                self.step_walkers();
            }
            for b in self.blockers.iter_mut() {
                b.frame = (b.frame + 1) % 16;
                blocker_rows(b.frame, &mut b.rows);
            }
        }
        if self.time > ASSEMBLE * 0.5 {
            self.update_falls(dt);
        }
        self.press_dots(dt);

        for e in self.embers.iter_mut() {
            e.life += dt / e.lifetime;
            if e.life >= 1.0 {
                let line = rand_range(&mut self.rng, 0.0, 1.0) < 0.5;
                let (cy, sx, sy) = if line { (LINE1_Y + 14.0, 260.0, 14.0) } else { (LINE2_Y + 8.0, 230.0, 8.0) };
                *e = spawn_ember(&mut self.rng, W / 2.0, cy, sx, sy, 0.0);
            }
        }
    }

    fn render(&mut self, ctx: &mut Context<HeaderAction>) {
        if PAUSED.load(Ordering::Relaxed) {
            return;
        }
        let pal = palette();
        let reduced = REDUCED.load(Ordering::Relaxed);

        for s in &self.stars {
            let a = 0.10 + 0.32 * (0.5 + 0.5 * (self.time * s.speed * TAU + s.phase * TAU).sin());
            ctx.draw_rect_layer(RenderLayer::Background, Vec2::new(s.x, s.y), Vec2::new(1.0, 1.0), [0.65, 0.65, 0.75, a]);
        }

        let text = [1.0, 0.96, 0.88];
        let sweep_x = if reduced || self.time < ASSEMBLE + 1.2 { -1000.0 } else { -60.0 + ((self.time - ASSEMBLE - 1.2) * 110.0) % 900.0 };
        for d in &self.dots {
            let base = if d.accent { mix(pal.dominant, text, 0.25) } else { text };
            let t = ((self.time - d.delay) / ASSEMBLE).clamp(0.0, 1.0);
            if t <= 0.0 {
                continue;
            }
            let e = 1.0 - (1.0 - t).powi(3);
            let x = d.from_x + (d.x - d.from_x) * e;
            let y = d.from_y + (d.y - d.from_y) * e + d.press;
            let twinkle = if reduced { 1.0 } else { 0.84 + 0.16 * (self.time * 2.3 + d.phase * TAU).sin() };
            let dx = (d.x - sweep_x) / 24.0;
            let sweep = (-dx * dx).exp();
            let lum = twinkle + sweep * 0.7 + d.press * 0.15;
            ctx.draw_rect_layer(
                RenderLayer::World,
                Vec2::new(x, y),
                Vec2::new(d.size, d.size),
                [(base[0] * lum).min(1.0), (base[1] * lum).min(1.0), (base[2] * lum).min(1.0), t],
            );
            let g = d.size * 2.4;
            let off = (g - d.size) / 2.0;
            let glow = mix(base, pal.dominant, 0.5);
            ctx.draw_rect_additive(Vec2::new(x - off, y - off), Vec2::new(g, g), [glow[0], glow[1], glow[2], t * (0.05 + sweep * 0.22)]);
        }

        if !reduced {
            for e in &self.embers {
                let t = e.life;
                let wobble = (t * e.phase_speed * TAU + e.phase * TAU).sin() * 12.0;
                let x = e.origin_x + wobble + e.drift_x * t;
                let y = e.origin_y - t * e.speed * e.lifetime + (t * 3.0).sin() * 4.0;
                let alpha = (t * 4.0).min(1.0) * ((1.0 - t) * 3.0).min(1.0) * 0.7;
                let s = e.size * (1.0 - t * 0.2);
                let c = mix(pal.accent, pal.dominant, e.shade);
                ctx.draw_rect_additive(Vec2::new(x, y), Vec2::new(s, s), [c[0], c[1], c[2], alpha]);
            }
        }

        for b in &self.blockers {
            Self::draw_sprite(ctx, &b.rows, b.x, GROUND - SPRITE, false, &pal);
        }
        for w in &self.walkers {
            if w.y < -SPRITE {
                continue;
            }
            let rows = match w.pose {
                Pose::Walk { .. } => &self.walker_rows[w.frame],
                Pose::Fall { .. } => &self.walker_rows[0],
            };
            Self::draw_sprite(ctx, rows, w.x, w.y - SPRITE, w.dir < 0.0, &pal);
        }
    }

    fn ui(&mut self, _egui_ctx: &engine::egui::Context, _ctx: &mut Context<Self::Action>, scene_params: &mut engine::SceneParams) {
        let pal = palette();
        // The haze fades up from the site's near-black over the first seconds, then follows the page palette.
        let f = (self.time / 7.0).clamp(0.0, 1.0);
        let theme = [0.010, 0.010, 0.010];
        let bg = mix(pal.background, theme, 0.5);
        scene_params.background_color = scale(mix(pal.background, [0.04, 0.04, 0.04], 0.5), 1.0);
        scene_params.sky = SkyParams {
            enabled: true,
            horizon_glow: 0.3 + 0.6 * f,
            top_color: mix(theme, mix(bg, pal.primary, 0.03), f),
            horizon_color: mix(theme, scale(pal.accent, 0.14), f),
            bottom_color: mix(theme, mix(bg, pal.accent, 0.012), f),
            horizon_y: 0.52,
            horizon_width: 0.42,
        };
        scene_params.fog_color = scale(pal.accent, 0.1);
        scene_params.fog_density = 8.0;
        scene_params.fog_opacity = 0.45;
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Audio: root's procedural engine, unchanged (music toggle, UI hover and click).

#[wasm_bindgen]
pub struct AudioEngine {
    transport: Transport,
    sample_rate: f32,
    kick_pat: EuclideanPattern<16>,
    synth_pat: EuclideanPattern<16>,
    kick_phase: f32,
    kick_env: f32,
    synth_phase1: f32,
    synth_phase2: f32,
    synth_freq: f32,
    synth_env: f32,
    filter_state: f32,
    sub_phase: f32,
    delay_line: Vec<f32>,
    delay_idx: usize,
    markov: MarkovChain<8>,
    lfsr: u32,
    ui_hover_phase: f32,
    ui_hover_env: f32,
    ui_click_env: f32,
    ui_click_seed: u32,
    music_muted: bool,
    hat_pat: EuclideanPattern<16>,
    hat_env: f32,
    hat_seed: u32,
    pad_phases: [f32; 3],
    pad_env: f32,
    pad_freqs: [f32; 3],
    lfo_phase: f32,
    chord_idx: usize,
    bass_freq: f32,
    snare_env: f32,
    snare_seed: u32,
    arp_phase: f32,
    arp_env: f32,
    arp_note_idx: usize,
}

#[wasm_bindgen]
impl AudioEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: u32) -> Self {
        let bpm = 80.0;
        let transport = Transport::new(sample_rate, bpm);
        let matrix = [
            [10, 30, 20, 10, 10, 10, 5, 5],
            [20, 10, 30, 20, 10, 5, 5, 0],
            [10, 20, 10, 30, 20, 10, 0, 0],
            [5, 10, 20, 10, 30, 20, 5, 0],
            [0, 5, 10, 20, 10, 30, 20, 5],
            [0, 0, 5, 10, 20, 10, 30, 25],
            [5, 0, 0, 5, 10, 20, 10, 50],
            [30, 10, 0, 0, 5, 10, 20, 25],
        ];
        let delay_samples = (sample_rate as f32 * 60.0 / bpm * 0.75) as usize;
        Self {
            transport,
            sample_rate: sample_rate as f32,
            kick_pat: EuclideanPattern::<16>::new(4, 16, 0),
            synth_pat: EuclideanPattern::<16>::new(7, 16, 2),
            kick_phase: 0.0,
            kick_env: 0.0,
            synth_phase1: 0.0,
            synth_phase2: 0.0,
            synth_freq: 110.0,
            synth_env: 0.0,
            filter_state: 0.0,
            sub_phase: 0.0,
            delay_line: vec![0.0; delay_samples],
            delay_idx: 0,
            markov: MarkovChain::new(matrix, 0),
            lfsr: 0xBEEF,
            ui_hover_phase: 0.0,
            ui_hover_env: 0.0,
            ui_click_env: 0.0,
            ui_click_seed: 123456789,
            music_muted: true,
            hat_pat: EuclideanPattern::<16>::new(8, 16, 0),
            hat_env: 0.0,
            hat_seed: 987654321,
            pad_phases: [0.0; 3],
            pad_env: 0.0,
            pad_freqs: [0.0; 3],
            lfo_phase: 0.0,
            chord_idx: 0,
            bass_freq: 55.0,
            snare_env: 0.0,
            snare_seed: 111111111,
            arp_phase: 0.0,
            arp_env: 0.0,
            arp_note_idx: 0,
        }
    }
    pub fn play_ui_click(&mut self) {
        self.ui_click_env = 1.0;
    }
    pub fn play_ui_hover(&mut self) {
        self.ui_hover_env = 1.0;
    }
    pub fn toggle_music(&mut self) {
        self.music_muted = !self.music_muted;
    }
    pub fn music_on(&self) -> bool {
        !self.music_muted
    }
    pub fn process(&mut self, output: &mut [f32]) {
        let chords: [(f32, f32, f32); 4] = [(110.0, 130.81, 164.81), (174.61, 220.0, 261.63), (130.81, 164.81, 196.0), (196.0, 246.94, 293.66)];
        let scale_notes = [110.0, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, 220.0];
        let dt = 1.0 / self.sample_rate;
        for i in 0..output.len() {
            if self.transport.tick() {
                let step = self.transport.current_step() as usize;
                if step == 0 {
                    self.chord_idx = (self.chord_idx + 1) % 4;
                    let (root, third, fifth) = chords[self.chord_idx];
                    self.pad_freqs = [root, third, fifth];
                    self.bass_freq = root * 0.5;
                }
                if self.kick_pat.is_active(step) {
                    self.kick_env = 1.0;
                }
                if self.synth_pat.is_active(step) {
                    self.lfsr ^= self.lfsr << 13;
                    self.lfsr ^= self.lfsr >> 17;
                    self.lfsr ^= self.lfsr << 5;
                    let next_state = self.markov.next(self.lfsr as u16);
                    self.synth_freq = scale_notes[next_state];
                    self.synth_env = 1.0;
                    self.pad_env = 1.0;
                }
                if step == 4 || step == 12 {
                    self.snare_env = 1.0;
                }
                if step % 2 == 0 {
                    self.arp_note_idx = (self.arp_note_idx + 1) % 3;
                    self.arp_env = 1.0;
                }
                if self.hat_pat.is_active(step) {
                    self.hat_env = 1.0;
                }
            }
            let kick_pitch = 40.0 + (self.kick_env * 120.0);
            self.kick_phase = (self.kick_phase + kick_pitch * dt) % 1.0;
            let kick_out = (self.kick_phase * TAU).sin() * self.kick_env;
            self.kick_env *= 0.9992;
            self.sub_phase = (self.sub_phase + self.bass_freq * dt) % 1.0;
            let sidechain = 1.0 - (self.kick_env * 0.8);
            let sub_out = (self.sub_phase * TAU).sin() * sidechain * 0.12;
            self.synth_phase1 = (self.synth_phase1 + self.synth_freq * dt) % 1.0;
            self.synth_phase2 = (self.synth_phase2 + (self.synth_freq * 1.01) * dt) % 1.0;
            let synth_raw = ((self.synth_phase1 * 2.0 - 1.0) + (self.synth_phase2 * 2.0 - 1.0)) * 0.5;
            let lfo = (self.lfo_phase * TAU).sin();
            self.lfo_phase = (self.lfo_phase + 0.3 * dt) % 1.0;
            let cutoff = 0.02 + (lfo + 1.0) * 0.06 + (self.synth_env * 0.15);
            self.filter_state += (synth_raw - self.filter_state) * cutoff;
            let synth_out = self.filter_state * self.synth_env;
            self.synth_env *= 0.9996;
            self.snare_seed = self.snare_seed.wrapping_mul(1664525).wrapping_add(1013904223);
            let snare_out = ((self.snare_seed as f32 / u32::MAX as f32) * 2.0 - 1.0) * self.snare_env * 0.25;
            self.snare_env *= 0.992;
            self.hat_seed = self.hat_seed.wrapping_mul(1664525).wrapping_add(1013904223);
            let hat_out = ((self.hat_seed as f32 / u32::MAX as f32) * 2.0 - 1.0) * self.hat_env * 0.08;
            self.hat_env *= 0.96;
            for ch in 0..3 {
                let detune = [1.001, 1.0, 0.999][ch];
                self.pad_phases[ch] = (self.pad_phases[ch] + self.pad_freqs[ch] * detune * dt) % 1.0;
            }
            let pad_osc = (self.pad_phases[0] * TAU).sin() * 0.15 + (self.pad_phases[1] * TAU).sin() * 0.15 + (self.pad_phases[2] * TAU).sin() * 0.10;
            let pad_out = pad_osc * self.pad_env;
            self.pad_env *= 0.9995;
            let arp_freq = self.pad_freqs[self.arp_note_idx] * 2.0;
            self.arp_phase = (self.arp_phase + arp_freq * dt) % 1.0;
            let arp_osc = (self.arp_phase * TAU).sin() + 0.5 * ((self.arp_phase * 2.0) % 1.0 * TAU).sin() + 0.3 * ((self.arp_phase * 3.0) % 1.0 * TAU).sin();
            let arp_out = arp_osc * 0.18 / 1.8 * self.arp_env;
            self.arp_env *= 0.997;
            let dry = (kick_out * 0.6) + sub_out + (synth_out * 0.5) + (pad_out * 0.35) + hat_out + snare_out + arp_out;
            let delay_read = self.delay_line[self.delay_idx];
            self.delay_line[self.delay_idx] = dry + (delay_read * 0.4);
            self.delay_idx = (self.delay_idx + 1) % self.delay_line.len();
            let mut out = if self.music_muted { 0.0 } else { (dry * 0.7) + (delay_read * 0.35) };
            let hover_pitch = 1000.0 + (self.ui_hover_env * 500.0);
            self.ui_hover_phase = (self.ui_hover_phase + hover_pitch * dt) % 1.0;
            out += (self.ui_hover_phase * TAU).sin() * self.ui_hover_env * 0.15;
            self.ui_hover_env *= 0.995;
            self.ui_click_seed = self.ui_click_seed.wrapping_mul(1664525).wrapping_add(1013904223);
            out += ((self.ui_click_seed as f32 / u32::MAX as f32) * 2.0 - 1.0) * self.ui_click_env * 0.20;
            self.ui_click_env *= 0.985;
            output[i] = out.tanh();
        }
    }
}

#[wasm_bindgen(start)]
pub fn wasm_main() {
    engine::run_wasm::<HeaderGame>();
}
