import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import type { Mbti, TonightEnergy } from "@/lib/second/profile";
import { selectClassicCocktail } from "./engine";
import { createLocalSignatureCocktail } from "./local-creative";
import type {
  CocktailGenerationResponse,
  CocktailRecipe,
} from "./types";
import { validateCocktailRecipe } from "./validator";

type BrowserGeneratorInput = {
  spirit: SpiritId;
  flavor: FlavorId;
  energy?: TonightEnergy;
  mbti?: Mbti;
  signatureSeed: string;
  variation: number;
};

function seededRandom(seed: string) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function classicResponse(referenceRecipe: CocktailRecipe): CocktailGenerationResponse {
  return {
    recipe: {
      ...referenceRecipe,
      glass: referenceRecipe.glass?.trim() || "Cocktail glass",
    },
    generationMode: "fixed",
    personalization: {},
    referenceCocktail: {
      id: referenceRecipe.id,
      name: referenceRecipe.name,
    },
  };
}

export function generateBrowserCocktail(
  input: BrowserGeneratorInput,
): CocktailGenerationResponse {
  const random = seededRandom(
    `${input.signatureSeed}:${input.variation}:${input.spirit}:${input.flavor}`,
  );
  const referenceRecipe = selectClassicCocktail(input, random);

  try {
    const recipe = createLocalSignatureCocktail(
      {
        spirit: input.spirit,
        flavor: input.flavor,
        energy: input.energy,
        mbti: input.mbti,
        referenceRecipe,
      },
      { random },
    );
    const validation = validateCocktailRecipe(recipe, input.spirit);
    if (!validation.valid) return classicResponse(referenceRecipe);

    return {
      recipe,
      generationMode: "local",
      personalization: {
        ...(input.energy
          ? {
              energy: input.energy,
              energyEffect: (
                {
                  open: "brighter",
                  curious: "exploratory",
                  slow: "softer",
                  celebrating: "celebratory",
                } as const
              )[input.energy],
            }
          : {}),
        ...(input.mbti
          ? {
              mbti: input.mbti,
              mbtiEffect: input.mbti.startsWith("E")
                ? "expressive"
                : "restrained",
            }
          : {}),
      },
      referenceCocktail: {
        id: referenceRecipe.id,
        name: referenceRecipe.name,
      },
    };
  } catch {
    return classicResponse(referenceRecipe);
  }
}
