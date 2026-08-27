import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import { fixedMenuRecipes, type FixedMenuRecipe } from "./fixed-menu";

export type CocktailEngineInput = {
  spirit: SpiritId;
  flavor: FlavorId;
};

export function selectClassicCocktail(
  input: CocktailEngineInput,
  random: () => number = Math.random,
): FixedMenuRecipe {
  const exactCandidates = fixedMenuRecipes.filter(
    (recipe) =>
      recipe.baseSpirit === input.spirit && recipe.flavor === input.flavor,
  );
  const spiritCandidates = fixedMenuRecipes.filter(
    (recipe) => recipe.baseSpirit === input.spirit,
  );
  const selectionPool =
    exactCandidates.length > 0
      ? exactCandidates
      : spiritCandidates.length > 0
        ? spiritCandidates
        : fixedMenuRecipes;
  const randomValue = random();
  const safeRandom = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 0.999999)
    : 0;
  const selectedIndex = Math.floor(safeRandom * selectionPool.length);

  return selectionPool[selectedIndex] ?? fixedMenuRecipes[0]!;
}
