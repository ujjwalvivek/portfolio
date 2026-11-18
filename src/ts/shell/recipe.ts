// Recipe format v1 (ADR section 11.1). TEMPORARY: until substrate 2.1.0 ships its named recipes and validator (stream S1),
// the portfolio carries root's stack here. Once 2.1.0 is vendored this file shrinks to getRecipe("root") and recipeToScene.

export type RecipeLayer = {
  name: string;
  opacity?: number;
  speed?: number;
  density?: number;
  params?: Record<string, number | string | boolean>;
};
export type Recipe = { recipe: 1; name: string; layers: RecipeLayer[] };

export const ROOT_RECIPE: Recipe = {
  recipe: 1,
  name: "root",
  layers: [
    { name: "digital-rain", opacity: 1, speed: 0.03, density: 3, params: { cellSize: 20, trailLength: 10, glyphDensity: 0.6, flicker: 15 } },
    { name: "desktop-wallpaper", opacity: 0.7, speed: 0.25, density: 3, params: {} },
    { name: "particles", opacity: 0.35, speed: 0.05, density: 3, params: { maxRadius: 1200, minRadius: 120 } },
    { name: "floating-squares", opacity: 1, speed: 0.35, density: 0, params: { minSize: 2, maxSize: 20, count: 0 } },
    { name: "vignette", opacity: 1, speed: 0, density: 0, params: { innerRadius: 0.1, outerRadius: 0.8 } },
    { name: "city-skyline", opacity: 0.25, speed: 2, density: 3, params: { buildingCount: 15, windowDensity: 0.5, horizon: -1, color: "background", waterDepth: 0 } },
  ],
};

// The same mapping as root's toScene: opacity, speed and density become layer options, params spread in.
export function toLayers(recipe: Recipe): { name: string; options: Record<string, unknown> }[] {
  return recipe.layers.map(({ name, opacity, speed, density, params }) => {
    const options: Record<string, unknown> = { ...params };
    if (opacity !== undefined) options.opacity = opacity;
    if (speed !== undefined) options.speed = speed;
    if (density !== undefined) options.density = density;
    return { name, options };
  });
}
