import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import { getFixedMenuRecipe, getMenuVariants } from "./fixed-menu";
import type {
  CocktailGenerationResponse,
  CocktailRecipe,
} from "./types";

type BrowserGeneratorInput = {
  spirit: SpiritId;
  flavor: FlavorId;
  variantIndex?: number;
};
function fixedResponse(referenceRecipe: CocktailRecipe): CocktailGenerationResponse {
  return {
    recipe: {
      ...referenceRecipe,
      glass: referenceRecipe.glass?.trim() || "Cocktail glass",
    },
    generationMode: "fixed",
    referenceCocktail: {
      id: referenceRecipe.id,
      name: referenceRecipe.name,
    },
  };
}

export function generateBrowserCocktail(
  input: BrowserGeneratorInput,
): CocktailGenerationResponse {
  const referenceRecipe =
    getFixedMenuRecipe(input.spirit, input.flavor, input.variantIndex ?? 1) ??
    getMenuVariants(input.spirit, input.flavor)[0];

  if (!referenceRecipe) {
    throw new Error(`Missing fixed menu path: ${input.spirit}/${input.flavor}`);
  }

  return fixedResponse(referenceRecipe);
}
