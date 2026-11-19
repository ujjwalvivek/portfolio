// Moods: the status bar's change key. Each press moves to the next of every wallpaper and palette pairing, in an order
// shuffled once per deck, never repeating the current pairing. Without the wallpaper (off, or no WebGPU) only the palette
// changes. The full panel (vibe-switch.ts) is still there, for static or animated, the ON/OFF switch and pasted recipes.

import { emit } from "../lib/store.js";
import { currentPalette, setPalette } from "./drift.js";
import { PALETTES } from "./palettes.js";
import { RECIPES, chooseRecipe, recipeChoice, wallpaperAvailable, wallpaperOn } from "./wallpaper.js";

const LABELS: Record<string, string> = { root: "Arcology", nebula: "Nebula" };
type Mood = { recipe: string; palette: string };
let deck: Mood[] = [];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function moodLabel(): string {
  const wall = wallpaperOn() && wallpaperAvailable() ? `${LABELS[recipeChoice()] ?? recipeChoice()}, ` : "";
  return wall + currentPalette().label;
}

export function nextMood(): void {
  const walls = wallpaperOn() && wallpaperAvailable() ? RECIPES : [recipeChoice()];
  const same = (m: Mood) => m.recipe === recipeChoice() && m.palette === currentPalette().name;
  deck = deck.filter((m) => walls.includes(m.recipe) && !same(m));
  if (!deck.length) deck = shuffle(walls.flatMap((recipe) => PALETTES.map((p) => ({ recipe, palette: p.name })))).filter((m) => !same(m));
  const m = deck.shift();
  if (!m) return;
  setPalette(m.palette);
  if (m.recipe !== recipeChoice()) void chooseRecipe(m.recipe).then(() => emit("mood", { label: moodLabel() }));
  emit("mood", { label: moodLabel() });
}
