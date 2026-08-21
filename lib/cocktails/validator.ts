import type { SpiritId } from "@/app/spirits/spirits";
import type { CocktailRecipe } from "./types";

export type RecipeValidationResult =
  | { valid: true; errors: [] }
  | { valid: false; errors: string[] };

const baseIngredientMatchers: Record<SpiritId, RegExp> = {
  gin: /\bgin\b/i,
  vodka: /\bvodka\b/i,
  rum: /\b(rum|cachaça|cachaca|ron|aguardiente)\b/i,
  tequila: /\b(tequila|mezcal)\b/i,
  whisky: /\b(whisky|whiskey|bourbon|rye|scotch)\b/i,
  brandy: /\b(brandy|cognac|pisco|calvados|armagnac)\b/i,
};

export function validateCocktailRecipe(
  recipe: CocktailRecipe,
  expectedSpirit: SpiritId,
): RecipeValidationResult {
  const errors: string[] = [];

  if (!recipe.name.trim()) errors.push("Cocktail name is required.");
  if (!recipe.method.trim()) errors.push("Method is required.");
  if (!recipe.glass?.trim()) errors.push("Glass is required.");

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push("Ingredients cannot be empty.");
  } else if (recipe.ingredients.length < 2 || recipe.ingredients.length > 8) {
    errors.push("Ingredient count must be between 2 and 8.");
  }

  for (const ingredient of recipe.ingredients) {
    if (!ingredient.name.trim()) errors.push("Ingredient names cannot be empty.");
    if (
      ingredient.amountMl !== undefined &&
      (!Number.isFinite(ingredient.amountMl) || ingredient.amountMl < 0)
    ) {
      errors.push(`Invalid amount for ${ingredient.name || "ingredient"}.`);
    }
  }

  const normalizedNames = recipe.ingredients.map((ingredient) =>
    ingredient.name.trim().toLowerCase(),
  );
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    errors.push("Ingredient names must be unique.");
  }

  const totalLiquidMl = recipe.ingredients.reduce(
    (total, ingredient) => total + (ingredient.amountMl ?? 0),
    0,
  );
  if (totalLiquidMl < 15 || totalLiquidMl > 500) {
    errors.push("Total liquid volume is outside a practical cocktail range.");
  }

  if (recipe.baseSpirit !== expectedSpirit) {
    errors.push("Base spirit does not match the user selection.");
  }

  const hasExpectedBase = recipe.ingredients.some(
    (ingredient) =>
      baseIngredientMatchers[expectedSpirit].test(ingredient.name) &&
      (ingredient.amountMl ?? 0) >= 20,
  );
  if (!hasExpectedBase) {
    errors.push("The selected base spirit is missing as a primary ingredient.");
  }

  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}
