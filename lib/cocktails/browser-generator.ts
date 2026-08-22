import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import { getMenuVariants } from "./fixed-menu";
import type {
  CocktailGenerationResponse,
  CocktailRecipe,
} from "./types";

type BrowserGeneratorInput = {
  spirit: SpiritId;
  flavor: FlavorId;
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
  const variants = getMenuVariants(input.spirit, input.flavor);
  const referenceRecipe = variants[Math.floor(Math.random() * variants.length)];

  if (!referenceRecipe) {
    throw new Error(`Missing fixed menu path: ${input.spirit}/${input.flavor}`);
  }

  return fixedResponse(referenceRecipe);
}
