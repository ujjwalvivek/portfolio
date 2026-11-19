// Recipe format v1 (ADR section 11.1), the types only. The data, the validator and recipeToScene come from substrate
// 2.1.0, vendored; recipes.ts loads them.

export type RecipeLayer = {
  name: string;
  opacity?: number;
  speed?: number;
  density?: number;
  params?: Record<string, number | string | boolean>;
};
export type Recipe = { recipe: 1; name: string; layers: RecipeLayer[] };

// validateRecipe and parseRecipe answer in this shape; parseRecipe adds the recipe when it is valid.
export type Check = { ok: boolean; errors: string[]; recipe?: Recipe };

// What the portfolio uses from substrate's recipe support.
export type RecipeBook = {
  recipeNames: readonly string[];
  getRecipe(name: string): Recipe | undefined;
};
export type RecipeTools = {
  RECIPE_VERSION: number;
  MAX_RECIPE_LAYERS: number;
  validateRecipe(recipe: unknown): Check;
  parseRecipe(text: string): Check;
  recipeToScene(recipe: Recipe): unknown;
};
