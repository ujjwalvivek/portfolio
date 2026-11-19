// Recipes from substrate 2.1.0, vendored (scripts/vendor.mjs): the named recipes from its recipes entry, and the
// validator, parser and scene builder from its main entry, the same module the wallpaper renders with.

import type { Recipe, RecipeBook, RecipeTools } from "./recipe.js";

const RECIPES = "/vendor/substrate@2.1.0/recipes.js";
const SUBSTRATE = "/vendor/substrate@2.1.0/index.js";

let book: Promise<RecipeBook> | null = null;
let tools: Promise<RecipeTools> | null = null;

export function recipeBook(): Promise<RecipeBook> {
  book ??= (import(RECIPES) as Promise<{ recipeNames: readonly string[]; getRecipe(name: string): Recipe | undefined }>).then(
    (m) => ({ recipeNames: m.recipeNames, getRecipe: m.getRecipe }),
  );
  book.catch(() => (book = null));
  return book;
}

export function recipeTools(): Promise<RecipeTools> {
  tools ??= (import(SUBSTRATE) as Promise<RecipeTools>).then((m) => ({
    RECIPE_VERSION: m.RECIPE_VERSION,
    MAX_RECIPE_LAYERS: m.MAX_RECIPE_LAYERS,
    validateRecipe: m.validateRecipe,
    parseRecipe: m.parseRecipe,
    recipeToScene: m.recipeToScene,
  }));
  tools.catch(() => (tools = null));
  return tools;
}
