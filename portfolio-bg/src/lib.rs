// Engine API docs at https://docs.journey.ujjwalvivek.com

use engine::{BloomSettings, Context, GameAction, GameApp, Vec2};
use core::sync::atomic::{AtomicU32, AtomicU8, Ordering};
static RENDER_MODE: AtomicU8 = AtomicU8::new(0);
static DENSITY_BITS: AtomicU32 = AtomicU32::new(1.0f32.to_bits());
static SPEED_BITS: AtomicU32 = AtomicU32::new(1.0f32.to_bits());
static INTENSITY_BITS: AtomicU32 = AtomicU32::new(1.0f32.to_bits());
static ANIMATION_ENABLED: AtomicU8 = AtomicU8::new(1);

const MODE_TOPOGRAPHIC: u8 = 0;
const WIDTH: f32 = 640.0;
const HEIGHT: f32 = 360.0;
const TOPO_BASE_SPACING: f32 = 12.0;
const TOPO_NOISE_SCALE: f32 = 0.055;
const TOPO_SPEED_X: f32 = 0.3;
const TOPO_SPEED_Y: f32 = 0.2;
const TOPO_SIZE_MIN: f32 = 1.5;
const TOPO_ALPHA_MIN: f32 = 0.05;
const TOPO_ALPHA_MAX: f32 = 0.85;
const MAX_TOPO_CELLS: usize = 18_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum BgAction {
    Noop,
}

impl GameAction for BgAction {
    fn count() -> usize {
        1
    }
    fn index(&self) -> usize {
        0
    }
    fn from_index(i: usize) -> Option<Self> {
        match i {
            0 => Some(Self::Noop),
            _ => None,
        }
    }
}

const PERM: [u8; 512] = {
    const BASE: [u8; 256] = [
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30,
        69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94,
        252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171,
        168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60,
        211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1,
        216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
        164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118,
        126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170,
        213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39,
        253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
        242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49,
        192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];
    let mut table = [0u8; 512];
    let mut i = 0;
    while i < 512 {
        table[i] = BASE[i & 255];
        i += 1;
    }
    table
};

#[inline]
fn fade(t: f32) -> f32 {
    t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
}
#[inline]
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + t * (b - a)
}
#[inline]
fn grad(hash: u8, x: f32, y: f32) -> f32 {
    match hash & 3 {
        0 => x + y,
        1 => -x + y,
        2 => x - y,
        _ => -x - y,
    }
}

fn perlin2d(x: f32, y: f32) -> f32 {
    let xi = (x.floor() as i32 & 255) as usize;
    let yi = (y.floor() as i32 & 255) as usize;
    let xf = x - x.floor();
    let yf = y - y.floor();
    let u = fade(xf);
    let v = fade(yf);
    let aa = PERM[PERM[xi] as usize + yi];
    let ab = PERM[PERM[xi] as usize + yi + 1];
    let ba = PERM[PERM[xi + 1] as usize + yi];
    let bb = PERM[PERM[xi + 1] as usize + yi + 1];
    let x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1.0, yf), u);
    let x2 = lerp(grad(ab, xf, yf - 1.0), grad(bb, xf - 1.0, yf - 1.0), u);
    lerp(x1, x2, v)
}

#[inline]
fn noise2d(x: f32, y: f32) -> f32 {
    (perlin2d(x, y) + 1.0) * 0.5
}

#[inline]
fn read_atomic_f32(value: &AtomicU32, fallback: f32) -> f32 {
    let f = f32::from_bits(value.load(Ordering::Relaxed));
    if f.is_finite() {
        f
    } else {
        fallback
    }
}

#[inline]
fn write_atomic_f32(value: &AtomicU32, f: f32, min: f32, max: f32) {
    value.store(f.clamp(min, max).to_bits(), Ordering::Relaxed);
}

#[cfg(target_arch = "wasm32")]
fn dispatch_fps(fps: f32) {
    use wasm_bindgen::JsValue;
    let win = match web_sys::window() {
        Some(w) => w,
        None => return,
    };
    let init = web_sys::CustomEventInit::new();
    init.set_detail(&JsValue::from_f64(fps as f64));
    if let Ok(evt) = web_sys::CustomEvent::new_with_event_init_dict("journey:fps", &init) {
        let _ = win.dispatch_event(&evt);
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn dispatch_fps(_fps: f32) {}

struct PortfolioBg {
    time: f32,
    frame_count: u32,
}

impl GameApp for PortfolioBg {
    type Action = BgAction;

    fn window_title() -> &'static str {
        "Portfolio Background"
    }
    fn wasm_ready_event() -> Option<&'static str> {
        Some("journey:first-frame")
    }
    fn internal_resolution() -> (u32, u32) {
        (640, 360)
    }

    fn init(_ctx: &mut Context<BgAction>) -> Self {
        Self {
            time: 0.0,
            frame_count: 0,
        }
    }

    fn update(&mut self, ctx: &mut Context<BgAction>) {
        if ANIMATION_ENABLED.load(Ordering::Relaxed) != 0 {
            let speed = read_atomic_f32(&SPEED_BITS, 1.0);
            self.time += ctx.delta_time * speed;
        }
        self.frame_count += 1;

        // FPS dispatch every 30 frames
        if self.frame_count % 30 == 0 {
            dispatch_fps(ctx.fps);
        }
    }

    fn render(&mut self, ctx: &mut Context<BgAction>) {
        match RENDER_MODE.load(Ordering::Relaxed) {
            MODE_TOPOGRAPHIC => self.render_topographic(ctx),
            _ => self.render_topographic(ctx),
        }
    }

    fn ui(
        &mut self,
        _egui_ctx: &engine::egui::Context,
        ctx: &mut Context<BgAction>,
        scene_params: &mut engine::SceneParams,
    ) {
        ctx.show_perf_hud = false;
        scene_params.background_color = [0.0, 0.0, 0.0];
        scene_params.fog_enabled = false;

        ctx.override_bloom(match RENDER_MODE.load(Ordering::Relaxed) {
            MODE_TOPOGRAPHIC => BloomSettings {
                enabled: true,
                threshold: 0.05,
                intensity: 0.25,
                radius: 0.3,
            },
            
            _ => BloomSettings {
                enabled: true,
                threshold: 0.50,
                intensity: 0.25,
                radius: 1.0,
            },
        });
    }
}

impl PortfolioBg {
    fn render_topographic(&self, ctx: &mut Context<BgAction>) {
        let t = self.time;
        let density = read_atomic_f32(&DENSITY_BITS, 1.0);
        let intensity = read_atomic_f32(&INTENSITY_BITS, 1.0);
        let spacing = (TOPO_BASE_SPACING / density.sqrt()).clamp(4.0, 18.0);
        let cols = (WIDTH / spacing).ceil() as usize + 1;
        let rows = (HEIGHT / spacing).ceil() as usize + 1;
        let mut drawn = 0;

        for row in 0..rows {
            for col in 0..cols {
                if drawn >= MAX_TOPO_CELLS {
                    return;
                }

                let nx = col as f32 * TOPO_NOISE_SCALE + t * TOPO_SPEED_X;
                let ny = row as f32 * TOPO_NOISE_SCALE + t * TOPO_SPEED_Y;
                let val = noise2d(nx, ny);
                let pulse = noise2d(nx * 2.2 - t * 0.15, ny * 2.2 + t * 0.12);

                let size_max = spacing * 0.9;
                let size = TOPO_SIZE_MIN + val * pulse * (size_max - TOPO_SIZE_MIN);
                let alpha = (TOPO_ALPHA_MIN + val * (TOPO_ALPHA_MAX - TOPO_ALPHA_MIN)) * intensity;

                let x = col as f32 * spacing + (spacing - size) * 0.5;
                let y = row as f32 * spacing + (spacing - size) * 0.5;

                ctx.draw_rect(
                    Vec2::new(x, y),
                    Vec2::new(size, size),
                    [1.0, 1.0, 1.0, alpha.clamp(0.0, 1.0)],
                );
                drawn += 1;
            }
        }
    }
}

pub fn run_bg() {
    engine::run::<PortfolioBg>();
}

#[cfg(target_arch = "wasm32")]
mod wasm_entry {
    use super::*;
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen(start)]
    pub fn wasm_main() {
        engine::run_wasm::<PortfolioBg>();
    }

    #[wasm_bindgen]
    pub fn set_mode(mode: &str) {
        let m = match mode {
            "topographic" => MODE_TOPOGRAPHIC,
            _ => MODE_TOPOGRAPHIC,
        };
        RENDER_MODE.store(m, Ordering::Relaxed);
    }

    #[wasm_bindgen]
    pub fn set_density(value: f32) {
        write_atomic_f32(&DENSITY_BITS, value, 0.2, 3.0);
    }

    #[wasm_bindgen]
    pub fn set_speed(value: f32) {
        write_atomic_f32(&SPEED_BITS, value, 0.0, 4.0);
    }

    #[wasm_bindgen]
    pub fn set_intensity(value: f32) {
        write_atomic_f32(&INTENSITY_BITS, value, 0.1, 1.5);
    }

    #[wasm_bindgen]
    pub fn set_animation_enabled(enabled: bool) {
        ANIMATION_ENABLED.store(if enabled { 1 } else { 0 }, Ordering::Relaxed);
    }

    #[wasm_bindgen]
    pub fn set_music(_enabled: bool) {}
}
