import type { SpiritId } from "@/app/spirits/spirits";
import type { Mbti, TonightEnergy } from "@/lib/second/profile";

export type CocktailIngredient = {
  name: string;
  amountMl?: number;
  amountText?: string;
};

export type CocktailRecipe = {
  id: string;
  name: string;
  baseSpirit: SpiritId;
  ingredients: CocktailIngredient[];
  method: string;
  glass?: string;
  garnish?: string;
  source?: string;
  liqueurs?: string[];
  allergens?: string[];
  caffeineFlag?: boolean;
  availability?: boolean;
  version?: string;
};

export type GenerationMode = "local" | "ai" | "classic" | "fixed";

export type CocktailGenerationResponse = {
  recipe: CocktailRecipe;
  generationMode: GenerationMode;
  personalization: {
    energy?: TonightEnergy;
    mbti?: Mbti;
    energyEffect?: "brighter" | "exploratory" | "softer" | "celebratory";
    mbtiEffect?: "expressive" | "restrained" | "exploratory" | "classic";
  };
  referenceCocktail: {
    id: string;
    name: string;
  };
};
