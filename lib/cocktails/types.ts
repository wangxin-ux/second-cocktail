import type { SpiritId } from "@/app/spirits/spirits";

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
};

export type GenerationMode = "local" | "ai" | "classic";

export type CocktailGenerationResponse = {
  recipe: CocktailRecipe;
  generationMode: GenerationMode;
  referenceCocktail: {
    id: string;
    name: string;
  };
};
