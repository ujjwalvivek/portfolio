// TEMPORARY local mirror of substrate 2.1.0's recipe support, until 2.1.0 is published and vendored (stream S1).
// Ported line for line from the substrate repo, branch "recipes":
//   validator, parseRecipe, recipeToScene  packages/substrate/src/gpu/recipe.js       (ed7a92b)
//   root, nebula, signal, getRecipe        packages/substrate/src/recipes/index.js    (aa714dd)
// The vendored 2.0.2 build has the same primitives and descriptors as 2.1.0, so validating against its
// shaderDescriptors gives the same answers. Same messages, same order, same limits.
//
// When 2.1.0 is vendored, this file becomes two imports: recipeBook() from "/vendor/substrate/recipes.js"
// (recipeNames, getRecipe) and recipeTools() from "/vendor/substrate/index.js" (RECIPE_VERSION, MAX_RECIPE_LAYERS,
// validateRecipe, parseRecipe, recipeToScene). Nothing else in the portfolio changes.

import type { Check, Recipe, RecipeBook, RecipeTools } from "./recipe.js";

const SUBSTRATE = "/vendor/substrate/index.js";

type ParamSpec = { key: string; type?: string };
type Engine = {
  compose(layers: { fn: unknown; options: Record<string, unknown> }[]): unknown;
  primitives: Record<string, unknown>;
  shaderDescriptors: { name: string; params: ParamSpec[] }[];
};

// ---- src/recipes/index.js ----

const root: Recipe = {
  recipe: 1,
  name: "root",
  layers: [
    { name: "digital-rain", opacity: 1, speed: 0.03, density: 3, params: { cellSize: 20, trailLength: 10, glyphDensity: 0.6, flicker: 15 } },
    { name: "desktop-wallpaper", opacity: 0.7, speed: 0.25, density: 3, params: {} },
    { name: "particles", opacity: 0.35, speed: 0.05, density: 3, params: { maxRadius: 1200, minRadius: 120 } },
    { name: "floating-squares", opacity: 1, speed: 0.35, density: 0, params: { minSize: 2, maxSize: 20, count: 0 } },
    { name: "vignette", opacity: 1, speed: 0, density: 0, params: { innerRadius: 0.1, outerRadius: 0.8 } },
    {
      name: "city-skyline",
      opacity: 0.25,
      speed: 2,
      density: 3,
      params: { buildingCount: 15, windowDensity: 0.5, horizon: -1, color: "background", waterDepth: 0 },
    },
  ],
};

// CANDIDATE in substrate, not yet reviewed on screen.
const nebula: Recipe = {
  recipe: 1,
  name: "nebula",
  layers: [
    { name: "pixel-nebula-stars", opacity: 1, speed: 0.4, density: 0.5, params: { starSize: 3, starSpeed: 30, nebulaStrength: 0.6, twinkle: 1 } },
    { name: "nebula-drift", opacity: 0.45, speed: 0.1, density: 0.6, params: { zoomSpeed: 0.15, zoomAmount: 0.2, zoomOffset: 1.2, brightness: 1.6 } },
    { name: "particles", opacity: 0.3, speed: 0.04, density: 2, params: { minRadius: 150, maxRadius: 900 } },
    { name: "streams", opacity: 0.25, speed: 0.3, density: 0.6, params: { trailLength: 10 } },
    { name: "vignette", opacity: 1, speed: 0, density: 0, params: { innerRadius: 0.2, outerRadius: 0.85 } },
  ],
};

// CANDIDATE in substrate, not yet reviewed on screen.
const signal: Recipe = {
  recipe: 1,
  name: "signal",
  layers: [
    { name: "laser-grid", opacity: 1, speed: 0.2, density: 0.6, params: { spacing: 140, lineWidth: 0.01, warpAmount: 3, color: "secondary" } },
    { name: "voronoi-perlin", opacity: 0.12, speed: 0.05, density: 0.6, params: { voronoiScale: 24, perlinScale: 5, noiseSpeed: 0.2, contrast: 0.6 } },
    { name: "scanlines", opacity: 0.5, speed: 1, density: 1, params: { spacing: 3, maxAlpha: 0.06, color: "primary" } },
    { name: "nodes", opacity: 0.5, speed: 0.3, density: 0.6, params: { maxDist: 0.12, nodeSize: 1.5, curveAmount: 20 } },
    { name: "sys-horizon", opacity: 0.18, speed: 0.3, density: 1, params: { horizon: 0.1, skyFade: 0.4, paneDepth: 0.05, reflectionStrength: 0.25 } },
    { name: "vignette", opacity: 1, speed: 0, density: 0, params: { innerRadius: 0.15, outerRadius: 0.85 } },
  ],
};

const recipes: Readonly<Record<string, Recipe>> = Object.freeze({ root, nebula, signal });

const book: RecipeBook = {
  recipeNames: Object.freeze(Object.keys(recipes)),
  // A fresh, mutable copy of the named recipe, or undefined if there is none.
  getRecipe(name) {
    const recipe = Object.hasOwn(recipes, name) ? recipes[name] : undefined;
    return recipe ? (JSON.parse(JSON.stringify(recipe)) as Recipe) : undefined;
  },
};

export function recipeBook(): Promise<RecipeBook> {
  return Promise.resolve(book);
}

// ---- src/gpu/recipe.js ----

const RECIPE_VERSION = 1;
const MAX_RECIPE_LAYERS = 8;

const RECIPE_KEYS = new Set(["recipe", "name", "layers"]);
const LAYER_KEYS = new Set(["name", "opacity", "speed", "density", "params"]);
const LAYER_NUMBERS = ["opacity", "speed", "density"];
const COLOR_NAMES = new Set(["primary", "secondary", "accent", "background"]);

type Obj = Record<string, unknown>;
const isPlainObject = (value: unknown): value is Obj =>
  value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export function createRecipeTools(engine: Engine): RecipeTools {
  const descriptors = new Map(
    engine.shaderDescriptors.map((descriptor) => [descriptor.name, new Map(descriptor.params.map((spec) => [spec.key, spec]))]),
  );

  function checkParam(where: string, spec: ParamSpec, value: unknown, errors: string[]): void {
    if (spec.type === "color") {
      if (typeof value === "string" && COLOR_NAMES.has(value)) return;
      if (Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3) return;
      errors.push(`${where} must be one of primary, secondary, accent, background (or 0 to 3).`);
      return;
    }
    if (spec.type === "bool") {
      if (typeof value === "boolean") return;
      if (typeof value === "number" && Number.isFinite(value)) return;
      errors.push(`${where} must be true, false or a finite number.`);
      return;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${where} must be a finite number.`);
  }

  function checkLayer(layer: unknown, index: number, errors: string[]): void {
    const at = `layers[${index}]`;
    if (!isPlainObject(layer)) {
      errors.push(`${at} must be an object.`);
      return;
    }
    for (const key of Object.keys(layer)) if (!LAYER_KEYS.has(key)) errors.push(`${at} has an unknown key "${key}".`);
    if (typeof layer.name !== "string" || !layer.name) {
      errors.push(`${at}.name must be a primitive name.`);
      return;
    }
    const specs = descriptors.get(layer.name);
    if (!specs) {
      errors.push(`${at}.name "${layer.name}" is not a known primitive.`);
      return;
    }
    const where = `${at} (${layer.name})`;
    for (const key of LAYER_NUMBERS) {
      if (!(key in layer)) continue;
      const value = layer[key];
      if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${where}.${key} must be a finite number.`);
    }
    if (!("params" in layer)) return;
    if (!isPlainObject(layer.params)) {
      errors.push(`${where}.params must be an object.`);
      return;
    }
    for (const [key, value] of Object.entries(layer.params)) {
      const spec = specs.get(key);
      if (!spec) {
        const known = [...specs.keys()];
        errors.push(
          `${where}.params.${key} is not a parameter of ${layer.name}` +
            (known.length ? ` (it takes ${known.join(", ")}).` : " (it takes none)."),
        );
        continue;
      }
      checkParam(`${where}.params.${key}`, spec, value, errors);
    }
  }

  // Returns { ok: true, errors: [] } or { ok: false, errors: [message, ...] }.
  function validateRecipe(recipe: unknown): Check {
    const errors: string[] = [];
    if (!isPlainObject(recipe)) return { ok: false, errors: ["A recipe must be a JSON object."] };
    if (recipe.recipe !== RECIPE_VERSION)
      errors.push(`Unknown recipe version ${JSON.stringify(recipe.recipe)}; this build reads version ${RECIPE_VERSION}.`);
    for (const key of Object.keys(recipe)) if (!RECIPE_KEYS.has(key)) errors.push(`Unknown key "${key}".`);
    if (typeof recipe.name !== "string" || !recipe.name) errors.push("name must be a non-empty string.");
    if (!Array.isArray(recipe.layers)) {
      errors.push("layers must be an array.");
    } else if (recipe.layers.length > MAX_RECIPE_LAYERS) {
      errors.push(`A recipe has at most ${MAX_RECIPE_LAYERS} layers; this one has ${recipe.layers.length}.`);
    } else {
      recipe.layers.forEach((layer: unknown, index: number) => checkLayer(layer, index, errors));
    }
    return { ok: errors.length === 0, errors };
  }

  // Parses pasted text as JSON (never as code) and validates it.
  function parseRecipe(text: string): Check {
    let recipe: unknown;
    try {
      recipe = JSON.parse(String(text));
    } catch (error) {
      return { ok: false, errors: [`Not valid JSON: ${(error as Error).message}`] };
    }
    const result = validateRecipe(recipe);
    return result.ok ? { ...result, recipe: recipe as Recipe } : result;
  }

  // Opacity, speed and density become layer options and params are spread in, as root's toScene does.
  function recipeToScene(recipe: Recipe): unknown {
    const { ok, errors } = validateRecipe(recipe);
    if (!ok) throw new Error(`Invalid substrate recipe:\n${errors.join("\n")}`);
    return engine.compose(
      recipe.layers.map(({ name, opacity, speed, density, params }) => {
        const options: Record<string, unknown> = {};
        if (opacity !== undefined) options.opacity = opacity;
        if (speed !== undefined) options.speed = speed;
        if (density !== undefined) options.density = density;
        return { fn: engine.primitives[name], options: { ...options, ...(params || {}) } };
      }),
    );
  }

  return { RECIPE_VERSION, MAX_RECIPE_LAYERS, validateRecipe, parseRecipe, recipeToScene };
}

let tools: Promise<RecipeTools> | null = null;

// Loads substrate (the same module the wallpaper renders with) and builds the tools on its descriptors.
export function recipeTools(): Promise<RecipeTools> {
  tools ??= (import(SUBSTRATE) as Promise<Engine>).then(createRecipeTools);
  tools.catch(() => (tools = null));
  return tools;
}
