import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import type { Mbti, TonightEnergy } from "@/lib/second/profile";
import { createSignatureCocktail } from "./ai";
import { selectClassicCocktail } from "./engine";
import { createLocalSignatureCocktail } from "./local-creative";
import type {
  CocktailGenerationResponse,
  CocktailRecipe,
} from "./types";
import { validateCocktailRecipe } from "./validator";

type HybridGeneratorInput = {
  spirit: SpiritId;
  flavor: FlavorId;
  energy?: TonightEnergy;
  mbti?: Mbti;
  signatureSeed?: string;
  variation?: string;
};

type HybridGeneratorOptions = {
  mode?: "local" | "openai";
  hasApiKey?: boolean;
  localGenerator?: (input: {
    spirit: SpiritId;
    flavor: FlavorId;
    energy?: TonightEnergy;
    mbti?: Mbti;
    referenceRecipe: CocktailRecipe;
  }, options?: { random?: () => number }) => CocktailRecipe;
  creativeGenerator?: (input: {
    spirit: SpiritId;
    flavor: FlavorId;
    referenceRecipe: CocktailRecipe;
  }) => Promise<CocktailRecipe | undefined>;
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

function classicResponse(
  referenceRecipe: CocktailRecipe,
): CocktailGenerationResponse {
  const fallbackRecipe: CocktailRecipe = {
    ...referenceRecipe,
    glass: referenceRecipe.glass?.trim() || "Cocktail glass",
  };

  return {
    recipe: fallbackRecipe,
    generationMode: "fixed",
    personalization: {},
    referenceCocktail: {
      id: referenceRecipe.id,
      name: referenceRecipe.name,
    },
  };
}

export async function generateHybridCocktail(
  input: HybridGeneratorInput,
  options: HybridGeneratorOptions = {},
): Promise<CocktailGenerationResponse> {
  const random = input.signatureSeed
    ? seededRandom(
        `${input.signatureSeed}:${input.variation ?? "first"}:${input.spirit}:${input.flavor}`,
      )
    : Math.random;
  const referenceRecipe = selectClassicCocktail(input, random);
  const mode =
    options.mode ??
    (process.env.COCKTAIL_GENERATION_MODE === "openai" ? "openai" : "local");

  if (mode === "local") {
    try {
      const localGenerator =
        options.localGenerator ?? createLocalSignatureCocktail;
      const localRecipe = localGenerator(
        {
          spirit: input.spirit,
          flavor: input.flavor,
          energy: input.energy,
          mbti: input.mbti,
          referenceRecipe,
        },
        { random },
      );
      const validation = validateCocktailRecipe(localRecipe, input.spirit);

      if (!validation.valid) return classicResponse(referenceRecipe);

      return {
        recipe: localRecipe,
        generationMode: "local",
        personalization: {
          ...(input.energy ? { energy: input.energy, energyEffect: ({ open: "brighter", curious: "exploratory", slow: "softer", celebrating: "celebratory" } as const)[input.energy] } : {}),
          ...(input.mbti ? { mbti: input.mbti, mbtiEffect: input.mbti.startsWith("E") ? "expressive" : input.mbti.startsWith("I") ? "restrained" : input.mbti[1] === "N" ? "exploratory" : "classic" } : {}),
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

  const hasApiKey = options.hasApiKey ?? Boolean(process.env.OPENAI_API_KEY);

  if (!hasApiKey) return classicResponse(referenceRecipe);

  try {
    const creativeGenerator =
      options.creativeGenerator ?? createSignatureCocktail;
    const aiRecipe = await creativeGenerator({ ...input, referenceRecipe });

    if (!aiRecipe) return classicResponse(referenceRecipe);

    const validation = validateCocktailRecipe(aiRecipe, input.spirit);
    if (!validation.valid) return classicResponse(referenceRecipe);

    return {
      recipe: aiRecipe,
      generationMode: "ai",
      personalization: {},
      referenceCocktail: {
        id: referenceRecipe.id,
        name: referenceRecipe.name,
      },
    };
  } catch {
    return classicResponse(referenceRecipe);
  }
}
